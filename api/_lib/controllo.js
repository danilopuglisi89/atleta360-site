/* Il modulo salva davvero? Due campanelli, nati dal guasto del 27/07-11/10/2026
 * (una colonna mancante: per due mesi e mezzo nessuna richiesta salvata, e
 * nessuno se n'è accorto).
 *
 * 1. provaModulo(): ogni mattina, con la chiave PUBBLICA (quella del sito),
 *    tenta di inserire un contatto con un tipo che il database non accetta.
 *    Se il rifiuto arriva dal controllo sul tipo (23514), vuol dire che tutto
 *    il resto è passato — colonne, permessi, regole — e il modulo funziona.
 *    Non resta niente nel database: l'inserimento fallisce sempre.
 * 2. allarmeModulo(): quando un visitatore vede l'errore, il sito lo conta
 *    (api/evento.js) e qui parte la mail. Una al giorno al massimo.
 */
import { conta } from "./db.js";
import { leggiOpzioni, salvaOpzioni } from "./opzioni.js";
import { inviaMail, cornice, esc, destinatario, mailConfigurata } from "./mail.js";
import { giornoRoma } from "./riassunto.js";

const URL_DB = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const PUBBLICA = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const SPIEGAZIONI = {
  colonna: "manca una colonna nel database (una migrazione non eseguita)",
  permesso: "il database non dà più il permesso di inserire",
  controllo: "un controllo del database rifiuta i dati",
  altro: "errore non riconosciuto",
};

export async function provaModulo() {
  if (!URL_DB || !PUBBLICA) return { esito: "non-eseguito", dettaglio: "chiave pubblica non disponibile sul server" };
  const quando = new Date().toISOString();
  try {
    const r = await fetch(`${URL_DB}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: PUBBLICA, Authorization: `Bearer ${PUBBLICA}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      // gli stessi campi che manda il modulo, col tipo volutamente sbagliato
      body: JSON.stringify({
        tipo: "controllo-automatico", nome: "Controllo", cognome: "Automatico", email: "controllo@atleta-360.com",
        telefono: "", societa: null, ruolo: null,
        consenso_privacy: true, consenso_data: quando, informativa_versione: "v1",
      }),
    });
    const testo = await r.text();
    let j = {};
    try { j = JSON.parse(testo); } catch { /* non JSON */ }
    if (j.code === "23514" && /tipo/.test(testo)) return { esito: "ok", quando };
    if (r.ok) {
      // non dovrebbe mai succedere: il tipo non valido è stato accettato
      return { esito: "problema", quando, dettaglio: "il database ha accettato un tipo non valido: manca il controllo sul tipo (c'è una riga «controllo-automatico» da cancellare)" };
    }
    const tipo = /PGRST204|42703|column/i.test(testo) ? "colonna"
      : /42501|permission|denied|row-level|JWT|apikey/i.test(testo) || r.status === 401 || r.status === 403 ? "permesso"
      : /23514|23502|violates/i.test(testo) ? "controllo" : "altro";
    return { esito: "problema", quando, tipo, dettaglio: `${SPIEGAZIONI[tipo]}: ${String(j.message || testo).slice(0, 200)}` };
  } catch (e) {
    return { esito: "non-eseguito", quando, dettaglio: `database non raggiungibile (${e.message})` };
  }
}

async function mandaAllarme(titolo, testoHtml) {
  if (!mailConfigurata) return;
  const { valori, stato } = await leggiOpzioni();
  if (stato !== "ok") return;
  const oggi = giornoRoma();
  if (valori.allarme_modulo === oggi) return; // una mail al giorno basta
  await salvaOpzioni({ ...valori, allarme_modulo: oggi });
  await inviaMail({
    a: await destinatario(valori),
    oggetto: `Atleta360: ${titolo}`,
    html: cornice("Allarme modulo", titolo, `<p style="color:#3A4563;font-size:15px;line-height:1.6;margin:0">${testoHtml}</p>`),
  });
}

/* Il controllo del mattino: risultato salvato (lo mostra la Salute), contato,
   e se c'è un problema ti arriva la mail. */
export async function controlloDelMattino({ forza = false } = {}) {
  // l'indirizzo della sveglia è pubblico: al massimo una prova all'ora
  if (!forza) {
    const { valori } = await leggiOpzioni();
    const ultimo = valori.ultimo_controllo?.quando;
    if (ultimo && Date.now() - new Date(ultimo).getTime() < 3600e3) return valori.ultimo_controllo;
  }
  const r = await provaModulo();
  if (!r.quando) r.quando = new Date().toISOString();
  await conta(r.esito === "ok" ? "controllo.ok" : r.esito === "problema" ? "controllo.problema" : "controllo.saltato");
  try {
    const { valori, stato } = await leggiOpzioni();
    if (stato === "ok") await salvaOpzioni({ ...valori, ultimo_controllo: r });
  } catch (e) { console.error("[controllo] salvataggio:", e.message); }
  if (r.esito === "problema") {
    await mandaAllarme("il modulo delle richieste non salva",
      `Il controllo automatico ha provato a salvare una richiesta e il database l'ha rifiutata: <strong>${esc(r.dettaglio)}</strong>.<br><br>
       Finché non è sistemato, chi compila il modulo vede un errore e il suo contatto va perso.`);
  }
  return r;
}

/* Un visitatore ha visto l'errore (il sito l'ha contato in form.errore.*). */
export async function allarmeModulo(tipo) {
  if (tipo === "rete") return; // la connessione del visitatore, non il sito
  await mandaAllarme("una richiesta di demo non si è salvata",
    `Qualcuno ha compilato il modulo e il database ha rifiutato il salvataggio: <strong>${esc(SPIEGAZIONI[tipo] || tipo)}</strong>.<br><br>
     Il contatto è perso. Apri la Salute nel pannello e premi «Controlla adesso».`);
}

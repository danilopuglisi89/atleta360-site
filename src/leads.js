import { opzioniAttuali } from "./opzioni";
import { getSupabase } from "./supabaseClient";
import { conta } from "./analytics";
import { fonte } from "./fonte";
import { azione, visitaDiventaLead } from "./visita";

/* Colonne aggiunte dopo: se il database non le ha ancora (migrazione non
   eseguita) il contatto conta più del dettaglio, si riprova senza. */
const FACOLTATIVE = ["sospetto", "origine", "origine_dettaglio"];

/* Perché il database ha rifiutato: va nei contatori anonimi (form.errore.*)
   e, se non è la rete del visitatore, fa scattare l'allarme del pannello.
   Dal 27/07 all'11/10/2026 il modulo non ha salvato niente per una colonna
   mancante, e nessuno se n'è accorto: questo è il campanello. */
function tipoErrore(e) {
  const t = `${e?.code || ""} ${e?.message || ""} ${e?.details || ""}`;
  if (!e?.code && /Failed to fetch|NetworkError|Load failed|network/i.test(t)) return "rete";
  if (/PGRST204|42703|column/i.test(t)) return "colonna";
  if (/42501|PGRST301|permission|denied|row-level|JWT|apikey/i.test(t)) return "permesso";
  if (/23514|23502|check constraint|violates/i.test(t)) return "controllo";
  return "altro";
}

export const PRIVACY_VERSION = "v1";

/* Avviso via mail a Danilo. È volutamente "best effort": il lead è già
   salvato, quindi un problema qui non deve mai bloccare chi ha compilato.
   Il tempo massimo evita che una risposta lenta ritardi l'ingresso in demo. */
async function avvisaPerMail(dati) {
  try {
    const stop = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => stop?.abort(), 2500);
    await fetch("/api/notifica-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
      signal: stop?.signal,
      keepalive: true,
    });
    clearTimeout(timer);
  } catch {
    // in locale l'endpoint non esiste, e in produzione un errore qui non
    // deve avere conseguenze per chi sta entrando nella demo
  }
}

export async function submitLead({ tipo, nome, cognome, email, telefono, societa, ruolo, consenso, troppoVeloce }) {
  const supabase = await getSupabase();
  if (!supabase) { conta("form.errore.altro"); return new Error("Supabase non configurato"); }
  const { categoria, dettaglio } = fonte();
  const riga = {
    tipo,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    societa: societa?.trim() || null,
    ruolo: ruolo?.trim() || null,
    consenso_privacy: !!consenso,
    consenso_data: consenso ? new Date().toISOString() : null,
    informativa_versione: consenso ? PRIVACY_VERSION : null,
    // compilato troppo in fretta: nel pannello compare come «sospetto»
    sospetto: !!troppoVeloce,
    // da dove è arrivato: link con utm_source, oppure il sito di provenienza
    origine: categoria,
    origine_dettaglio: dettaglio || null,
  };
  let { error } = await supabase.from("leads").insert(riga);
  // PostgREST nomina la colonna che non conosce: "Could not find the 'x' column"
  for (let i = 0; error && i < FACOLTATIVE.length; i++) {
    const testo = `${error.message} ${error.details || ""}`;
    const manca = FACOLTATIVE.filter((k) => k in riga && (testo.includes(`'${k}'`) || testo.includes(`"${k}"`)));
    if (!manca.length) break;
    manca.forEach((k) => delete riga[k]);
    ({ error } = await supabase.from("leads").insert(riga));
  }
  if (error) { conta(`form.errore.${tipoErrore(error)}`); azione("form.errore"); return error; }
  // nel registro delle visite: questa visita è diventata un contatto
  visitaDiventaLead(riga.email);

  // compilazione sospetta: il contatto resta salvato, ma non fa suonare la
  // casella — lo trovi nel pannello con l'etichetta «sospetto»
  if (troppoVeloce) return null;

  // il lead è al sicuro nel database: adesso l'avviso, che può anche fallire
  await avvisaPerMail({
    tipo,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    societa: societa?.trim() || "",
    ruolo: ruolo?.trim() || "",
  });
  return null;
}

// il link si cambia dal pannello /admin; il predefinito resta quello di sempre
export function demoUrl(tipo) {
  const o = opzioniAttuali();
  return tipo === "atleta" ? o.demo_url_atleta : o.demo_url_societa;
}

/* Opzioni del sito modificabili dal pannello /admin.
 * Una sola riga in public.impostazioni (colonna jsonb "valori"): qui ci sono i
 * valori predefiniti, la pulizia di quello che arriva dal pannello e la lettura.
 * Se la tabella non esiste ancora valgono i predefiniti: il sito non si rompe
 * prima che la migrazione sia eseguita.
 */
import { db, dbConfigurato } from "./db.js";

export const PREDEFINITE = {
  avviso_mail_attivo: true,
  avviso_mail_a: "",            // vuoto = NOTIFICA_A su Vercel, o info@danilopuglisi.com
  messaggio_attivo: false,
  messaggio_testo: "",
  messaggio_link: "",
  modulo_in_pausa: false,
  modulo_pausa_testo: "",
  demo_url_atleta: "https://demo.atleta-360.com/?demo=atleta",
  demo_url_societa: "https://demo.atleta-360.com/?demo=societa",
};

/* Le uniche che il sito pubblico può leggere: il destinatario delle mail no. */
export const PUBBLICHE = [
  "messaggio_attivo", "messaggio_testo", "messaggio_link",
  "modulo_in_pausa", "modulo_pausa_testo",
  "demo_url_atleta", "demo_url_societa",
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function urlHttps(v) {
  try { const u = new URL(v); return u.protocol === "https:" ? u.toString() : null; } catch { return null; }
}

/* Restituisce { valori, errori }: un campo non valido resta al valore attuale
   e finisce negli errori, invece di salvare qualcosa che rompe il sito. */
export function pulisci(ingresso, attuali) {
  const v = { ...attuali };
  const errori = [];
  const testo = (k, max) => { if (k in ingresso) v[k] = String(ingresso[k] ?? "").trim().slice(0, max); };
  const vero = (k) => { if (k in ingresso) v[k] = Boolean(ingresso[k]); };

  vero("avviso_mail_attivo");
  vero("messaggio_attivo");
  vero("modulo_in_pausa");
  testo("messaggio_testo", 160);
  testo("modulo_pausa_testo", 300);

  if ("avviso_mail_a" in ingresso) {
    const e = String(ingresso.avviso_mail_a ?? "").trim();
    if (e === "" || EMAIL.test(e)) v.avviso_mail_a = e.slice(0, 120);
    else errori.push("avviso_mail_a");
  }
  if ("messaggio_link" in ingresso) {
    const l = String(ingresso.messaggio_link ?? "").trim();
    if (l === "" || /^\/[^/]/.test(l) || l === "/") v.messaggio_link = l.slice(0, 300);
    else if (urlHttps(l)) v.messaggio_link = urlHttps(l);
    else errori.push("messaggio_link");
  }
  for (const k of ["demo_url_atleta", "demo_url_societa"]) {
    if (k in ingresso) {
      const u = urlHttps(String(ingresso[k] ?? "").trim());
      if (u) v[k] = u; else errori.push(k);
    }
  }
  // un messaggio acceso senza testo mostrerebbe una barra vuota
  if (v.messaggio_attivo && !v.messaggio_testo) errori.push("messaggio_testo");
  return { valori: v, errori };
}

export async function leggiOpzioni() {
  if (!dbConfigurato) return { valori: { ...PREDEFINITE }, stato: "senza-chiave" };
  try {
    const righe = await db("impostazioni?id=eq.1&select=valori,aggiornato_il");
    const salvate = righe?.[0]?.valori || {};
    return { valori: { ...PREDEFINITE, ...salvate }, aggiornato: righe?.[0]?.aggiornato_il || null, stato: "ok" };
  } catch (e) {
    return { valori: { ...PREDEFINITE }, stato: e.tabellaMancante ? "migrazione-mancante" : "errore" };
  }
}

export async function salvaOpzioni(valori) {
  await db("impostazioni", {
    metodo: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    corpo: { id: 1, valori, aggiornato_il: new Date().toISOString() },
  });
}

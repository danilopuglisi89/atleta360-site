/* Accesso al database dal server, con la chiave di servizio.
 *
 * La chiave di servizio salta le regole di sicurezza del database: per questo
 * vive SOLO qui, nelle funzioni Vercel, e non arriva mai al browser. Il sito
 * pubblico continua a usare la chiave anonima, che può solo inserire lead.
 *
 * Parla direttamente con l'API REST di Supabase (PostgREST): niente libreria,
 * le funzioni restano leggere.
 */

const URL_DB = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const CHIAVE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const dbConfigurato = Boolean(URL_DB && CHIAVE);

function intestazioni(extra = {}) {
  const h = { apikey: CHIAVE, "Content-Type": "application/json", ...extra };
  // le chiavi nuove (sb_secret_…) non sono JWT: vanno solo in "apikey"
  if (!CHIAVE.startsWith("sb_secret_")) h.Authorization = `Bearer ${CHIAVE}`;
  return h;
}

export class ErroreDb extends Error {
  constructor(stato, testo) {
    super(`database ${stato}: ${String(testo).slice(0, 200)}`);
    this.stato = stato;
    // 404 / PGRST205 = tabella inesistente: la migrazione admin.sql non è stata eseguita
    this.colonnaMancante = /PGRST204|column .* does not exist|Could not find the .* column/i.test(String(testo));
    this.tabellaMancante = !this.colonnaMancante && (stato === 404 || /PGRST205|does not exist|schema cache/i.test(String(testo)));
  }
}

export async function db(percorso, { metodo = "GET", corpo, prefer } = {}) {
  if (!dbConfigurato) throw new ErroreDb(0, "chiave di servizio non configurata");
  const r = await fetch(`${URL_DB}/rest/v1/${percorso}`, {
    method: metodo,
    headers: intestazioni(prefer ? { Prefer: prefer } : {}),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const testo = await r.text();
  if (!r.ok) throw new ErroreDb(r.status, testo);
  return testo ? JSON.parse(testo) : null;
}

/* Tutte le righe, a pagine da 1.000. Supabase non ne restituisce di più in una
   volta sola ("Max rows") e taglia in silenzio: chiedere limit=5000 non basta.
   Il percorso deve avere un ordinamento stabile, altrimenti le pagine si
   sovrappongono. "massimo" evita di scaricare all'infinito. */
export async function tutte(percorso, { pagina = 1000, massimo = 20000 } = {}) {
  const out = [];
  for (let offset = 0; offset < massimo; offset += pagina) {
    const righe = await db(`${percorso}&limit=${pagina}&offset=${offset}`);
    out.push(...(righe || []));
    if (!righe || righe.length < pagina) return { righe: out, completo: true };
  }
  return { righe: out, completo: false };
}

/* Conta un evento anonimo. Non deve MAI far fallire chi la chiama: un
   contatore perso vale meno di una pagina che si rompe. */
export async function conta(evento) {
  if (!dbConfigurato) return false;
  try {
    await db("rpc/incrementa_contatore", { metodo: "POST", corpo: { p_evento: evento } });
    return true;
  } catch {
    return false;
  }
}

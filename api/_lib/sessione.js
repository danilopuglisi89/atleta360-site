/* Accesso al pannello: una password (ADMIN_PASSWORD su Vercel) e una sessione
 * in un cookie firmato. Nessuna tabella utenti: il pannello è di una persona.
 *
 * La chiave di firma è derivata da password + chiave di servizio: se cambi la
 * password, tutte le sessioni aperte decadono da sole.
 */
import crypto from "node:crypto";

const PASSWORD = process.env.ADMIN_PASSWORD || "";
const NOME = "a360_admin";
const DURATA_S = 7 * 24 * 3600;

export const passwordConfigurata = PASSWORD.length >= 8;

const chiaveFirma = crypto.createHash("sha256")
  .update(`a360-admin|${PASSWORD}|${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`)
  .digest();

const b64 = (b) => Buffer.from(b).toString("base64url");
const firma = (dati) => crypto.createHmac("sha256", chiaveFirma).update(dati).digest("base64url");

function uguali(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function passwordGiusta(tentativo) {
  if (!passwordConfigurata) return false;
  const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return crypto.timingSafeEqual(h(tentativo), h(PASSWORD));
}

export function cookieSessione() {
  const dati = b64(JSON.stringify({ scade: Date.now() + DURATA_S * 1000 }));
  // Path ristretto alle funzioni del pannello: il cookie non viaggia col sito
  return `${NOME}=${dati}.${firma(dati)}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATA_S}`;
}

export const cookieUscita = `${NOME}=; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function sessioneValida(req) {
  if (!passwordConfigurata) return false;
  const cookie = String(req.headers.cookie || "")
    .split(";").map((c) => c.trim()).find((c) => c.startsWith(`${NOME}=`));
  if (!cookie) return false;
  const [dati, f] = cookie.slice(NOME.length + 1).split(".");
  if (!dati || !f || !uguali(f, firma(dati))) return false;
  try { return JSON.parse(Buffer.from(dati, "base64url").toString()).scade > Date.now(); } catch { return false; }
}

/* Tentativi di accesso: 5 sbagliati in 15 minuti per indirizzo, poi stop.
   In memoria dell'istanza: ferma chi prova a indovinare, non è un muro assoluto
   (per questo la password deve comunque essere lunga). */
const FINESTRA = 15 * 60 * 1000;
const errati = new Map();

export function bloccato(ip) {
  const ora = Date.now();
  const lista = (errati.get(ip) || []).filter((t) => ora - t < FINESTRA);
  errati.set(ip, lista);
  return lista.length >= 5;
}

export function segnaErrore(ip) {
  const lista = errati.get(ip) || [];
  lista.push(Date.now());
  errati.set(ip, lista);
  if (errati.size > 500) for (const [k, v] of errati) if (!v.some((t) => Date.now() - t < FINESTRA)) errati.delete(k);
}

export const ipDi = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "sconosciuto";

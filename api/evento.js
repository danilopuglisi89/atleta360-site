/* Contatori anonimi del percorso: visita → scelta → modulo aperto.
 *
 * Arriva solo il NOME dell'evento, da un elenco chiuso. Non si salva l'IP, né
 * un cookie, né un identificativo: nel database finisce "+1 al giorno X per
 * l'evento Y". Per questo non serve il consenso del banner cookie.
 * (L'IP si usa solo qui, in memoria, per non farsi gonfiare i numeri.)
 */
import { conta } from "./_lib/db.js";

const AMMESSI = new Set([
  "visita.home", "visita.contatti",
  "scelta.atleta", "scelta.societa",
  "origine.hero", "origine.header", "origine.demo-preview", "origine.chiusura",
  "form.aperto",
]);

const ORIGINI = ["https://atleta-360.com", "https://www.atleta-360.com"];

const FINESTRA = 60 * 60 * 1000;
const MAX_PER_IP = 120;
const perIp = new Map();

function troppi(ip) {
  const ora = Date.now();
  const lista = (perIp.get(ip) || []).filter((t) => ora - t < FINESTRA);
  if (lista.length >= MAX_PER_IP) { perIp.set(ip, lista); return true; }
  lista.push(ora); perIp.set(ip, lista);
  if (perIp.size > 2000) for (const [k, v] of perIp) if (!v.some((t) => ora - t < FINESTRA)) perIp.delete(k);
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }

  const origin = req.headers.origin;
  if (origin && !ORIGINI.includes(origin) && !origin.startsWith("http://localhost")) return res.status(403).end();

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  const eventi = (Array.isArray(b?.eventi) ? b.eventi : [b?.evento])
    .map(String).filter((e) => AMMESSI.has(e)).slice(0, 4);
  if (!eventi.length) return res.status(204).end();

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (troppi(ip)) return res.status(204).end();

  await Promise.all(eventi.map(conta));
  return res.status(204).end();
}

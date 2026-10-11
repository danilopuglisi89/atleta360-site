/* Il "bollettino del Mister" per l'Assistente AI (l'hub dell'ecosistema):
 * nuovi contatti, chi aspetta, chi va richiamato, visite della settimana.
 * Sola lettura, solo nomi e numeri — niente email né telefoni.
 *
 *   GET /api/hub   con   Authorization: Bearer <HUB_CHIAVE>
 *
 * HUB_CHIAVE va messa su Vercel in questo progetto e nell'hub. Senza, la
 * porta resta chiusa (503): niente si apre per sbaglio.
 */
import crypto from "node:crypto";
import { dbConfigurato } from "./_lib/db.js";
import { riassuntoAdesso } from "./_lib/riassunto.js";

const CHIAVE = process.env.HUB_CHIAVE || "";

function chiaveGiusta(req) {
  const data = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
  return CHIAVE.length >= 24 && crypto.timingSafeEqual(h(data), h(CHIAVE));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false }); }
  if (CHIAVE.length < 24) return res.status(503).json({ ok: false, motivo: "HUB_CHIAVE non configurata" });
  if (!chiaveGiusta(req)) return res.status(401).json({ ok: false });
  if (!dbConfigurato) return res.status(503).json({ ok: false, motivo: "database non configurato" });
  try {
    return res.status(200).json({ ok: true, ...(await riassuntoAdesso()) });
  } catch (e) {
    console.error("[hub]", e.message);
    return res.status(500).json({ ok: false, motivo: "errore del database" });
  }
}

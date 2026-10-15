/* Registro delle visite (tabella "visite", supabase/admin-4.sql).
 *
 * Il browser manda: { id, tipo: "inizio" | "aggiorna" | "lead", ... }.
 * L'id lo inventa la pagina all'apertura e vive solo finché resta aperta:
 * niente cookie, niente IP salvato. Città, regione e paese li ricava Vercel
 * dall'indirizzo (header x-vercel-ip-*), che qui si usa e si butta.
 *
 * Mai bloccante: qualsiasi errore risponde 204 e il sito va avanti.
 */
import { db, dbConfigurato } from "./_lib/db.js";

const ORIGINI = ["https://atleta-360.com", "https://www.atleta-360.com"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGINE = ["home", "contatti"];
const FONTI = ["instagram", "facebook", "google", "linkedin", "whatsapp", "danilopuglisi", "email", "diretto", "altro"];
const AZIONI = new Set([
  "scelta.atleta", "scelta.societa", "form.aperto", "form.inviato", "form.errore",
  "privacy", "whatsapp", "demo", "faq",
]);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp\/|telegram|embedly|vercel/i;

/* Al massimo 200 chiamate all'ora per indirizzo: basta per chi naviga davvero. */
const FINESTRA = 3600e3;
const perIp = new Map();
function troppe(ip) {
  const ora = Date.now();
  const l = (perIp.get(ip) || []).filter((t) => ora - t < FINESTRA);
  l.push(ora); perIp.set(ip, l);
  if (perIp.size > 3000) for (const [k, v] of perIp) if (!v.some((t) => ora - t < FINESTRA)) perIp.delete(k);
  return l.length > 200;
}

const testo = (v, max) => (v == null || v === "" ? null : String(v).slice(0, max));
const dec = (v) => { try { return v ? decodeURIComponent(String(v)) : null; } catch { return String(v); } };

/* Dal "user agent": solo tre cose grossolane, niente impronte. */
function dispositivo(ua) {
  const u = String(ua || "");
  const tipo = /iPad|Tablet|Android(?!.*Mobile)/i.test(u) ? "tablet" : /Mobi|iPhone|Android/i.test(u) ? "telefono" : "computer";
  const sistema = /iPhone|iPad|iPod/.test(u) ? "iOS" : /Android/.test(u) ? "Android" : /Windows/.test(u) ? "Windows"
    : /Mac OS X|Macintosh/.test(u) ? "macOS" : /Linux|CrOS/.test(u) ? "Linux" : "altro";
  const browser = /Edg\//.test(u) ? "Edge" : /SamsungBrowser/.test(u) ? "Samsung" : /Instagram/.test(u) ? "Instagram"
    : /FBAN|FBAV/.test(u) ? "Facebook" : /Firefox|FxiOS/.test(u) ? "Firefox" : /CriOS|Chrome/.test(u) ? "Chrome"
    : /Safari/.test(u) ? "Safari" : "altro";
  return { dispositivo: tipo, sistema, browser };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const fine = () => res.status(204).end();
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  const origin = req.headers.origin;
  if (origin && !ORIGINI.includes(origin) && !origin.startsWith("http://localhost")) return res.status(403).end();
  if (!dbConfigurato || BOT.test(String(req.headers["user-agent"] || ""))) return fine();

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  if (!b || !UUID.test(String(b.id))) return fine();
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (troppe(ip)) return fine();

  try {
    if (b.tipo === "inizio") {
      const riga = {
        id: b.id,
        pagina: PAGINE.includes(b.pagina) ? b.pagina : "home",
        fonte: FONTI.includes(b.fonte) ? b.fonte : "diretto",
        fonte_dettaglio: testo(b.dettaglio, 200),
        citta: testo(dec(req.headers["x-vercel-ip-city"]), 80),
        regione: testo(req.headers["x-vercel-ip-country-region"], 20),
        paese: testo(req.headers["x-vercel-ip-country"], 4),
        ...dispositivo(req.headers["user-agent"]),
      };
      // se l'id c'è già (doppio invio) non si tocca niente
      await db("visite?on_conflict=id", { metodo: "POST", corpo: riga, prefer: "resolution=ignore-duplicates,return=minimal" });
      return fine();
    }

    // aggiornamenti solo su visite recenti: una riga vecchia non si riscrive
    const recente = new Date(Date.now() - 6 * 3600e3).toISOString();
    const dove = `visite?id=eq.${b.id}&inizio=gte.${recente}`;

    if (b.tipo === "aggiorna") {
      const azioni = (Array.isArray(b.azioni) ? b.azioni : []).map(String).filter((a) => AZIONI.has(a));
      await db(dove, {
        metodo: "PATCH", prefer: "return=minimal",
        corpo: {
          ultimo: new Date().toISOString(),
          profondita: Math.max(0, Math.min(100, Math.round(Number(b.profondita) || 0))),
          secondi: Math.max(0, Math.min(6 * 3600, Math.round(Number(b.secondi) || 0))),
          azioni: [...new Set(azioni)].slice(0, 20),
        },
      });
      return fine();
    }

    if (b.tipo === "lead") {
      // la visita che ha portato il contatto: si cerca il lead appena arrivato con quella email
      const email = String(b.email || "").trim();
      if (!email || email.length > 254) return fine();
      const dieciMinuti = new Date(Date.now() - 10 * 60e3).toISOString();
      const l = await db(`leads?select=id&email=eq.${encodeURIComponent(email)}&created_at=gte.${dieciMinuti}&order=created_at.desc&limit=1`);
      if (l?.[0]?.id) await db(dove, { metodo: "PATCH", prefer: "return=minimal", corpo: { lead_id: l[0].id } });
      return fine();
    }
  } catch (e) {
    // tabella non ancora creata (admin-4.sql) o database giù: il sito non se ne accorge
    console.error("[visita]", e.message);
  }
  return fine();
}

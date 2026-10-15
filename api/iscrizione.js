/* Iscrizione ai webinar (pagina /webinar → tabella "iscrizioni", admin-5.sql).
 *
 * A differenza dei lead, qui scrive il server con la chiave di servizio: la
 * tabella non ha permessi per il pubblico, quindi i controlli stanno qui.
 * Una persona per evento (stessa email = aggiorna i dati, non duplica).
 * A Danilo parte una mail d'avviso, come per le richieste di demo.
 */
import { db, conta, dbConfigurato } from "./_lib/db.js";
import { leggiOpzioni } from "./_lib/opzioni.js";
import { inviaMail, cornice, esc, destinatario } from "./_lib/mail.js";
import { allarmeModulo } from "./_lib/controllo.js";

const ORIGINI = ["https://atleta-360.com", "https://www.atleta-360.com"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENTO = /^(\d{4}-\d{2}-\d{2}|prossimo)$/;
const FONTI = ["instagram", "facebook", "google", "linkedin", "whatsapp", "danilopuglisi", "email", "diretto", "altro"];
const CONTIENE_LINK = /(https?:\/\/|www\.|\[url|<a\s)/i;
const INFORMATIVA = "v1";

const FINESTRA = 3600e3;
const perIp = new Map();
function troppe(ip) {
  const ora = Date.now();
  const l = (perIp.get(ip) || []).filter((t) => ora - t < FINESTRA);
  l.push(ora); perIp.set(ip, l);
  if (perIp.size > 1000) for (const [k, v] of perIp) if (!v.some((t) => ora - t < FINESTRA)) perIp.delete(k);
  return l.length > 6;
}

const t = (v, max) => { const s = String(v ?? "").trim().slice(0, max); return s || null; };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  const origin = req.headers.origin;
  if (origin && !ORIGINI.includes(origin) && !origin.startsWith("http://localhost")) return res.status(403).json({ ok: false });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // esca compilata: si finge successo, non si salva niente
  if (String(b.sito_web || "").trim()) return res.status(200).json({ ok: true });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  if (troppe(ip)) return res.status(429).json({ ok: false, motivo: "troppe richieste" });

  const riga = {
    evento: EVENTO.test(String(b.evento)) ? String(b.evento) : null,
    nome: t(b.nome, 100), cognome: t(b.cognome, 100),
    email: t(b.email, 254)?.toLowerCase() || null,
    telefono: t(b.telefono, 40), societa: t(b.societa, 200), ruolo: t(b.ruolo, 120),
    consenso_privacy: b.privacy === true,
    consenso_marketing: b.aggiornamenti === true,
    consenso_data: new Date().toISOString(),
    informativa_versione: INFORMATIVA,
    origine: FONTI.includes(b.origine) ? b.origine : "diretto",
    origine_dettaglio: t(b.origine_dettaglio, 200),
    // compilato in meno di 3 secondi: quasi sempre un programma
    sospetto: Number(b.secondi) < 3,
  };
  if (!riga.evento || !riga.nome || !riga.cognome || !riga.email || !EMAIL.test(riga.email) || !riga.consenso_privacy) {
    return res.status(400).json({ ok: false, motivo: "dati mancanti" });
  }
  if ([riga.nome, riga.cognome, riga.societa, riga.ruolo].some((v) => v && CONTIENE_LINK.test(v))) riga.sospetto = true;
  if (!dbConfigurato) return res.status(503).json({ ok: false, motivo: "database non configurato" });

  try {
    await db("iscrizioni?on_conflict=evento,email", {
      metodo: "POST", corpo: riga, prefer: "resolution=merge-duplicates,return=minimal",
    });
  } catch (e) {
    console.error("[iscrizione]", e.message);
    await conta("form.errore.altro");
    try { await allarmeModulo(e.tabellaMancante ? "colonna" : "altro"); } catch { /* best effort */ }
    return res.status(500).json({ ok: false, motivo: "non salvato" });
  }

  await conta("webinar.iscrizione");
  if (!riga.sospetto) {
    try {
      const { valori } = await leggiOpzioni();
      if (valori.avviso_mail_attivo) {
        const nome = `${riga.nome} ${riga.cognome}`;
        const r = (k, v) => (v ? `<tr><td style="padding:6px 14px 6px 0;color:#64708F;font-size:14px">${esc(k)}</td><td style="padding:6px 0;color:#0C1330;font-size:15px;font-weight:600">${esc(v)}</td></tr>` : "");
        await inviaMail({
          a: await destinatario(valori),
          rispondiA: riga.email,
          oggetto: `Iscrizione al webinar: ${nome.replace(/[<>\r\n]+/g, " ")}`,
          html: cornice(riga.evento === "prossimo" ? "Avviso per il prossimo webinar" : `Webinar del ${riga.evento}`, nome, `
            <table style="border-collapse:collapse;width:100%">
              ${r("Email", riga.email)}${r("Ruolo", riga.ruolo)}${r("Società", riga.societa)}${r("Telefono", riga.telefono)}
              ${r("Arrivato da", [riga.origine, riga.origine_dettaglio].filter(Boolean).join(" · "))}
              ${r("Novità su Atleta360", riga.consenso_marketing ? "sì, può ricevere proposte" : "no, solo il webinar")}
            </table>`),
        });
      }
    } catch (e) { console.error("[iscrizione] mail:", e.message); }
  }
  return res.status(200).json({ ok: true });
}

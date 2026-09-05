/* Manda a Danilo una mail normale a ogni richiesta demo.
 *
 * Perché qui e non con un trigger SQL su Supabase: così la chiave Resend resta
 * una variabile d'ambiente su Vercel invece di finire scritta dentro una
 * funzione del database, e non c'è nulla da eseguire a mano su Supabase.
 *
 * Il lead è già salvato quando questa funzione viene chiamata: la mail è un
 * avviso, non deve mai far fallire l'invio del form.
 *
 * Variabili d'ambiente su Vercel:
 *   RESEND_API_KEY  (obbligatoria)  chiave da resend.com
 *   NOTIFICA_A      (facoltativa)   destinatario, default info@danilopuglisi.com
 *   NOTIFICA_DA     (facoltativa)   mittente, default onboarding@resend.dev
 */

const DESTINATARIO = process.env.NOTIFICA_A || "info@danilopuglisi.com";
const MITTENTE = process.env.NOTIFICA_DA || "Atleta360 <onboarding@resend.dev>";

const ORIGINI_AMMESSE = [
  "https://atleta-360.com",
  "https://www.atleta-360.com",
];

function esc(v) {
  return String(v ?? "").replace(/[<>&"]/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]
  ));
}

function riga(etichetta, valore, link) {
  if (!valore) return "";
  const testo = link
    ? `<a href="${esc(link)}" style="color:#B4520A">${esc(valore)}</a>`
    : esc(valore);
  return `<tr>
    <td style="padding:7px 14px 7px 0;color:#64708F;font-size:14px;white-space:nowrap">${esc(etichetta)}</td>
    <td style="padding:7px 0;color:#0C1330;font-size:15px;font-weight:600">${testo}</td>
  </tr>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  // La mail parte solo verso l'indirizzo di Danilo, mai verso indirizzi
  // forniti da chi compila: questo endpoint non può essere usato per spammare
  // terzi. Il controllo sull'origine ferma comunque le chiamate banali.
  const origin = req.headers.origin;
  if (origin && !ORIGINI_AMMESSE.includes(origin) && !origin.startsWith("http://localhost")) {
    return res.status(403).json({ ok: false });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[notifica-lead] RESEND_API_KEY non impostata: nessuna mail inviata");
    return res.status(200).json({ ok: false, motivo: "chiave assente" });
  }

  const b = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
  const nome = String(b.nome || "").slice(0, 80);
  const cognome = String(b.cognome || "").slice(0, 80);
  const email = String(b.email || "").slice(0, 120);
  const telefono = String(b.telefono || "").slice(0, 40);
  const societa = String(b.societa || "").slice(0, 120);
  const ruolo = String(b.ruolo || "").slice(0, 80);
  const tipo = b.tipo === "atleta" ? "Atleta" : "Società sportiva";

  if (!email) return res.status(400).json({ ok: false });

  const nomeCompleto = `${nome} ${cognome}`.trim() || "(senza nome)";
  // l'oggetto non viene interpretato come HTML, ma tag e ritorni a capo lo
  // renderebbero illeggibile: lì tengo solo testo semplice
  const nomeOggetto = nomeCompleto.replace(/[<>\r\n]+/g, " ").replace(/\s+/g, " ").trim() || "(senza nome)";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F6F7FB;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:26px">
      <div style="color:#B4520A;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">
        Nuova richiesta demo
      </div>
      <h1 style="color:#0A1650;font-size:21px;margin:8px 0 4px">${esc(nomeCompleto)}</h1>
      <div style="color:#64708F;font-size:14px;margin-bottom:20px">${esc(tipo)} · da atleta-360.com</div>
      <table style="border-collapse:collapse;width:100%">
        ${riga("Email", email, `mailto:${email}`)}
        ${riga("Telefono", telefono, telefono ? `tel:${telefono.replace(/\s/g, "")}` : null)}
        ${riga("Società", societa)}
        ${riga("Ruolo", ruolo)}
      </table>
      <p style="color:#64708F;font-size:13px;line-height:1.6;margin:22px 0 0;border-top:1px solid #E6E9F2;padding-top:16px">
        Rispondi direttamente a questa mail per scrivere a ${esc(nomeCompleto)}.
      </p>
    </div>
  </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MITTENTE,
        to: [DESTINATARIO],
        // così basta premere "Rispondi" per scrivere a chi ha compilato
        reply_to: email,
        subject: `Nuovo contatto: ${nomeOggetto} (${tipo})`,
        html,
      }),
    });
    if (!r.ok) {
      console.error("[notifica-lead] Resend ha risposto", r.status, await r.text());
      return res.status(200).json({ ok: false });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[notifica-lead] invio fallito:", e);
    return res.status(200).json({ ok: false });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

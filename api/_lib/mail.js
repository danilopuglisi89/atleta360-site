/* Invio delle mail del sito (Resend): avviso dei lead, mail di prova, allarmi
 * del pannello, riepilogo settimanale. Partono SOLO verso Danilo, mai verso
 * indirizzi scritti da chi compila il modulo.
 *
 *   RESEND_API_KEY  chiave da resend.com (senza, nessuna mail)
 *   NOTIFICA_A      destinatario predefinito (dal pannello si può cambiare)
 *   NOTIFICA_DA     mittente; senza, quello di prova di Resend — che consegna
 *                   SOLO all'indirizzo con cui è stato aperto l'account Resend
 */
import { leggiOpzioni } from "./opzioni.js";

export const MITTENTE = process.env.NOTIFICA_DA || "Atleta360 <onboarding@resend.dev>";
export const MITTENTE_DI_PROVA = !process.env.NOTIFICA_DA;
export const DESTINATARIO_PREDEFINITO = process.env.NOTIFICA_A || "info@danilopuglisi.com";
export const mailConfigurata = Boolean(process.env.RESEND_API_KEY);

export function esc(v) {
  return String(v ?? "").replace(/[<>&"]/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]
  ));
}

/* Destinatario attuale: quello delle Opzioni, se c'è. */
export async function destinatario(valori) {
  const o = valori || (await leggiOpzioni()).valori;
  return o.avviso_mail_a || DESTINATARIO_PREDEFINITO;
}

/* Restituisce { ok, motivo }: non lancia mai, chi chiama decide cosa farne. */
export async function inviaMail({ a, oggetto, html, rispondiA }) {
  if (!mailConfigurata) return { ok: false, motivo: "chiave Resend assente su Vercel" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MITTENTE,
        to: [a],
        ...(rispondiA ? { reply_to: rispondiA } : {}),
        subject: String(oggetto).replace(/[\r\n]+/g, " ").slice(0, 200),
        html,
      }),
    });
    if (!r.ok) {
      const testo = (await r.text()).slice(0, 300);
      console.error("[mail] Resend ha risposto", r.status, testo);
      let spiegazione = testo;
      try { spiegazione = JSON.parse(testo).message || testo; } catch { /* testo semplice */ }
      return { ok: false, motivo: `Resend ${r.status}: ${spiegazione}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[mail] invio fallito:", e);
    return { ok: false, motivo: "Resend non raggiungibile" };
  }
}

/* Involucro grafico comune: stessa cornice dell'avviso dei lead. */
export function cornice(etichetta, titolo, corpo) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#F6F7FB;padding:24px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:26px">
      <div style="color:#B4520A;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">${esc(etichetta)}</div>
      <h1 style="color:#0A1650;font-size:21px;margin:8px 0 14px">${esc(titolo)}</h1>
      ${corpo}
      <p style="color:#64708F;font-size:13px;line-height:1.6;margin:22px 0 0;border-top:1px solid #E6E9F2;padding-top:16px">
        <a href="https://atleta-360.com/admin" style="color:#17297A">Apri il pannello</a>
      </p>
    </div>
  </div>`;
}

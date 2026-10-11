/* Riepilogo del lunedì: una mail con la settimana appena finita. Parte dalla
 * sveglia giornaliera del database (cron delle 6 UTC, vedi api/opzioni.js),
 * solo di lunedì e una volta sola: l'indirizzo della sveglia è pubblico, e
 * chiamarlo dieci volte non deve mandarti dieci mail.
 */
import { leggiOpzioni, salvaOpzioni } from "./opzioni.js";
import { inviaMail, cornice, esc, destinatario, mailConfigurata } from "./mail.js";
import { riassuntoAdesso, giornoRoma } from "./riassunto.js";

const giornoSettimana = (d = new Date()) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome", weekday: "short" }).format(d);

const variazione = (ora, prima) => {
  if (!prima) return ora ? "prima settimana con dati" : "";
  const p = Math.round(((ora - prima) / prima) * 100);
  return p === 0 ? "come la settimana prima" : `${p > 0 ? "+" : ""}${p}% sulla settimana prima`;
};

const elenco = (voci) => voci.length
  ? `<ul style="margin:6px 0 0;padding-left:18px;color:#0C1330;font-size:14px;line-height:1.6">${voci.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>`
  : "";

export async function forseRiepilogo({ forza = false } = {}) {
  if (!mailConfigurata) return { inviato: false, motivo: "mail non configurata" };
  const { valori, stato } = await leggiOpzioni();
  if (stato !== "ok") return { inviato: false, motivo: "opzioni non leggibili" };
  if (!valori.riepilogo_attivo && !forza) return { inviato: false, motivo: "spento" };
  const oggi = giornoRoma();
  if (!forza && (giornoSettimana() !== "Mon" || valori.ultimo_riepilogo === oggi)) return { inviato: false, motivo: "non è il momento" };

  // prima si segna, poi si manda: due sveglie insieme non fanno due mail
  if (!forza) await salvaOpzioni({ ...valori, ultimo_riepilogo: oggi });

  // la settimana appena finita: da lunedì scorso a ieri
  const ieri = giornoRoma(Date.now() - 864e5);
  const r = await riassuntoAdesso(ieri);
  const riga = (etichetta, valore, nota) => `<tr>
    <td style="padding:7px 14px 7px 0;color:#64708F;font-size:14px">${esc(etichetta)}</td>
    <td style="padding:7px 0;color:#0C1330;font-size:16px;font-weight:700">${esc(valore)}</td>
    <td style="padding:7px 0 7px 12px;color:#64708F;font-size:13px">${esc(nota || "")}</td></tr>`;

  const corpo = `
    <table style="border-collapse:collapse;width:100%">
      ${riga("Pagine viste", r.visite7, variazione(r.visite7, r.visitePrec7))}
      ${riga("Nuovi contatti", r.lead7, variazione(r.lead7, r.leadPrec7))}
      ${riga("Ancora da contattare", r.nuovi)}
    </table>
    ${r.inAttesa.length ? `<p style="margin:18px 0 0;color:#9A5B00;font-size:14px;font-weight:700">Aspettano da più di un giorno</p>${elenco(r.inAttesa.slice(0, 10))}` : ""}
    ${r.daRichiamare.length ? `<p style="margin:18px 0 0;color:#17297A;font-size:14px;font-weight:700">Da richiamare</p>${elenco(r.daRichiamare.slice(0, 10))}` : ""}
    ${r.visite7 === 0 ? `<p style="margin:18px 0 0;color:#B42318;font-size:14px">Nessuna visita registrata in tutta la settimana: controlla che il sito sia online.</p>` : ""}`;

  const esito = await inviaMail({
    a: await destinatario(valori),
    oggetto: `Atleta360, la settimana: ${r.lead7} ${r.lead7 === 1 ? "contatto" : "contatti"}, ${r.visite7} pagine viste`,
    html: cornice("Riepilogo settimanale", "La settimana del sito", corpo),
  });
  return { inviato: esito.ok, motivo: esito.motivo };
}

/* Il webinar in programma: un posto solo da cambiare per il prossimo.
 * Orari in UTC (dicembre: Roma = UTC+1). La pagina /webinar si chiude da sola
 * dopo la fine e passa a "lasciami la mail per il prossimo".
 */
export const WEBINAR = {
  id: "2026-12-03",
  titolo: "Le soft skill nello spogliatoio",
  sottotitolo: "Come tenere le ragazze in squadra (e farle crescere) nel settore giovanile",
  inizio: "2026-12-03T19:30:00Z", // 20:30 a Roma
  fine: "2026-12-03T20:30:00Z",   // 21:30 a Roma
  quandoTesto: "Giovedì 3 dicembre 2026, 20:30 – 21:30",
  dove: "Online, dal computer o dal telefono",
  punti: [
    "Perché tante ragazze lasciano la pallavolo fra i 13 e i 16 anni, e i segnali da cogliere prima.",
    "Comunicazione, gestione dell'errore, leadership: come si allenano in palestra, con 3 esercizi pronti da usare.",
    "Dare feedback alla squadra e parlare con i genitori senza scontri.",
    "Un caso vero: come l'Oasi Volley segue la crescita delle sue atlete, settimana dopo settimana.",
  ],
  perChi: "Per allenatori e allenatrici del settore giovanile, dirigenti e responsabili delle società di pallavolo.",
};

export const webinarFinito = (ora = Date.now()) => ora > new Date(WEBINAR.fine).getTime();

const compatta = (iso) => iso.replace(/[-:]/g, "").replace(/\.\d+/, "");

export function linkGoogleCalendar() {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Webinar Atleta360 · ${WEBINAR.titolo}`,
    dates: `${compatta(WEBINAR.inizio)}/${compatta(WEBINAR.fine)}`,
    details: "Il link per collegarti arriva per email qualche giorno prima. Info: atleta-360.com/webinar",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/* File .ics per Apple Calendario, Outlook e gli altri. */
export function scaricaIcs() {
  const testo = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Atleta360//Webinar//IT", "BEGIN:VEVENT",
    `UID:webinar-${WEBINAR.id}@atleta-360.com`,
    `DTSTAMP:${compatta(new Date().toISOString())}`,
    `DTSTART:${compatta(WEBINAR.inizio)}`, `DTEND:${compatta(WEBINAR.fine)}`,
    `SUMMARY:Webinar Atleta360 · ${WEBINAR.titolo}`,
    "DESCRIPTION:Il link per collegarti arriva per email qualche giorno prima. Info: https://atleta-360.com/webinar",
    "URL:https://atleta-360.com/webinar",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([testo], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "webinar-atleta360.ics" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

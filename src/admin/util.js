/* Servizi comuni del pannello: chiamate al server, date, numeri, CSV. */

export async function chiama(azione, dati = {}) {
  const r = await fetch("/api/admin", {
    method: "POST",
    credentials: "same-origin",
    // X-Admin: senza questa intestazione il server rifiuta ogni modifica (vedi api/admin.js)
    headers: { "Content-Type": "application/json", "X-Admin": "1" },
    body: JSON.stringify({ azione, ...dati }),
  });
  let j = {};
  try { j = await r.json(); } catch { /* risposta vuota */ }
  return { stato: r.status, ...j };
}

/* Giorno di calendario a Roma (AAAA-MM-GG): un lead delle 00:30 è di oggi. */
const fmtGiorno = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" });
export const giornoDi = (d) => fmtGiorno.format(new Date(d));

export function giorniIndietro(oggi, n) {
  const out = [];
  const base = new Date(`${oggi}T12:00:00Z`);
  for (let i = n - 1; i >= 0; i--) out.push(new Date(base.getTime() - i * 864e5).toISOString().slice(0, 10));
  return out;
}

const fmtData = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short", year: "numeric" });
const fmtOra = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
export const dataBreve = (d) => (d ? fmtData.format(new Date(d)) : "—");
export const dataOra = (d) => (d ? `${fmtData.format(new Date(d))}, ${fmtOra.format(new Date(d))}` : "—");
export const giornoCorto = (g) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${g}T00:00:00Z`));

export function giorniFa(d) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
}

export const numero = (n) => new Intl.NumberFormat("it-IT").format(n || 0);
export const percento = (a, b) => (b ? `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format((a / b) * 100)}%` : "—");

/* contatori: [{giorno, evento, conteggio}] → somma degli eventi che passano il filtro, nei giorni dati */
export function somma(contatori, giorni, filtro) {
  const set = new Set(giorni);
  let t = 0;
  for (const c of contatori) if (set.has(c.giorno) && filtro(c.evento)) t += c.conteggio;
  return t;
}

export function perGiorno(contatori, giorni, filtro) {
  const m = Object.fromEntries(giorni.map((g) => [g, 0]));
  for (const c of contatori) if (c.giorno in m && filtro(c.evento)) m[c.giorno] += c.conteggio;
  return giorni.map((g) => ({ giorno: g, valore: m[g] }));
}

/* Numero italiano senza prefisso → 39…; serve per il link WhatsApp. */
export function whatsapp(telefono) {
  let n = String(telefono || "").replace(/[^\d+]/g, "");
  if (!n) return null;
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (/^3\d{8,9}$/.test(n)) n = `39${n}`;
  return `https://wa.me/${n}`;
}

/* CSV con punto e virgola e BOM: si apre giusto in Excel italiano, accenti compresi. */
export function scaricaCsv(nomeFile, righe, colonne) {
  const cella = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const testo = [colonne.map((c) => c.titolo).join(";"), ...righe.map((r) => colonne.map((c) => cella(c.valore(r))).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", testo], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeFile });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const STATI = [
  { id: "nuovo", etichetta: "Nuovo" },
  { id: "contattato", etichetta: "Contattato" },
  { id: "cliente", etichetta: "Cliente" },
  { id: "perso", etichetta: "Perso" },
];
export const etichettaStato = (id) => STATI.find((s) => s.id === id)?.etichetta || "Nuovo";
export const etichettaTipo = (t) => (t === "atleta" ? "Atleta" : "Società");

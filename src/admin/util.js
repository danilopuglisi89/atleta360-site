/* Servizi comuni del pannello: chiamate al server, date, numeri, CSV. */

/* Non lancia mai: rete assente o risposta illeggibile diventano { ok: false }.
   Senza questa rete di sicurezza i pulsanti restavano su "in corso" per sempre. */
let quandoFuori = null;
export const seSessioneScade = (f) => { quandoFuori = f; };

export async function chiama(azione, dati = {}) {
  let r;
  try {
    r = await fetch("/api/admin", {
      method: "POST",
      credentials: "same-origin",
      // X-Admin: senza questa intestazione il server rifiuta ogni modifica (vedi api/admin.js)
      headers: { "Content-Type": "application/json", "X-Admin": "1" },
      body: JSON.stringify({ azione, ...dati }),
    });
  } catch {
    return { ok: false, stato: 0, motivo: "connessione assente: riprova quando torna la rete" };
  }
  let j = {};
  try { j = await r.json(); } catch { /* risposta vuota */ }
  // sessione scaduta a metà lavoro: si torna alla password invece di mostrare
  // un errore accanto al pulsante
  if (r.status === 401 && !["login", "sessione", "logout"].includes(azione)) quandoFuori?.();
  return { stato: r.status, ...j, ok: Boolean(j.ok) && r.ok };
}

/* Giorno di calendario a Roma (AAAA-MM-GG): un lead delle 00:30 è di oggi. */
const fmtGiorno = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" });
export const giornoDi = (d) => fmtGiorno.format(new Date(d));
export const oggiRoma = () => giornoDi(new Date());

export function giorniIndietro(oggi, n) {
  const out = [];
  const base = new Date(`${oggi}T12:00:00Z`);
  for (let i = n - 1; i >= 0; i--) out.push(new Date(base.getTime() - i * 864e5).toISOString().slice(0, 10));
  return out;
}

/* Giorno spostato di n (anche negativo), sempre in formato AAAA-MM-GG. */
export const spostaGiorno = (g, n) => new Date(new Date(`${g}T12:00:00Z`).getTime() + n * 864e5).toISOString().slice(0, 10);

const fmtData = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short", year: "numeric" });
const fmtOra = new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
export const dataBreve = (d) => (d ? fmtData.format(new Date(d)) : "—");
export const dataOra = (d) => (d ? `${fmtData.format(new Date(d))}, ${fmtOra.format(new Date(d))}` : "—");
export const giornoCorto = (g) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${g}T00:00:00Z`));
export const giornoLungo = (g) => new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${g}T00:00:00Z`));

/* Giorni di CALENDARIO a Roma fra una data e oggi: un lead di ieri alle 23
   alle 8 del mattino è "ieri", non "oggi" (prima contava le 24 ore passate). */
export function giorniFa(d, oggi = oggiRoma()) {
  if (!d) return null;
  const g = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : giornoDi(d);
  return Math.round((new Date(`${oggi}T12:00:00Z`) - new Date(`${g}T12:00:00Z`)) / 864e5);
}
export const quandoFa = (d) => {
  const n = giorniFa(d);
  return n == null ? "—" : n <= 0 ? "oggi" : n === 1 ? "ieri" : `${n} giorni fa`;
};

export const numero = (n) => new Intl.NumberFormat("it-IT").format(n || 0);
export const percento = (a, b) => (b ? `${new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format((a / b) * 100)}%` : "—");

/* Variazione rispetto al periodo prima: { testo, verso } oppure null. */
export function variazione(ora, prima) {
  if (!prima && !ora) return null;
  if (!prima) return { testo: "nuovo", verso: "su" };
  const p = Math.round(((ora - prima) / prima) * 100);
  if (p === 0) return { testo: "= periodo prima", verso: "pari" };
  return { testo: `${p > 0 ? "+" : ""}${p}% sul periodo prima`, verso: p > 0 ? "su" : "giu" };
}

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

export const eVisita = (e) => e.startsWith("visita.");

/* ---- contatti ---- */

export const statoDi = (l) => l.stato || "nuovo";
export const aperto = (l) => !["cliente", "perso"].includes(statoDi(l));

/* Ultimo "tocco": arrivo, modifica, voce di diario — il più recente. */
export function ultimoTocco(l) {
  const date = [l.created_at, l.aggiornato_il, ...(Array.isArray(l.diario) ? l.diario.map((v) => v.quando) : [])].filter(Boolean);
  return date.sort().pop();
}

/* Termometro del contatto: quanto si sta raffreddando chi non senti da giorni.
   Solo per i contatti ancora aperti (nuovi o contattati). */
export function temperatura(l) {
  if (!aperto(l)) return null;
  const n = giorniFa(ultimoTocco(l)) ?? 0;
  if (n < 3) return { id: "caldo", etichetta: "Caldo", nota: n === 0 ? "sentito oggi" : `${n} ${n === 1 ? "giorno" : "giorni"} fa` };
  if (n < 7) return { id: "tiepido", etichetta: "Tiepido", nota: `${n} giorni senza notizie` };
  if (n < 14) return { id: "freddo", etichetta: "Freddo", nota: `${n} giorni senza notizie` };
  return { id: "ghiaccio", etichetta: "In panchina", nota: `${n} giorni senza notizie` };
}

export const daRichiamare = (l, oggi = oggiRoma()) => Boolean(l.ricontatta_il && l.ricontatta_il <= oggi && aperto(l));

/* Conservazione: l'informativa promette al massimo 24 mesi dall'ultimo contatto. */
export const oltre24Mesi = (l, oggi = oggiRoma()) => giorniFa(ultimoTocco(l), oggi) > 730;

/* Chiave per riconoscere chi ha scritto più volte: email, oppure telefono. */
export const chiaveEmail = (l) => String(l.email || "").trim().toLowerCase();
export const chiaveTelefono = (l) => {
  let n = String(l.telefono || "").replace(/[^\d]/g, "");
  if (n.startsWith("0039")) n = n.slice(4); else if (n.startsWith("39") && n.length > 10) n = n.slice(2);
  return n.length >= 6 ? n : "";
};

/* Gruppi di doppioni: id → elenco degli id dello stesso "chi". */
export function doppioni(leads) {
  const perChiave = new Map();
  for (const l of leads) {
    for (const k of [`e:${chiaveEmail(l)}`, `t:${chiaveTelefono(l)}`]) {
      if (k.length <= 2) continue;
      if (!perChiave.has(k)) perChiave.set(k, new Set());
      perChiave.get(k).add(l.id);
    }
  }
  const out = new Map();
  for (const set of perChiave.values()) {
    if (set.size < 2) continue;
    for (const id of set) {
      const prima = out.get(id) || new Set([id]);
      for (const x of set) prima.add(x);
      out.set(id, prima);
    }
  }
  return out;
}

/* Numero italiano senza prefisso → 39…; serve per il link WhatsApp. */
export function whatsapp(telefono, testo) {
  let n = String(telefono || "").replace(/[^\d+]/g, "");
  if (!n) return null;
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (/^3\d{8,9}$/.test(n)) n = `39${n}`;
  return `https://wa.me/${n}${testo ? `?text=${encodeURIComponent(testo)}` : ""}`;
}

/* Messaggio pronto dal modello delle Opzioni: {nome} e {societa}. */
export function riempi(modello, l) {
  return String(modello || "")
    .replaceAll("{nome}", l.nome || "")
    .replaceAll("{cognome}", l.cognome || "")
    .replaceAll("{societa}", l.societa || "la tua società");
}

/* CSV con punto e virgola e BOM: si apre giusto in Excel italiano, accenti compresi.
   Una cella che inizia con = + - @ Excel la esegue come formula, e i campi
   arrivano dal modulo pubblico: si disinnesca con un apostrofo davanti.
   Le colonne "testo" (il telefono) vanno come ="…", così Excel non toglie il +
   né lo 0 iniziale e non le trasforma in notazione scientifica. */
export function scaricaCsv(nomeFile, righe, colonne) {
  const cella = (v, comeTesto) => {
    let s = v == null ? "" : String(v);
    if (comeTesto && s) s = `="${s.replace(/"/g, '""')}"`;
    else if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const testo = [colonne.map((c) => c.titolo).join(";"), ...righe.map((r) => colonne.map((c) => cella(c.valore(r), c.testo)).join(";"))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", testo], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeFile });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* AAAA-MM-GG HH:MM a Roma: Excel la riconosce e la ordina come data. */
const fmtIso = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
export const dataIso = (d) => (d ? fmtIso.format(new Date(d)) : "");

export const STATI = [
  { id: "nuovo", etichetta: "Nuovo" },
  { id: "contattato", etichetta: "Contattato" },
  { id: "cliente", etichetta: "Cliente" },
  { id: "perso", etichetta: "Perso" },
];
export const etichettaStato = (id) => STATI.find((s) => s.id === id)?.etichetta || "Nuovo";
export const etichettaTipo = (t) => (t === "atleta" ? "Atleta" : "Società");

/* "Non contare le mie visite": un segno in questo browser, letto dal sito
   (src/analytics.js) prima di ogni contatore. Stesso dominio, quindi vale. */
const CHIAVE_NON_CONTARE = "a360_non_contare";
export function nonContare() {
  try { return localStorage.getItem(CHIAVE_NON_CONTARE) === "1"; } catch { return false; }
}
export function impostaNonContare(si) {
  try { if (si) localStorage.setItem(CHIAVE_NON_CONTARE, "1"); else localStorage.removeItem(CHIAVE_NON_CONTARE); } catch { /* storage bloccato */ }
}

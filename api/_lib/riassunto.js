/* Il "bollettino" del sito in poche cifre: lo usano il riepilogo del lunedì
 * via mail e l'endpoint per l'Assistente AI (api/hub.js). Stessi conti del
 * pannello, ma lato server e senza grafici.
 */
import { tutte } from "./db.js";

const fmtGiorno = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" });
export const giornoRoma = (d = new Date()) => fmtGiorno.format(new Date(d));

export function giorniIndietro(oggi, n) {
  const base = new Date(`${oggi}T12:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 864e5).toISOString().slice(0, 10));
}

/* Giorni di calendario (a Roma) fra una data e oggi: ieri alle 23 è "1", non "0". */
export function giorniDa(d, oggi = giornoRoma()) {
  return Math.round((new Date(`${oggi}T12:00:00Z`) - new Date(`${giornoRoma(d)}T12:00:00Z`)) / 864e5);
}

/* Ultimo "tocco" di un contatto: arrivo, modifica, voce di diario. */
export function ultimoTocco(l) {
  const date = [l.created_at, l.aggiornato_il, ...(Array.isArray(l.diario) ? l.diario.map((v) => v.quando) : [])].filter(Boolean);
  return date.sort().pop();
}

export const statoDi = (l) => l.stato || "nuovo";

export async function caricaPerRiassunto() {
  const da = giorniIndietro(giornoRoma(), 30)[0];
  const [leads, contatori] = await Promise.all([
    tutte("leads?select=id,tipo,nome,cognome,societa,stato,created_at,aggiornato_il,ricontatta_il,sospetto&order=created_at.desc,id.asc").catch(() =>
      // senza admin-2.sql le colonne nuove non ci sono: si legge quel che c'è
      tutte("leads?select=id,tipo,nome,cognome,societa,stato,created_at,aggiornato_il&order=created_at.desc,id.asc")),
    tutte(`contatori?select=giorno,evento,conteggio&giorno=gte.${da}&order=giorno.desc,evento.asc`),
  ]);
  return { leads: leads.righe, contatori: contatori.righe };
}

export function riassunto({ leads, contatori }, oggi = giornoRoma()) {
  const ult7 = new Set(giorniIndietro(oggi, 7));
  const prec7 = new Set(giorniIndietro(oggi, 14).slice(0, 7));
  const ieri = giorniIndietro(oggi, 2)[0];
  const veri = leads.filter((l) => !l.sospetto);
  const visite = (set) => contatori.filter((c) => set.has(c.giorno) && c.evento.startsWith("visita.")).reduce((t, c) => t + c.conteggio, 0);
  const leadIn = (set) => veri.filter((l) => set.has(giornoRoma(l.created_at)));

  const daRichiamare = veri.filter((l) => l.ricontatta_il && l.ricontatta_il <= oggi && !["cliente", "perso"].includes(statoDi(l)));
  const nuovi = veri.filter((l) => statoDi(l) === "nuovo");
  const inAttesa = nuovi.filter((l) => giorniDa(l.created_at, oggi) >= 1);
  const nome = (l) => `${l.nome || ""} ${l.cognome || ""}`.trim() + (l.societa ? ` (${l.societa})` : "");

  return {
    oggi,
    visite7: visite(ult7),
    visitePrec7: visite(prec7),
    visiteIeri: visite(new Set([ieri])),
    lead7: leadIn(ult7).length,
    leadPrec7: leadIn(prec7).length,
    nuovi: nuovi.length,
    inAttesa: inAttesa.map(nome),
    daRichiamare: daRichiamare.map(nome),
    totaleLead: veri.length,
    ultimiLead: leadIn(ult7).slice(0, 10).map((l) => ({ nome: nome(l), tipo: l.tipo, quando: l.created_at })),
  };
}

/* Per chi chiama da fuori: tutto in un colpo. */
export async function riassuntoAdesso(oggi = giornoRoma()) {
  return riassunto(await caricaPerRiassunto(), oggi);
}

/* Il dettaglio dei giorni recenti (da oggi indietro), per leggere le statistiche
 * da Claude Code senza la password del pannello: visite una per una, contatori
 * del giorno, richieste di colloquio e iscrizioni. Niente email né telefoni. */
export async function dettaglioGiorni(giorni = 1, oggi = giornoRoma()) {
  const n = Math.max(1, Math.min(30, Math.round(Number(giorni) || 1)));
  const elenco = giorniIndietro(oggi, n);
  // un giorno di margine e poi il filtro sul giorno di Roma: regge l'ora legale
  const da = new Date(`${elenco[0]}T00:00:00Z`).getTime() - 864e5;
  const dentro = new Set(elenco), delGiorno = (d) => dentro.has(giornoRoma(d));
  const leggi = (q) => tutte(q, { massimo: 5000 }).then((r) => r.righe).catch(() => null);
  const [visite, contatori, iscrizioni] = await Promise.all([
    leggi(`visite?select=inizio,pagina,fonte,fonte_dettaglio,citta,regione,paese,dispositivo,browser,profondita,secondi,azioni,lead_id&inizio=gte.${new Date(da).toISOString()}&order=inizio.desc,id.asc`),
    leggi(`contatori?select=giorno,evento,conteggio&giorno=gte.${elenco[0]}&order=giorno.desc,evento.asc`),
    leggi(`iscrizioni?select=created_at,evento,nome,cognome,origine,origine_dettaglio,sospetto&created_at=gte.${new Date(da).toISOString()}&order=created_at.desc,id.asc`),
  ]);
  const perGiorno = {};
  for (const c of contatori || []) (perGiorno[c.giorno] ||= {})[c.evento] = c.conteggio;
  return {
    giorni: elenco,
    contatori: perGiorno,
    visite: visite && visite.filter((v) => delGiorno(v.inizio)).map((v) => ({
      quando: v.inizio, pagina: v.pagina, fonte: v.fonte, dettaglio: v.fonte_dettaglio,
      luogo: [v.citta, v.regione, v.paese].filter(Boolean).join(", "), dispositivo: v.dispositivo, browser: v.browser,
      secondi: v.secondi, lettura: v.profondita, azioni: v.azioni, contatto: Boolean(v.lead_id),
    })),
    richieste: iscrizioni && iscrizioni.filter((i) => !i.sospetto && delGiorno(i.created_at)).map((i) => ({
      quando: i.created_at, tipo: i.evento === "coaching" ? "colloquio" : `webinar ${i.evento}`,
      nome: `${i.nome || ""} ${i.cognome || ""}`.trim(), origine: [i.origine, i.origine_dettaglio].filter(Boolean).join(" / "),
    })),
  };
}

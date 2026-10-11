/* Pannello /admin — l'unica porta d'accesso ai dati in lettura e modifica.
 *
 * Tutto passa da POST { azione, ... }. Le azioni diverse dal login vogliono
 * una sessione valida E l'intestazione X-Admin: un sito terzo non può inviarla
 * senza che il browser la blocchi, e il cookie è SameSite=Strict — doppia
 * difesa contro le richieste falsificate da altre pagine.
 */
import { db, tutte, conta, dbConfigurato, ErroreDb } from "./_lib/db.js";
import { leggiOpzioni, salvaOpzioni, pulisci, pulisciSegni, PREDEFINITE } from "./_lib/opzioni.js";
import {
  passwordConfigurata, passwordGiusta, cookieSessione, cookieUscita,
  leggiSessione, bloccato, segnaErrore, ipDi,
} from "./_lib/sessione.js";
import { inviaMail, cornice, esc, destinatario, MITTENTE, MITTENTE_DI_PROVA, DESTINATARIO_PREDEFINITO, mailConfigurata } from "./_lib/mail.js";
import { giornoRoma, giorniIndietro } from "./_lib/riassunto.js";
import { forseRiepilogo } from "./_lib/riepilogo.js";

const STATI = ["nuovo", "contattato", "cliente", "perso"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GIORNO = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// tentativi sbagliati in un giorno oltre i quali parte una mail di allarme
const SOGLIA_ALLARME_ACCESSI = 20;
// contatori caricati: 90 giorni del periodo più lungo + 90 per il confronto
const GIORNI_CONTATORI = 182;

const rispondi = (res, codice, corpo) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(codice).json(corpo);
};

function corpoDi(req) {
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body || {};
}

function configurazione() {
  return {
    password: passwordConfigurata,
    database: dbConfigurato,
    mail: mailConfigurata,
    hub: (process.env.HUB_CHIAVE || "").length >= 24,
  };
}

async function caricaDati(opzioni) {
  const t0 = Date.now();
  const salute = { database: "ok", latenzaMs: null, migrazione: "ok", migrazione2: "ok", errori: [], leadCompleti: true, leadOk: true };

  let leads = [];
  try {
    // ordinamento stabile (anche per id) perché le pagine non si sovrappongano
    const r = await tutte("leads?select=*&order=created_at.desc,id.asc");
    leads = r.righe;
    salute.leadCompleti = r.completo;
    salute.latenzaMs = Date.now() - t0;
  } catch (e) {
    salute.database = "errore";
    salute.leadOk = false;
    salute.errori.push(e.message);
    // colonne stato/note mancanti: la tabella c'è ma admin.sql non è stato eseguito
    if (/stato|note|column/i.test(e.message)) salute.migrazione = "mancante";
  }
  // le colonne della seconda migrazione (richiami, diario, sospetti)
  if (salute.leadOk && leads.length && !("diario" in leads[0])) salute.migrazione2 = "mancante";
  if (salute.leadOk && !leads.length) {
    try { await db("leads?select=diario,ricontatta_il,sospetto&limit=1"); } catch { salute.migrazione2 = "mancante"; }
  }

  let contatori = [];
  let inizioConteggi = null;
  const da = giorniIndietro(giornoRoma(), GIORNI_CONTATORI)[0];
  try {
    // dal più recente: se mai si taglia, si perdono i giorni vecchi, non quelli di oggi
    const [r, primo] = await Promise.all([
      tutte(`contatori?select=giorno,evento,conteggio&giorno=gte.${da}&order=giorno.desc,evento.asc`),
      db("contatori?select=giorno&evento=like.visita.*&order=giorno.asc&limit=1"),
    ]);
    contatori = r.righe;
    inizioConteggi = primo?.[0]?.giorno || null;
  } catch (e) {
    if (e instanceof ErroreDb && e.tabellaMancante) salute.migrazione = "mancante";
    else salute.errori.push(e.message);
  }

  if (opzioni.stato === "migrazione-mancante") salute.migrazione = "mancante";
  if (opzioni.stato === "errore") salute.errori.push("opzioni non leggibili: valgono i predefiniti");

  const { sessione_gen, ultimo_riepilogo, allarme_accessi, ...visibili } = opzioni.valori;
  return {
    leads,
    contatori,
    inizioConteggi,
    opzioni: visibili,
    opzioniAggiornate: opzioni.aggiornato || null,
    ultimoRiepilogo: ultimo_riepilogo || null,
    salute: {
      ...salute,
      oggi: giornoRoma(),
      configurazione: configurazione(),
      destinatarioPredefinito: DESTINATARIO_PREDEFINITO,
      mittente: MITTENTE,
      mittenteDiProva: MITTENTE_DI_PROVA,
      versione: {
        commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
        messaggio: (process.env.VERCEL_GIT_COMMIT_MESSAGE || "").split("\n")[0].slice(0, 120) || null,
        ambiente: process.env.VERCEL_ENV || "locale",
      },
    },
  };
}

/* Tentativo sbagliato: conteggio in memoria (blocco per indirizzo) e nel
   database (sopravvive ai riavvii, e oltre la soglia ti arriva una mail). */
async function registraErrore(ip) {
  segnaErrore(ip);
  if (!dbConfigurato) return;
  await conta("accesso.errato");
  try {
    const oggi = giornoRoma();
    const r = await db(`contatori?select=conteggio&giorno=eq.${oggi}&evento=eq.accesso.errato`);
    const n = r?.[0]?.conteggio || 0;
    if (n < SOGLIA_ALLARME_ACCESSI) return;
    const valori = await opzioniDaRiscrivere();
    if (valori.allarme_accessi === oggi) return; // una mail al giorno basta
    await salvaOpzioni({ ...valori, allarme_accessi: oggi });
    await inviaMail({
      a: await destinatario(valori),
      oggetto: "Atleta360: tentativi di accesso al pannello",
      html: cornice("Allarme pannello", `${n} password sbagliate oggi`, `
        <p style="color:#3A4563;font-size:15px;line-height:1.6;margin:0">
          Qualcuno sta provando a entrare nel pannello /admin. Ogni indirizzo viene fermato dopo 5 tentativi,
          ma se non sei stato tu conviene <strong>cambiare ADMIN_PASSWORD su Vercel</strong> (con una password lunga)
          e premere «Esci da tutti i dispositivi» nelle Opzioni.
        </p>`),
    });
  } catch (e) {
    console.error("[admin] allarme accessi:", e.message);
  }
}

/* Il link della demo risponde? Un refuso manderebbe ogni nuovo lead nel vuoto. */
async function provaLink(url) {
  try {
    const stop = new AbortController();
    const t = setTimeout(() => stop.abort(), 5000);
    const r = await fetch(url, { method: "GET", redirect: "follow", signal: stop.signal });
    clearTimeout(t);
    return r.ok ? null : `risponde con errore ${r.status}`;
  } catch {
    return "non risponde";
  }
}

/* Opzioni da riscrivere: se non si sono lette davvero, salvare i predefiniti
   cancellerebbe quelle vere. Meglio fermarsi. */
async function opzioniDaRiscrivere() {
  const o = await leggiOpzioni();
  if (o.stato !== "ok") throw new ErroreDb(503, `opzioni non leggibili (${o.stato})`);
  return o.valori;
}

const motivoDb = (e) => {
  if (e instanceof ErroreDb && e.colonnaMancante) return "manca la migrazione supabase/admin-2.sql";
  if (e instanceof ErroreDb && e.tabellaMancante) return "migrazione admin.sql da eseguire";
  return "errore del database";
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return rispondi(res, 405, { ok: false });
  }
  const b = corpoDi(req);
  const azione = String(b.azione || "");
  const ip = ipDi(req);

  if (azione === "login") {
    if (!passwordConfigurata) return rispondi(res, 503, { ok: false, motivo: "password non configurata" });
    if (bloccato(ip)) return rispondi(res, 429, { ok: false, motivo: "troppi tentativi: riprova tra 15 minuti" });
    if (!passwordGiusta(b.password || "")) {
      await registraErrore(ip);
      // un piccolo ritardo rende inutile provare a raffica
      await new Promise((r) => setTimeout(r, 600));
      return rispondi(res, 401, { ok: false, motivo: "password errata" });
    }
    const { valori } = await leggiOpzioni();
    res.setHeader("Set-Cookie", cookieSessione(Number(valori.sessione_gen) || 0));
    await conta("accesso.ok");
    return rispondi(res, 200, { ok: true });
  }

  if (azione === "logout") {
    res.setHeader("Set-Cookie", cookieUscita);
    return rispondi(res, 200, { ok: true });
  }

  const sessione = leggiSessione(req);
  // una lettura sola delle opzioni per richiesta: serve sia alla generazione
  // delle sessioni sia ai dati
  const opzioni = sessione ? await leggiOpzioni() : null;
  // se le opzioni non si leggono (database giù) la generazione non si può
  // verificare: vale la firma del cookie, come prima che esistesse
  const dentro = Boolean(sessione && (opzioni.stato !== "ok" || sessione.gen === (Number(opzioni.valori.sessione_gen) || 0)));

  if (azione === "sessione") {
    // a chi non è dentro si dice solo se la password esiste, niente altro
    return rispondi(res, 200, { ok: true, dentro, configurazione: dentro ? configurazione() : { password: passwordConfigurata } });
  }

  // da qui in giù serve essere dentro
  if (req.headers["x-admin"] !== "1" || !dentro) {
    return rispondi(res, 401, { ok: false, motivo: "sessione scaduta" });
  }
  if (!dbConfigurato) return rispondi(res, 503, { ok: false, motivo: "chiave del database non configurata" });

  try {
    if (azione === "dati") {
      return rispondi(res, 200, { ok: true, ...(await caricaDati(opzioni)) });
    }

    if (azione === "lead.aggiorna") {
      if (!UUID.test(String(b.id))) return rispondi(res, 400, { ok: false, motivo: "id non valido" });
      const modifiche = { aggiornato_il: new Date().toISOString() };
      if ("stato" in b) {
        if (!STATI.includes(b.stato)) return rispondi(res, 400, { ok: false, motivo: "stato non valido" });
        modifiche.stato = b.stato;
      }
      if ("note" in b) modifiche.note = String(b.note ?? "").slice(0, 4000) || null;
      if ("ricontatta_il" in b) {
        if (b.ricontatta_il !== null && !GIORNO.test(String(b.ricontatta_il))) return rispondi(res, 400, { ok: false, motivo: "data non valida" });
        modifiche.ricontatta_il = b.ricontatta_il || null;
      }
      const righe = await db(`leads?id=eq.${b.id}`, { metodo: "PATCH", corpo: modifiche, prefer: "return=representation" });
      if (!righe?.length) return rispondi(res, 404, { ok: false, motivo: "lead non trovato" });
      return rispondi(res, 200, { ok: true, lead: righe[0] });
    }

    if (azione === "lead.diario") {
      // aggiunge (o toglie) una voce al diario: il testo vecchio non si sovrascrive mai
      if (!UUID.test(String(b.id))) return rispondi(res, 400, { ok: false, motivo: "id non valido" });
      const attuale = await db(`leads?id=eq.${b.id}&select=diario`);
      if (!attuale?.length) return rispondi(res, 404, { ok: false, motivo: "lead non trovato" });
      let diario = Array.isArray(attuale[0].diario) ? attuale[0].diario : [];
      if (b.togli) {
        diario = diario.filter((v) => v.quando !== b.togli);
      } else {
        const testo = String(b.testo ?? "").trim().slice(0, 2000);
        if (!testo) return rispondi(res, 400, { ok: false, motivo: "testo vuoto" });
        diario = [...diario, { quando: new Date().toISOString(), testo }].slice(-200);
      }
      const righe = await db(`leads?id=eq.${b.id}`, {
        metodo: "PATCH", corpo: { diario, aggiornato_il: new Date().toISOString() }, prefer: "return=representation",
      });
      return rispondi(res, 200, { ok: true, lead: righe[0] });
    }

    if (azione === "lead.elimina" || azione === "lead.eliminaMolti") {
      // cancellazione definitiva: serve per il diritto all'oblio (GDPR art. 17)
      // e per i contatti oltre i 24 mesi promessi nell'informativa
      const ids = azione === "lead.elimina" ? [b.id] : (Array.isArray(b.ids) ? b.ids : []);
      if (!ids.length || ids.length > 200 || !ids.every((id) => UUID.test(String(id)))) {
        return rispondi(res, 400, { ok: false, motivo: "id non validi" });
      }
      const righe = await db(`leads?id=in.(${ids.join(",")})`, { metodo: "DELETE", prefer: "return=representation" });
      if (!righe?.length) return rispondi(res, 404, { ok: false, motivo: "lead non trovato" });
      // traccia anonima: "il giorno X sono state eseguite N cancellazioni", senza dati personali
      for (let i = 0; i < righe.length; i++) await conta("gdpr.cancellazione");
      return rispondi(res, 200, { ok: true, eliminati: righe.map((r) => r.id) });
    }

    if (azione === "opzioni.salva") {
      const attuali = await opzioniDaRiscrivere();
      const { valori, errori } = pulisci(b.valori || {}, attuali);
      if (errori.length) return rispondi(res, 400, { ok: false, motivo: "campi non validi", campi: errori });
      // si salva comunque: un sito momentaneamente giù non deve impedire di cambiare il link
      const avvisi = {};
      for (const k of ["demo_url_atleta", "demo_url_societa"]) {
        if (valori[k] !== attuali[k]) { const p = await provaLink(valori[k]); if (p) avvisi[k] = p; }
      }
      await salvaOpzioni(valori);
      const { sessione_gen, ultimo_riepilogo, allarme_accessi, ...visibili } = valori;
      return rispondi(res, 200, { ok: true, opzioni: visibili, avvisi });
    }

    if (azione === "opzioni.predefinite") {
      return rispondi(res, 200, { ok: true, opzioni: PREDEFINITE });
    }

    if (azione === "segni.salva") {
      const attuali = await opzioniDaRiscrivere();
      const segni = pulisciSegni(b.segni);
      await salvaOpzioni({ ...attuali, segni });
      return rispondi(res, 200, { ok: true, segni });
    }

    if (azione === "mail.prova") {
      // al destinatario scritto nelle Opzioni (anche se non ancora salvato)
      const scritto = String(b.a || "").trim();
      if (scritto && !EMAIL.test(scritto)) return rispondi(res, 400, { ok: false, motivo: "indirizzo non valido" });
      const a = scritto || await destinatario(opzioni.valori);
      const esito = await inviaMail({
        a,
        oggetto: "Atleta360: mail di prova dal pannello",
        html: cornice("Prova", "Funziona", `<p style="color:#3A4563;font-size:15px;line-height:1.6;margin:0">
          Se leggi questa mail, gli avvisi dei nuovi contatti arrivano a <strong>${esc(a)}</strong>.</p>`),
      });
      return rispondi(res, 200, { ...esito, a });
    }

    if (azione === "riepilogo.prova") {
      // il riepilogo del lunedì, subito: per vedere com'è senza aspettare
      return rispondi(res, 200, { ok: true, ...(await forseRiepilogo({ forza: true })) });
    }

    if (azione === "sessioni.chiudiTutte") {
      // fa salire la generazione: ogni cookie emesso prima non vale più,
      // e a questo dispositivo se ne dà subito uno nuovo
      const attuali = await opzioniDaRiscrivere();
      const gen = (Number(attuali.sessione_gen) || 0) + 1;
      await salvaOpzioni({ ...attuali, sessione_gen: gen });
      res.setHeader("Set-Cookie", cookieSessione(gen));
      return rispondi(res, 200, { ok: true });
    }

    return rispondi(res, 400, { ok: false, motivo: "azione sconosciuta" });
  } catch (e) {
    console.error("[admin]", azione, e.message);
    return rispondi(res, 500, { ok: false, motivo: motivoDb(e) });
  }
}

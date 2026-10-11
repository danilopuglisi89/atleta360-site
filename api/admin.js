/* Pannello /admin — l'unica porta d'accesso ai dati in lettura e modifica.
 *
 * Tutto passa da POST { azione, ... }. Le azioni diverse dal login vogliono
 * una sessione valida E l'intestazione X-Admin: un sito terzo non può inviarla
 * senza che il browser la blocchi, e il cookie è SameSite=Strict — doppia
 * difesa contro le richieste falsificate da altre pagine.
 */
import { db, dbConfigurato, ErroreDb } from "./_lib/db.js";
import { leggiOpzioni, salvaOpzioni, pulisci, PREDEFINITE } from "./_lib/opzioni.js";
import {
  passwordConfigurata, passwordGiusta, cookieSessione, cookieUscita,
  sessioneValida, bloccato, segnaErrore, ipDi,
} from "./_lib/sessione.js";

const STATI = ["nuovo", "contattato", "cliente", "perso"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    mail: Boolean(process.env.RESEND_API_KEY),
  };
}

/* Data "di calendario" a Roma, non in UTC: un lead delle 00:30 è di oggi. */
function giornoRoma(d = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(d);
}

async function caricaDati() {
  const t0 = Date.now();
  const salute = { database: "ok", latenzaMs: null, migrazione: "ok", errori: [] };

  let leads = [];
  try {
    leads = await db("leads?select=*&order=created_at.desc&limit=5000");
    salute.latenzaMs = Date.now() - t0;
  } catch (e) {
    salute.database = "errore";
    salute.errori.push(e.message);
    // colonne stato/note mancanti: la tabella c'è ma admin.sql non è stato eseguito
    if (/stato|note|column/i.test(e.message)) salute.migrazione = "mancante";
  }

  let contatori = [];
  const da = new Date(Date.now() - 400 * 864e5);
  try {
    contatori = await db(`contatori?select=giorno,evento,conteggio&giorno=gte.${giornoRoma(da)}&order=giorno.asc&limit=20000`);
  } catch (e) {
    if (e instanceof ErroreDb && e.tabellaMancante) salute.migrazione = "mancante";
    else salute.errori.push(e.message);
  }

  const opzioni = await leggiOpzioni();
  if (opzioni.stato === "migrazione-mancante") salute.migrazione = "mancante";

  return {
    leads,
    contatori,
    opzioni: opzioni.valori,
    opzioniAggiornate: opzioni.aggiornato || null,
    salute: {
      ...salute,
      oggi: giornoRoma(),
      configurazione: configurazione(),
      destinatarioPredefinito: process.env.NOTIFICA_A || "info@danilopuglisi.com",
      versione: {
        commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
        messaggio: (process.env.VERCEL_GIT_COMMIT_MESSAGE || "").split("\n")[0].slice(0, 120) || null,
        ambiente: process.env.VERCEL_ENV || "locale",
      },
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return rispondi(res, 405, { ok: false });
  }
  const b = corpoDi(req);
  const azione = String(b.azione || "");
  const ip = ipDi(req);

  if (azione === "login") {
    if (!passwordConfigurata) return rispondi(res, 503, { ok: false, motivo: "password non configurata", configurazione: configurazione() });
    if (bloccato(ip)) return rispondi(res, 429, { ok: false, motivo: "troppi tentativi: riprova tra 15 minuti" });
    if (!passwordGiusta(b.password || "")) {
      segnaErrore(ip);
      // un piccolo ritardo rende inutile provare a raffica
      await new Promise((r) => setTimeout(r, 600));
      return rispondi(res, 401, { ok: false, motivo: "password errata" });
    }
    res.setHeader("Set-Cookie", cookieSessione());
    return rispondi(res, 200, { ok: true });
  }

  if (azione === "logout") {
    res.setHeader("Set-Cookie", cookieUscita);
    return rispondi(res, 200, { ok: true });
  }

  if (azione === "sessione") {
    return rispondi(res, 200, { ok: true, dentro: sessioneValida(req), configurazione: configurazione() });
  }

  // da qui in giù serve essere dentro
  if (req.headers["x-admin"] !== "1" || !sessioneValida(req)) {
    return rispondi(res, 401, { ok: false, motivo: "sessione scaduta" });
  }
  if (!dbConfigurato) return rispondi(res, 503, { ok: false, motivo: "chiave del database non configurata" });

  try {
    if (azione === "dati") {
      return rispondi(res, 200, { ok: true, ...(await caricaDati()) });
    }

    if (azione === "lead.aggiorna") {
      if (!UUID.test(String(b.id))) return rispondi(res, 400, { ok: false, motivo: "id non valido" });
      const modifiche = { aggiornato_il: new Date().toISOString() };
      if ("stato" in b) {
        if (!STATI.includes(b.stato)) return rispondi(res, 400, { ok: false, motivo: "stato non valido" });
        modifiche.stato = b.stato;
      }
      if ("note" in b) modifiche.note = String(b.note ?? "").slice(0, 4000) || null;
      const righe = await db(`leads?id=eq.${b.id}`, { metodo: "PATCH", corpo: modifiche, prefer: "return=representation" });
      if (!righe?.length) return rispondi(res, 404, { ok: false, motivo: "lead non trovato" });
      return rispondi(res, 200, { ok: true, lead: righe[0] });
    }

    if (azione === "lead.elimina") {
      // cancellazione definitiva: serve per il diritto all'oblio (GDPR art. 17)
      if (!UUID.test(String(b.id))) return rispondi(res, 400, { ok: false, motivo: "id non valido" });
      const righe = await db(`leads?id=eq.${b.id}`, { metodo: "DELETE", prefer: "return=representation" });
      if (!righe?.length) return rispondi(res, 404, { ok: false, motivo: "lead non trovato" });
      return rispondi(res, 200, { ok: true });
    }

    if (azione === "opzioni.salva") {
      const attuali = (await leggiOpzioni()).valori;
      const { valori, errori } = pulisci(b.valori || {}, attuali);
      if (errori.length) return rispondi(res, 400, { ok: false, motivo: "campi non validi", campi: errori });
      await salvaOpzioni(valori);
      return rispondi(res, 200, { ok: true, opzioni: valori });
    }

    if (azione === "opzioni.predefinite") {
      return rispondi(res, 200, { ok: true, opzioni: PREDEFINITE });
    }

    return rispondi(res, 400, { ok: false, motivo: "azione sconosciuta" });
  } catch (e) {
    console.error("[admin]", azione, e.message);
    const migrazione = e instanceof ErroreDb && e.tabellaMancante;
    return rispondi(res, 500, { ok: false, motivo: migrazione ? "migrazione admin.sql da eseguire" : "errore del database" });
  }
}

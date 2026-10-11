/* Opzioni pubbliche impostate dal pannello /admin (messaggio in evidenza,
   modulo in pausa, link della demo). Una sola richiesta per visita, in cache
   sul CDN; se fallisce — in locale, o col database fermo — valgono i
   predefiniti e il sito funziona identico a prima. */

export const PREDEFINITE = {
  messaggio_attivo: false,
  messaggio_testo: "",
  messaggio_link: "",
  modulo_in_pausa: false,
  modulo_pausa_testo: "",
  demo_url_atleta: "https://demo.atleta-360.com/?demo=atleta",
  demo_url_societa: "https://demo.atleta-360.com/?demo=societa",
};

let attuali = { ...PREDEFINITE };
let promessa = null;

export function caricaOpzioni() {
  if (!promessa) {
    promessa = fetch("/api/opzioni", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.opzioni) attuali = { ...PREDEFINITE, ...j.opzioni }; return attuali; })
      .catch(() => attuali);
  }
  return promessa;
}

export const opzioniAttuali = () => attuali;

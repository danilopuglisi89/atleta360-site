/* Opzioni pubbliche del sito (messaggio in evidenza, modulo in pausa, link
 * della demo), lette dal browser. Restituisce solo le chiavi pubbliche: il
 * destinatario delle mail resta nel pannello.
 *
 * In cache sul CDN per un minuto: una modifica dal pannello arriva al sito
 * entro ~60 secondi, e le visite non svegliano il database una per una.
 *
 * ?sveglia=1 è la chiamata giornaliera del cron (vercel.json): senza cache,
 * tocca davvero il database. Supabase gratuito mette in pausa un progetto
 * fermo da una settimana — e con lui modulo e demo, senza avvisare nessuno.
 * Di lunedì manda anche il riepilogo settimanale (api/_lib/riepilogo.js), e ogni
 * mattina controlla che il modulo salvi davvero (api/_lib/controllo.js).
 */
import { leggiOpzioni, PUBBLICHE } from "./_lib/opzioni.js";
import { conta, db } from "./_lib/db.js";
import { forseRiepilogo } from "./_lib/riepilogo.js";
import { controlloDelMattino } from "./_lib/controllo.js";

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).end(); }

  const sveglia = "sveglia" in (req.query || {});
  const { valori, stato } = await leggiOpzioni();
  if (sveglia) {
    await conta("sistema.sveglia");
    // ogni mattina: il modulo salva davvero? (prova che non lascia niente nel database)
    try { await controlloDelMattino(); } catch (e) { console.error("[opzioni] controllo:", e.message); }
    // il registro delle visite tiene 13 mesi, poi si cancella da solo (informativa § 8)
    try { await db(`visite?inizio=lt.${new Date(Date.now() - 395 * 864e5).toISOString()}`, { metodo: "DELETE", prefer: "return=minimal" }); } catch { /* tabella non ancora creata */ }
    // di lunedì la sveglia porta anche il riepilogo della settimana (una volta sola)
    try { await forseRiepilogo(); } catch (e) { console.error("[opzioni] riepilogo:", e.message); }
  }

  const pubbliche = Object.fromEntries(PUBBLICHE.map((k) => [k, valori[k]]));
  /* Due cache separate. Il browser NON tiene copie (stale-while-revalidate
     vale anche per lui, e mostrava le opzioni vecchie per minuti dopo il
     salvataggio); il CDN di Vercel sì, un minuto, così le visite non
     interrogano il database una per una. */
  res.setHeader("Cache-Control", "no-store");
  if (!sveglia) res.setHeader("Vercel-CDN-Cache-Control", "max-age=60, stale-while-revalidate=300");
  return res.status(200).json({ ok: true, stato, opzioni: pubbliche });
}

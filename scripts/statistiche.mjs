/* Statistiche del sito lette da qui (Claude Code), senza la password del pannello.
 *
 *   node scripts/statistiche.mjs        oggi
 *   node scripts/statistiche.mjs 7      ultimi 7 giorni
 *
 * Usa /api/hub con la chiave di sola lettura HUB_CHIAVE, tenuta in .env.hub
 * (ignorato da git). Stessa chiave che sta su Vercel.
 */
import { readFileSync } from "node:fs";

const giorni = Math.max(1, Math.min(30, Number(process.argv[2]) || 1));
let chiave = process.env.HUB_CHIAVE || "";
try { chiave ||= readFileSync(new URL("../.env.hub", import.meta.url), "utf8").match(/HUB_CHIAVE=(\S+)/)?.[1] || ""; } catch {}
if (!chiave) { console.error("Manca HUB_CHIAVE (.env.hub)"); process.exit(1); }

const r = await fetch(`https://atleta-360.com/api/hub?giorni=${giorni}`, { headers: { Authorization: `Bearer ${chiave}` } });
const j = await r.json().catch(() => ({}));
if (!j.ok) { console.error("Risposta", r.status, j.motivo || ""); process.exit(1); }

const ora = (d) => new Date(d).toLocaleString("it-IT", { timeZone: "Europe/Rome", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const d = j.dettaglio;
console.log(`Giorni: ${d.giorni[0]} → ${d.giorni.at(-1)}`);
console.log(`Settimana: ${j.visite7} pagine viste (prima ${j.visitePrec7}) · contatti ${j.lead7} (prima ${j.leadPrec7}) · nuovi da gestire ${j.nuovi}`);

for (const g of [...d.giorni].reverse()) {
  const c = d.contatori[g] || {};
  const voci = Object.entries(c).map(([k, v]) => `${k} ${v}`).join(" · ");
  console.log(`\n${g}: ${voci || "nessun contatore"}`);
}

if (d.visite === null) console.log("\nRegistro visite non leggibile (tabella mancante?)");
else {
  console.log(`\nVisite registrate: ${d.visite.length}`);
  for (const v of d.visite) {
    console.log(`- ${ora(v.quando)} ${v.pagina} · ${v.fonte}${v.dettaglio ? ` (${v.dettaglio})` : ""} · ${v.luogo || "?"} · ${v.dispositivo}/${v.browser} · ${v.secondi}s, ${v.lettura}%` +
      (v.azioni?.length ? ` · ${v.azioni.join(", ")}` : "") + (v.contatto ? " · CONTATTO" : ""));
  }
}

const rich = d.richieste || [];
console.log(`\nRichieste (colloqui e webinar): ${rich.length}`);
for (const x of rich) console.log(`- ${ora(x.quando)} ${x.tipo}: ${x.nome}${x.origine ? ` · da ${x.origine}` : ""}`);
if (j.ultimiLead?.length) console.log(`\nContatti demo della settimana: ${j.ultimiLead.map((l) => `${l.nome} (${l.tipo})`).join(", ")}`);

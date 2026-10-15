/* Registro della visita per il pannello (api/visita.js, tabella "visite").
 *
 * Un id casuale creato all'apertura della pagina e tenuto solo in memoria:
 * niente cookie, niente storage, e alla visita dopo è un id nuovo. Si manda:
 * l'inizio (pagina e provenienza), poi ogni tanto fin dove ha letto, quanto è
 * rimasto e cosa ha fatto (scelta, modulo, privacy…). Mai bloccante.
 *
 * Il browser segnato dal pannello ("non contare le mie visite") non manda niente.
 */
import { fonte } from "./fonte";

const nonContare = () => { try { return localStorage.getItem("a360_non_contare") === "1"; } catch { return false; } };

const stato = { id: null, inizio: 0, visibileDa: 0, secondi: 0, profondita: 0, azioni: new Set(), timer: null };

function invia(corpo, urgente) {
  try {
    const dati = JSON.stringify({ id: stato.id, ...corpo });
    if (urgente && navigator.sendBeacon?.("/api/visita", new Blob([dati], { type: "application/json" }))) return;
    fetch("/api/visita", { method: "POST", headers: { "Content-Type": "application/json" }, body: dati, keepalive: true }).catch(() => {});
  } catch { /* mai bloccante */ }
}

function secondiTotali() {
  const ora = Date.now();
  return Math.round(stato.secondi + (stato.visibileDa ? (ora - stato.visibileDa) / 1000 : 0));
}

function aggiorna(urgente = false) {
  if (!stato.id) return;
  clearTimeout(stato.timer);
  stato.timer = null;
  invia({ tipo: "aggiorna", profondita: stato.profondita, secondi: secondiTotali(), azioni: [...stato.azioni] }, urgente);
}

/* Le azioni arrivano a raffica (scelta + apertura del modulo): si aspetta un attimo. */
function aggiornaPresto() {
  if (!stato.id || stato.timer) return;
  stato.timer = setTimeout(() => aggiorna(), 1500);
}

export function iniziaVisita(pagina) {
  if (stato.id || typeof window === "undefined" || nonContare()) return;
  try { stato.id = crypto.randomUUID(); } catch { return; }
  stato.inizio = Date.now();
  stato.visibileDa = document.visibilityState === "visible" ? Date.now() : 0;
  const { categoria, dettaglio } = fonte();
  invia({ tipo: "inizio", pagina, fonte: categoria, dettaglio });

  // fin dove legge: il massimo raggiunto, in percentuale della pagina
  let attesa = null;
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const p = Math.min(100, Math.round((window.scrollY / max) * 100));
    if (p > stato.profondita) {
      stato.profondita = p;
      clearTimeout(attesa);
      attesa = setTimeout(() => aggiorna(), 4000);
    }
  }, { passive: true });

  // il tempo conta solo con la pagina davanti; uscendo si manda l'ultimo stato
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (stato.visibileDa) { stato.secondi += (Date.now() - stato.visibileDa) / 1000; stato.visibileDa = 0; }
      aggiorna(true);
    } else if (!stato.visibileDa) {
      stato.visibileDa = Date.now();
    }
  });
  window.addEventListener("pagehide", () => aggiorna(true));
  // un clic su WhatsApp (footer, chi sono, pausa del modulo) è un contatto anche lui
  document.addEventListener("click", (e) => {
    const a = e.target?.closest?.("a[href]");
    if (a && /wa\.me|whatsapp/i.test(a.getAttribute("href"))) azione("whatsapp");
  }, true);
  // chi resta a lungo senza scorrere: un aggiornamento al minuto, per i primi dieci
  let giri = 0;
  const battito = setInterval(() => { if (++giri > 10) clearInterval(battito); else if (document.visibilityState === "visible") aggiorna(); }, 60e3);
}

export function azione(nome) {
  if (!stato.id || stato.azioni.has(nome)) return;
  stato.azioni.add(nome);
  aggiornaPresto();
}

/* Il contatto è salvato: si collega alla visita (il server lo cerca per email,
   fra quelli arrivati negli ultimi minuti). Subito, prima del salto alla demo. */
export function visitaDiventaLead(email) {
  if (!stato.id) return;
  stato.azioni.add("form.inviato");
  aggiorna(true);
  invia({ tipo: "lead", email }, true);
}

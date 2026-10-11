import { track } from "@vercel/analytics";

/* Eventi oltre al Lead: servono a capire DOVE si ferma chi non converte.
   Vercel Analytics è senza cookie e sempre attivo; il Pixel Meta riceve
   gli stessi eventi solo se il visitatore ha accettato i cookie
   (window.fbq esiste solo in quel caso). */
function send(name, props) {
  try { track(name, props); } catch { /* analytics non disponibile: non è un errore bloccante */ }
  try { if (window.fbq) window.fbq("trackCustom", name, props); } catch { /* idem */ }
}

/* Contatori anonimi per il pannello /admin: solo il nome dell'evento, niente
   cookie né identificativi (vedi api/evento.js), quindi niente consenso da
   chiedere. sendBeacon sopravvive anche al cambio di pagina verso la demo. */
export function conta(...eventi) {
  try {
    // il browser di Danilo, segnato dal pannello: le sue prove non si contano
    if (localStorage.getItem("a360_non_contare") === "1") return;
  } catch { /* storage bloccato: si conta normalmente */ }
  try {
    const corpo = JSON.stringify({ eventi });
    if (navigator.sendBeacon?.("/api/evento", new Blob([corpo], { type: "application/json" }))) return;
    fetch("/api/evento", { method: "POST", headers: { "Content-Type": "application/json" }, body: corpo, keepalive: true }).catch(() => {});
  } catch { /* mai bloccante */ }
}

export function trackChoice(tipo, origine) {
  send("scelta_percorso", { tipo, origine });
  conta(`scelta.${tipo}`, `origine.${origine}`);
}

/* Profondità di scroll: una sola volta per soglia, per sessione. */
export function initScrollDepth() {
  if (typeof window === "undefined") return () => {};
  const marks = [25, 50, 75, 100];
  const seen = new Set();
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    const pct = Math.round((window.scrollY / max) * 100);
    for (const m of marks) {
      if (pct >= m && !seen.has(m)) {
        seen.add(m);
        send("scroll_profondita", { percentuale: m });
      }
    }
    if (seen.size === marks.length) window.removeEventListener("scroll", onScroll);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

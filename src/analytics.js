import { track } from "@vercel/analytics";

/* Eventi oltre al Lead: servono a capire DOVE si ferma chi non converte.
   Vercel Analytics è senza cookie e sempre attivo; il Pixel Meta riceve
   gli stessi eventi solo se il visitatore ha accettato i cookie
   (window.fbq esiste solo in quel caso). */
function send(name, props) {
  try { track(name, props); } catch { /* analytics non disponibile: non è un errore bloccante */ }
  try { if (window.fbq) window.fbq("trackCustom", name, props); } catch { /* idem */ }
}

export function trackChoice(tipo, origine) {
  send("scelta_percorso", { tipo, origine });
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

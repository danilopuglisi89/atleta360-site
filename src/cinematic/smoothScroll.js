import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;

/* Scorrimento con inerzia (Lenis) agganciato al ticker di GSAP, così
   ScrollTrigger e il palco leggono sempre la stessa posizione.
   Disattivato con prefers-reduced-motion. */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenisInstance = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

/* Torna in cima subito, passando da Lenis se attivo (altrimenti l'inerzia
   riporterebbe la pagina dov'era). */
export function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

/* Porta a una sezione con l'inerzia di Lenis. Passare Lenis invece dello
   scroll nativo evita che i due si contendano la posizione. */
export function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (lenisInstance) { lenisInstance.scrollTo(el, { offset: -70 }); return; }
  const y = el.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top: y, behavior: "smooth" });
}

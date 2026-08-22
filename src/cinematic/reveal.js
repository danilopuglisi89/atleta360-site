import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Rivela, quando la sezione entra nel viewport:
   - le parole dei titoli (.a360-w dentro SplitTitle): salgono da sotto
     la loro finestra, una per una, con un ritardo minimo;
   - gli elementi .a360-reveal: risalita + sfocatura, in sequenza.
   Stesso linguaggio della hero, così la pagina è un unico film. */
export function useRevealOnScroll(rootRef, deps = []) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    if (!el) return;
    const targets = el.querySelectorAll(".a360-reveal");
    const words = el.querySelectorAll(".a360-w");

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0, filter: "none" });
      gsap.set(words, { yPercent: 0, opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 80%" } });
      if (words.length) {
        tl.fromTo(words, { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.045, ease: "power3.out" }, 0);
      }
      if (targets.length) {
        tl.fromTo(targets, { opacity: 0, y: 46, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.1, ease: "power3.out" }, 0.15);
      }
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

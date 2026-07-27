import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* Rivela gli elementi con classe .a360-reveal dentro rootRef, in sequenza,
   quando entrano nella parte bassa del viewport. Stesso trattamento
   (blur + risalita) delle scene del radar, per coerenza visiva. */
export function useRevealOnScroll(rootRef, deps = []) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    if (!el) return;
    const targets = el.querySelectorAll(".a360-reveal");

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0, filter: "none" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, { opacity: 0, y: 46, filter: "blur(10px)" },
        {
          opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

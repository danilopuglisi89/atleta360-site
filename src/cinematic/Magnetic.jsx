import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/* Avvolge un elemento e lo fa "attrarre" dal puntatore entro un raggio:
   piccolo, elastico, solo con mouse (niente touch, niente reduced-motion).
   Il figlio conserva il proprio hover CSS: la magnetizzazione agisce
   su questo wrapper, non sul figlio. */
export default function Magnetic({ children, strength = 0.28, radius = 140, style }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const ok = window.matchMedia("(pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !ok) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(mx, my);
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (d > reach) { xTo(0); yTo(0); return; }
      const f = (1 - d / reach) * strength;
      xTo(mx * f);
      yTo(my * f);
    };
    const onLeave = () => { xTo(0); yTo(0); };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [strength, radius]);

  return <div ref={ref} style={{ display: "flex", willChange: "transform", ...style }}>{children}</div>;
}

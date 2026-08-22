import { useEffect, useRef } from "react";

/* Alone di luce arancio che segue il puntatore (in ritardo morbido) e si
   allarga sugli elementi cliccabili. Solo con mouse: su touch non esiste. */
export default function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const ok = window.matchMedia("(pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !ok) return;

    let x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y;
    let scale = 1, tScale = 1, shown = false, raf = 0;

    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; el.style.opacity = "1"; }
      const hot = e.target && e.target.closest && e.target.closest("a, button, [role='button']");
      tScale = hot ? 1.7 : 1;
    };
    const onLeave = () => { shown = false; el.style.opacity = "0"; };

    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      scale += (tScale - scale) * 0.12;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed", left: 0, top: 0, width: 360, height: 360, borderRadius: "50%",
        pointerEvents: "none", zIndex: 1, opacity: 0, transition: "opacity 0.4s ease",
        mixBlendMode: "screen",
        background: "radial-gradient(circle, rgba(255,140,50,0.22) 0%, rgba(255,122,24,0.08) 35%, rgba(255,122,24,0) 70%)",
        willChange: "transform",
      }}
    />
  );
}

import { useEffect, useRef } from "react";

/* Sottile linea arancio in alto che misura quanto si è scorso. */
export default function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);
  return (
    <div aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, right: 0, height: 2, zIndex: 40, pointerEvents: "none" }}>
      <div ref={ref} style={{
        height: "100%", width: "100%", transformOrigin: "0 50%", transform: "scaleX(0)",
        background: "linear-gradient(90deg, #FF7A18, #FFB070)", boxShadow: "0 0 12px rgba(255,122,24,0.8)",
      }} />
    </div>
  );
}

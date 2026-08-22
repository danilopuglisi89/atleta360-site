import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ClipboardList, LineChart, TrendingUp } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    Icon: ClipboardList,
    n: "1",
    title: "Rilevamento",
    text: "Ogni tot settimane, un questionario rapido fotografa le 6 soft skill dell'atleta. Pochi minuti, nessuna preparazione richiesta.",
  },
  {
    Icon: LineChart,
    n: "2",
    title: "Grafici",
    text: "I risultati diventano subito grafici chiari: per singolo atleta o per l'intera squadra, con il confronto nel tempo.",
  },
  {
    Icon: TrendingUp,
    n: "3",
    title: "Crescita",
    text: "Allenatore e società vedono dove intervenire, l'atleta vede i suoi progressi e i badge che li premiano.",
  },
];

export default function HowItWorks() {
  const rootRef = useRef(null);
  const lineRef = useRef(null);
  useRevealOnScroll(rootRef);

  /* La linea che collega i tre passi si disegna con lo scroll. */
  useEffect(() => {
    if (!lineRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(lineRef.current, { scaleX: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current, { scaleX: 0 }, {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top 70%", end: "top 25%", scrub: 0.6 },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} style={{ position: "relative", zIndex: 2, padding: "70px 20px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="a360-reveal" style={{
          ...font, textAlign: "center", color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12, opacity: 0,
        }}>
          Come funziona
        </div>
        <SplitTitle text="Tre passi, nessuna complicazione" style={{
          ...display, textAlign: "center", color: "#fff", fontWeight: 700,
          fontSize: "clamp(24px, 3.6vw, 34px)", margin: "0 auto 44px", maxWidth: 640,
          lineHeight: 1.25,
        }} />

        <div style={{ position: "relative" }}>
          <div aria-hidden="true" style={{ position: "absolute", left: "8%", right: "8%", top: 51, height: 1, pointerEvents: "none" }}>
            <div ref={lineRef} style={{
              height: "100%", transformOrigin: "0 50%", transform: "scaleX(0)",
              background: "linear-gradient(90deg, rgba(255,122,24,0.1), rgba(255,122,24,0.75), rgba(255,122,24,0.1))",
              boxShadow: "0 0 14px rgba(255,122,24,0.5)",
            }} />
          </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", position: "relative" }}>
          {STEPS.map((s) => (
            <div key={s.n} className="a360-reveal" style={{
              flex: "1 1 260px", maxWidth: 300, opacity: 0,
              background: "rgba(12,19,60,0.72)", border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              borderRadius: 20, padding: "28px 24px",
              boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, background: C.orangeSoft,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
              }}>
                <s.Icon size={22} color={C.orange} />
              </div>
              <div style={{ ...font, color: "rgba(255,122,24,0.85)", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                PASSO {s.n}
              </div>
              <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>
                {s.title}
              </div>
              <p style={{ ...font, color: "rgba(255,255,255,0.68)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

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

/* Linea temporale numerata, non tre riquadri: la sezione precedente ("Cosa
   vedrai nella demo") è già tre card affiancate, e ripetere lo stesso impianto
   faceva sembrare di rileggere la stessa sezione. */
export default function HowItWorks() {
  const rootRef = useRef(null);
  const lineRef = useRef(null);
  useRevealOnScroll(rootRef);

  useEffect(() => {
    if (!lineRef.current) return;
    // sotto i 780px la linea è verticale: va disegnata sull'asse Y, altrimenti
    // comparirebbe allargandosi invece di scendere lungo i passi
    const verticale = window.matchMedia("(max-width: 780px)").matches;
    const asse = verticale ? "scaleY" : "scaleX";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(lineRef.current, { [asse]: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(lineRef.current, { [asse]: 0 }, {
        [asse]: 1, ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top 72%", end: "top 28%", scrub: 0.6 },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="come-funziona" style={{ position: "relative", zIndex: 2, padding: "80px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="a360-reveal" style={{
          ...font, textAlign: "center", color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12, opacity: 0,
        }}>
          Come funziona
        </div>
        <SplitTitle text="Tre passi, nessuna complicazione" style={{
          ...display, textAlign: "center", color: "#fff", fontWeight: 700,
          fontSize: "clamp(24px, 3.6vw, 34px)", margin: "0 auto 56px", maxWidth: 640, lineHeight: 1.25,
        }} />

        <div className="a360-steps">
          <div className="a360-steps-track" aria-hidden="true">
            <div ref={lineRef} className="a360-steps-line" />
          </div>

          {STEPS.map((s) => (
            <div key={s.n} className="a360-step a360-reveal" style={{ opacity: 0 }}>
              <div className="a360-step-node">
                <span style={{ ...display, fontWeight: 700, fontSize: 19, color: "#fff" }}>{s.n}</span>
              </div>
              <div className="a360-step-icon">
                <s.Icon size={17} color={C.orange} />
              </div>
              <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 19, marginBottom: 9 }}>
                {s.title}
              </div>
              <p style={{ ...font, color: "rgba(255,255,255,0.68)", fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

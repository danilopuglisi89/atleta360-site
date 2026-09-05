import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, TrendingUp } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";
import RadarHero from "./RadarHero";

gsap.registerPlugin(ScrollTrigger);

/* Ricostruzione della dashboard come componenti nativi (non screenshot):
   resta nitida a ogni schermo, si anima, e soprattutto non rischia di
   mostrare per sbaglio dati veri delle atlete. I numeri qui sono
   dichiaratamente d'esempio, come nella demo. */

const SKILLS = [
  { name: "Focus", v: 82 },
  { name: "Comunicazione", v: 74 },
  { name: "Coachability", v: 88 },
  { name: "Gestione errore", v: 69 },
];

const ROWS = [
  { n: "Giulia R.", role: "Palleggiatrice", val: "8.1", up: "+0.6" },
  { n: "Sara M.", role: "Libero", val: "7.4", up: "+0.3" },
  { n: "Elena T.", role: "Centrale", val: "7.9", up: "+0.9" },
];

export default function DemoPreview({ onChoose }) {
  const rootRef = useRef(null);
  const avgRef = useRef(null);
  useRevealOnScroll(rootRef);

  useEffect(() => {
    const el = rootRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bars = el.querySelectorAll(".a360-bar-fill");

    if (reduced) {
      gsap.set(bars, { scaleX: 1 });
      if (avgRef.current) avgRef.current.textContent = "7.6";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(bars, { scaleX: 0 }, {
        scaleX: 1, duration: 1.1, stagger: 0.09, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
      });
      const counter = { v: 0 };
      gsap.to(counter, {
        v: 7.6, duration: 1.3, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
        onUpdate: () => { if (avgRef.current) avgRef.current.textContent = counter.v.toFixed(1); },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="demo" style={{ position: "relative", zIndex: 2, padding: "80px 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="a360-reveal" style={{
          ...font, textAlign: "center", color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12, opacity: 0,
        }}>
          Cosa vedrai nella demo
        </div>
        <SplitTitle text="La dashboard, prima ancora di lasciare i tuoi dati" style={{
          ...display, textAlign: "center", color: "#fff", fontWeight: 700,
          fontSize: "clamp(24px, 3.6vw, 34px)", margin: "0 auto 12px", maxWidth: 720, lineHeight: 1.25,
        }} />
        <p className="a360-reveal" style={{
          ...font, textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: 15,
          margin: "0 auto 44px", maxWidth: 560, lineHeight: 1.6, opacity: 0,
        }}>
          Questo è il prodotto vero, con numeri d'esempio. Nella demo puoi cliccare tutto.
        </p>

        <div className="a360-demo-grid">
          <div className="a360-reveal a360-demo-card" style={{ opacity: 0 }}>
            <div className="a360-demo-head">
              <span style={{ ...display, fontWeight: 700, fontSize: 15, color: "#fff" }}>Media squadra</span>
              <span ref={avgRef} style={{
                ...display, fontWeight: 700, fontSize: 30, color: C.orange, lineHeight: 1,
                textShadow: "0 0 22px rgba(255,122,24,0.55)",
              }}>0.0</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 20 }}>
              {SKILLS.map((s) => (
                <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", ...font, fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>
                    <span>{s.name}</span><span>{(s.v / 10).toFixed(1)}</span>
                  </div>
                  <div className="a360-bar">
                    <div className="a360-bar-fill" style={{ width: `${s.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="a360-reveal a360-demo-card a360-demo-radar" style={{ opacity: 0 }}>
            <span style={{ ...display, fontWeight: 700, fontSize: 15, color: "#fff" }}>Profilo competenze</span>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
              <RadarHero size={250} />
            </div>
          </div>

          <div className="a360-reveal a360-demo-card" style={{ opacity: 0 }}>
            <div className="a360-demo-head">
              <span style={{ ...display, fontWeight: 700, fontSize: 15, color: "#fff" }}>Le atlete</span>
              <span style={{ ...font, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>ultimi 30 giorni</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
              {ROWS.map((r) => (
                <div key={r.n} className="a360-demo-row">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...font, fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{r.n}</div>
                    <div style={{ ...font, fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{r.role}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="a360-chip"><TrendingUp size={11} /> {r.up}</span>
                    <span style={{ ...display, fontWeight: 700, fontSize: 17, color: "#fff" }}>{r.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="a360-reveal" style={{ textAlign: "center", marginTop: 40, opacity: 0 }}>
          <button className="a360-btn a360-btn-primary a360-btn-lg" onClick={() => onChoose("societa")}>
            Aprila e provala <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}

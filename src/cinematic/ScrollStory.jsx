import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brain, LineChart, Award } from "lucide-react";
import { C, font, display } from "../theme";

gsap.registerPlugin(ScrollTrigger);

const SCENES = [
  {
    Icon: Brain,
    kicker: "6 competenze, un solo rilevamento",
    title: "Reset, focus, gestione del corpo, comunicazione, coachability, tattica",
    text: "Ogni rilevamento fotografa le soft skill dell'atleta in modo semplice e ripetibile, senza test complicati da gestire.",
    stat: 6, statLabel: "competenze tracciate",
  },
  {
    Icon: LineChart,
    kicker: "La crescita, mese dopo mese",
    title: "Grafici che raccontano il percorso, non solo il numero di oggi",
    text: "Confronta i rilevamenti nel tempo, per singolo atleta o per l'intera squadra, e vedi subito dove intervenire.",
    stat: 100, statLabel: "% dati sotto il controllo della società",
  },
  {
    Icon: Award,
    kicker: "Motivazione che si vede",
    title: "Badge e traguardi che spingono ogni atleta a migliorarsi",
    text: "Un sistema semplice che rende visibili i progressi e premia la costanza, non solo il talento.",
    stat: null, statLabel: null,
  },
];

/* Ogni scena arriva verso la camera invece di scorrere piatta: lo scroll
   guida traslazione in profondità, rotazione e sfocatura (scrub). */
function Scene({ scene, index }) {
  const rootRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    const panels = el.querySelectorAll(".a360-panel");

    if (reduced) {
      gsap.set(panels, { opacity: 1, y: 0, z: 0, rotateX: 0, filter: "none" });
      if (numRef.current && scene.stat != null) numRef.current.textContent = scene.stat;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(panels,
        { opacity: 0, y: 80, z: -420, rotateX: 12, filter: "blur(12px)" },
        {
          opacity: 1, y: 0, z: 0, rotateX: 0, filter: "blur(0px)",
          ease: "power2.out", stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", end: "top 42%", scrub: 0.7 },
        });

      if (numRef.current && scene.stat != null) {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: scene.stat, ease: "none",
          scrollTrigger: { trigger: el, start: "top 80%", end: "top 45%", scrub: 0.5 },
          onUpdate: () => { numRef.current.textContent = Math.round(counter.v); },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [scene]);

  return (
    <div ref={rootRef} style={{
      minHeight: "78vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px 20px", perspective: 1100,
    }}>
      <div style={{
        width: "100%", maxWidth: 920, display: "flex", flexWrap: "wrap-reverse",
        flexDirection: index % 2 === 1 ? "row-reverse" : "row",
        alignItems: "center", justifyContent: "center", gap: 44,
        transformStyle: "preserve-3d",
      }}>
        <div className="a360-panel" style={{ flex: "1 1 320px", maxWidth: 440, opacity: 0 }}>
          <div style={{
            ...font, display: "inline-flex", alignItems: "center", gap: 8,
            color: C.orange, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
            textTransform: "uppercase", marginBottom: 14,
          }}>
            <scene.Icon size={16} /> {scene.kicker}
          </div>
          <h2 style={{
            ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(22px, 3.4vw, 31px)",
            lineHeight: 1.26, margin: 0, textShadow: "0 2px 26px rgba(0,0,0,0.55)",
          }}>{scene.title}</h2>
          <p style={{ ...font, color: "rgba(255,255,255,0.7)", fontSize: 15.5, lineHeight: 1.65, marginTop: 16 }}>
            {scene.text}
          </p>
        </div>

        <div className="a360-panel" style={{
          flex: "0 0 auto", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center",
          width: 200, height: 200, borderRadius: 24,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.11)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}>
          {scene.stat != null ? (
            <div style={{ textAlign: "center" }}>
              <div ref={numRef} style={{
                ...display, color: C.orange, fontWeight: 700, fontSize: 54, lineHeight: 1,
                textShadow: "0 0 34px rgba(255,122,24,0.65)",
              }}>0</div>
              <div style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: 12.5, marginTop: 8, maxWidth: 140, lineHeight: 1.4 }}>
                {scene.statLabel}
              </div>
            </div>
          ) : (
            <scene.Icon size={72} color={C.orange} strokeWidth={1.4}
              style={{ filter: "drop-shadow(0 0 26px rgba(255,122,24,0.6))" }} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScrollStory() {
  return (
    <div style={{ position: "relative", zIndex: 2 }}>
      {SCENES.map((s, i) => <Scene key={i} scene={s} index={i} />)}
    </div>
  );
}

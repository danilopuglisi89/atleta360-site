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

function Scene({ scene, index }) {
  const rootRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = rootRef.current;
    const targets = el.querySelectorAll(".a360-scene-in");

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      if (numRef.current && scene.stat != null) numRef.current.textContent = scene.stat;
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, { opacity: 0, y: 40 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 72%" },
      });

      if (numRef.current && scene.stat != null) {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: scene.stat, duration: 1.4, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 72%" },
          onUpdate: () => { numRef.current.textContent = Math.round(counter.v); },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [scene]);

  const align = index % 2 === 1 ? "row-reverse" : "row";

  return (
    <div ref={rootRef} style={{
      minHeight: "72vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "60px 20px",
    }}>
      <div style={{
        width: "100%", maxWidth: 920, display: "flex", flexWrap: "wrap-reverse",
        flexDirection: align, alignItems: "center", justifyContent: "center", gap: 44,
      }}>
        <div className="a360-scene-in" style={{ flex: "1 1 320px", maxWidth: 440, opacity: 0 }}>
          <div style={{
            ...font, display: "inline-flex", alignItems: "center", gap: 8,
            color: C.orange, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
            textTransform: "uppercase", marginBottom: 14,
          }}>
            <scene.Icon size={16} /> {scene.kicker}
          </div>
          <h2 style={{
            ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(22px, 3.4vw, 30px)",
            lineHeight: 1.28, margin: 0,
          }}>{scene.title}</h2>
          <p style={{ ...font, color: "rgba(255,255,255,0.68)", fontSize: 15.5, lineHeight: 1.65, marginTop: 16 }}>
            {scene.text}
          </p>
        </div>

        <div className="a360-scene-in" style={{
          flex: "0 0 auto", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center",
          width: 200, height: 200, borderRadius: 24,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}>
          {scene.stat != null ? (
            <div style={{ textAlign: "center" }}>
              <div ref={numRef} style={{ ...display, color: C.orange, fontWeight: 700, fontSize: 52, lineHeight: 1 }}>0</div>
              <div style={{ ...font, color: "rgba(255,255,255,0.55)", fontSize: 12.5, marginTop: 8, maxWidth: 140, lineHeight: 1.4 }}>
                {scene.statLabel}
              </div>
            </div>
          ) : (
            <scene.Icon size={72} color={C.orange} strokeWidth={1.4} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScrollStory() {
  return (
    <div style={{ position: "relative", background: "#060B2E", zIndex: 2 }}>
      {SCENES.map((s, i) => <Scene key={i} scene={s} index={i} />)}
    </div>
  );
}

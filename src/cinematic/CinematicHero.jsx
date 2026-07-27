import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ChevronDown, User, Building2 } from "lucide-react";
import { C, font, display } from "../theme";
import { ChoiceCard } from "../LandingHero";
import ParticleField from "./ParticleField";
import RadarHero from "./RadarHero";

const TITLE = "La dashboard che fa crescere le soft skill della tua squadra";

/* Scena d'apertura: titolo che entra parola per parola, radar animato,
   poi (a sequenza conclusa) le due scelte atleta/società. */
export default function CinematicHero({ onChoose }) {
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const radarRef = useRef(null);
  const badgeRef = useRef(null);
  const choicesRef = useRef(null);
  const scrollHintRef = useRef(null);
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShowChoices(true);
      return;
    }

    const words = titleRef.current.querySelectorAll(".a360-word");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(badgeRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 })
      .fromTo(radarRef.current, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.9 }, "-=0.2")
      .fromTo(words, { opacity: 0, y: 26, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, stagger: 0.055 }, "-=0.5")
      .fromTo(subRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.25")
      .add(() => setShowChoices(true))
      .fromTo(choicesRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.7 })
      .fromTo(scrollHintRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.3");

    return () => tl.kill();
  }, []);

  return (
    <div style={{
      ...font, position: "relative", minHeight: "100vh", overflow: "hidden",
      background: `radial-gradient(120% 90% at 50% 0%, ${C.navy2} 0%, ${C.navy} 55%, #060B2E 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "56px 20px 40px",
    }}>
      <ParticleField />

      <div style={{ position: "relative", zIndex: 2, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div ref={badgeRef} style={{ display: "inline-flex", alignItems: "center", gap: 11, marginBottom: 8, opacity: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, background: C.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            ...display, fontWeight: 700, color: "#fff", fontSize: 14, letterSpacing: -0.5,
            boxShadow: "0 0 24px rgba(255,122,24,0.5)",
          }}>360</div>
          <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: -0.3 }}>Atleta360</div>
        </div>

        <div ref={radarRef} style={{ margin: "6px 0 -18px", opacity: 0 }}>
          <RadarHero size={300} />
        </div>

        <div style={{ width: "100%", maxWidth: 760, textAlign: "center", marginTop: 8, marginBottom: 40, position: "relative", zIndex: 2 }}>
          <h1 ref={titleRef} style={{
            ...display, color: "#fff", fontWeight: 700, letterSpacing: -0.5,
            fontSize: "clamp(28px, 5vw, 46px)", lineHeight: 1.18, margin: 0,
          }}>
            {TITLE.split(" ").map((w, i) => (
              <span key={i} className="a360-word" style={{ display: "inline-block", marginRight: "0.28em" }}>{w}</span>
            ))}
          </h1>
          <p ref={subRef} style={{
            ...font, color: "rgba(255,255,255,0.75)", fontSize: 16.5, lineHeight: 1.6,
            marginTop: 20, maxWidth: 560, marginLeft: "auto", marginRight: "auto", opacity: 0,
          }}>
            Focus, comunicazione, gestione degli errori, coachability: rilevamenti periodici,
            grafici e badge per far crescere ogni atleta. Prova subito una demo gratuita, con dati di esempio.
          </p>
        </div>

        <div
          ref={choicesRef}
          style={{
            display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
            width: "100%", maxWidth: 720, opacity: showChoices ? undefined : 0,
            pointerEvents: showChoices ? "auto" : "none",
          }}
        >
          <ChoiceCard
            Icon={User}
            title="Sono un'atleta"
            description="Guarda come vedresti il tuo profilo: i tuoi progressi, i tuoi badge, la tua scheda personale."
            onClick={() => onChoose("atleta")}
          />
          <ChoiceCard
            Icon={Building2}
            title="Sono una società sportiva"
            description="Esplora la dashboard completa: tutta la squadra, i rilevamenti, i grafici di confronto."
            onClick={() => onChoose("societa")}
          />
        </div>

        <div ref={scrollHintRef} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          marginTop: 46, opacity: 0, color: "rgba(255,255,255,0.45)",
        }}>
          <span style={{ ...font, fontSize: 12 }}>Scopri di più</span>
          <ChevronDown size={18} className="a360-bounce" />
        </div>
      </div>
    </div>
  );
}

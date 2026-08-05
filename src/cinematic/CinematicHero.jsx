import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ChevronDown, User, Building2 } from "lucide-react";
import { font, display } from "../theme";
import { ChoiceCard } from "../LandingHero";
import RadarHero from "./RadarHero";

const TITLE = "La dashboard che fa crescere le soft skill della tua squadra";
const WORDS = TITLE.split(" ");

/* Sequenza d'apertura, tempi in secondi:
   0.15 logo · 0.5 ESPLOSIONE · 1.5 convergenza in esagono
   2.3 aggancio radar + onda d'urto · 2.45 titolo · 3.3 sottotitolo
   3.5 riflesso di luce · 3.6 scelte · 4.2 invito allo scroll        */
export default function CinematicHero({ onChoose, stageRef }) {
  const titleRef = useRef(null);
  const sweepRef = useRef(null);
  const subRef = useRef(null);
  const radarRef = useRef(null);
  const badgeRef = useRef(null);
  const choicesRef = useRef(null);
  const hintRef = useRef(null);
  const [radarIn, setRadarIn] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRadarIn(true);
      gsap.set([badgeRef.current, subRef.current, choicesRef.current, hintRef.current, radarRef.current], { opacity: 1 });
      gsap.set(titleRef.current.querySelectorAll(".a360-word"), { opacity: 1 });
      return;
    }

    const stage = stageRef?.current;
    const words = titleRef.current.querySelectorAll(".a360-word");
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(badgeRef.current, { opacity: 0, y: -14, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, 0.15)

      .add(() => stage?.burst(), 0.5)
      .add(() => stage?.converge(), 1.5)

      // il radar aggancia: onda d'urto, le particelle si liberano, l'SVG compare
      .add(() => { stage?.shock(1.2); stage?.release(); setRadarIn(true); }, 2.3)
      .fromTo(radarRef.current, { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, 2.3)

      // titolo: le parole entrano a schianto dal fondo, sfocate
      .fromTo(words, { opacity: 0, y: 46, scale: 1.28, filter: "blur(14px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.06 }, 2.45)

      .fromTo(subRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 3.3)

      // riflesso di luce che passa sulle lettere
      .fromTo(sweepRef.current, { backgroundPosition: "150% 0" },
        { backgroundPosition: "-50% 0", duration: 1.25, ease: "power2.inOut" }, 3.5)

      .fromTo(choicesRef.current, { opacity: 0, y: 34, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, 3.6)
      .fromTo(hintRef.current, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 4.2);

    /* Rete di sicurezza: se la timeline non arriva in fondo (scheda in
       background che sospende rAF, errore imprevisto…) i due CTA resterebbero
       invisibili e la pagina non raccoglierebbe più contatti. Dopo 8s forziamo
       comunque lo stato finale. */
    const safety = setTimeout(() => {
      if (tl.progress() >= 1) return;
      setRadarIn(true);
      gsap.set([badgeRef.current, radarRef.current, subRef.current, choicesRef.current, hintRef.current],
        { opacity: 1, y: 0, scale: 1, filter: "none", clearProps: "filter" });
      gsap.set(words, { opacity: 1, y: 0, scale: 1, filter: "none", clearProps: "filter" });
    }, 8000);

    return () => { clearTimeout(safety); tl.kill(); };
  }, [stageRef]);

  return (
    <section style={{
      ...font, position: "relative", zIndex: 2, minHeight: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "56px 20px 40px",
    }}>
      <div ref={badgeRef} style={{ marginBottom: 8, opacity: 0 }}>
        <img
          src="/logo-esteso-bianco.png"
          alt="Atleta360 — Mental Coach | Pallavolo"
          style={{ height: 84, display: "block", filter: "drop-shadow(0 0 26px rgba(255,122,24,0.35))" }}
        />
      </div>

      <div ref={radarRef} style={{ margin: "6px 0 -18px", opacity: 0 }}>
        {radarIn && <RadarHero size={300} />}
      </div>

      <div style={{ width: "100%", maxWidth: 780, textAlign: "center", marginTop: 8, marginBottom: 40 }}>
        <h1 ref={titleRef} style={{
          ...display, position: "relative", color: "#fff", fontWeight: 700, letterSpacing: -0.6,
          fontSize: "clamp(30px, 5.4vw, 52px)", lineHeight: 1.14, margin: 0,
          textShadow: "0 0 44px rgba(120,160,255,0.30), 0 2px 30px rgba(0,0,0,0.5)",
        }}>
          {WORDS.map((word, i) => (
            <span key={i} className="a360-word" style={{ display: "inline-block", marginRight: "0.28em" }}>{word}</span>
          ))}
          <span ref={sweepRef} aria-hidden="true" className="a360-title-sweep">
            {WORDS.map((word, i) => (
              <span key={i} style={{ display: "inline-block", marginRight: "0.28em" }}>{word}</span>
            ))}
          </span>
        </h1>
        <p ref={subRef} style={{
          ...font, color: "rgba(255,255,255,0.78)", fontSize: 16.5, lineHeight: 1.6,
          marginTop: 22, maxWidth: 560, marginLeft: "auto", marginRight: "auto", opacity: 0,
        }}>
          Focus, comunicazione, gestione degli errori, coachability: rilevamenti periodici,
          grafici e badge per far crescere ogni atleta. Prova subito una demo gratuita, con dati di esempio.
        </p>
      </div>

      <div ref={choicesRef} style={{
        display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
        width: "100%", maxWidth: 720, opacity: 0,
      }}>
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

      <div ref={hintRef} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        marginTop: 46, opacity: 0, color: "rgba(255,255,255,0.5)",
      }}>
        <span style={{ ...font, fontSize: 12 }}>Scopri di più</span>
        <ChevronDown size={18} className="a360-bounce" />
      </div>
    </section>
  );
}

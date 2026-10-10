import { Fragment, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { gsap } from "gsap";
import { ChevronDown, User, Building2 } from "lucide-react";
import { font, display, T } from "../theme";
import { ChoiceCard } from "../LandingHero";
import Magnetic from "./Magnetic";

const TITLE = "La dashboard che fa crescere le soft skill della tua squadra";
const WORDS = TITLE.split(" ");

/* Sequenza d'apertura, tempi in secondi:
   0.15 logo · 0.5 ESPLOSIONE · 1.35 le particelle formano la giocatrice
   2.35 aggancio (lampo, onda d'urto) · 2.45 titolo · 3.2 sottotitolo
   3.4 riflesso di luce · 3.55 scelte · 4.1 invito allo scroll

   quick=true (si torna dal form): niente esplosione, la figura si
   ricompone subito e il testo entra in un secondo. */
const CinematicHero = forwardRef(function CinematicHero({ onChoose, stageRef, quick = false }, ref) {
  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const sweepRef = useRef(null);
  const subRef = useRef(null);
  const logoRef = useRef(null);
  const choicesRef = useRef(null);
  const hintRef = useRef(null);
  const provaRef = useRef(null);

  /* Uscita cinematica verso il form: le particelle si liberano, lampo,
     il contenuto sale e sfoca. Restituisce una Promise. */
  useImperativeHandle(ref, () => ({
    leave() {
      const stage = stageRef?.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return Promise.resolve();
      stage?.shock(0.9);
      stage?.release();
      return new Promise((resolve) => {
        gsap.to(rootRef.current, {
          opacity: 0, y: -36, filter: "blur(10px)", duration: 0.55, ease: "power2.in", onComplete: resolve,
        });
      });
    },
  }), [stageRef]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = titleRef.current.querySelectorAll(".a360-word");
    const all = [logoRef.current, subRef.current, choicesRef.current, provaRef.current, hintRef.current];

    if (reduced) {
      gsap.set(all, { opacity: 1 });
      gsap.set(words, { opacity: 1 });
      return;
    }

    const stage = stageRef?.current;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (quick) {
      tl.add(() => { stage?.converge(); }, 0)
        .add(() => { stage?.lock(); }, 0.9)
        .fromTo(logoRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.1)
        .fromTo(words, { opacity: 0, y: 24, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.035 }, 0.2)
        .fromTo(subRef.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5)
        .fromTo(choicesRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 0.65)
        .fromTo(provaRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.9)
        .fromTo(hintRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 1.0);
    } else {
      tl.fromTo(logoRef.current, { opacity: 0, y: -14, filter: "blur(8px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 }, 0.15)

        .add(() => stage?.burst(), 0.5)
        .add(() => stage?.converge(), 1.35)
        .add(() => stage?.lock(), 2.35)

        // titolo: le parole entrano a schianto dal fondo, sfocate
        .fromTo(words, { opacity: 0, y: 46, scale: 1.28, filter: "blur(14px)" },
          { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, stagger: 0.06 }, 2.45)

        .fromTo(subRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 3.2)

        // riflesso di luce che passa sulle lettere
        .fromTo(sweepRef.current, { backgroundPosition: "150% 0" },
          { backgroundPosition: "-50% 0", duration: 1.25, ease: "power2.inOut" }, 3.4)

        .fromTo(choicesRef.current, { opacity: 0, y: 34, filter: "blur(10px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, 3.55)
        .fromTo(provaRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7 }, 3.85)
        .fromTo(hintRef.current, { opacity: 0 }, { opacity: 1, duration: 0.7 }, 4.1);
    }

    /* Rete di sicurezza: se la timeline non arriva in fondo (scheda in
       background che sospende rAF, errore imprevisto…) i due CTA resterebbero
       invisibili e la pagina non raccoglierebbe più contatti. Dopo 8s forziamo
       comunque lo stato finale. */
    const safety = setTimeout(() => {
      if (tl.progress() >= 1) return;
      gsap.set(all, { opacity: 1, y: 0, scale: 1, filter: "none", clearProps: "filter" });
      gsap.set(words, { opacity: 1, y: 0, scale: 1, filter: "none", clearProps: "filter" });
    }, quick ? 3000 : 8000);

    return () => { clearTimeout(safety); tl.kill(); };
  }, [stageRef, quick]);

  return (
    <section ref={rootRef} className="a360-hero" style={font}>
      <div className="a360-hero-inner">
        <div className="a360-hero-copy">
          <div ref={logoRef} className="a360-hero-logo" style={{ opacity: 0 }}>
            <img
              src="/logo-esteso-bianco.png"
              alt="Atleta360 — Mental Coach | Pallavolo"
              style={{ height: 76, display: "block", filter: "drop-shadow(0 0 26px rgba(255,122,24,0.35))" }}
            />
          </div>

          <h1 ref={titleRef} className="a360-hero-title" style={{
            ...display, position: "relative", color: "#fff", fontWeight: 700, letterSpacing: -0.8,
            fontSize: T.display, lineHeight: 1.08, margin: 0,
            textShadow: "0 0 44px rgba(120,160,255,0.30), 0 2px 30px rgba(0,0,0,0.5)",
          }}>
            {/* Spazi VERI fra le parole, non margini: con i margini il testo
                del titolo arrivava ai motori di ricerca tutto attaccato
                ("Ladashboardchefacrescere…"), cioè una parola sola senza senso
                nel punto che conta di più della pagina. */}
            {WORDS.map((word, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className="a360-word" style={{ display: "inline-block", opacity: 0 }}>{word}</span>
              </Fragment>
            ))}
            {/* Il riflesso di luce disegna il titolo una seconda volta: il testo
                gli arriva da data-testo via ::before (index.css), così a schermo
                è identico ma non entra nel testo dell'h1 — prima il motore
                leggeva il titolo due volte. */}
            <span ref={sweepRef} aria-hidden="true" className="a360-title-sweep" data-testo={TITLE} />
          </h1>

          <p ref={subRef} className="a360-hero-sub" style={{
            /* corpo e interlinea stanno in .a360-hero-sub (index.css): sul
               telefono si rimpiccioliscono, e uno stile inline li batterebbe */
            ...font, color: "rgba(255,255,255,0.78)", maxWidth: 560, opacity: 0,
          }}>
            Focus, comunicazione, gestione degli errori, coachability: rilevamenti periodici,
            grafici e badge per far crescere ogni atleta. Prova subito una demo gratuita, con dati di esempio.
          </p>

          <div ref={choicesRef} className="a360-hero-choices" style={{ opacity: 0 }}>
            <Magnetic>
              <ChoiceCard
                Icon={User}
                title="Sono un'atleta"
                description="Guarda come vedresti il tuo profilo: i tuoi progressi, i tuoi badge, la tua scheda personale."
                onClick={() => onChoose("atleta")}
              />
            </Magnetic>
            <Magnetic>
              <ChoiceCard
                Icon={Building2}
                title="Sono una società sportiva"
                description="Esplora la dashboard completa: tutta la squadra, i rilevamenti, i grafici di confronto."
                onClick={() => onChoose("societa")}
              />
            </Magnetic>
          </div>

          {/* Prova sopra la piega. Oasi Volley stava a 4.303px: qui trasforma
              la hero da "un prodotto che qualcuno ha costruito" a "un prodotto
              che una società ha scelto". Dice solo quello che è vero oggi —
              che hanno iniziato — senza promettere risultati. */}
          <div ref={provaRef} className="a360-hero-prova" style={{ opacity: 0 }}>
            <span className="a360-hero-prova-chip">
              <img src="/oasi-volley-logo.png" alt="" aria-hidden="true" />
            </span>
            <span>La prima società a usarlo: <strong>Oasi Volley Viareggio</strong></span>
          </div>

          <div ref={hintRef} className="a360-hero-hint" style={{ opacity: 0, color: "rgba(255,255,255,0.5)" }}>
            <span style={{ ...font, fontSize: T.micro }}>Scopri di più</span>
            <ChevronDown size={18} className="a360-bounce" />
          </div>
        </div>

        {/* spazio riservato alla silhouette di particelle (disegnata dal palco) */}
        <div className="a360-hero-figure" aria-hidden="true" />
      </div>
    </section>
  );
});

export default CinematicHero;

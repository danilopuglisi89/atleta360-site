import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { C, font, display } from "./theme";
import { supabaseConfigured } from "./supabaseClient";
import { demoUrl } from "./leads";
import { initPixelIfConsented, trackLead } from "./pixel";
import { trackChoice, initScrollDepth } from "./analytics";
import LeadForm from "./LeadForm";
import CookieBanner from "./CookieBanner";
import CinematicStage from "./cinematic/CinematicStage";
import CinematicHero from "./cinematic/CinematicHero";
import SiteHeader from "./cinematic/SiteHeader";
import CursorGlow from "./cinematic/CursorGlow";
import ScrollProgress from "./cinematic/ScrollProgress";
import { useSmoothScroll, scrollToTop } from "./cinematic/smoothScroll";

/* Tutto ciò che sta sotto la piega viene caricato dopo la hero: chi arriva
   dalle campagne vede prima possibile il titolo e i due bottoni. */
const ScrollStory = lazy(() => import("./cinematic/ScrollStory"));
const DemoPreview = lazy(() => import("./cinematic/DemoPreview"));
const HowItWorks = lazy(() => import("./cinematic/HowItWorks"));
const CaseStudy = lazy(() => import("./cinematic/CaseStudy"));
const AboutFounder = lazy(() => import("./cinematic/AboutFounder"));
const FAQ = lazy(() => import("./cinematic/FAQ"));
const SiteFooter = lazy(() => import("./cinematic/SiteFooter"));
const ContactPage = lazy(() => import("./ContactPage"));
const PrivacyPage = lazy(() => import("./PrivacyPage"));

const TITLES = {
  home: "Atleta360 — la dashboard che fa crescere le soft skill della tua squadra",
  contatti: "Richiedi la demo gratuita — Atleta360",
  privacy: "Informativa privacy — Atleta360",
  form: "Richiedi la demo gratuita — Atleta360",
};

function SetupNotice() {
  return (
    <div style={{
      ...font, minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ background: C.card, borderRadius: 18, padding: 26, maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AlertCircle size={20} color="#B4232A" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ ...display, fontSize: 16, fontWeight: 700, color: C.ink }}>Configurazione mancante</div>
            <p style={{ ...font, fontSize: 13.5, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
              Imposta le variabili d'ambiente <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> su Vercel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Ultimo fotogramma prima della demo: vale la pena curarlo. */
function Redirecting({ tipo }) {
  return (
    <div style={{
      ...font, position: "relative", zIndex: 2, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center",
    }}>
      <div style={{ maxWidth: 420 }}>
        <img src="/logo-esteso-bianco.png" alt="" height="56" style={{ marginBottom: 28, filter: "drop-shadow(0 0 24px rgba(255,122,24,0.4))" }} />
        <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 24, marginBottom: 10 }}>
          La tua demo è pronta
        </div>
        <p style={{ ...font, color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.6, margin: "0 0 26px" }}>
          Ti sto portando nella dashboard{tipo === "atleta" ? ", nella vista dell'atleta" : " completa della società"}.
          I dati che vedrai sono d'esempio: puoi cliccare tutto senza problemi.
        </p>
        <div className="a360-loader" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
  );
}

export default function App() {
  const [tipo, setTipo] = useState(null); // null | "atleta" | "societa"
  const [redirecting, setRedirecting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const returned = useRef(false);   // true quando si torna dal form: intro breve

  useSmoothScroll();

  useEffect(() => {
    initPixelIfConsented();
    return initScrollDepth();
  }, []);

  const isContactRoute = typeof window !== "undefined"
    && window.location.pathname.replace(/\/+$/, "") === "/contatti";

  // il titolo della scheda segue la vista: conta per SEO e per i preferiti
  useEffect(() => {
    const key = showPrivacy ? "privacy" : isContactRoute ? "contatti" : tipo ? "form" : "home";
    document.title = TITLES[key];
  }, [showPrivacy, isContactRoute, tipo]);

  if (!supabaseConfigured) return <SetupNotice />;
  if (showPrivacy) return (
    <Suspense fallback={null}>
      <PrivacyPage onBack={() => setShowPrivacy(false)} />
      <CookieBanner />
    </Suspense>
  );

  const goToForm = (chosenTipo) => {
    trackLead(chosenTipo);
    setRedirecting(true);
    window.location.href = demoUrl(chosenTipo);
  };

  /* Hero → form: uscita cinematica, poi cambio di vista in cima alla pagina. */
  const choose = async (chosen, origine = "hero") => {
    if (leaving) return;
    trackChoice(chosen, origine);
    setLeaving(true);
    // l'animazione d'uscita non deve MAI bloccare l'arrivo al form:
    // al massimo 900 ms, poi si procede comunque
    await Promise.race([
      heroRef.current?.leave() ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, 900)),
    ]);
    scrollToTop();
    setTipo(chosen);
    setLeaving(false);
  };

  const goHome = () => {
    returned.current = true;
    scrollToTop();
    setTipo(null);
  };

  let content;
  if (redirecting) {
    content = <Redirecting tipo={tipo} />;
  } else if (isContactRoute) {
    content = (
      <Suspense fallback={null}>
        <ContactPage onOpenPrivacy={() => setShowPrivacy(true)} onSuccess={goToForm} />
      </Suspense>
    );
  } else if (tipo) {
    content = (
      <LeadForm
        tipo={tipo}
        onBack={goHome}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onSuccess={goToForm}
        animateIn
      />
    );
  } else {
    content = (
      <>
        <SiteHeader onChoose={(t) => choose(t, "header")} />
        <CinematicHero ref={heroRef} onChoose={choose} stageRef={stageRef} quick={returned.current} />
        <Suspense fallback={null}>
          <ScrollStory />
          <DemoPreview onChoose={(t) => choose(t, "demo-preview")} />
          <HowItWorks />
          <CaseStudy />
          <AboutFounder />
          <FAQ />
          <SiteFooter onOpenPrivacy={() => setShowPrivacy(true)} />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <CinematicStage ref={stageRef} />
      <CursorGlow />
      <ScrollProgress />
      {content}
      <CookieBanner />
    </>
  );
}

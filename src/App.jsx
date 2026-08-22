import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { C, font, display } from "./theme";
import { supabaseConfigured } from "./supabaseClient";
import { demoUrl } from "./leads";
import { initPixelIfConsented, trackLead } from "./pixel";
import LeadForm from "./LeadForm";
import ContactPage from "./ContactPage";
import PrivacyPage from "./PrivacyPage";
import CookieBanner from "./CookieBanner";
import CinematicStage from "./cinematic/CinematicStage";
import CinematicHero from "./cinematic/CinematicHero";
import ScrollStory from "./cinematic/ScrollStory";
import HowItWorks from "./cinematic/HowItWorks";
import CaseStudy from "./cinematic/CaseStudy";
import AboutFounder from "./cinematic/AboutFounder";
import FAQ from "./cinematic/FAQ";
import SiteFooter from "./cinematic/SiteFooter";
import CursorGlow from "./cinematic/CursorGlow";
import ScrollProgress from "./cinematic/ScrollProgress";
import { useSmoothScroll, scrollToTop } from "./cinematic/smoothScroll";

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

function Redirecting() {
  return (
    <div style={{
      ...font, position: "relative", zIndex: 2, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center",
    }}>
      <div>
        <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
          Sto preparando la tua demo…
        </div>
        <p style={{ ...font, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
          Un attimo, ti sto portando nella dashboard.
        </p>
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
  }, []);

  if (!supabaseConfigured) return <SetupNotice />;
  if (showPrivacy) return (
    <>
      <PrivacyPage onBack={() => setShowPrivacy(false)} />
      <CookieBanner />
    </>
  );

  const isContactRoute = window.location.pathname.replace(/\/+$/, "") === "/contatti";

  /* Hero -> form: uscita cinematica, poi cambio di vista in cima alla pagina. */
  const choose = async (chosen) => {
    if (leaving) return;
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
    content = <Redirecting />;
  } else if (isContactRoute) {
    content = (
      <ContactPage
        onOpenPrivacy={() => setShowPrivacy(true)}
        onSuccess={(chosenTipo) => {
          trackLead(chosenTipo);
          setRedirecting(true);
          window.location.href = demoUrl(chosenTipo);
        }}
      />
    );
  } else if (tipo) {
    content = (
      <LeadForm
        tipo={tipo}
        onBack={goHome}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onSuccess={(chosenTipo) => {
          trackLead(chosenTipo);
          setRedirecting(true);
          window.location.href = demoUrl(chosenTipo);
        }}
        animateIn
      />
    );
  } else {
    content = (
      <>
        <CinematicHero ref={heroRef} onChoose={choose} stageRef={stageRef} quick={returned.current} />
        <ScrollStory />
        <HowItWorks />
        <CaseStudy />
        <AboutFounder />
        <FAQ />
        <SiteFooter onOpenPrivacy={() => setShowPrivacy(true)} />
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

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { C, font, display } from "./theme";
import { supabaseConfigured } from "./supabaseClient";
import { demoUrl } from "./leads";
import LeadForm from "./LeadForm";
import CinematicHero from "./cinematic/CinematicHero";
import ScrollStory from "./cinematic/ScrollStory";

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

function Redirecting({ tipo }) {
  return (
    <div style={{
      ...font, minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`,
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

  if (!supabaseConfigured) return <SetupNotice />;
  if (redirecting) return <Redirecting tipo={tipo} />;

  if (tipo) {
    return (
      <LeadForm
        tipo={tipo}
        onBack={() => setTipo(null)}
        onSuccess={(chosenTipo) => {
          setRedirecting(true);
          window.location.href = demoUrl(chosenTipo);
        }}
      />
    );
  }

  return (
    <>
      <CinematicHero onChoose={setTipo} />
      <ScrollStory />
      <p style={{ ...font, color: "rgba(255,255,255,0.5)", fontSize: 12.5, textAlign: "center", padding: "20px 0 32px", background: "#060B2E", margin: 0 }}>
        © {new Date().getFullYear()} Atleta360
      </p>
    </>
  );
}

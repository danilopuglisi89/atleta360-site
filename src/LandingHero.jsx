import { User, Building2, ArrowRight } from "lucide-react";
import { C, font, display } from "./theme";

export function ChoiceCard({ Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="a360-choice-card"
      style={{
        ...font, textAlign: "left", cursor: "pointer", border: "none",
        background: C.card, borderRadius: 20, padding: 26,
        boxShadow: "0 24px 70px rgba(0,0,0,0.28)",
        width: "100%", maxWidth: 340,
        display: "flex", flexDirection: "column", gap: 14,
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: C.orangeSoft,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={26} color={C.orange} />
      </div>
      <div>
        <div style={{ ...display, fontSize: 19, fontWeight: 700, color: C.ink }}>{title}</div>
        <p style={{ ...font, fontSize: 13.5, color: C.muted, lineHeight: 1.5, marginTop: 6 }}>{description}</p>
      </div>
      <div style={{
        ...font, display: "inline-flex", alignItems: "center", gap: 7,
        color: C.orange, fontSize: 14, fontWeight: 600, marginTop: 4,
      }}>
        Avvia la demo <ArrowRight size={16} />
      </div>
    </button>
  );
}

export default function LandingHero({ onChoose }) {
  return (
    <div style={{
      ...font, minHeight: "100vh",
      background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navy2} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "60px 20px 40px",
    }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 11, marginBottom: 26 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, background: C.orange,
          display: "flex", alignItems: "center", justifyContent: "center",
          ...display, fontWeight: 700, color: "#fff", fontSize: 14, letterSpacing: -0.5,
        }}>360</div>
        <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 22, letterSpacing: -0.3 }}>Atleta360</div>
      </div>

      <div style={{ width: "100%", maxWidth: 720, textAlign: "center", marginBottom: 44 }}>
        <h1 style={{
          ...display, color: "#fff", fontWeight: 700, letterSpacing: -0.5,
          fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.15, margin: 0,
        }}>
          La dashboard che fa crescere le soft skill della tua squadra
        </h1>
        <p style={{
          ...font, color: "rgba(255,255,255,0.75)", fontSize: 16.5, lineHeight: 1.6,
          marginTop: 18, maxWidth: 560, marginLeft: "auto", marginRight: "auto",
        }}>
          Focus, comunicazione, gestione degli errori, coachability: rilevamenti periodici,
          grafici e badge per far crescere ogni atleta. Prova subito una demo gratuita, con dati di esempio.
        </p>
      </div>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
        width: "100%", maxWidth: 720,
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

      <p style={{ ...font, color: "rgba(255,255,255,0.5)", fontSize: 12.5, marginTop: 48 }}>
        © {new Date().getFullYear()} Atleta360
      </p>
    </div>
  );
}

import { useState } from "react";
import { User, Building2 } from "lucide-react";
import { C, font, display } from "./theme";
import LeadForm from "./LeadForm";

/* Pagina lead dedicata alle campagne (atleta-360.com/contatti).
   Deep-link per le ads: /contatti?tipo=societa oppure /contatti?tipo=atleta
   preseleziona il percorso; senza parametro parte su "società" (il target
   tipico delle campagne CTA). */

export function getContactTipoFromUrl() {
  const t = new URLSearchParams(window.location.search).get("tipo");
  return t === "atleta" ? "atleta" : "societa";
}

function Toggle({ tipo, onChange }) {
  const opt = (value, Icon, label) => {
    const active = tipo === value;
    return (
      <button
        onClick={() => onChange(value)}
        style={{
          ...font, flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
          gap: 7, padding: "10px 14px", borderRadius: 11, cursor: "pointer",
          fontSize: 13.5, fontWeight: 600,
          background: active ? C.orange : "transparent",
          color: active ? "#fff" : "rgba(255,255,255,0.75)",
          border: active ? "1px solid transparent" : "1px solid rgba(255,255,255,0.22)",
        }}
      >
        <Icon size={15} /> {label}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 440, margin: "0 auto 18px" }}>
      {opt("societa", Building2, "Società sportiva")}
      {opt("atleta", User, "Atleta")}
    </div>
  );
}

export default function ContactPage({ onSuccess, onOpenPrivacy }) {
  const [tipo, setTipo] = useState(getContactTipoFromUrl);

  return (
    <div style={{ position: "relative", zIndex: 2, padding: "44px 0 30px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <a href="/" aria-label="Vai alla home di Atleta360">
          <img
            src="/logo-esteso-bianco.png"
            alt="Atleta360 — Mental Coach | Pallavolo"
            style={{ height: 72, display: "block", filter: "drop-shadow(0 0 22px rgba(255,122,24,0.3))" }}
          />
        </a>
      </div>
      <h1 style={{
        ...display, color: "#fff", fontWeight: 700, textAlign: "center",
        fontSize: "clamp(22px, 4vw, 30px)", lineHeight: 1.25,
        maxWidth: 560, margin: "0 auto 8px", padding: "0 20px",
      }}>
        Prova subito la demo gratuita di Atleta360
      </h1>
      <p style={{
        ...font, color: "rgba(255,255,255,0.72)", fontSize: 14.5, lineHeight: 1.6,
        textAlign: "center", maxWidth: 480, margin: "0 auto 24px", padding: "0 20px",
      }}>
        Lascia i tuoi contatti e entri subito nella dashboard, con dati di esempio. Senza impegno.
      </p>

      <div style={{ padding: "0 20px" }}>
        <Toggle tipo={tipo} onChange={setTipo} />
      </div>

      {/* hideTitle: il percorso scelto è già scritto sul selettore qui sopra,
          ripeterlo nell'intestazione del form era una doppia etichetta */}
      <LeadForm
        key={tipo}
        tipo={tipo}
        compact
        hideTitle
        onBack={null}
        onOpenPrivacy={onOpenPrivacy}
        onSuccess={onSuccess}
      />
    </div>
  );
}

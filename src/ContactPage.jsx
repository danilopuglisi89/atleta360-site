import { useState } from "react";
import { User, Building2, Check, BadgeCheck, ShieldCheck } from "lucide-react";
import { C, font, display } from "./theme";
import LeadForm from "./LeadForm";

/* Pagina lead dedicata alle campagne (atleta-360.com/contatti).
   Deep-link per le ads: /contatti?tipo=societa oppure /contatti?tipo=atleta
   preseleziona il percorso; senza parametro parte su "società" (il target
   tipico delle campagne CTA).

   Impianto a due colonne: chi arriva da una sponsorizzata non conosce
   Atleta360, e un form nudo in mezzo allo schermo non gli dà nessun motivo
   per lasciare i dati. A sinistra il perché, a destra il come. */

export function getContactTipoFromUrl() {
  const t = new URLSearchParams(window.location.search).get("tipo");
  return t === "atleta" ? "atleta" : "societa";
}

const PUNTI = [
  "Entri nella dashboard vera, con dati di esempio: puoi cliccare tutto.",
  "Radar delle 6 competenze e confronto dei rilevamenti nel tempo.",
  "Niente da installare: si apre nel browser, anche dal telefono.",
];

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
    <div style={{ display: "flex", gap: 8, width: "100%", marginBottom: 14 }}>
      {opt("societa", Building2, "Società sportiva")}
      {opt("atleta", User, "Atleta")}
    </div>
  );
}

export default function ContactPage({ onSuccess, onOpenPrivacy }) {
  const [tipo, setTipo] = useState(getContactTipoFromUrl);

  return (
    <div className="a360-contact">
      <div className="a360-contact-inner">
        <div className="a360-contact-copy">
          <a href="/" aria-label="Vai alla home di Atleta360" className="a360-contact-logo">
            <img
              src="/logo-esteso-bianco.png"
              alt="Atleta360 — Mental Coach | Pallavolo"
              style={{ height: 62, display: "block", filter: "drop-shadow(0 0 22px rgba(255,122,24,0.3))" }}
            />
          </a>

          <h1 style={{
            ...display, color: "#fff", fontWeight: 700,
            fontSize: "clamp(26px, 3.6vw, 40px)", lineHeight: 1.15, margin: "0 0 14px", letterSpacing: -0.5,
          }}>
            Prova la demo gratuita di Atleta360
          </h1>
          <p style={{ ...font, color: "rgba(255,255,255,0.75)", fontSize: 16, lineHeight: 1.6, margin: "0 0 26px" }}>
            Lascia i tuoi contatti ed entri subito nella dashboard. Senza impegno,
            senza carta di credito.
          </p>

          <ul className="a360-contact-list">
            {PUNTI.map((p) => (
              <li key={p}>
                <span className="a360-check"><Check size={13} strokeWidth={3} /></span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="a360-contact-proof">
            <div className="a360-proof-person">
              <img src="/danilo.jpg" alt="Danilo Puglisi" width="56" height="56" loading="lazy" />
              <div>
                <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 15 }}>Danilo Puglisi</div>
                <div style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: 12.5, marginTop: 2 }}>
                  Consulente e formatore · Carrara
                </div>
                <div className="a360-proof-badge">
                  <BadgeCheck size={12} color={C.orange} />
                  <span>Esperto di settore — Regione Toscana, n° 531</span>
                </div>
              </div>
            </div>

            <div className="a360-proof-club">
              <span style={{ ...font, color: "rgba(255,255,255,0.55)", fontSize: 12.5 }}>
                La prima società a bordo
              </span>
              <img src="/oasi-volley-logo.png" alt="Oasi Volley Viareggio" height="34" loading="lazy" />
            </div>
          </div>
        </div>

        <div className="a360-contact-form">
          <Toggle tipo={tipo} onChange={setTipo} />
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
          <div className="a360-contact-note">
            <ShieldCheck size={13} /> I tuoi dati restano a me: non li cedo a nessuno.
          </div>
        </div>
      </div>
    </div>
  );
}

import { useRef } from "react";
import { Linkedin } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";
import { LINKEDIN_URL } from "./contactsConfig";

/* Nessuna foto ancora disponibile: avatar con iniziali al posto del
   placeholder generico, così la sezione resta pulita finché Danilo non
   passa uno scatto reale (vedi nota finale). */
export default function AboutFounder() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} style={{ position: "relative", zIndex: 2, padding: "70px 20px" }}>
      <div className="a360-reveal" style={{
        maxWidth: 680, margin: "0 auto", opacity: 0, textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        <div style={{
          width: 92, height: 92, borderRadius: "50%",
          background: `linear-gradient(160deg, ${C.orange} 0%, #C85A0E 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 5px rgba(255,122,24,0.14), 0 20px 50px rgba(0,0,0,0.4)",
          marginBottom: 22,
        }}>
          <span style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 30 }}>DP</span>
        </div>

        <div style={{
          ...font, color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10,
        }}>
          Chi c'è dietro Atleta360
        </div>
        <h2 style={{
          ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(22px, 3.2vw, 28px)",
          margin: "0 0 6px",
        }}>
          Danilo Puglisi
        </h2>
        <p style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: 13.5, marginBottom: 18 }}>
          Consulente aziendale e formatore
        </p>
        <p style={{
          ...font, color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.7,
          maxWidth: 560, margin: "0 0 24px",
        }}>
          Da anni affianco società e organizzazioni nella formazione delle persone — dal retail
          allo sport. Atleta360 nasce da un'idea semplice: le soft skill si allenano quanto la
          tecnica, ma solo se si possono vedere e misurare. Se vuoi parlarne, sono raggiungibile
          direttamente.
        </p>

        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            ...font, display: "inline-flex", alignItems: "center", gap: 8,
            color: "#fff", fontSize: 14, fontWeight: 600, textDecoration: "none",
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 12, padding: "10px 18px",
          }}
        >
          <Linkedin size={17} /> Collegati su LinkedIn
        </a>
      </div>
    </section>
  );
}

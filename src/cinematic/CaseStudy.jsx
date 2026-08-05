import { useRef } from "react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";

/* Logo reale fornito da Danilo (già in uso in Dashboard Atleta360/public).
   Ha sfondo bianco pieno, non trasparente: lo teniamo dentro un chip
   bianco arrotondato invece di posarlo direttamente sullo sfondo scuro. */
export default function CaseStudy() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} style={{ position: "relative", zIndex: 2, padding: "70px 20px" }}>
      <div className="a360-reveal" style={{
        maxWidth: 780, margin: "0 auto", opacity: 0,
        background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24, padding: "40px 34px",
        boxShadow: "0 30px 90px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", background: "#fff",
          borderRadius: 14, padding: "10px 16px", marginBottom: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}>
          <img src="/oasi-volley-logo.png" alt="Oasi Volley Viareggio" style={{ height: 34, display: "block" }} />
        </div>

        <div style={{
          ...font, color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12,
        }}>
          La prima collaborazione
        </div>
        <h2 style={{
          ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(22px, 3.2vw, 28px)",
          lineHeight: 1.3, margin: "0 0 16px",
        }}>
          Inizia il percorso con Oasi Volley Viareggio
        </h2>
        <p style={{ ...font, color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          Atleta360 scende in campo: è appena nata la collaborazione con Oasi Volley Viareggio,
          la prima società a portare il percorso sulle soft skill dentro il proprio settore
          giovanile. Seguiremo la crescita delle atlete non solo nei risultati in campo —
          e questo è solo l'inizio.
        </p>
      </div>
    </section>
  );
}

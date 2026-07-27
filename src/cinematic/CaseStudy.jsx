import { useRef } from "react";
import { Trophy } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";

/* Caso reale in forma anonima: la società non ha ancora dato il via libera
   a essere citata per nome (vedi nota per Danilo), quindi qui restiamo su
   una descrizione fattuale senza inventare citazioni o dichiarazioni. */
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
          width: 50, height: 50, borderRadius: 14, background: C.orangeSoft,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <Trophy size={24} color={C.orange} />
        </div>

        <div style={{
          ...font, color: C.orange, fontSize: 13, fontWeight: 600,
          letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12,
        }}>
          Non solo una demo
        </div>
        <h2 style={{
          ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(22px, 3.2vw, 28px)",
          lineHeight: 1.3, margin: "0 0 16px",
        }}>
          Una società di volley femminile lo usa già, stagione dopo stagione
        </h2>
        <p style={{ ...font, color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.7, margin: 0 }}>
          Atleta360 non nasce da un'idea sulla carta: è in uso reale con una società di volley
          femminile, che rileva periodicamente le soft skill delle proprie atlete per seguirne
          la crescita nel tempo — non solo i risultati in campo. Quello che vedi nella demo è
          il prodotto vero, non un prototipo.
        </p>
      </div>
    </section>
  );
}

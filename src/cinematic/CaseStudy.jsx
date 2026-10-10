import { useRef } from "react";
import { C, font, display, T, W, R } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

/* Logo reale fornito da Danilo (già in uso in Dashboard Atleta360/public).
   Ha sfondo bianco pieno, non trasparente: va tenuto dentro un chip bianco
   invece che posato sullo sfondo scuro.
   Prima quel chip era appeso sopra-a-sinistra del testo ed era l'oggetto più
   luminoso dello schermo, più del titolo: adesso sta nella sua colonna,
   accanto al racconto, e la card occupa tutta la larghezza utile invece di
   lasciare vuota la metà destra. */
export default function CaseStudy() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} style={{ position: "relative", zIndex: 2, padding: "70px 20px" }}>
      <div className="a360-reveal a360-caso" style={{ opacity: 0 }}>
        <div className="a360-caso-logo">
          <span className="a360-caso-chip">
            <img src="/oasi-volley-logo.png" alt="Oasi Volley Viareggio" />
          </span>
        </div>

        <div className="a360-caso-testo">
          <div style={{
            ...font, color: C.orange, fontSize: T.kicker, fontWeight: W.medio,
            letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12,
          }}>
            La prima collaborazione
          </div>
          <SplitTitle text="Inizia il percorso con Oasi Volley Viareggio" style={{
            ...display, color: "#fff", fontWeight: W.forte, fontSize: T.h2,
            lineHeight: 1.25, margin: "0 0 16px",
          }} />
          <p style={{ ...font, color: "rgba(255,255,255,0.72)", fontSize: T.body, lineHeight: 1.7, margin: 0 }}>
            Atleta360 scende in campo: è appena nata la collaborazione con Oasi Volley Viareggio,
            la prima società a portare il percorso sulle soft skill dentro il proprio settore
            giovanile. Seguiremo la crescita delle atlete non solo nei risultati in campo —
            e questo è solo l'inizio.
          </p>
        </div>
      </div>
    </section>
  );
}

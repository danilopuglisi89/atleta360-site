import { useRef } from "react";
import { ArrowRight, User, Building2 } from "lucide-react";
import { font, display, T, W } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

/* Chiusura. Prima le FAQ finivano e cominciava direttamente il footer: chi
   aveva letto tutto ed era convinto non aveva niente da cliccare, doveva
   risalire o cercare nella barra. Qui si chiude il giro. */
export default function ClosingCTA({ onChoose }) {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} className="a360-chiusura" style={{ position: "relative", zIndex: 2 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <SplitTitle text="Pronto a vedere la tua squadra in Atleta360?" style={{
          ...display, color: "#fff", fontWeight: W.forte, fontSize: T.h2,
          lineHeight: 1.22, margin: "0 auto 14px",
        }} />
        <p className="a360-reveal" style={{
          ...font, color: "rgba(255,255,255,0.74)", fontSize: T.body,
          lineHeight: 1.65, margin: "0 auto 30px", maxWidth: 520, opacity: 0,
        }}>
          La demo è gratuita, con dati di esempio. Nessuna installazione, nessuna carta di credito.
        </p>
        <div className="a360-reveal a360-chiusura-azioni" style={{ opacity: 0 }}>
          <button className="a360-btn a360-btn-primary a360-btn-lg" onClick={() => onChoose("societa")}>
            <Building2 size={17} /> Sono una società sportiva <ArrowRight size={16} />
          </button>
          <button className="a360-btn a360-btn-ghost a360-btn-lg" onClick={() => onChoose("atleta")}>
            <User size={17} /> Sono un'atleta
          </button>
        </div>
      </div>
    </section>
  );
}

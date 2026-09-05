import { useRef } from "react";
import { Linkedin, MessageCircle, BadgeCheck } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";
import { LINKEDIN_URL, WHATSAPP_URL } from "./contactsConfig";

export default function AboutFounder() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} id="chi-sono" style={{ position: "relative", zIndex: 2, padding: "80px 20px" }}>
      <div className="a360-about">
        <div className="a360-reveal a360-about-photo" style={{ opacity: 0 }}>
          <img
            src="/danilo.jpg"
            alt="Danilo Puglisi"
            width="480"
            height="480"
            loading="lazy"
            decoding="async"
          />
          <span className="a360-about-ring" aria-hidden="true" />
        </div>

        <div className="a360-about-copy">
          <div className="a360-reveal" style={{
            ...font, color: C.orange, fontSize: 13, fontWeight: 600,
            letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10, opacity: 0,
          }}>
            Chi c'è dietro Atleta360
          </div>

          <SplitTitle text="Danilo Puglisi" style={{
            ...display, color: "#fff", fontWeight: 700, fontSize: "clamp(26px, 3.6vw, 34px)",
            margin: "0 0 6px",
          }} />

          <p className="a360-reveal" style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "0 0 16px", opacity: 0 }}>
            Consulente e formatore · Carrara, Toscana
          </p>

          <div className="a360-reveal a360-badge" style={{ opacity: 0 }}>
            <BadgeCheck size={15} color={C.orange} />
            <span>Esperto di settore — Regione Toscana, n° 531</span>
          </div>

          <p className="a360-reveal" style={{
            ...font, color: "rgba(255,255,255,0.75)", fontSize: 15.5, lineHeight: 1.7, margin: "18px 0 0", opacity: 0,
          }}>
            Quindici anni dentro la grande distribuzione: logistica, numeri e soprattutto persone
            da far crescere. Oggi porto quel mestiere in aula e nelle aziende — e nello sport.
          </p>
          <p className="a360-reveal" style={{
            ...font, color: "rgba(255,255,255,0.75)", fontSize: 15.5, lineHeight: 1.7, margin: "14px 0 26px", opacity: 0,
          }}>
            Atleta360 nasce da un'idea semplice: le soft skill si allenano quanto la tecnica,
            ma solo se si possono vedere e misurare. Se vuoi parlarne, sono raggiungibile
            direttamente — rispondo entro 24 ore.
          </p>

          <div className="a360-reveal a360-about-actions" style={{ opacity: 0 }}>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="a360-btn a360-btn-primary">
              <MessageCircle size={17} /> Scrivimi su WhatsApp
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="a360-btn a360-btn-ghost">
              <Linkedin size={17} /> LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

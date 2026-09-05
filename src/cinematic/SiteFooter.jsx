import { Linkedin, Instagram, Mail, Calendar, Phone } from "lucide-react";
import { font, display } from "../theme";
import { scrollToSection } from "./smoothScroll";
import {
  WHATSAPP_URL, LINKEDIN_URL, INSTAGRAM_URL, BOOKING_URL,
  CONTACT_EMAIL, PHONE_DISPLAY, SITE_URL,
} from "./contactsConfig";

const WhatsAppIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.09c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.8-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .54.01.17.01.41-.06.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
  </svg>
);

export default function SiteFooter({ onOpenPrivacy }) {
  return (
    <footer className="a360-footer">
      <div className="a360-footer-inner">
        <div className="a360-footer-brand">
          <img src="/logo-esteso-bianco.png" alt="Atleta360 — Mental Coach | Pallavolo" height="52" loading="lazy" />
          <p style={{ ...font, color: "rgba(255,255,255,0.55)", fontSize: 13.5, lineHeight: 1.6, margin: "16px 0 0", maxWidth: 300 }}>
            La dashboard che rende visibili le soft skill di chi gioca. Un progetto di Danilo Puglisi.
          </p>
          <div className="a360-footer-social">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18} /></a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon size={18} /></a>
          </div>
        </div>

        <nav className="a360-footer-col" aria-label="Sezioni del sito">
          <h2 style={{ ...display, color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 14px", letterSpacing: 0.3 }}>Il prodotto</h2>
          {[
            ["#demo", "Cosa vedrai nella demo"],
            ["#come-funziona", "Come funziona"],
            ["#chi-sono", "Chi c'è dietro"],
            ["#faq", "Domande frequenti"],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); scrollToSection(href); }}>{label}</a>
          ))}
          <a href="/contatti">Richiedi la demo</a>
        </nav>

        <div className="a360-footer-col">
          <h2 style={{ ...display, color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 0 14px", letterSpacing: 0.3 }}>Contatti</h2>
          <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={14} /> {CONTACT_EMAIL}</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"><Phone size={14} /> {PHONE_DISPLAY}</a>
          <a href={BOOKING_URL} target="_blank" rel="noreferrer"><Calendar size={14} /> Prenota una call</a>
          <a href={SITE_URL} target="_blank" rel="noreferrer">danilopuglisi.com</a>
        </div>
      </div>

      <div className="a360-footer-bottom">
        <span>© {new Date().getFullYear()} Atleta360 — Danilo Puglisi · P.IVA 01506110459</span>
        <button onClick={onOpenPrivacy}>Informativa privacy</button>
      </div>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="a360-wa-fab"
        aria-label="Scrivici su WhatsApp"
      >
        <WhatsAppIcon size={28} />
      </a>
    </footer>
  );
}

import { Linkedin, Mail, Calendar } from "lucide-react";
import { C, font, display } from "../theme";
import { WHATSAPP_URL, LINKEDIN_URL, BOOKING_URL, CONTACT_EMAIL } from "./contactsConfig";

const linkStyle = {
  ...font, display: "inline-flex", alignItems: "center", gap: 7,
  color: "rgba(255,255,255,0.75)", fontSize: 13.5, fontWeight: 500, textDecoration: "none",
};

export default function SiteFooter({ onOpenPrivacy }) {
  const bookingHref = BOOKING_URL !== "#"
    ? BOOKING_URL
    : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Prenotiamo una call su Atleta360")}`;

  return (
    <footer style={{ position: "relative", zIndex: 2, padding: "36px 20px 44px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{
        maxWidth: 920, margin: "0 auto", display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: 20,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, background: C.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            ...display, fontWeight: 700, color: "#fff", fontSize: 11,
          }}>360</div>
          <span style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 15 }}>Atleta360</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
          <a href={bookingHref} style={linkStyle} target={bookingHref.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            <Calendar size={15} /> Prenota una call
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
            <Mail size={15} /> {CONTACT_EMAIL}
          </a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" style={linkStyle}>
            <Linkedin size={15} /> LinkedIn
          </a>
          <button
            onClick={onOpenPrivacy}
            style={{ ...linkStyle, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            Privacy
          </button>
        </div>
      </div>

      <p style={{
        ...font, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12,
        marginTop: 26, marginBottom: 0,
      }}>
        © {new Date().getFullYear()} Atleta360
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Scrivici su WhatsApp"
        style={{
          position: "fixed", right: 20, bottom: 20, zIndex: 30,
          width: 56, height: 56, borderRadius: "50%",
          background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 32px rgba(0,0,0,0.4)", textDecoration: "none",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.09c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.8-.11-.41-.13-.94-.31-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .54.01.17.01.41-.06.64.49.24.57.81 1.97.88 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.49-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.28.37-.23.63-.14.26.09 1.63.77 1.91.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
        </svg>
      </a>
    </footer>
  );
}

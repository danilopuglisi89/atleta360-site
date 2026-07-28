import { useEffect, useState } from "react";
import { C, font } from "./theme";
import { getConsent, setConsent } from "./pixel";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div style={{
      ...font, position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 50,
      maxWidth: 560, margin: "0 auto",
      background: "#12183F", border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
    }}>
      <p style={{ ...font, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.55, margin: 0, flex: "1 1 260px" }}>
        Usiamo cookie di misurazione per capire come viene usato il sito. Puoi accettarli o rifiutarli —
        il sito funziona comunque in entrambi i casi. Dettagli nell'informativa privacy.
      </p>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => choose("rejected")}
          style={{
            ...font, background: "none", border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          Rifiuta
        </button>
        <button
          onClick={() => choose("accepted")}
          style={{
            ...font, background: C.orange, border: "none",
            color: "#fff", borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          Accetta
        </button>
      </div>
    </div>
  );
}

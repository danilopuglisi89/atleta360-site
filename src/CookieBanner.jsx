import { useEffect, useState } from "react";
import { C, font } from "./theme";
import { getConsent, setConsent } from "./pixel";

/* Nessun cookie viene scritto finché non si accetta, quindi il banner può
   aspettare: comparendo subito si piazzerebbe sopra i due bottoni proprio
   nel momento dell'apertura. Arriva a sequenza finita — o al primo scroll,
   se il visitatore è più veloce dell'animazione. */
const DELAY_MS = 5200;

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() !== null) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setVisible(true);
      window.removeEventListener("scroll", show);
    };
    /* Su telefono lo schermo è corto e le due card stanno in basso: lì il
       banner aspetta il primo scroll, altrimenti le coprirebbe comunque. */
    const small = window.matchMedia("(max-width: 560px)").matches;
    const t = small ? null : setTimeout(show, DELAY_MS);
    window.addEventListener("scroll", show, { passive: true });
    return () => { if (t) clearTimeout(t); window.removeEventListener("scroll", show); };
  }, []);

  if (!visible) return null;

  const choose = (value) => {
    setConsent(value);
    setVisible(false);
  };

  return (
    <div className="a360-cookie" role="dialog" aria-label="Preferenze cookie">
      <p style={{ ...font, color: "rgba(255,255,255,0.8)", fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
        Usiamo cookie di misurazione per capire come viene usato il sito.
        Il sito funziona comunque, in entrambi i casi.
      </p>
      <div style={{ display: "flex", gap: 9 }}>
        <button
          onClick={() => choose("rejected")}
          style={{
            ...font, background: "none", border: "1px solid rgba(255,255,255,0.25)",
            color: "#fff", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Rifiuta
        </button>
        <button
          onClick={() => choose("accepted")}
          style={{
            ...font, background: C.orange, border: "none",
            color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          Accetta
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { caricaOpzioni } from "./opzioni";
import "./avviso.css";

/* Messaggio in evidenza, acceso e scritto dal pannello /admin (es. "Iscrizioni
   aperte per la stagione 2026/27"). Sta in cima alla pagina, nel flusso: la
   sua altezza va in --a360-avviso-h, che la hero sottrae alla propria, così
   sul telefono le due card di scelta restano comunque dentro lo schermo. */
export default function Avviso() {
  const [o, setO] = useState(null);
  const [chiuso, setChiuso] = useState(false);
  const ref = useRef(null);

  useEffect(() => { caricaOpzioni().then(setO); }, []);

  const visibile = !chiuso && o?.messaggio_attivo && o?.messaggio_testo;

  useEffect(() => {
    const radice = document.documentElement;
    if (!visibile || !ref.current) {
      radice.style.removeProperty("--a360-avviso-h");
      return;
    }
    const misura = () => radice.style.setProperty("--a360-avviso-h", `${ref.current.offsetHeight}px`);
    misura();
    const ro = new ResizeObserver(misura);
    ro.observe(ref.current);
    return () => { ro.disconnect(); radice.style.removeProperty("--a360-avviso-h"); };
  }, [visibile]);

  if (!visibile) return null;
  const link = o.messaggio_link;
  const esterno = link && !link.startsWith("/");

  return (
    <div ref={ref} className="a360-avviso" role="region" aria-label="Avviso">
      <span className="a360-avviso-punto" aria-hidden="true" />
      <span className="a360-avviso-testo">{o.messaggio_testo}</span>
      {link && (
        <a className="a360-avviso-link" href={link}
          {...(esterno ? { target: "_blank", rel: "noreferrer" } : {})}>
          Scopri <ArrowRight size={14} />
        </a>
      )}
      <button className="a360-avviso-chiudi" onClick={() => setChiuso(true)} aria-label="Chiudi l'avviso">
        <X size={16} />
      </button>
    </div>
  );
}

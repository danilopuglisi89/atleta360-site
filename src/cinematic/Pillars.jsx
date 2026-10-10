import { useRef } from "react";
import { Brain, LineChart, Award } from "lucide-react";
import { C, font, display, T, W, R } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

/* Era "ScrollStory": tre scene a scorrimento alte 78vh l'una, 2.106px in
   tutto — il 34% della pagina — per dire tre frasi. Chi guardava da computer
   vedeva tre volte di fila uno schermo quasi vuoto, con sotto un riquadro che
   conteneva una sola medaglietta. Stesso contenuto, una fascia sola: i tre
   pilastri affiancati, con la prova del prodotto subito prima. */

const PILASTRI = [
  {
    Icon: Brain,
    titolo: "Sei competenze, un solo rilevamento",
    testo: "Reset, focus, gestione del corpo, comunicazione, coachability e tattica. Un questionario rapido le fotografa tutte, senza test complicati da gestire.",
  },
  {
    Icon: LineChart,
    titolo: "La crescita, mese dopo mese",
    testo: "I rilevamenti si confrontano nel tempo, per singolo atleta o per l'intera squadra: si vede subito dove si cresce e dove intervenire.",
  },
  {
    Icon: Award,
    titolo: "Motivazione che si vede",
    testo: "Badge e traguardi rendono visibili i progressi e premiano la costanza, non solo il talento di partenza.",
  },
];

export default function Pillars() {
  const rootRef = useRef(null);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} className="a360-banda-soffusa" style={{ position: "relative", zIndex: 2, padding: "76px 20px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <SplitTitle text="Che cosa misura Atleta360" style={{
          ...display, textAlign: "center", color: "#fff", fontWeight: W.forte,
          fontSize: T.h2, lineHeight: 1.22, margin: "0 auto 46px", maxWidth: 620,
        }} />

        <div className="a360-pilastri">
          {PILASTRI.map(({ Icon, titolo, testo }) => (
            <div key={titolo} className="a360-reveal a360-pilastro" style={{ opacity: 0 }}>
              <div className="a360-pilastro-icona" aria-hidden="true">
                <Icon size={22} color={C.orange} strokeWidth={1.8} />
              </div>
              <h3 style={{
                ...display, color: "#fff", fontWeight: W.forte, fontSize: T.h3,
                lineHeight: 1.28, margin: "18px 0 10px",
              }}>{titolo}</h3>
              <p style={{
                ...font, color: "rgba(255,255,255,0.7)", fontSize: T.body,
                lineHeight: 1.65, margin: 0,
              }}>{testo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

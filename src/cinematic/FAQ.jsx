import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { C, font, display } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

const ITEMS = [
  {
    q: "Quanto costa Atleta360?",
    a: "Il prezzo dipende dalla dimensione della società e dal numero di atlete/atleti da seguire. Prova prima la demo gratuita: se ti convince, ne parliamo insieme e troviamo la soluzione più adatta a voi.",
  },
  {
    q: "I dati delle atlete minorenni sono al sicuro?",
    a: "Sì: i dati sono conservati su infrastruttura protetta, con accesso riservato alla società e mai condiviso con terzi. Trovi tutti i dettagli nell'informativa privacy, in fondo alla pagina.",
  },
  {
    q: "Dobbiamo installare qualcosa?",
    a: "No. Atleta360 è una dashboard web: si usa dal browser, su computer o telefono, senza installazioni né configurazioni tecniche.",
  },
  {
    q: "Quanto tempo richiede un rilevamento?",
    a: "Pochi minuti per atleta. È pensato per essere ripetuto periodicamente senza pesare sul lavoro quotidiano dello staff.",
  },
  {
    q: "Posso provarlo prima di decidere?",
    a: "Sì, è proprio quello che fa questa pagina: scegli sopra se sei atleta o società e avvii subito una demo con dati di esempio, senza impegno.",
  },
];

function Item({ item, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
      <button
        onClick={onToggle}
        style={{
          ...font, width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "18px 2px", textAlign: "left", color: "#fff", fontSize: 15.5, fontWeight: 600,
        }}
      >
        <span>{item.q}</span>
        {open ? <Minus size={18} color={C.orange} style={{ flexShrink: 0 }} /> : <Plus size={18} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />}
      </button>
      <div style={{
        maxHeight: open ? 200 : 0, overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <p style={{ ...font, color: "rgba(255,255,255,0.68)", fontSize: 14.5, lineHeight: 1.65, margin: "0 2px 18px" }}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const rootRef = useRef(null);
  const [openIdx, setOpenIdx] = useState(0);
  useRevealOnScroll(rootRef);

  return (
    <section ref={rootRef} style={{ position: "relative", zIndex: 2, padding: "70px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <SplitTitle text="Domande frequenti" style={{
          ...display, textAlign: "center", color: "#fff", fontWeight: 700,
          fontSize: "clamp(24px, 3.6vw, 32px)", margin: "0 auto 34px",
        }} />

        <div className="a360-reveal" style={{
          opacity: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "6px 22px",
        }}>
          {ITEMS.map((item, i) => (
            <Item key={i} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { C, font, display, T, W, R } from "../theme";
import { useRevealOnScroll } from "./reveal";
import SplitTitle from "./SplitTitle";

const ITEMS = [
  {
    q: "Quanto costa Atleta360?",
    a: "Il prezzo dipende dalla dimensione della società e dal numero di atlete/atleti da seguire. Prova prima la demo gratuita: se ti convince, ne parliamo insieme e troviamo la soluzione più adatta a voi.",
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
    <div style={{ borderBottom: `1px solid ${C.grid}` }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          ...font, width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "19px 2px", textAlign: "left", color: C.ink, fontSize: T.body, fontWeight: W.medio,
        }}
      >
        <span>{item.q}</span>
        {open ? <Minus size={18} color={C.orange} style={{ flexShrink: 0 }} />
              : <Plus size={18} color={C.muted} style={{ flexShrink: 0 }} />}
      </button>
      <div style={{ maxHeight: open ? 220 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <p style={{ ...font, color: C.muted, fontSize: T.small, lineHeight: 1.7, margin: "0 2px 19px" }}>
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
    /* L'unica sezione chiara di una pagina lunga 6.000px. Spezza il blu
       ininterrotto, dà un capitolo alla pagina e — per una consulenza che
       vende a dirigenti di società — una sezione calma e leggibile legge
       come più affidabile del buio. Di riflesso rende la hero più scura. */
    <section ref={rootRef} id="faq" className="a360-banda-chiara" style={{ position: "relative", zIndex: 2, padding: "76px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <SplitTitle text="Domande frequenti" style={{
          ...display, textAlign: "center", color: C.ink, fontWeight: W.forte,
          fontSize: T.h2, lineHeight: 1.22, margin: "0 auto 34px",
        }} />

        <div className="a360-reveal" style={{
          opacity: 0, background: C.card, border: `1px solid ${C.grid}`,
          borderRadius: R.lg, padding: "6px 22px",
          boxShadow: "0 18px 50px rgba(10,22,80,0.10)",
        }}>
          {ITEMS.map((item, i) => (
            <Item key={i} item={item} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

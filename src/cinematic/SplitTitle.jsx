import { Fragment } from "react";

/* Titolo spezzato in parole, ciascuna in una "finestra" con overflow
   nascosto: il reveal le fa salire da sotto una per una (vedi reveal.js,
   selettore .a360-w). Usare dentro un contenitore con useRevealOnScroll.

   Fra una parola e l'altra c'è uno spazio VERO, non un margine: con i
   margini il testo del titolo usciva attaccato ("Domandefrequenti"), e così
   lo leggevano motori di ricerca e assistenti vocali. */
export default function SplitTitle({ text, as: Tag = "h2", style, className = "" }) {
  return (
    <Tag className={className} style={style}>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
            <span className="a360-w" style={{ display: "inline-block", willChange: "transform" }}>{w}</span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
}

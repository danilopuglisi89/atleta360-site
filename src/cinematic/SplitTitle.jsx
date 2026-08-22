/* Titolo spezzato in parole, ciascuna in una "finestra" con overflow
   nascosto: il reveal le fa salire da sotto una per una (vedi reveal.js,
   selettore .a360-w). Usare dentro un contenitore con useRevealOnScroll. */
export default function SplitTitle({ text, as: Tag = "h2", style, className = "" }) {
  return (
    <Tag className={className} style={style} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
          <span className="a360-w" style={{ display: "inline-block", marginRight: "0.26em", willChange: "transform" }}>{w}</span>
        </span>
      ))}
    </Tag>
  );
}

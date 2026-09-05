import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { C, font } from "../theme";

/* Radar delle competenze: si disegna da solo (anelli e assi tracciati con
   stroke-dashoffset), poi il poligono "aggancia" e respira tra il primo e
   l'ultimo rilevamento — la crescita resa visibile. */

const SKILLS = ["Reset", "Focus", "Body", "Comunicazione", "Coachability", "Tattica"];
/* Valori d'esempio volutamente DISOMOGENEI: un profilo alto e uniforme
   riempirebbe l'esagono e si leggerebbe come una macchia, senza dire nulla.
   Una forma irregolare mostra a colpo d'occhio dove si cresce e dove no. */
const FROM = [4.8, 5.9, 5.2, 4.1, 5.6, 3.9];
const TO = [8.4, 7.1, 8.9, 6.3, 8.2, 5.8];

const CX = 180, CY = 180, R = 138;

function point(i, value) {
  const ang = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
  const r = (R * value) / 10;
  return [CX + Math.cos(ang) * r, CY + Math.sin(ang) * r];
}
function polyPath(values) {
  return values.map((v, i) => point(i, v).join(",")).join(" ");
}

export default function RadarHero({ size = 360, delay = 0 }) {
  /* Il font dentro l'SVG è in unità di viewBox (360): a size=230 un 11.5
     rendeva ~7px reali, illeggibili. Lo calcoliamo a ritroso dalla dimensione
     effettiva per ottenere sempre ~12.5px a schermo. */
  const labelFont = (12.5 * 360) / size;
  const rootRef = useRef(null);
  const polyRef = useRef(null);
  const glowRef = useRef(null);
  const sweepRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const start = performance.now();

    const tick = (now) => {
      const t = (now - start) / 1000;
      const k = reduced ? 1 : 0.5 + 0.5 * Math.sin(t * 0.55 - Math.PI / 2);
      const values = FROM.map((f, i) => f + (TO[i] - f) * k);
      const pts = polyPath(values);
      if (polyRef.current) polyRef.current.setAttribute("points", pts);
      if (glowRef.current) glowRef.current.setAttribute("points", pts);
      if (sweepRef.current && !reduced) {
        sweepRef.current.setAttribute("transform", `rotate(${(t * 46) % 360} ${CX} ${CY})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // entrata: il radar si traccia da solo
    let ctxGsap;
    if (!reduced) {
      ctxGsap = gsap.context(() => {
        const strokes = rootRef.current.querySelectorAll(".a360-draw");
        strokes.forEach((el) => {
          const len = el.getTotalLength ? el.getTotalLength() : 900;
          gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
        });
        gsap.to(strokes, {
          strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut",
          stagger: 0.045, delay,
        });
        gsap.fromTo(rootRef.current.querySelectorAll(".a360-radar-fade"),
          { opacity: 0 }, { opacity: 1, duration: 0.8, delay: delay + 0.55, stagger: 0.05 });
      }, rootRef);
    }

    const onMove = (e) => {
      if (reduced || !wrapRef.current) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      wrapRef.current.style.transform =
        `perspective(900px) rotateY(${nx * 16}deg) rotateX(${-ny * 13}deg)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ctxGsap?.revert();
    };
  }, [delay]);

  return (
    <div
      ref={wrapRef}
      style={{ width: size, height: size, transition: "transform 0.25s ease-out", willChange: "transform" }}
    >
      <svg ref={rootRef} viewBox="0 0 360 360" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,122,24,0.16)" />
            <stop offset="70%" stopColor="rgba(23,41,122,0.14)" />
            <stop offset="100%" stopColor="rgba(5,10,36,0)" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,122,24,0)" />
            <stop offset="100%" stopColor="rgba(255,150,60,0.45)" />
          </linearGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="11" />
          </filter>
        </defs>

        <circle className="a360-radar-fade" cx={CX} cy={CY} r={R + 14} fill="url(#radarBg)" />

        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle key={f} className="a360-draw" cx={CX} cy={CY} r={R * f}
            fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1" />
        ))}
        <circle className="a360-ping a360-radar-fade" cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(255,140,50,0.55)" strokeWidth="1.5" />

        {SKILLS.map((s, i) => {
          const [x, y] = point(i, 10);
          const [lx, ly] = point(i, 11.9);
          return (
            <g key={s}>
              <line className="a360-draw" x1={CX} y1={CY} x2={x} y2={y}
                stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
              <text className="a360-radar-fade" x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                style={{ ...font, fontSize: labelFont, fontWeight: 600 }}
                fill="rgba(255,255,255,0.72)">{s}</text>
            </g>
          );
        })}

        <g ref={sweepRef} className="a360-radar-fade">
          <path d={`M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX + R * 0.5} ${CY - R * 0.866} Z`}
            fill="url(#sweepGrad)" />
          <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke="rgba(255,150,60,0.8)" strokeWidth="1.5" />
        </g>

        <polygon ref={glowRef} className="a360-radar-fade" points={polyPath(FROM)}
          fill="rgba(255,122,24,0.28)" filter="url(#softGlow)" />
        <polygon ref={polyRef} className="a360-radar-fade" points={polyPath(FROM)}
          fill="rgba(255,122,24,0.10)" stroke={C.orange} strokeWidth="2.2"
          strokeLinejoin="round" />
      </svg>
    </div>
  );
}

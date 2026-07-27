import { useEffect, useRef } from "react";
import { C, font } from "../theme";

/* Radar delle competenze animato: 6 assi (le skill vere della dashboard),
   sweep rotante stile sonar, poligono che "respira" tra il primo e l'ultimo
   rilevamento — la crescita resa visibile. SVG + rAF, con tilt 3D via CSS. */

const SKILLS = ["Reset", "Focus", "Body", "Comunicazione", "Coachability", "Tattica"];
const FROM = [5.2, 5.8, 5.0, 4.6, 5.5, 4.9]; // primo rilevamento (su 10)
const TO = [8.2, 8.6, 8.8, 7.9, 8.7, 8.1];   // ultimo rilevamento

const CX = 180, CY = 180, R = 138;

function point(i, value) {
  const ang = (Math.PI * 2 * i) / SKILLS.length - Math.PI / 2;
  const r = (R * value) / 10;
  return [CX + Math.cos(ang) * r, CY + Math.sin(ang) * r];
}
function polyPath(values) {
  return values.map((v, i) => point(i, v).join(",")).join(" ");
}

export default function RadarHero({ size = 360 }) {
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
      // respiro lento tra FROM e TO (la crescita che pulsa)
      const k = reduced ? 1 : 0.5 + 0.5 * Math.sin(t * 0.55 - Math.PI / 2);
      const values = FROM.map((f, i) => f + (TO[i] - f) * k);
      const pts = polyPath(values);
      if (polyRef.current) polyRef.current.setAttribute("points", pts);
      if (glowRef.current) glowRef.current.setAttribute("points", pts);
      if (sweepRef.current && !reduced) {
        sweepRef.current.setAttribute("transform", `rotate(${(t * 42) % 360} ${CX} ${CY})`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // tilt 3D che segue il mouse
    const onMove = (e) => {
      if (reduced || !wrapRef.current) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      wrapRef.current.style.transform =
        `perspective(900px) rotateY(${nx * 14}deg) rotateX(${-ny * 12}deg)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{ width: size, height: size, transition: "transform 0.25s ease-out", willChange: "transform" }}
    >
      <svg viewBox="0 0 360 360" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,122,24,0.10)" />
            <stop offset="70%" stopColor="rgba(23,41,122,0.12)" />
            <stop offset="100%" stopColor="rgba(5,10,36,0)" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,122,24,0)" />
            <stop offset="100%" stopColor="rgba(255,122,24,0.35)" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <circle cx={CX} cy={CY} r={R + 14} fill="url(#radarBg)" />

        {/* anelli concentrici + ping */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle key={f} cx={CX} cy={CY} r={R * f}
            fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
        ))}
        <circle className="a360-ping" cx={CX} cy={CY} r={R} fill="none"
          stroke="rgba(255,122,24,0.5)" strokeWidth="1.5" />

        {/* assi + etichette */}
        {SKILLS.map((s, i) => {
          const [x, y] = point(i, 10);
          const [lx, ly] = point(i, 11.9);
          return (
            <g key={s}>
              <line x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                style={{ ...font, fontSize: 11.5, fontWeight: 600 }}
                fill="rgba(255,255,255,0.55)">{s}</text>
            </g>
          );
        })}

        {/* sweep sonar */}
        <g ref={sweepRef}>
          <path d={`M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX + R * 0.5} ${CY - R * 0.866} Z`}
            fill="url(#sweepGrad)" />
          <line x1={CX} y1={CY} x2={CX} y2={CY - R} stroke="rgba(255,122,24,0.7)" strokeWidth="1.5" />
        </g>

        {/* poligono competenze: glow sotto + tratto sopra */}
        <polygon ref={glowRef} points={polyPath(FROM)}
          fill="rgba(255,122,24,0.35)" filter="url(#softGlow)" />
        <polygon ref={polyRef} points={polyPath(FROM)}
          fill="rgba(255,122,24,0.16)" stroke={C.orange} strokeWidth="2"
          strokeLinejoin="round" />
      </svg>
    </div>
  );
}

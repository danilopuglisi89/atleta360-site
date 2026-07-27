import { useEffect, useRef } from "react";

/* Campo di particelle "embers" full-screen: scintille arancio/bianche che
   salgono lente nel buio, con parallasse leggera sul mouse. Canvas 2D puro,
   nessuna dipendenza. Con prefers-reduced-motion resta statico. */
export default function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w, h, dpr, raf;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const COUNT = Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 14000));
    const parts = Array.from({ length: COUNT }, () => spawn(true));

    function spawn(anywhere) {
      const warm = Math.random() < 0.72; // arancio brand, il resto bianco freddo
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 1.9,
        vy: 0.12 + Math.random() * 0.5,
        vx: (Math.random() - 0.5) * 0.16,
        depth: 0.3 + Math.random() * 0.7,
        alpha: 0.12 + Math.random() * 0.5,
        flicker: Math.random() * Math.PI * 2,
        color: warm ? "255,122,24" : "210,222,255",
      };
    }

    const onMove = (e) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const px = (mouse.x - 0.5) * 40;
      const py = (mouse.y - 0.5) * 24;

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!reduced) {
          p.y -= p.vy;
          p.x += p.vx + Math.sin(t / 2400 + p.flicker) * 0.08;
          if (p.y < -12 || p.x < -12 || p.x > w + 12) parts[i] = spawn(false);
        }
        const tw = 0.72 + 0.28 * Math.sin(t / 640 + p.flicker * 3);
        const a = p.alpha * tw;
        const x = p.x - px * p.depth;
        const y = p.y - py * p.depth;
        ctx.beginPath();
        ctx.arc(x, y, p.r * p.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${a})`;
        ctx.fill();
        if (p.r > 1.7) {
          ctx.beginPath();
          ctx.arc(x, y, p.r * p.depth * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${a * 0.08})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 1,
      }}
    />
  );
}

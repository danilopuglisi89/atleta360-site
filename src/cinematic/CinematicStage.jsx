import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/* ============================================================
   PALCO CINEMATOGRAFICO
   Campo di particelle in 3D proiettato a mano (niente WebGL: resta
   leggero, importante per una landing che deve caricare in fretta).
   Il "filmico" viene da: blending additivo, scie di movimento,
   raggi volumetrici, flare anamorfico, grana e vignettatura.

   Sequenza: accensione -> esplosione -> deriva -> convergenza in
   esagono (la forma del radar) -> rilascio.
   ============================================================ */

const FOCAL = 620;          // distanza focale della camera virtuale
const NEAR = 46;            // oltre questa la particella ha superato la camera
const FAR = 1500;
const CONVERGE_Z = 620;     // piano dove le particelle formano l'esagono
const HEX_R = 118;          // raggio esagono in unità mondo (= px a z=FOCAL)

const WARM = "255,150,60";
const COOL = "190,215,255";

function makeSprite(rgb) {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // nucleo stretto e pieno + alone corto: dà scintilla invece di foschia
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.13, `rgba(${rgb},0.88)`);
  grad.addColorStop(0.30, `rgba(${rgb},0.32)`);
  grad.addColorStop(0.62, `rgba(${rgb},0.07)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return c;
}

function makeGrain(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* punto sul perimetro dell'esagono, i/n lungo il giro */
function hexPoint(f) {
  const t = f * 6;
  const seg = Math.floor(t) % 6;
  const k = t - Math.floor(t);
  const a0 = (Math.PI * 2 * seg) / 6 - Math.PI / 2;
  const a1 = (Math.PI * 2 * (seg + 1)) / 6 - Math.PI / 2;
  return {
    x: (Math.cos(a0) * (1 - k) + Math.cos(a1) * k) * HEX_R,
    y: (Math.sin(a0) * (1 - k) + Math.sin(a1) * k) * HEX_R,
  };
}

export default forwardRef(function CinematicStage(_props, ref) {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);

  useImperativeHandle(ref, () => ({
    burst: () => apiRef.current?.burst(),
    converge: () => apiRef.current?.converge(),
    release: () => apiRef.current?.release(),
    shock: (s) => apiRef.current?.shock(s),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 700;

    const spriteWarm = makeSprite(WARM);
    const spriteCool = makeSprite(COOL);
    const grain = small ? null : makeGrain(96);

    let w = 0, h = 0, cx = 0, cy = 0, dpr = 1, raf = 0, vignette = null;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cx = w / 2;
      cy = h / 2;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      vignette = document.createElement("canvas");
      vignette.width = w;
      vignette.height = h;
      const vg = vignette.getContext("2d");
      const r = Math.hypot(w, h) / 2;
      const grad = vg.createRadialGradient(cx, cy, r * 0.34, cx, cy, r);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.62, "rgba(2,5,22,0.30)");
      grad.addColorStop(1, "rgba(2,5,22,0.80)");
      vg.fillStyle = grad;
      vg.fillRect(0, 0, w, h);
    };
    resize();

    const COUNT = small ? 380 : Math.min(1150, Math.floor((w * h) / 1750));
    const MOTES = small ? 8 : 16;   // braci grandi: sono queste a fare "magia"

    const rnd = (a, b) => a + Math.random() * (b - a);

    function seed(p, i) {
      p.warm = Math.random() < 0.66;
      p.mote = i < MOTES;
      p.size = p.mote ? rnd(4.5, 9) : rnd(0.5, 2.4);
      p.hexF = i / COUNT;
      p.follows = Math.random() < 0.62;      // solo una parte converge: resta organico
      p.jx = rnd(-14, 14);
      p.jy = rnd(-14, 14);
      p.phase = Math.random() * Math.PI * 2;
      return p;
    }

    function placeDrift(p) {
      p.z = rnd(NEAR + 30, FAR);
      const half = (w / 2) * (p.z / FOCAL) * 1.25;
      p.x = rnd(-half, half);
      p.y = rnd(-half * (h / w), half * (h / w));
      p.bvx = 0; p.bvy = 0; p.bvz = 0;
      p.psx = null;
      return p;
    }

    const parts = Array.from({ length: COUNT }, (_, i) => placeDrift(seed({}, i)));

    const st = {
      energy: 0,            // 1 subito dopo l'esplosione, decade a 0
      flash: 0,
      shake: 0,
      core: reduced ? 0.25 : 0,
      rayBoost: 0,
      converge: 0,          // 0..1 forza di attrazione all'esagono
      shocks: [],
      t: 0,
    };

    apiRef.current = {
      burst() {
        if (reduced) return;
        for (const p of parts) {
          p.z = rnd(560, 720);
          const a = Math.random() * Math.PI * 2;
          const e = Math.acos(rnd(-1, 1));
          const sp = rnd(280, 1000);
          p.x = Math.cos(a) * rnd(0, 16);
          p.y = Math.sin(a) * rnd(0, 16);
          p.bvx = Math.sin(e) * Math.cos(a) * sp;
          p.bvy = Math.sin(e) * Math.sin(a) * sp * 0.72;
          p.bvz = -Math.abs(Math.cos(e)) * sp * 1.5 - 160;   // spinta verso la camera
          p.psx = null;
        }
        st.energy = 1;
        // volutamente sotto il bianco pieno: si devono vedere le scie DENTRO il
        // lampo (più cinematografico) ed è più gentile con la fotosensibilità
        st.flash = 0.8;
        st.shake = 26;
        st.rayBoost = 1.25;
        st.core = 1;
        st.shocks.push({ r: 0, life: 1, wide: true });
        setTimeout(() => st.shocks.push({ r: 0, life: 0.85, wide: false }), 130);
      },
      converge() { if (!reduced) st.converge = 1; },
      release() {
        if (reduced) return;
        st.converge = 0;
        for (const p of parts) {
          const a = Math.atan2(p.y, p.x);
          const sp = rnd(60, 260);
          p.bvx = Math.cos(a) * sp;
          p.bvy = Math.sin(a) * sp;
          p.bvz = rnd(-140, -30);
        }
        st.energy = Math.max(st.energy, 0.55);
      },
      shock(s = 1) {
        if (reduced) return;
        st.shocks.push({ r: 0, life: 1, wide: false });
        st.flash = Math.max(st.flash, 0.34 * s);
        st.shake = Math.max(st.shake, 7 * s);
        st.rayBoost = Math.max(st.rayBoost, 0.7 * s);
      },
    };

    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      st.t += dt;

      // decadimenti
      st.energy = Math.max(0, st.energy - dt * 0.72);
      st.flash = Math.max(0, st.flash - dt * 4.2);
      st.shake = Math.max(0, st.shake - dt * 42);
      st.rayBoost = Math.max(0, st.rayBoost - dt * 1.5);
      st.core += ((reduced ? 0.25 : 0.34) - st.core) * dt * 1.6;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (st.shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
      }

      ctx.globalCompositeOperation = "lighter";

      /* ---- nebulose: masse di luce enormi e lentissime, danno profondità ---- */
      const nebR = Math.max(w, h) * 0.62;
      for (let i = 0; i < 3; i++) {
        const nx = cx + Math.sin(st.t * 0.045 + i * 2.1) * w * 0.30;
        const ny = cy + Math.cos(st.t * 0.037 + i * 1.4) * h * 0.28;
        ctx.globalAlpha = (i === 1 ? 0.10 : 0.075) * (0.7 + 0.3 * Math.sin(st.t * 0.3 + i));
        ctx.drawImage(i === 1 ? spriteCool : spriteWarm, nx - nebR, ny - nebR, nebR * 2, nebR * 2);
      }
      ctx.globalAlpha = 1;

      /* ---- raggi volumetrici dal centro ---- */
      const rayA = 0.085 + st.rayBoost * 0.5;
      if (rayA > 0.012) {
        const reach = Math.hypot(w, h);
        for (let i = 0; i < 7; i++) {
          const ang = st.t * 0.09 + (i * Math.PI * 2) / 7;
          const spread = 0.05 + 0.02 * Math.sin(st.t * 0.7 + i);
          const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * reach, cy + Math.sin(ang) * reach);
          g.addColorStop(0, `rgba(255,150,70,${rayA * 0.5})`);
          g.addColorStop(0.35, `rgba(255,122,24,${rayA * 0.18})`);
          g.addColorStop(1, "rgba(255,122,24,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ang - spread) * reach, cy + Math.sin(ang - spread) * reach);
          ctx.lineTo(cx + Math.cos(ang + spread) * reach, cy + Math.sin(ang + spread) * reach);
          ctx.closePath();
          ctx.fill();
        }
      }

      /* ---- nucleo luminoso ---- */
      const coreR = (70 + 210 * st.rayBoost) * (0.85 + 0.15 * Math.sin(st.t * 1.6));
      const coreA = st.core * (0.5 + st.rayBoost * 0.5);
      ctx.globalAlpha = coreA;
      ctx.drawImage(spriteWarm, cx - coreR, cy - coreR, coreR * 2, coreR * 2);
      ctx.globalAlpha = coreA * 0.55;
      ctx.drawImage(spriteCool, cx - coreR * 0.42, cy - coreR * 0.42, coreR * 0.84, coreR * 0.84);
      ctx.globalAlpha = 1;

      /* ---- flare anamorfico ---- */
      const flareA = st.core * 0.30 + st.rayBoost * 0.55;
      if (flareA > 0.02) {
        const fw = w * (0.5 + st.rayBoost * 0.6);
        const fh = 2 + 16 * st.rayBoost;
        const g = ctx.createLinearGradient(cx - fw, cy, cx + fw, cy);
        g.addColorStop(0, "rgba(120,170,255,0)");
        g.addColorStop(0.35, `rgba(140,185,255,${flareA * 0.35})`);
        g.addColorStop(0.5, `rgba(226,240,255,${flareA})`);
        g.addColorStop(0.65, `rgba(140,185,255,${flareA * 0.35})`);
        g.addColorStop(1, "rgba(120,170,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - fw, cy - fh, fw * 2, fh * 2);
      }

      /* ---- particelle ---- */
      const driftPull = 1 - st.energy;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];

        if (st.converge > 0 && p.follows) {
          const tgt = hexPoint((p.hexF + st.t * 0.012) % 1);
          const k = Math.min(1, dt * 3.4 * st.converge);
          p.x += (tgt.x + p.jx - p.x) * k;
          p.y += (tgt.y + p.jy - p.y) * k;
          p.z += (CONVERGE_Z - p.z) * k;
        } else {
          // esplosione che sfuma nella deriva ambientale
          const dvx = Math.sin(st.t * 0.35 + p.phase) * 5;
          const dvy = Math.cos(st.t * 0.29 + p.phase) * 4;
          const dvz = -16;
          p.x += (p.bvx * st.energy + dvx * driftPull) * dt;
          p.y += (p.bvy * st.energy + dvy * driftPull) * dt;
          p.z += (p.bvz * st.energy + dvz * driftPull) * dt;
        }

        if (p.z < NEAR) { placeDrift(p); p.z = FAR; }
        else if (p.z > FAR + 200) { placeDrift(p); }

        const s = FOCAL / p.z;
        const sx = cx + p.x * s;
        const sy = cy + p.y * s;

        // fuori schermo con margine: salta il disegno
        if (sx < -160 || sx > w + 160 || sy < -160 || sy > h + 160) { p.psx = sx; p.psy = sy; continue; }

        const depth = Math.min(1, (FAR - p.z) / FAR + 0.15);
        const r = Math.max(0.7, p.size * s * (p.mote ? 3.4 : 2.6));
        const sprite = p.warm ? spriteWarm : spriteCool;

        // scia di movimento: è questa che rende l'esplosione "esplosiva"
        if (p.psx != null && st.energy > 0.06) {
          const dx = sx - p.psx, dy = sy - p.psy;
          if (dx * dx + dy * dy > 9) {
            ctx.strokeStyle = `rgba(${p.warm ? WARM : COOL},${0.34 * st.energy * depth})`;
            ctx.lineWidth = Math.max(0.6, r * 0.30);
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.psx, p.psy);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }

        const twinkle = 0.55 + 0.45 * Math.sin(st.t * 2.4 + p.phase * 3);
        ctx.globalAlpha = Math.min(1, (0.60 * depth * twinkle + st.energy * 0.4) * (p.mote ? 1.35 : 1));
        ctx.drawImage(sprite, sx - r, sy - r, r * 2, r * 2);
        ctx.globalAlpha = 1;

        p.psx = sx; p.psy = sy;
      }

      /* ---- onde d'urto ---- */
      for (let i = st.shocks.length - 1; i >= 0; i--) {
        const s = st.shocks[i];
        s.life -= dt * (s.wide ? 0.85 : 1.5);
        s.r += dt * (s.wide ? 1500 : 780);
        if (s.life <= 0) { st.shocks.splice(i, 1); continue; }
        const a = s.life * s.life;
        ctx.strokeStyle = `rgba(255,150,70,${a * 0.5})`;
        ctx.lineWidth = 1 + 9 * a;
        ctx.beginPath();
        ctx.arc(cx, cy, s.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(226,240,255,${a * 0.28})`;
        ctx.lineWidth = 1 + 3 * a;
        ctx.beginPath();
        ctx.arc(cx, cy, s.r * 0.93, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* ---- flash ---- */
      if (st.flash > 0.004) {
        ctx.fillStyle = `rgba(255,240,225,${st.flash * 0.85})`;
        ctx.fillRect(-40, -40, w + 80, h + 80);
      }

      /* ---- trattamento filmico ---- */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      if (vignette) ctx.drawImage(vignette, 0, 0);

      if (grain) {
        ctx.globalCompositeOperation = "overlay";
        ctx.globalAlpha = 0.035;
        const ox = -Math.random() * 96;
        const oy = -Math.random() * 96;
        for (let x = ox; x < w; x += 96) for (let y = oy; y < h; y += 96) ctx.drawImage(grain, x, y);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      apiRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
});

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { silhouetteLayout } from "./layout";

/* ============================================================
   PALCO CINEMATOGRAFICO
   Campo di particelle in 3D proiettato a mano (niente WebGL: resta
   leggero, importante per una landing che deve caricare in fretta).
   Il "filmico" viene da: blending additivo, scie di movimento,
   raggi volumetrici, flare anamorfico, grana e vignettatura.

   Sequenza: accensione -> esplosione -> le particelle si ricompongono
   nella SILHOUETTE della giocatrice del logo -> aggancio (lampo) ->
   la figura resta viva (respira, onda di luce, palla che pulsa, segue
   il mouse) -> scorrendo la pagina si dissolve verso la camera e si
   ricompone risalendo.
   ============================================================ */

const FOCAL = 620;          // distanza focale della camera virtuale
const NEAR = 46;            // oltre questa la particella ha superato la camera
const FAR = 1500;
const CONVERGE_Z = 620;     // piano della silhouette (= FOCAL: 1 unità = 1 px)

const WARM = "255,150,60";
const COOL = "190,215,255";
const SIL_SRC = "/silhouette-navy.png";
const SIL_ASPECT_LOCAL = 0.473;   // larghezza/altezza del PNG della silhouette

function makeSprite(rgb) {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
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

/* Campiona la silhouette: restituisce punti normalizzati sull'altezza
   dell'immagine (px,py in unità "altezza", centrati) + flag palla. */
function samplePoints(img, wanted) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, W, H).data;
  const all = [];
  const step = 2;
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 120) continue;
      const r = data[i], gg = data[i + 1], b = data[i + 2];
      const warm = r > 190 && gg > 90 && b < 120;
      all.push({ px: (x - W / 2) / H, py: (y - H / 2) / H, warm });
    }
  }
  // sottocampiona in modo uniforme fino al numero desiderato
  if (all.length <= wanted) return all;
  const out = [];
  const ratio = all.length / wanted;
  for (let k = 0; k < wanted; k++) out.push(all[Math.floor(k * ratio)]);
  return out;
}

export default forwardRef(function CinematicStage(_props, ref) {
  const canvasRef = useRef(null);
  const apiRef = useRef(null);

  useImperativeHandle(ref, () => ({
    burst: () => apiRef.current?.burst(),
    converge: () => apiRef.current?.converge(),
    lock: () => apiRef.current?.lock(),
    release: () => apiRef.current?.release(),
    shock: (s) => apiRef.current?.shock(s),
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const small = window.innerWidth < 700;

    const spriteWarm = makeSprite(WARM);
    const spriteCool = makeSprite(COOL);
    const grain = small ? null : makeGrain(96);

    let w = 0, h = 0, cx = 0, cy = 0, dpr = 1, raf = 0, vignette = null;
    let sil = { x: 0, y: 0, h: 0, w: 0 };   // layout a schermo della silhouette

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
      sil = silhouetteLayout(w, h);

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

    // budget: la silhouette ha le sue particelle (abbastanza da disegnare una
    // figura piena), più braci grandi e un fondo di polvere ambientale
    const MOTES = small ? 8 : 16;   // braci grandi: sono queste a fare "magia"
    const SIL_TARGET = small ? 520 : Math.min(1150, Math.floor((w * h) / 950));
    const AMBIENT = small ? 90 : 160;
    const COUNT = MOTES + SIL_TARGET + AMBIENT;

    const rnd = (a, b) => a + Math.random() * (b - a);

    function seed(p, i) {
      p.warm = Math.random() < 0.66;
      p.mote = i < MOTES;
      p.size = p.mote ? rnd(4.5, 9) : rnd(0.5, 2.4);
      p.follows = !p.mote && i < MOTES + SIL_TARGET;   // queste formano la figura
      p.pt = null;                                    // punto della silhouette assegnato
      p.jx = rnd(-1.4, 1.4);
      p.jy = rnd(-1.4, 1.4);
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
    const followers = parts.filter((p) => p.follows);

    /* ---- silhouette: carica e campiona ---- */
    let points = null;
    let silGlow = null;               // versione bianca della figura, per l'alone morbido
    let ball = { px: 0, py: -0.4 };   // centro palla (unità altezza), aggiornato dal campionamento
    const img = new Image();
    img.onload = () => {
      points = samplePoints(img, followers.length);
      silGlow = document.createElement("canvas");
      silGlow.width = img.naturalWidth; silGlow.height = img.naturalHeight;
      const sg = silGlow.getContext("2d");
      sg.drawImage(img, 0, 0);
      sg.globalCompositeOperation = "source-in";
      sg.fillStyle = "rgb(205,222,255)";
      sg.fillRect(0, 0, silGlow.width, silGlow.height);
      let bx = 0, by = 0, bn = 0;
      points.forEach((pt) => { if (pt.warm) { bx += pt.px; by += pt.py; bn++; } });
      if (bn) ball = { px: bx / bn, py: by / bn };
      // assegna i punti ai follower (ciclicamente se i follower sono di più)
      followers.forEach((p, i) => { p.pt = points[i % points.length]; });
    };
    img.src = SIL_SRC;

    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const onMove = (e) => { mouse.tx = e.clientX / w; mouse.ty = e.clientY / h; };
    if (finePointer) window.addEventListener("mousemove", onMove, { passive: true });

    const st = {
      energy: 0,            // 1 subito dopo l'esplosione, decade a 0
      flash: 0,
      shake: 0,
      core: reduced ? 0.25 : 0,
      rayBoost: 0,
      converge: 0,          // 0..1 forza di attrazione alla silhouette
      locked: 0,            // 0..1 figura agganciata (più luminosa, palla accesa)
      focus: 0,             // 0..1 la sorgente di luce si sposta sulla figura
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
        st.shocks.push({ r: 0, life: 1, wide: true, ox: cx, oy: cy });
        setTimeout(() => st.shocks.push({ r: 0, life: 0.85, wide: false, ox: cx, oy: cy }), 130);
      },
      converge() { if (!reduced) { st.converge = 1; } },
      lock() {
        if (reduced) return;
        st.locked = 1;
        const o = silOrigin();
        st.shocks.push({ r: 0, life: 1, wide: false, ox: o.x, oy: o.y });
        st.flash = Math.max(st.flash, 0.3);
        st.shake = Math.max(st.shake, 9);
        st.rayBoost = Math.max(st.rayBoost, 0.9);
      },
      release() {
        if (reduced) return;
        st.converge = 0;
        st.locked = 0;
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
        const o = silOrigin();
        st.shocks.push({ r: 0, life: 1, wide: false, ox: o.x, oy: o.y });
        st.flash = Math.max(st.flash, 0.34 * s);
        st.shake = Math.max(st.shake, 7 * s);
        st.rayBoost = Math.max(st.rayBoost, 0.7 * s);
      },
    };

    /* centro della silhouette a schermo, con parallasse di scroll e mouse */
    function silOrigin() {
      const sy = window.scrollY || 0;
      return {
        x: sil.x + (mouse.x - 0.5) * 18,
        y: sil.y - sy * 0.45 + (mouse.y - 0.5) * 12,
      };
    }

    let last = performance.now();

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      st.t += dt;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // decadimenti
      st.energy = Math.max(0, st.energy - dt * 0.72);
      st.flash = Math.max(0, st.flash - dt * 4.2);
      st.shake = Math.max(0, st.shake - dt * 42);
      st.rayBoost = Math.max(0, st.rayBoost - dt * 1.5);
      st.core += ((reduced ? 0.25 : 0.34) - st.core) * dt * 1.6;
      st.focus += ((st.converge > 0 ? 1 : 0) - st.focus) * dt * 1.8;

      // scroll: la figura tiene finché si resta in hero, poi si dissolve
      const scrollY = window.scrollY || 0;
      const hold = Math.max(0, Math.min(1, 1 - scrollY / (h * 0.6)));
      const org = silOrigin();
      const breathe = 1 + 0.012 * Math.sin(st.t * 0.9);
      const silH = sil.h * breathe;

      // sorgente di luce: dal centro alla figura
      const ox = cx + (org.x - cx) * st.focus;
      const oy = cy + (org.y - cy) * st.focus;

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

      /* ---- raggi volumetrici dalla sorgente ---- */
      const rayA = (0.085 + st.rayBoost * 0.5) * (0.55 + 0.45 * hold);
      if (rayA > 0.012) {
        const reach = Math.hypot(w, h);
        for (let i = 0; i < 7; i++) {
          const ang = st.t * 0.09 + (i * Math.PI * 2) / 7;
          const spread = 0.05 + 0.02 * Math.sin(st.t * 0.7 + i);
          const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * reach, oy + Math.sin(ang) * reach);
          g.addColorStop(0, `rgba(255,150,70,${rayA * 0.5})`);
          g.addColorStop(0.35, `rgba(255,122,24,${rayA * 0.18})`);
          g.addColorStop(1, "rgba(255,122,24,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(ox, oy);
          ctx.lineTo(ox + Math.cos(ang - spread) * reach, oy + Math.sin(ang - spread) * reach);
          ctx.lineTo(ox + Math.cos(ang + spread) * reach, oy + Math.sin(ang + spread) * reach);
          ctx.closePath();
          ctx.fill();
        }
      }

      /* ---- nucleo luminoso (dietro la figura una volta agganciata) ---- */
      const coreR = (70 + 210 * st.rayBoost + 60 * st.locked) * (0.85 + 0.15 * Math.sin(st.t * 1.6));
      const coreA = st.core * (0.5 + st.rayBoost * 0.5) * (0.5 + 0.5 * hold);
      ctx.globalAlpha = coreA;
      ctx.drawImage(spriteWarm, ox - coreR, oy - coreR, coreR * 2, coreR * 2);
      ctx.globalAlpha = coreA * 0.55;
      ctx.drawImage(spriteCool, ox - coreR * 0.42, oy - coreR * 0.42, coreR * 0.84, coreR * 0.84);
      ctx.globalAlpha = 1;

      /* ---- flare anamorfico ---- */
      const flareA = (st.core * 0.30 + st.rayBoost * 0.55) * (0.4 + 0.6 * hold);
      if (flareA > 0.02) {
        const fw = w * (0.5 + st.rayBoost * 0.6);
        const fh = 2 + 16 * st.rayBoost;
        const g = ctx.createLinearGradient(ox - fw, oy, ox + fw, oy);
        g.addColorStop(0, "rgba(120,170,255,0)");
        g.addColorStop(0.35, `rgba(140,185,255,${flareA * 0.35})`);
        g.addColorStop(0.5, `rgba(226,240,255,${flareA})`);
        g.addColorStop(0.65, `rgba(140,185,255,${flareA * 0.35})`);
        g.addColorStop(1, "rgba(120,170,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(ox - fw, oy - fh, fw * 2, fh * 2);
      }

      /* ---- alone morbido della figura: le dà corpo sotto i punti ---- */
      if (st.locked > 0 && silGlow && hold > 0.02 && "filter" in ctx) {
        const gw = silH * SIL_ASPECT_LOCAL, gh = silH;
        ctx.filter = `blur(${Math.round(silH * 0.035)}px)`;
        ctx.globalAlpha = 0.22 * st.locked * hold * (0.85 + 0.15 * Math.sin(st.t * 0.9));
        ctx.drawImage(silGlow, org.x - gw / 2, org.y - gh / 2, gw, gh);
        ctx.filter = "none";
        ctx.globalAlpha = 1;
      }

      /* ---- palla: bagliore caldo che pulsa ---- */
      if (st.locked > 0 && points && hold > 0.02) {
        const bx = org.x + ball.px * silH;
        const by = org.y + ball.py * silH;
        const br = silH * (0.09 + 0.015 * Math.sin(st.t * 2.2));
        ctx.globalAlpha = 0.55 * st.locked * hold;
        ctx.drawImage(spriteWarm, bx - br, by - br, br * 2, br * 2);
        ctx.globalAlpha = 1;
      }

      /* ---- particelle ---- */
      const driftPull = 1 - st.energy;
      const attract = st.converge * hold;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const forming = attract > 0.01 && p.follows && p.pt;

        if (forming) {
          // bersaglio: punto della silhouette + micro-vibrazione
          const pt = p.pt;
          const tx = (org.x - cx) + pt.px * silH + p.jx + Math.sin(st.t * 1.3 + p.phase) * 1.1;
          const ty = (org.y - cy) + pt.py * silH + p.jy + Math.cos(st.t * 1.1 + p.phase) * 1.1;
          const k = Math.min(1, dt * 3.6 * attract);
          p.x += (tx - p.x) * k;
          p.y += (ty - p.y) * k;
          p.z += (CONVERGE_Z - p.z) * k;
          // quando lo scroll allenta la presa, la figura vola verso la camera
          const loose = 1 - hold;
          if (loose > 0) {
            p.y -= loose * 90 * dt;
            p.z -= loose * 240 * dt;
            p.x += Math.sin(st.t * 0.8 + p.phase) * loose * 40 * dt;
          }
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

        if (sx < -160 || sx > w + 160 || sy < -160 || sy > h + 160) { p.psx = sx; p.psy = sy; continue; }

        const depth = Math.min(1, (FAR - p.z) / FAR + 0.15);
        const inFigure = forming ? Math.min(1, st.locked + 0.35) : 0;
        const warm = forming ? p.pt.warm : p.warm;
        const r = forming
          ? Math.max(1.1, (1.7 + 0.7 * st.locked) * s * (small ? 0.85 : 1))
          : Math.max(0.7, p.size * s * (p.mote ? 3.4 : 2.6));
        const sprite = warm ? spriteWarm : spriteCool;

        // scia di movimento: è questa che rende l'esplosione "esplosiva"
        if (p.psx != null && st.energy > 0.06) {
          const dx = sx - p.psx, dy = sy - p.psy;
          if (dx * dx + dy * dy > 9) {
            ctx.strokeStyle = `rgba(${warm ? WARM : COOL},${0.34 * st.energy * depth})`;
            ctx.lineWidth = Math.max(0.6, r * 0.30);
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.psx, p.psy);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }

        let alpha;
        if (forming) {
          // onda di luce che risale la figura + respiro
          const wave = Math.max(0, Math.sin(st.t * 1.5 - p.pt.py * 5.2));
          alpha = (0.8 + 0.3 * wave) * (0.6 + 0.4 * inFigure) * (0.35 + 0.65 * hold) + st.energy * 0.3;
          if (p.pt.warm) alpha = Math.min(1, alpha + 0.25 * st.locked);
        } else {
          const twinkle = 0.55 + 0.45 * Math.sin(st.t * 2.4 + p.phase * 3);
          alpha = (0.60 * depth * twinkle + st.energy * 0.4) * (p.mote ? 1.35 : 1);
        }
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.drawImage(sprite, sx - r, sy - r, r * 2, r * 2);
        ctx.globalAlpha = 1;

        p.psx = sx; p.psy = sy;
      }

      /* ---- onde d'urto ---- */
      for (let i = st.shocks.length - 1; i >= 0; i--) {
        const sh = st.shocks[i];
        sh.life -= dt * (sh.wide ? 0.85 : 1.5);
        sh.r += dt * (sh.wide ? 1500 : 780);
        if (sh.life <= 0) { st.shocks.splice(i, 1); continue; }
        const a = sh.life * sh.life;
        ctx.strokeStyle = `rgba(255,150,70,${a * 0.5})`;
        ctx.lineWidth = 1 + 9 * a;
        ctx.beginPath();
        ctx.arc(sh.ox, sh.oy, sh.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(226,240,255,${a * 0.28})`;
        ctx.lineWidth = 1 + 3 * a;
        ctx.beginPath();
        ctx.arc(sh.ox, sh.oy, sh.r * 0.93, 0, Math.PI * 2);
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
        const gx = -Math.random() * 96;
        const gy = -Math.random() * 96;
        for (let x = gx; x < w; x += 96) for (let y = gy; y < h; y += 96) ctx.drawImage(grain, x, y);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      raf = requestAnimationFrame(frame);
    };

    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    // solo in sviluppo: permette di pilotare i frame a mano nei test
    if (import.meta.env.DEV) {
      window.__a360Stage = { frame, api: apiRef.current, sil: () => sil, points: () => points, parts };
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (finePointer) window.removeEventListener("mousemove", onMove);
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

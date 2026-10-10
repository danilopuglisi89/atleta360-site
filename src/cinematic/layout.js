/* Geometria condivisa tra il palco (canvas) e la hero (DOM): dove sta la
   silhouette a schermo. Deve restare coerente con le classi .a360-hero-*
   in index.css. Tutto in px di viewport. */

export const HERO_MAX_W = 1180;   // larghezza massima del contenuto hero
export const HERO_PAD_X = 20;     // padding laterale
export const HERO_GAP = 32;       // gap tra colonna testo e colonna figura
export const FIGURE_FR = 0.44;    // quota della colonna figura (desktop)
export const MOBILE_BP = 900;     // sotto: layout a colonna singola
export const SIL_ASPECT = 0.473;  // larghezza/altezza della silhouette

/* Sul telefono la colonna-figura è elastica: si prende l'altezza che avanza
   dopo logo, titolo, testo e card, così le due scelte restano sempre dentro
   lo schermo. Un'altezza del genere non si può riscrivere come formula —
   quindi lì il palco MISURA la casella invece di indovinarla. Su desktop
   resta la formula: la colonna ha una quota fissa e il calcolo è esatto. */
function figuraMisurata() {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(".a360-hero-figure");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 40 || r.height < 40) return null;
  return r;
}

export function silhouetteLayout(w, h) {
  if (w > MOBILE_BP) {
    const inner = Math.min(w - HERO_PAD_X * 2, HERO_MAX_W);
    const figW = (inner - HERO_GAP) * FIGURE_FR;
    const silH = Math.min(h * 0.74, figW / SIL_ASPECT);
    return { x: w / 2 + inner / 2 - figW / 2, y: h / 2, h: silH, w: silH * SIL_ASPECT };
  }

  const box = figuraMisurata();
  if (box) {
    const silH = Math.min(box.height * 0.98, box.width / SIL_ASPECT);
    /* getBoundingClientRect misura rispetto a dove si è scorsi, mentre il
       palco disegna in coordinate di finestra assumendo la pagina in cima.
       Senza riaggiungere scrollY, una misura presa mentre si è più in basso
       (succede sul telefono: la barra del browser che si ritrae è un resize)
       metterebbe la silhouette fuori posto per il resto della visita. */
    return {
      x: box.left + box.width / 2,
      y: box.top + (window.scrollY || 0) + box.height / 2,
      h: silH, w: silH * SIL_ASPECT,
    };
  }

  // ripiego: la hero non è a schermo (form, /contatti) o non è ancora montata
  const silH = Math.min(h * 0.28, ((w - HERO_PAD_X * 2) / SIL_ASPECT) * 0.95);
  return { x: w / 2, y: 90 + silH / 2, h: silH, w: silH * SIL_ASPECT };
}

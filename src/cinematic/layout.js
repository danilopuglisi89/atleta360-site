/* Geometria condivisa tra il palco (canvas) e la hero (DOM): dove sta la
   silhouette a schermo. Deve restare coerente con le classi .a360-hero-*
   in index.css. Tutto in px di viewport. */

export const HERO_MAX_W = 1180;   // larghezza massima del contenuto hero
export const HERO_PAD_X = 20;     // padding laterale
export const HERO_GAP = 32;       // gap tra colonna testo e colonna figura
export const FIGURE_FR = 0.44;    // quota della colonna figura (desktop)
export const MOBILE_BP = 900;     // sotto: layout a colonna singola
export const SIL_ASPECT = 0.473;  // larghezza/altezza della silhouette

export function silhouetteLayout(w, h) {
  if (w > MOBILE_BP) {
    const inner = Math.min(w - HERO_PAD_X * 2, HERO_MAX_W);
    const figW = (inner - HERO_GAP) * FIGURE_FR;
    const silH = Math.min(h * 0.74, figW / SIL_ASPECT);
    return { x: w / 2 + inner / 2 - figW / 2, y: h / 2, h: silH, w: silH * SIL_ASPECT };
  }
  // mobile: logo in alto, figura sotto il logo, testo dopo
  const silH = Math.min(h * 0.38, ((w - HERO_PAD_X * 2) / SIL_ASPECT) * 0.95);
  return { x: w / 2, y: 96 + h * 0.21, h: silH, w: silH * SIL_ASPECT };
}

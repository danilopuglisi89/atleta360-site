/* ============================================================
   BRAND — palette e font, copiati da Dashboard Atleta360/src/theme.js
   per mantenere la stessa identità visiva. Se cambia lì, aggiorna anche qui.
   ============================================================ */
export const C = {
  navy: "#0A1650",
  navy2: "#17297A",
  orange: "#FF7A18",
  orangeSoft: "#FFE9D5",
  ink: "#0C1330",
  muted: "#64708F",
  surface: "#F6F7FB",
  card: "#FFFFFF",
  grid: "#E6E9F2",
};

export const font = { fontFamily: "'Inter', system-ui, sans-serif" };
export const display = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };

/* ============================================================
   SCALA — sette gradini di testo e quattro raggi, niente di più.
   Prima di questa scala la pagina usava 26 combinazioni di corpo e peso
   (19 delle quali fra 11,5px e 19px) e 9 raggi diversi: differenze da
   mezzo pixel che non erano scelte, ma sedimentazione. Si vede, e legge
   come "qui non c'è un sistema". Se serve una misura nuova, prima
   chiediti quale di queste stavi cercando.
   ============================================================ */
export const T = {
  display: "clamp(32px, 4.7vw, 60px)", // titolo della hero
  h2: "clamp(24px, 3.6vw, 34px)",      // titoli di sezione
  h3: "clamp(19px, 2.4vw, 24px)",      // titoli dentro le card
  lead: "19px",                         // sommario, nomi nelle card
  body: "16px",                         // testo corrente
  small: "14px",                        // testo di servizio
  micro: "12.5px",                      // didascalie, note
  kicker: "13px",                       // occhielli maiuscoletti
  /* Due varianti fluide: approdano agli stessi gradini (lead e small) ma si
     restringono, perché le card di scelta stanno affiancate anche a 163px
     di larghezza sul telefono e un corpo fisso le spaccherebbe. */
  leadFluida: "clamp(14px, 3.2vw, 19px)",
  smallFluida: "clamp(12.5px, 2.3vw, 14px)",
};

export const W = { normale: 400, medio: 600, forte: 700 };

export const R = { sm: 10, md: 16, lg: 24, tonda: "50%", pillola: 999 };

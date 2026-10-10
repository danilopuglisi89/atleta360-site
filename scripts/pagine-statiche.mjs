/* Dopo `vite build`: crea dist/contatti.html a partire da dist/index.html.
 *
 * Perché: il sito è una sola pagina React, quindi /contatti riceveva lo stesso
 * HTML della home — stesso titolo, stessa descrizione e soprattutto canonical
 * che puntava alla home. Per un motore di ricerca /contatti era un doppione
 * della home, mentre la sitemap la indicava come pagina a sé: due segnali in
 * contraddizione. Qui riceve la sua testa e il suo testo statico.
 *
 * Nessuna dipendenza: solo sostituzioni su testo, che falliscono a voce alta
 * se index.html cambia forma (meglio una build rotta che una pagina sbagliata).
 */
import { readFileSync, writeFileSync } from "node:fs";

const SITO = "https://atleta-360.com";
const html = readFileSync("dist/index.html", "utf8");

const TITOLO = "Richiedi la demo gratuita — Atleta360";
const DESCRIZIONE =
  "Lascia i tuoi contatti ed entri subito nella demo di Atleta360, con dati di esempio. Senza impegno, senza carta di credito.";

const STATICO = `<main class="a360-statico">
        <h1>Prova la demo gratuita di Atleta360</h1>
        <p>Lascia i tuoi contatti ed entri subito nella dashboard. Senza impegno, senza carta di credito.</p>
        <p>Atleta360 è la dashboard che fa crescere le soft skill della tua squadra di pallavolo: rilevamenti periodici, grafici e badge.</p>
        <p>Il modulo richiede JavaScript. In alternativa scrivi a <a href="mailto:info@danilopuglisi.com">info@danilopuglisi.com</a> o su <a href="https://wa.me/393770870217">WhatsApp al +39 377 087 0217</a>.</p>
        <p><a href="/">Torna alla pagina principale</a></p>
      </main>`;

function sostituisci(testo, cerca, metti) {
  if (!cerca.test(testo)) throw new Error(`pagine-statiche: non trovo ${cerca} in dist/index.html`);
  return testo.replace(cerca, metti);
}

let c = html;
c = sostituisci(c, /<title>[^<]*<\/title>/, `<title>${TITOLO}</title>`);
c = sostituisci(c, /(<meta name="description" content=")[^"]*(")/, `$1${DESCRIZIONE}$2`);
c = sostituisci(c, /(<link rel="canonical" href=")[^"]*(")/, `$1${SITO}/contatti$2`);
c = sostituisci(c, /(<meta property="og:url" content=")[^"]*(")/, `$1${SITO}/contatti$2`);
c = sostituisci(c, /(<meta property="og:title" content=")[^"]*(")/, `$1${TITOLO}$2`);
c = sostituisci(c, /<main class="a360-statico">[\s\S]*?<\/main>/, STATICO);

writeFileSync("dist/contatti.html", c);
console.log("pagine-statiche: scritto dist/contatti.html");

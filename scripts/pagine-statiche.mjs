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

/* /webinar: stessa operazione, con la sua testa e il suo testo statico. */
const TITOLO_W = "Webinar gratuito: le soft skill nello spogliatoio — Atleta360";
const DESCRIZIONE_W =
  "Giovedì 3 dicembre 2026, 20:30-21:30, online e gratuito: come tenere le ragazze in squadra e farle crescere nel settore giovanile di pallavolo. Con Danilo Puglisi e il caso Oasi Volley.";
const STATICO_W = `<main class="a360-statico">
        <h1>Le soft skill nello spogliatoio</h1>
        <p>Webinar gratuito per allenatori, allenatrici e dirigenti del settore giovanile di pallavolo. Giovedì 3 dicembre 2026, dalle 20:30 alle 21:30, online.</p>
        <p>Perché tante ragazze lasciano la pallavolo fra i 13 e i 16 anni, come allenare comunicazione, gestione dell'errore e leadership con esercizi pronti, come dare feedback a squadra e genitori, e il caso dell'Oasi Volley.</p>
        <p>L'iscrizione richiede JavaScript. In alternativa scrivi a <a href="mailto:info@danilopuglisi.com">info@danilopuglisi.com</a> o su <a href="https://wa.me/393770870217">WhatsApp al +39 377 087 0217</a>.</p>
        <p><a href="/">Torna alla pagina principale</a></p>
      </main>`;
let w = html;
w = sostituisci(w, /<title>[^<]*<\/title>/, `<title>${TITOLO_W}</title>`);
w = sostituisci(w, /(<meta name="description" content=")[^"]*(")/, `$1${DESCRIZIONE_W}$2`);
w = sostituisci(w, /(<link rel="canonical" href=")[^"]*(")/, `$1${SITO}/webinar$2`);
w = sostituisci(w, /(<meta property="og:url" content=")[^"]*(")/, `$1${SITO}/webinar$2`);
w = sostituisci(w, /(<meta property="og:title" content=")[^"]*(")/, `$1${TITOLO_W}$2`);
w = sostituisci(w, /<main class="a360-statico">[\s\S]*?<\/main>/, STATICO_W);
writeFileSync("dist/webinar.html", w);
console.log("pagine-statiche: scritto dist/webinar.html");

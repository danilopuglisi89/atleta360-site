/* Pagine per Google: servizio, zona e guide (contenuti/*.md, contenuti/guide/*.md).
 *
 * Gira dopo `vite build` (vedi package.json) e scrive HTML statico in dist/:
 * Google legge il testo subito, senza aspettare l'app React del sito.
 *
 *   dist/<slug>.html           pagine di servizio e di zona
 *   dist/guide.html            indice delle guide
 *   dist/guide/<slug>.html     le guide
 *   dist/sitemap.xml           rigenerata con le pagine pubblicate
 *
 * Va online solo ciò che ha `stato: pubblicato`. Le bozze si costruiscono con
 * BOZZE=1 (o nelle anteprime di Vercel, fuori da main): stesse pagine con
 * "noindex" e una fascia "bozza" in cima, per l'approvazione di Danilo.
 * Nessuna dipendenza: frontmatter e markdown hanno un lettore minimo qui sotto.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SITO = "https://atleta-360.com";
const BOZZE = process.env.BOZZE === "1" || (process.env.VERCEL_ENV === "preview");
const DIST = "dist";
const OGGI = new Date().toISOString().slice(0, 10);

/* ---------- lettura ---------- */

function frontmatter(testo) {
  const m = testo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("contenuti: frontmatter mancante");
  const dati = {};
  let lista = null, voce = null;
  for (const riga of m[1].split(/\r?\n/)) {
    if (!riga.trim()) continue;
    const elem = riga.match(/^\s*-\s+(\w+):\s*(.*)$/);
    const sotto = riga.match(/^\s{3,}(\w+):\s*(.*)$/);
    const chiave = riga.match(/^(\w+):\s*(.*)$/);
    if (elem && lista) { voce = { [elem[1]]: elem[2] }; dati[lista].push(voce); }
    else if (sotto && voce) voce[sotto[1]] = sotto[2];
    else if (chiave) {
      if (chiave[2] === "") { lista = chiave[1]; dati[lista] = []; voce = null; }
      else { dati[chiave[1]] = chiave[2]; lista = null; }
    }
  }
  return { dati, corpo: m[2] };
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const esterno = /^https?:\/\//.test(u) && !u.startsWith(SITO);
      return `<a href="${u}"${esterno ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
    });
}

/* Markdown ridotto: titoli ## ###, paragrafi, elenchi, tabelle, citazioni,
   blocchi :::nota e il segnaposto :::cta (il riquadro di contatto). */
function markdown(md) {
  const righe = md.replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  while (i < righe.length) {
    const r = righe[i];
    if (!r.trim()) { i++; continue; }
    if (r.startsWith(":::")) {
      const tipo = r.slice(3).trim();
      if (tipo === "cta") { out.push("<!--CTA-->"); i++; continue; }
      const dentro = [];
      i++;
      while (i < righe.length && !righe[i].startsWith(":::")) dentro.push(righe[i++]);
      i++;
      // :::nota → riquadro; :::per-chi, :::passi… → blocco con la sua classe (schede, passi numerati)
      const classe = tipo.replace(/[^a-z-]/g, "");
      out.push(!classe || classe === "nota"
        ? `<aside class="nota">${markdown(dentro.join("\n"))}</aside>`
        : `<div class="blocco-${classe}">${markdown(dentro.join("\n"))}</div>`);
      continue;
    }
    let h = r.match(/^(#{2,3})\s+(.*)$/);
    if (h) { out.push(`<h${h[1].length} id="${ancora(h[2])}">${inline(h[2])}</h${h[1].length}>`); i++; continue; }
    if (r.startsWith("|")) {
      const t = [];
      while (i < righe.length && righe[i].startsWith("|")) t.push(righe[i++]);
      const celle = (x) => x.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const [testa, , ...corpo] = t;
      out.push(`<div class="tabella"><table><thead><tr>${celle(testa).map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${corpo.map((x) => `<tr>${celle(x).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(r) || /^\s*\d+\.\s+/.test(r)) {
      const ordinato = /^\s*\d+\./.test(r);
      const voci = [];
      while (i < righe.length && (ordinato ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(righe[i])) {
        voci.push(righe[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, ""));
        i++;
      }
      const tag = ordinato ? "ol" : "ul";
      out.push(`<${tag}>${voci.map((v) => `<li>${inline(v)}</li>`).join("")}</${tag}>`);
      continue;
    }
    if (r.startsWith(">")) {
      const q = [];
      while (i < righe.length && righe[i].startsWith(">")) q.push(righe[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`);
      continue;
    }
    const p = [];
    while (i < righe.length && righe[i].trim() && !/^(#{2,3}\s|[-*]\s|\d+\.\s|\||>|:::)/.test(righe[i])) p.push(righe[i++]);
    out.push(`<p>${inline(p.join(" "))}</p>`);
  }
  return out.join("\n");
}

const ancora = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const parole = (md) => md.replace(/[#*>|:\-\[\]()]/g, " ").split(/\s+/).filter(Boolean).length;

function leggi(cartella, sezione) {
  if (!existsSync(cartella)) return [];
  return readdirSync(cartella).filter((f) => f.endsWith(".md")).map((f) => {
    const { dati, corpo } = frontmatter(readFileSync(join(cartella, f), "utf8"));
    const percorso = sezione ? `/${sezione}/${dati.slug}` : `/${dati.slug}`;
    return { ...dati, corpo, percorso, minuti: Math.max(2, Math.round(parole(corpo) / 200)) };
  });
}

const tutte = [...leggi("contenuti"), ...leggi("contenuti/guide", "guide")];
const visibili = tutte.filter((p) => p.stato === "pubblicato" || BOZZE);
const guide = visibili.filter((p) => p.tipo === "guida").sort((a, b) => (b.data || "").localeCompare(a.data || ""));

/* ---------- pagina ---------- */

const fmtData = (d) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`));

const WA_NUMERO = "393770870217";
const WA_PREDEFINITO = "Ciao Danilo, ho letto la tua pagina sul mental coaching per la pallavolo e vorrei saperne di più.";
// testo WhatsApp precompilato: quello della pagina (frontmatter "whatsapp") o uno che cita la guida letta
const linkWa = (p) => `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(p?.whatsapp || (p?.tipo === "guida" ? `Ciao Danilo, ho letto la tua guida «${p.titolo}» e vorrei saperne di più sul mental coaching.` : WA_PREDEFINITO))}`;

/* Il modulo "colloquio gratuito" (in fondo a ogni pagina). Pochi campi: chi sei,
   l'età di chi gioca, come preferisci essere ricontattato. Il cognome è
   facoltativo; se scegli telefono o WhatsApp il numero diventa obbligatorio
   (lo controlla traccia.js). */
const cta = (p) => `
<section class="cta" id="contatto" aria-labelledby="cta-titolo">
  <h2 id="cta-titolo">Parliamone: il primo colloquio è gratuito</h2>
  <p>Venti minuti, online o al telefono. Mi racconti cosa succede in campo e vi dico con franchezza se posso esservi utile.</p>
  <a class="bottone-wa" href="${linkWa(p)}" target="_blank" rel="noopener">Scrivimi su WhatsApp</a>
  <p class="oppure">oppure lascia i tuoi dati e ti ricontatto io</p>
  <form class="cta-form" data-modulo="coaching" novalidate>
    <div class="esca" aria-hidden="true"><label for="sito_web">Non compilare</label><input id="sito_web" name="sito_web" tabindex="-1" autocomplete="off"></div>
    <div class="campi-2 resta">
      <p><label for="c-ruolo">Sono *</label><select id="c-ruolo" name="ruolo" required><option value="" disabled selected>Scegli…</option><option>Genitore</option><option>Atleta</option><option>Allenatore / allenatrice</option><option>Dirigente</option><option>Altro</option></select></p>
      <p><label for="c-eta">Età di chi gioca *</label><select id="c-eta" name="eta" required><option value="" disabled selected>Scegli…</option><option>12-14 anni</option><option>15-17 anni</option><option>18-25 anni</option><option>Oltre 25</option><option>Una squadra</option></select></p>
    </div>
    <div class="campi-2 resta">
      <p><label for="c-nome">Nome *</label><input id="c-nome" name="nome" autocomplete="given-name" maxlength="100" required></p>
      <p><label for="c-cognome">Cognome</label><input id="c-cognome" name="cognome" autocomplete="family-name" maxlength="100"></p>
    </div>
    <p><label for="c-email">Email *</label><input id="c-email" name="email" type="email" autocomplete="email" maxlength="254" required></p>
    <div class="campi-2">
      <p><label for="c-pref">Come preferisci essere ricontattato? *</label><select id="c-pref" name="preferenza" required><option>WhatsApp</option><option>Telefonata</option><option>Email</option></select></p>
      <p><label for="c-tel">Telefono</label><input id="c-tel" name="telefono" type="tel" autocomplete="tel" maxlength="40"></p>
    </div>
    <p><label for="c-msg">Cosa succede in campo? (facoltativo)</label><textarea id="c-msg" name="messaggio" rows="3" maxlength="1500" placeholder="Es. gioca bene in allenamento ma in partita si blocca dopo il primo errore"></textarea></p>
    <label class="consenso"><input type="checkbox" name="privacy" required> <span>Ho letto l'<a href="/#privacy">informativa sulla privacy</a> e acconsento al trattamento dei dati per essere ricontattato. *</span></label>
    <button type="submit" class="bottone">Prenota il colloquio gratuito di 20 minuti</button>
    <p class="cta-garanzia">Nessun impegno · Rispondo entro 24 ore · Non contatto la società né l'allenatore</p>
    <p class="cta-minori">Hai meno di 14 anni? Chiedi a un genitore di scrivermi.</p>
    <p class="esito" role="status" aria-live="polite"></p>
  </form>
  <p class="cta-alt">Oppure: <a href="mailto:info@danilopuglisi.com">info@danilopuglisi.com</a> · +39 377 087 0217</p>
</section>`;

/* L'invito breve dove il testo ha ":::cta": un pulsante che porta al modulo. */
const CTA_BREVE = `<aside class="cta-breve"><p><strong>Vuoi capire se fa per te?</strong> Venti minuti, online o al telefono. Gratis e senza impegno.</p><a class="bottone bottone-auto" href="#contatto">Prenota il colloquio gratuito</a></aside>`;

function schema(p) {
  const url = `${SITO}${p.percorso}`;
  const autore = { "@type": "Person", name: "Danilo Puglisi", url: `${SITO}/mental-coach-pallavolo`, jobTitle: "Mental coach e formatore" };
  const briciole = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Atleta360", item: `${SITO}/` },
      ...(p.tipo === "guida" ? [{ "@type": "ListItem", position: 2, name: "Guide", item: `${SITO}/guide` }] : []),
      { "@type": "ListItem", position: p.tipo === "guida" ? 3 : 2, name: p.titolo, item: url },
    ],
  };
  const grafo = [briciole];
  if (p.tipo === "guida") {
    grafo.push({ "@type": "Article", headline: p.titolo, description: p.descrizione, datePublished: p.data, dateModified: p.aggiornato || p.data, author: autore, publisher: { "@type": "Organization", name: "Atleta360", logo: { "@type": "ImageObject", url: `${SITO}/logo-icona.png` } }, mainEntityOfPage: url, image: `${SITO}/og-image.jpg`, inLanguage: "it-IT" });
  } else {
    grafo.push({ "@type": "Service", name: p.titolo, serviceType: "Mental coaching sportivo per la pallavolo", description: p.descrizione, provider: autore, url, areaServed: p.tipo === "zona" ? ["Massa-Carrara", "Lucca", "Pisa", "La Spezia", "Toscana", "Liguria"] : "IT" });
  }
  if (Array.isArray(p.faq) && p.faq.length) {
    grafo.push({ "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.d, acceptedAnswer: { "@type": "Answer", text: f.r } })) });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": grafo });
}

function guscio({ titoloSeo, descrizione, percorso, indicizza = true, jsonld = "", pagina = "guida", corpo }) {
  const url = `${SITO}${percorso}`;
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titoloSeo)}</title>
<meta name="description" content="${esc(descrizione)}">
<link rel="canonical" href="${url}">
${indicizza ? "" : '<meta name="robots" content="noindex, nofollow">\n'}<meta property="og:type" content="article">
<meta property="og:title" content="${esc(titoloSeo)}">
<meta property="og:description" content="${esc(descrizione)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITO}/og-image.jpg">
<meta property="og:locale" content="it_IT">
<meta name="theme-color" content="#0A1650">
<link rel="icon" type="image/png" href="/logo-icona.png">
<link rel="preload" href="/contenuti/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/contenuti/stile.css">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ""}
</head>
<body data-pagina="${pagina}">
${BOZZE ? '<div class="bozza">Anteprima per l\'approvazione: questa pagina non è ancora pubblica.</div>' : ""}
<header class="testata">
  <a href="/" class="marchio" aria-label="Atleta360, pagina principale"><img src="/contenuti/logo-bianco-480.png" alt="Atleta360" width="480" height="203"></a>
  <nav aria-label="Sezioni">
    <a href="/mental-coach-pallavolo">Mental coach</a>
    <a href="/guide">Guide</a>
    <a href="/mental-coach-pallavolo#contatto" class="nav-cta">Colloquio gratuito</a>
  </nav>
</header>
${corpo}
${pagina === "servizio" ? '<a class="barra-fissa" href="#contatto">Colloquio gratuito · 20 min</a>' : ""}
<footer class="piede">
  <p><strong>Atleta360</strong> · Danilo Puglisi, mental coach e formatore · Carrara (MS)</p>
  <p>Esperto di settore · Regione Toscana n° 531 · <a href="mailto:info@danilopuglisi.com">info@danilopuglisi.com</a> · <a href="/#privacy">Privacy</a></p>
  <p class="piccolo">Il mental coaching non è una prestazione sanitaria né psicologica e non sostituisce il parere di un medico o di uno psicologo. Professione non organizzata in ordini o collegi, esercitata ai sensi della Legge 14 gennaio 2013, n. 4.</p>
</footer>
<script src="/contenuti/traccia.js" defer></script>
</body>
</html>`;
}

function correlate(p) {
  const altre = guide.filter((g) => g.percorso !== p.percorso).slice(0, 3);
  if (!altre.length) return "";
  return `<section class="correlate" aria-labelledby="corr"><h2 id="corr">Leggi anche</h2><ul>${altre.map((g) => `<li><a href="${g.percorso}"><strong>${esc(g.titolo)}</strong><span>${esc(g.sommario || "")}</span></a></li>`).join("")}</ul></section>`;
}

function faqHtml(p) {
  if (!Array.isArray(p.faq) || !p.faq.length) return "";
  return `<section class="faq" aria-labelledby="faq"><h2 id="faq">Domande frequenti</h2>${p.faq.map((f) => `<details><summary>${esc(f.d)}</summary><p>${esc(f.r)}</p></details>`).join("")}</section>`;
}

/* Pagine di servizio e di zona: in apertura la persona, la promessa e i due
   modi di contattare (modulo e WhatsApp), poi la striscia Oasi Volley. */
function eroe(p) {
  return `<header class="eroe">
      <div class="eroe-testo">
        <p class="occhiello">Mental coaching sportivo · online e in Toscana</p>
        <h1>${esc(p.titolo)}</h1>
        ${p.sommario ? `<p class="sommario">${esc(p.sommario)}</p>` : ""}
        <div class="eroe-azioni">
          <a class="bottone bottone-auto" href="#contatto">Prenota il colloquio gratuito</a>
          <a class="link-wa" href="${linkWa(p)}" target="_blank" rel="noopener">oppure scrivimi su WhatsApp</a>
        </div>
        <ul class="rassicura"><li>20 minuti, gratis</li><li>Online o in presenza</li><li>Nessun impegno</li></ul>
      </div>
      <figure class="eroe-foto">
        <img src="/danilo.jpg" alt="Danilo Puglisi" width="480" height="480" fetchpriority="high">
        <figcaption><strong>Danilo Puglisi</strong>Esperto di settore · Regione Toscana n° 531</figcaption>
      </figure>
    </header>
    <div class="fiducia">
      <img src="/oasi-volley-logo.png" alt="Oasi Volley" width="260" height="75" loading="lazy">
      <p>Atleta360 è lo strumento con cui l'<strong>Oasi Volley</strong> di Viareggio segue la crescita delle sue atlete.</p>
    </div>`;
}

function paginaContenuto(p) {
  const briciole = p.tipo === "guida"
    ? `<a href="/">Atleta360</a> › <a href="/guide">Guide</a> › <span>${esc(p.titolo)}</span>`
    : `<a href="/">Atleta360</a> › <span>${esc(p.titolo)}</span>`;
  const testo = markdown(p.corpo).split("<!--CTA-->").join(CTA_BREVE);
  const info = p.tipo === "guida"
    ? `<p class="info">Di <a href="/mental-coach-pallavolo">Danilo Puglisi</a>, mental coach · ${fmtData(p.data)} · ${p.minuti} minuti di lettura</p>`
    : "";
  const corpo = `
<main class="contenuto">
  <nav class="briciole" aria-label="Sei qui">${briciole}</nav>
  <article>
    ${p.tipo === "guida" ? `<header class="intestazione">
      <h1>${esc(p.titolo)}</h1>
      ${p.sommario ? `<p class="sommario">${esc(p.sommario)}</p>` : ""}
      ${info}
    </header>` : eroe(p)}
    ${testo}
    ${faqHtml(p)}
  </article>
  ${cta(p)}
  ${correlate(p)}
</main>`;
  return guscio({
    titoloSeo: p.titoloSeo || `${p.titolo} | Atleta360`,
    descrizione: p.descrizione, percorso: p.percorso,
    indicizza: p.stato === "pubblicato" && !BOZZE,
    jsonld: schema(p), pagina: p.tipo === "guida" ? "guida" : "servizio", corpo,
  });
}

function paginaIndice() {
  const corpo = `
<main class="contenuto">
  <nav class="briciole" aria-label="Sei qui"><a href="/">Atleta360</a> › <span>Guide</span></nav>
  <header class="intestazione">
    <h1>Guide di mental coaching per la pallavolo</h1>
    <p class="sommario">Ansia prima della partita, paura di sbagliare, il ruolo dei genitori: guide pratiche per atlete, atleti e famiglie.</p>
  </header>
  <ul class="elenco-guide">
    ${guide.map((g) => `<li><a href="${g.percorso}"><h2>${esc(g.titolo)}</h2><p>${esc(g.sommario || g.descrizione)}</p><span class="info">${fmtData(g.data)} · ${g.minuti} min</span></a></li>`).join("\n    ") || "<li>Le prime guide arrivano a breve.</li>"}
  </ul>
  ${cta()}
</main>`;
  return guscio({
    titoloSeo: "Guide di mental coaching per la pallavolo | Atleta360",
    descrizione: "Guide pratiche di mental coaching per la pallavolo: ansia da prestazione, paura di sbagliare, gestione dell'errore, consigli per i genitori.",
    percorso: "/guide", indicizza: !BOZZE && guide.length > 0, pagina: "guida", corpo,
  });
}

/* ---------- scrittura ---------- */

mkdirSync(join(DIST, "guide"), { recursive: true });
mkdirSync(join(DIST, "contenuti", "fonts"), { recursive: true });
for (const p of visibili) writeFileSync(join(DIST, `${p.percorso.slice(1)}.html`), paginaContenuto(p));
if (guide.length || BOZZE) writeFileSync(join(DIST, "guide.html"), paginaIndice());
copyFileSync("scripts/contenuti/stile.css", join(DIST, "contenuti", "stile.css"));
copyFileSync("scripts/contenuti/traccia.js", join(DIST, "contenuti", "traccia.js"));
// logo bianco a 480 px (32 KB invece dei 123 KB dell'originale da 1968 px)
copyFileSync("scripts/contenuti/logo-bianco-480.png", join(DIST, "contenuti", "logo-bianco-480.png"));
for (const [pacchetto, file] of [["inter", "inter-latin-400-normal.woff2"], ["inter", "inter-latin-600-normal.woff2"], ["inter", "inter-latin-700-normal.woff2"], ["space-grotesk", "space-grotesk-latin-700-normal.woff2"]]) {
  copyFileSync(join("node_modules", "@fontsource", pacchetto, "files", file), join(DIST, "contenuti", "fonts", file));
}

/* Sitemap: le pagine fisse più quelle pubblicate (le bozze mai). */
const pubblicate = tutte.filter((p) => p.stato === "pubblicato");
const pubGuide = pubblicate.filter((p) => p.tipo === "guida");
const voci = [
  { loc: "/", lastmod: "2026-10-10" }, { loc: "/contatti", lastmod: "2026-10-10" }, { loc: "/webinar", lastmod: "2026-10-15" },
  ...pubblicate.map((p) => ({ loc: p.percorso, lastmod: p.aggiornato || p.data })),
  ...(pubGuide.length ? [{ loc: "/guide", lastmod: pubGuide.map((g) => g.aggiornato || g.data).sort().pop() }] : []),
];
writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${voci.map((v) => `  <url><loc>${SITO}${v.loc}</loc><lastmod>${v.lastmod || OGGI}</lastmod></url>`).join("\n")}
</urlset>
`);

console.log(`contenuti: ${visibili.length} pagine${BOZZE ? " (con bozze, noindex)" : ""}, ${pubblicate.length} pubblicate in sitemap`);

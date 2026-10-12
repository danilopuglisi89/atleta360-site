/* Da dove arriva chi visita: link con ?utm_source=… (o ?ref=…), altrimenti il
 * sito da cui ha cliccato. Si legge una volta, all'apertura della pagina, e
 * resta in memoria finché la pagina è aperta: niente cookie né storage.
 *
 * La "categoria" va nei contatori anonimi (fonte.instagram, fonte.diretto…),
 * il "dettaglio" solo nel lead, che il visitatore lascia di sua volontà.
 */
export const CATEGORIE = ["instagram", "facebook", "google", "linkedin", "whatsapp", "danilopuglisi", "email", "diretto", "altro"];

const REGOLE = [
  ["instagram", /instagram|^ig$/],
  ["facebook", /facebook|^fb$|meta/],
  ["google", /google|bing|duckduckgo|ecosia|yahoo/],
  ["linkedin", /linkedin|lnkd/],
  ["whatsapp", /whatsapp|^wa$/],
  ["danilopuglisi", /danilopuglisi/],
  ["email", /mail|newsletter/],
];

function categoria(testo) {
  const t = String(testo || "").toLowerCase();
  if (!t) return "diretto";
  for (const [c, re] of REGOLE) if (re.test(t)) return c;
  return "altro";
}

function leggi() {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = q.get("utm_source") || q.get("ref") || q.get("fonte") || "";
    if (utm) {
      const parti = [utm, q.get("utm_medium"), q.get("utm_campaign")].filter(Boolean).map((s) => s.slice(0, 60));
      return { categoria: categoria(utm), dettaglio: parti.join(" / ").slice(0, 200) };
    }
    let host = "";
    try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch { /* referrer illeggibile */ }
    // passaggi interni (dal sito stesso) non sono una provenienza
    if (host === window.location.hostname.replace(/^www\./, "")) host = "";
    return { categoria: categoria(host), dettaglio: host.slice(0, 200) };
  } catch {
    return { categoria: "diretto", dettaglio: "" };
  }
}

let memo = null;
export function fonte() {
  if (!memo) memo = leggi();
  return memo;
}

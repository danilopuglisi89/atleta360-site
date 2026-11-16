# atleta360-site — mappa (cronaca e dettagli in DIARIO.md)

Landing pubblica di Atleta360 (atleta/società → form lead → redirect alla demo con dati finti). Online: https://atleta-360.com
(Vercel, DNS su Cloudflare; `git push` su `main` ripubblica). Single-purpose: nessuna area riservata né contenuti editoriali.

## Stato oggi
- Flusso: hero (Atleta | Società) → `LeadForm` → `submitLead()` su Supabase (`leads`) + Pixel → `demo.atleta-360.com/?demo=atleta|societa`.
- Pannello `/admin` (pagina Vite separata), `/webinar`, `/contatti` (variante campagne), pagine SEO mental coach da `contenuti/*.md`.
- Ordine sezioni (non rimescolarlo): hero → DemoPreview → Pillars → HowItWorks → CaseStudy → AboutFounder → FAQ → ClosingCTA → footer.

## Cartelle chiave
- `src/` (`App.jsx` router a stati, `cinematic/` palco+sezioni, `LeadForm.jsx`, `leads.js`, `theme.js`) · `public/` loghi e `404.html`
- `api/` (funzioni Vercel: `notifica-lead`, `admin`, `evento`, `opzioni`, `hub`, `visita`, `iscrizione`; `_lib/`) · `admin.html` + `src/admin/`
- `supabase/` (migrazioni di questo repo: leads, admin, admin-2…5) · `scripts/` (`pagine-statiche.mjs`, `contenuti.mjs`, `statistiche.mjs`)
- `contenuti/` (pagine Google) · `PIANO-LEAD.md`, `PIANO-CONTENUTI.md`, `README.md` (ordine migrazioni).

## Comandi
- Locale: `npm install && npm run dev`; build: `npm run build` (poi `pagine-statiche.mjs` e `contenuti.mjs`; `BOZZE=1` include le bozze).
- Deploy: `git push` su `main`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `HUB_CHIAVE`.
- Statistiche: `node scripts/statistiche.mjs [giorni]` (chiave in `.env.hub`, ignorato da git).

## Regole che valgono sempre
- Brand Atleta360 (navy `#0A1650`/`#17297A`, arancio `#FF7A18`, Inter + Space Grotesk), non quello Caterino; `theme.js` va tenuto sincronizzato a mano con la dashboard.
- Supabase del sito SEPARATO da quello Oasi (atlete vere): migrazioni prima quelle della dashboard, poi queste, in ordine. Mai policy « authenticated » sulle tabelle del sito.
- Chiavi di servizio, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `HUB_CHIAVE` solo su Vercel/`.env`, mai nel database né in git. `notify-lead-email.sql` è superato: non eseguirlo.
- Se cambi un testo nei componenti, cambialo anche nel blocco `statico:inizio/fine` di `index.html`; titolo in DUE posti (`index.html` e `TITLES.home`).
- Non togliere i meta `google-site-verification` e `msvalidate.01`. Nessuna rewrite « prendi-tutto » in `vercel.json`: una rotta nuova vuole un suo `.html`.
- Scala grafica da `theme.js`/`:root` (niente numeri sciolti); lo stile inline batte il CSS; mobile: `100svh`, tocchi 44px, input 16px, scelta dentro la prima schermata.
- Supabase taglia a 1.000 righe: leggere con `tutte()` in `api/_lib/db.js`. Sul modulo anti-spam: campo esca `sito_web` fuori schermo.
- Vanno online solo i contenuti `stato: pubblicato`; mai `clip-path` già applicato su elementi osservati.
- Dopo un push controllare che il sito risponda. Dettagli: `DIARIO.md` › « Dalla vecchia mappa ».

# atleta360-site — landing page atleta-360.com

Landing page pubblica di **atleta-360.com**: raccoglie i contatti di chi vuole
provare la demo di Atleta360 (come atleta o come società sportiva) e li fa
entrare nella demo live della dashboard principale (`Dashboard Atleta360` /
oasi.danilopuglisi.com), popolata con dati finti.

Progetto **single-purpose**: nessuna area riservata, nessun contenuto editoriale —
solo scelta atleta/società → form lead → redirect alla demo.

## Flusso

```
CinematicHero (scelta: Atleta | Società)
   → LeadForm (nome, cognome, email, telefono, società*, ruolo*, consenso privacy)
      → submitLead() salva su Supabase (tabella "leads") + evento Pixel "Lead"
         → redirect a demo.atleta-360.com/?demo=atleta|societa
```

**Ordine delle sezioni (rivisto il 2026-10-10) — non rimescolarlo a caso:**
hero → **DemoPreview** → Pillars → HowItWorks → CaseStudy → AboutFounder → FAQ →
**ClosingCTA** → footer. La prova del prodotto sta per seconda di proposito: prima
era a 3.006px, dopo 3,3 schermate, ed è la cosa che convince chi non è ancora
convinto. La chiusura esiste perché prima le FAQ finivano e cominciava il footer:
chi aveva letto tutto non aveva niente da cliccare.

`*` campi opzionali. La rotta `/contatti` (ContactPage) è la variante per le
campagne: stesso form, senza la home cinematografica.

## Architettura

```
atleta360-site/
├── src/
│   ├── App.jsx                 Router a stati: SetupNotice | Privacy | /contatti | Redirecting |
│   │                            LeadForm | home (hero + sezioni). Gestisce la transizione
│   │                            hero→form (leave() della hero, poi monta il form) e il ritorno
│   │                            (hero con quick=true: niente esplosione, figura subito).
│   │                            Tutto ciò che sta sotto la piega è in lazy(): la hero e i due
│   │                            CTA arrivano prima. Aggiorna document.title per vista.
│   ├── analytics.js            Eventi oltre al Lead (scelta percorso, profondità di scroll),
│   │                            inviati a Vercel Analytics e — solo con consenso — al Pixel.
│   ├── cinematic/
│   │   ├── CinematicStage.jsx  IL PALCO: canvas fixed full-screen, particelle 3D proiettate a
│   │   │                        mano. burst() esplosione → converge() le particelle formano la
│   │   │                        SILHOUETTE della giocatrice del logo (campionata da
│   │   │                        public/silhouette-navy.png) → lock() lampo + figura "viva"
│   │   │                        (respiro, onda di luce, palla che pulsa, parallasse mouse).
│   │   │                        Scorrendo la figura si dissolve verso la camera e si ricompone
│   │   │                        risalendo (legge window.scrollY ogni frame). release() la scioglie
│   │   │                        (usato uscendo verso il form). In dev espone window.__a360Stage
│   │   │                        per pilotare i frame nei test (rAF è sospeso nel pannello headless).
│   │   ├── layout.js           Geometria condivisa palco↔DOM: dove sta la silhouette a schermo.
│   │   │                        Su DESKTOP è una formula, speculare alle classi .a360-hero-* in
│   │   │                        index.css: cambiarle insieme. Su MOBILE no: lì la colonna-figura
│   │   │                        è elastica (si prende l'altezza che avanza), quindi il palco
│   │   │                        MISURA .a360-hero-figure invece di indovinarla — e CinematicStage
│   │   │                        la osserva con un ResizeObserver.
│   │   ├── CinematicHero.jsx   Hero: testo a sinistra, colonna-figura a destra (mobile: logo,
│   │   │                        figura, testo). Timeline GSAP dell'apertura + leave() per l'uscita.
│   │   │                        Rete di sicurezza: dopo 8s i CTA vengono mostrati comunque.
│   │   ├── Pillars.jsx         I tre pilastri affiancati in una fascia sola. Era ScrollStory:
│   │   │                        3 scene a scrub alte 78vh, 2.106px per tre frasi, con riquadri
│   │   │                        vuoti (uno conteneva solo una medaglietta) e la statistica
│   │   │                        inventata "100%". Rimosso tutto.
│   │   ├── ClosingCTA.jsx      Fascia di chiusura prima del footer: le due scelte, di nuovo.
│   │   ├── SiteHeader.jsx      Barra fissa che compare passata la hero (logo, ancore, CTA).
│   │   │                        Resta visibile: nasconderla scorrendo toglieva il CTA a chi legge.
│   │   ├── DemoPreview.jsx     "Cosa vedrai nella demo": dashboard ricostruita come componenti
│   │   │                        nativi (mai screenshot — niente rischio di dati veri delle atlete).
│   │   ├── HowItWorks/CaseStudy/AboutFounder/FAQ/SiteFooter.jsx  sezioni
│   │   ├── reveal.js           useRevealOnScroll: .a360-reveal (risalita+blur) e .a360-w
│   │   │                        (parole dei titoli che salgono dalla loro finestra)
│   │   ├── SplitTitle.jsx      titolo spezzato in parole per il reveal
│   │   ├── smoothScroll.js     Lenis agganciato al ticker GSAP + scrollToTop()
│   │   ├── Magnetic.jsx        wrapper "magnetico" per le card CTA (solo mouse)
│   │   ├── CursorGlow.jsx      alone arancio che segue il puntatore (solo mouse)
│   │   ├── ScrollProgress.jsx  linea arancio di avanzamento in alto
│   │   ├── RadarHero.jsx       radar SVG animato delle 6 competenze
│   │   └── contactsConfig.js   WhatsApp, LinkedIn, Instagram, prenotazioni, email — dati reali
│   │                            presi da danilopuglisi.com (LinkedIn dalla ricerca web: il sito
│   │                            blocca i bot, l'URL è da confermare a occhio)
│   ├── LandingHero.jsx         resta solo per ChoiceCard (la vecchia hero statica non è più usata)
│   ├── LeadForm.jsx            Form + consenso + animateIn (entrata dopo la transizione).
│   │                            ANTI-SPAM: campo esca "sito_web" fuori schermo (non
│   │                            display:none, che molti bot saltano apposta) — se compilato
│   │                            si finge successo senza salvare né avvisare; se il form è
│   │                            inviato in meno di 2,5s il lead si salva ma NON parte la mail.
│   ├── ContactPage.jsx         rotta /contatti per le campagne
│   ├── PrivacyPage.jsx         informativa (titolare e P.IVA inseriti; indirizzo e regione
│   │                            Supabase ancora segnaposto)
│   ├── CookieBanner.jsx + pixel.js  Meta Pixel solo dopo consenso; trackLead() al submit
│   ├── leads.js                submitLead() (insert su Supabase) + demoUrl()
│   ├── supabaseClient.js       getSupabase() importa la libreria SOLO al primo invio del form
│   │                            (~55 KB gz fuori dal caricamento iniziale). NIENTE fallback
│   │                            hardcoded (a differenza della dashboard): se mancano le env var
│   │                            mostra errore chiaro invece di scrivere nel progetto sbagliato
│   └── theme.js                Palette/font — copiati da Dashboard Atleta360/src/theme.js,
│                                tenere sincronizzati manualmente se cambia il brand
├── public/                     loghi ufficiali (logo-icona = favicon, logo-esteso-bianco in hero,
│                                silhouette-navy per il palco), danilo.jpg (ritratto), og-image.jpg
│                                (generata con Pillow da logo+silhouette), logo Oasi Volley,
│                                robots.txt, sitemap.xml
├── api/
│   └── notifica-lead.js        Funzione Vercel: manda a Danilo una mail a ogni richiesta demo
│                                (Resend). Chiamata da leads.js DOPO il salvataggio, best effort:
│                                se fallisce il lead resta comunque salvato. Chiave in
│                                RESEND_API_KEY su Vercel — mai dentro il database.
│                                Difende SOLO la casella (i lead si salvano comunque): scarta
│                                link nei campi nome/società, email malformate, e limita a 5
│                                mail/ora per IP e 40/ora totali. Il conteggio è in memoria
│                                dell'istanza: ferma le raffiche, non è una barriera assoluta.
├── supabase/                   Migrazioni SQL di questo repo (leads.sql, leads-consenso.sql,
│                                demo-seed.sql) — DOPO quelle della dashboard.
│                                notify-lead-email.sql è SUPERATO: non eseguirlo, farebbe
│                                partire una seconda mail per ogni richiesta.
├── scripts/pagine-statiche.mjs Dopo `vite build`: crea dist/contatti.html con titolo, descrizione
│                                e canonical propri (prima /contatti era un doppione della home).
├── public/404.html             404 vera, autonoma (senza React). Prima ogni URL sbagliato
│                                rispondeva 200 con la home: "soft 404" per Google.
├── admin.html + src/admin/    Pannello /admin (pagina separata). api/admin.js · api/evento.js ·
│                                api/opzioni.js · api/hub.js · api/_lib/ (db, sessione, opzioni,
│                                mail, riassunto, riepilogo) — vedi sotto.
└── vercel.json                 cleanUrls + www→apex 308 + niente barra finale. NIENTE rewrite
                                 "prendi-tutto": una rotta nuova va servita da un suo .html.
```

## Pannello /admin (dal 2026-10-11)

`atleta-360.com/admin` — pagina Vite separata (`admin.html` + `src/admin/`), il sito pubblico non
ne carica il codice. Schede: Panoramica (pagine viste, percorso, grafici), Contatti (stato, note,
CSV, cancellazione GDPR), Opzioni, Salute.

- **Tutti i dati passano da `api/admin.js`** con la chiave di servizio (`SUPABASE_SERVICE_ROLE_KEY`,
  solo su Vercel). ⚠️ **Mai policy "authenticated" sulle tabelle del sito**: lo stesso database
  serve la demo, che entra con un account demo autenticato e vedrebbe i contatti veri.
- Accesso: `ADMIN_PASSWORD` su Vercel, cookie firmato (HttpOnly, SameSite=Strict, Path=/api/admin,
  7 giorni), 5 tentativi sbagliati in 15 minuti per IP. Le azioni vogliono anche `X-Admin: 1`.
  La chiave di firma deriva da password + chiave di servizio: cambiare password chiude le sessioni.
- **Contatori anonimi** (`api/evento.js`, tabella `contatori`): solo nome evento da elenco chiuso
  e +1 al giorno, niente IP/cookie → niente consenso. Contati una volta per caricamento (ref).
- **Opzioni** (tabella `impostazioni`, una riga jsonb): avviso mail on/off e destinatario, messaggio
  in evidenza (`src/Avviso.jsx`, la hero ne sottrae l'altezza via `--a360-avviso-h`), modulo in
  pausa, link della demo. Il sito le legge da `api/opzioni.js`: browser `no-store`, CDN 60s.
- **Cron** giornaliero `GET /api/opzioni?sveglia=1` (vercel.json): tiene sveglio Supabase gratuito.
- Migrazione **`supabase/admin.sql`** da eseguire nel progetto del sito (`rdpzkbynpptxryufhfpq`),
  **non** in `atleta360Oasi` (atlete vere). Senza migrazione/chiavi tutto degrada ai predefiniti.
- **Acceso il 2026-10-11**: `SUPABASE_SERVICE_ROLE_KEY` (verificata: service_role del progetto
  del sito) e `ADMIN_PASSWORD` su Vercel, `admin.sql` eseguito. Verificato che con la chiave
  pubblica le tabelle del pannello tornano vuote e contatore/opzioni sono rifiutati (401).
- Prova in locale: server finto + proxy Vite (vedi cronologia 2026-10-11); `vercel dev` non serve.

### Seconda tornata (2026-10-11 sera): correzioni + funzioni + idee

Nate da due revisori (un pignolo e un "inventore"). Da sapere:
- **Supabase taglia a 1.000 righe** ("Max rows") senza dirlo: `limit=5000` non basta. Tutto passa
  da `tutte()` in `api/_lib/db.js` (pagine da 1.000, ordinamento stabile con `id`). I contatori
  si leggono **dal più recente**, ultimi 182 giorni (90 del periodo + 90 del confronto).
- **`supabase/admin-2.sql`** (da eseguire a mano: il progetto del sito NON è nell'account Supabase
  collegato a Claude Code): colonne `sospetto`, `ricontatta_il`, `diario` (jsonb) e soprattutto
  **permessi a colonne** — la chiave pubblica può inserire solo i campi del modulo, più limiti di
  lunghezza. Prima poteva scrivere stato/note/date nel futuro e testi enormi. Tutto funziona anche
  senza: `src/leads.js` riprova l'inserimento senza `sospetto`, il pannello spegne richiami/diario
  e lo dice in Salute ("Protezione e richiami").
- **Sessioni**: il cookie porta una "generazione" (`sessione_gen` nelle impostazioni). "Esci da
  tutti i dispositivi" la fa salire. Le chiavi interne (`sessione_gen`, `ultimo_riepilogo`,
  `allarme_accessi`) non tornano mai al browser e `pulisci()` non le tocca. Le opzioni si
  riscrivono solo se lette davvero (`opzioniDaRiscrivere`), mai sopra i predefiniti.
- Password sbagliate contate anche nel database (`accesso.errato`); oltre 20 al giorno parte
  **una** mail di allarme. Nessun blocco globale: un attaccante chiuderebbe fuori Danilo.
- Mail tutte da `api/_lib/mail.js`. Senza `NOTIFICA_DA` il mittente è quello di prova di Resend,
  che consegna **solo** all'indirizzo dell'account Resend: Salute lo segnala, Opzioni ha la mail di prova.
- **Riepilogo del lunedì**: parte dalla sveglia giornaliera (cron), solo di lunedì e una volta
  (`ultimo_riepilogo` segnato *prima* dell'invio: l'indirizzo della sveglia è pubblico).
- **`api/hub.js`**: bollettino per l'Assistente AI (nomi e numeri, niente email/telefoni), chiuso
  finché non c'è `HUB_CHIAVE` (≥24 caratteri) su Vercel. **Lato hub non è ancora collegato.**
- "Non contare le mie visite": `localStorage.a360_non_contare` letto da `src/analytics.js` e da
  `beforeSend` di Vercel Analytics in `src/main.jsx`. Il primo login da un browser lo accende.
- CSV: telefono come `="…"`, celle che iniziano con `= + - @` disinnescate con l'apostrofo, date
  AAAA-MM-GG HH:MM. Giorni sempre **di calendario a Roma** (`giorniFa` in util.js), non 24 ore.
- ⚠️ **Guasto scoperto il 2026-10-11**: nel database vero mancava `consenso_privacy`
  (`leads-consenso.sql` mai eseguito lì), quindi **dal 27/07 all'11/10/2026 il modulo non ha
  salvato nessuna richiesta**, senza che nessuno lo sapesse. `admin-2.sql` ora aggiunge anche quelle
  colonne. Da qui i due campanelli di `api/_lib/controllo.js`:
  1. **controllo del mattino** (sveglia, max uno all'ora; "Controlla adesso" in Salute): con la
     chiave PUBBLICA (`VITE_SUPABASE_ANON_KEY`, letta anche dal server) prova a inserire un lead
     con `tipo` non valido. Il rifiuto `23514` sul tipo = tutto il resto è a posto. Non resta niente.
  2. **errore visto da un visitatore**: `src/leads.js` conta `form.errore.<colonna|permesso|
     controllo|rete|altro>` (anche dal browser di Danilo); `api/evento.js` manda la mail (una al
     giorno, `allarme_modulo`; mai per "rete"). Compaiono in Timeout, Salute e col "!" sulla scheda.
- **Provenienza** (`src/fonte.js`): `utm_source`/`ref`/`fonte` del link, altrimenti il referrer;
  in memoria, niente storage. Categoria nei contatori (`fonte.*`), categoria + dettaglio nel lead
  (`origine`, `origine_dettaglio` → **`supabase/admin-3.sql`**; senza, `leads.js` riprova senza
  quelle colonne). Pannello: "Da dove arrivano". Informativa aggiornata (sezioni 2 e 8).
- **Vercel Web Analytics è SPENTO** per il progetto (verificato il 2026-10-15: l'API risponde
  "not enabled"): `<Analytics/>` manda dati che nessuno registra. Le visite dal 27/07 non esistono
  da nessuna parte; i contatori del pannello partono dal 13/10.
- **Registro delle visite** (2026-10-15, scheda "Visite"): tabella `visite` (**`supabase/admin-4.sql`**),
  scritta solo da `api/visita.js` (chiave di servizio). `src/visita.js` crea un id casuale in
  memoria all'apertura (niente cookie/storage), manda inizio → aggiornamenti (lettura %, secondi con
  la pagina davanti, azioni da elenco chiuso) → `lead` (il server collega il lead per email arrivata
  negli ultimi 10 minuti). Città/regione/paese dagli header `x-vercel-ip-*`, dispositivo grossolano
  dallo user agent, **IP mai salvato**. Bot scartati per user agent. Righe > 13 mesi cancellate
  dalla sveglia. Informativa § 8 aggiornata. Il browser "non contare" non manda niente.
- Idee dell'inventore fatte: termometro del contatto, "Al servizio" (una persona alla volta),
  Timeout (anomalie con le mosse), bandierine sul grafico (`segni` nelle impostazioni, con
  l'effetto dei 3 giorni dopo), tabellone della settimana, sala trofei, link "cerca la società".
  Scartate per ora: mappa dei campanili (manca la città nel modulo), scheda scout con AI, radar
  del lead, gemello dell'Oasi (dati veri di un altro database, serve il consenso).

## Indicizzazione (revisione del 2026-10-10)

- **Il titolo sta in DUE posti**: `<title>` in index.html e `TITLES.home` in src/App.jsx (che
  lo riscrive dopo il caricamento). Sotto i 60 caratteri e con "pallavolo" dentro: era la
  parola che mancava, stava solo nell'immagine del logo.
- **index.html contiene il testo della pagina** fra `statico:inizio` e `statico:fine`: lo
  vede chi non esegue JavaScript (crawler degli assistenti AI, alcune anteprime). Per chi
  ha JavaScript è nascosto da subito (classe `js` sull'html). **Se cambi un testo nei
  componenti, cambialo anche lì** — deve restare la stessa pagina, non una versione per i
  motori. pagine-statiche.mjs sostituisce quel blocco per /contatti.
- **Titoli spezzati in parole** (hero, SplitTitle): fra le parole servono spazi VERI, non
  margini — con i margini il testo usciva attaccato ("Ladashboardchefacrescere…"). Il
  riflesso di luce sul titolo prende il testo da `data-testo` via `::before`, così l'h1 non
  contiene il titolo due volte.
- **Font serviti dal sito** (@fontsource, importati in main.jsx), non da Google Fonts:
  quella richiesta bloccava la prima pittura ~1s sul telefono.
- Dati strutturati: Organization + Person + WebSite + SoftwareApplication, **senza offerta a
  prezzo 0** (il prodotto non è gratis, la demo sì).
- Sitemap: aggiornare `lastmod` quando cambia il contenuto. Google ignora changefreq/priority.
- **Search Console e Bing Webmaster Tools** (account di Danilo, dal 2026-10-10): proprietà
  `https://atleta-360.com/` verificate con i meta tag `google-site-verification` e
  `msvalidate.01` in index.html — **non toglierli**, la proprietà decadrebbe. Sitemap inviata a
  entrambi. Il DNS sta su **Cloudflare**, non su Vercel: per questo la verifica è a tag e non
  a record DNS. Al 2026-10-10 Google aveva indicizzato solo la home (ultima lettura 22/09,
  prima delle revisioni); `/contatti` era sconosciuta. Chiesta la riscansione di entrambe.
- danilopuglisi.com/sport linka il sito dal 2026-10-10 (pulsante "Prova la demo"): vedi
  `../sito-danilopuglisi/attuale/LEGGIMI.md`.
- Marchio: al 2026-10-10 TMView non mostra nessun "Atleta360" depositato in Italia o UE
  (solo due marchi brasiliani). Esiste però un altro progetto "Atleta360" della Polisportiva
  Riccione (aprile 2026), non registrato.
- **LCP ~4,2s da telefono è il prezzo dell'apertura cinematografica**: il titolo è invisibile
  finché la sequenza non lo rivela a 2,45s. Scelta consapevole; finché il sito non ha
  traffico sufficiente per i dati reali di Chrome (CrUX) non incide sul posizionamento.

## Sistema grafico (revisione del 2026-10-10)

**La scala sta in `src/theme.js` (`T`, `W`, `R`) e, gemella, in `:root` di
`index.css` (`--fs-*`, `--r-*`). Usare quelle, non numeri sciolti.**
Sette corpi (60 / 34 / 24 / 19 / 16 / 14 / 13 / 12,5), tre pesi (400/600/700),
quattro raggi più cerchio e pillola. Prima la pagina ne usava 26 combinazioni —
19 fra 11,5px e 19px — e 9 raggi: differenze da mezzo pixel che non erano
scelte ma sedimentazione, e che si leggono come assenza di sistema.
Se serve una misura nuova, prima chiediti quale di queste stavi cercando.

⚠️ **Lo stile inline batte il CSS.** Dove un corpo deve cambiare col viewport
(es. `.a360-hero-sub`) va dichiarato SOLO nel CSS: metterlo anche inline
disattiva in silenzio le media query.

**Tre trattamenti di sezione**, perché 6.178px di blu uguale non davano peso a
niente: `.a360-banda-soffusa` (bianco al 3,5%), `.a360-banda-chiara` (#F6F7FB
opaco, oggi solo le FAQ — l'unica sezione chiara della pagina) e
`.a360-chiusura` (navy pieno del brand). Il resto resta trasparente sul palco.

## Regole del mobile (revisione del 2026-10-10)

Vincoli da non rompere, verificati a 375×812 e 375×667:

- **La scelta atleta/società sta dentro la prima schermata.** Logo, titolo, testo e card hanno
  altezza propria; `.a360-hero-figure` si prende il resto (`flex: 1`, da 72px a 32vh). Serve il
  `max-height` su `.a360-hero-inner`: senza, la colonna cresce e la figura non si stringe mai.
- **`100svh`, mai solo `100vh`**: i browser mobili misurano `vh` a barre nascoste, quindi con
  `100vh` la hero esce dallo schermo.
- **44px minimi** per ogni cosa che si tocca (link del footer, icone social, CTA della barra).
- **`.a360-input` a 16px sul telefono**, altrimenti Safari su iPhone ingrandisce la pagina al
  tocco. La regola sta in fondo a index.css: `.a360-input` è definita tardi e a parità di
  specificità vincerebbe lei.
- **Il tasto WhatsApp compare solo dopo la hero** (stessa soglia della barra in alto): sulla hero
  si sedeva sopra la card "Sono una società sportiva".
- **L'avviso cookie riserva spazio** (`body.a360-con-cookie`): copriva consenso e tasto di invio.

Tutte le animazioni rispettano `prefers-reduced-motion` (stato finale statico).
Test in anteprima: il pannello Browser non compone i frame (rAF sospeso) — si
verifica campionando i pixel del canvas e pilotando `window.__a360Stage.frame`.

## Stack

React 18 + Vite 5, `@supabase/supabase-js`, `lucide-react`, `gsap` (+ScrollTrigger),
`lenis` (scroll fluido), `@vercel/analytics`. Nessun router (state locale in `App.jsx`
+ lettura di `location.pathname` per `/contatti`).

## Brand

Navy `#0A1650`/`#17297A` (gradiente), arancio `#FF7A18` (CTA), font Inter (testo) +
Space Grotesk (titoli/display). Stessa identità di Atleta360, ma **palette diversa**
dal Caterino ecosystem (che usa navy `#020C68` + giallo `#FFBA00`) — Atleta360 è un
brand a sé stante sotto l'ombrello di Danilo, non fa parte della famiglia Caterino.

## Supabase — importante

Progetto Supabase **separato** da quello di produzione della dashboard Oasi: niente
dati reali qui. Setup one-tantum richiede di eseguire PRIMA tutte le migrazioni della
dashboard (`Dashboard Atleta360/supabase/`) e SOLO DOPO quelle di questo repo, in ordine
(vedi README.md per la sequenza esatta — non modificare l'ordine).

## Deploy

Vercel, stesso account di oasi.danilopuglisi.com. `git push` su `main` ripubblica
in automatico. Env var richieste: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; per il pannello
`SUPABASE_SERVICE_ROLE_KEY` e `ADMIN_PASSWORD`.
Per l'avviso via mail dei lead serve anche `RESEND_API_KEY` (facoltative:
`NOTIFICA_A` destinatario, `NOTIFICA_DA` mittente). Senza la chiave il sito
funziona identico, semplicemente non parte la mail.

## Demo target

Dopo l'invio del form, il visitatore va su `demo.atleta-360.com/?demo=atleta` (o
`?demo=societa`) — un secondo deploy Vercel del repo `Dashboard Atleta360`, puntato
sullo stesso progetto Supabase, che riconosce `?demo=` e fa login automatico con un
account demo fisso (vedi `src/demoMode.js` in quel repo).

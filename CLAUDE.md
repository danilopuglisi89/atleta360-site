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
│   │   │                        Speculare alle classi .a360-hero-* in index.css: cambiarle insieme.
│   │   ├── CinematicHero.jsx   Hero: testo a sinistra, colonna-figura a destra (mobile: logo,
│   │   │                        figura, testo). Timeline GSAP dell'apertura + leave() per l'uscita.
│   │   │                        Rete di sicurezza: dopo 8s i CTA vengono mostrati comunque.
│   │   ├── ScrollStory.jsx     3 scene a scrub (profondità+blur), radar nella prima, parallasse.
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
└── vercel.json                 rewrite SPA che esclude /api (serve /contatti e le funzioni)
```

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
in automatico. Env var richieste: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Per l'avviso via mail dei lead serve anche `RESEND_API_KEY` (facoltative:
`NOTIFICA_A` destinatario, `NOTIFICA_DA` mittente). Senza la chiave il sito
funziona identico, semplicemente non parte la mail.

## Demo target

Dopo l'invio del form, il visitatore va su `demo.atleta-360.com/?demo=atleta` (o
`?demo=societa`) — un secondo deploy Vercel del repo `Dashboard Atleta360`, puntato
sullo stesso progetto Supabase, che riconosce `?demo=` e fa login automatico con un
account demo fisso (vedi `src/demoMode.js` in quel repo).

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
│   │   ├── HowItWorks/CaseStudy/AboutFounder/FAQ/SiteFooter.jsx  sezioni
│   │   ├── reveal.js           useRevealOnScroll: .a360-reveal (risalita+blur) e .a360-w
│   │   │                        (parole dei titoli che salgono dalla loro finestra)
│   │   ├── SplitTitle.jsx      titolo spezzato in parole per il reveal
│   │   ├── smoothScroll.js     Lenis agganciato al ticker GSAP + scrollToTop()
│   │   ├── Magnetic.jsx        wrapper "magnetico" per le card CTA (solo mouse)
│   │   ├── CursorGlow.jsx      alone arancio che segue il puntatore (solo mouse)
│   │   ├── ScrollProgress.jsx  linea arancio di avanzamento in alto
│   │   ├── RadarHero.jsx       radar SVG animato delle 6 competenze
│   │   └── contactsConfig.js   WhatsApp/LinkedIn/Instagram/booking — alcuni ancora segnaposto
│   ├── LandingHero.jsx         resta solo per ChoiceCard (la vecchia hero statica non è più usata)
│   ├── LeadForm.jsx            Form + consenso + animateIn (entrata dopo la transizione)
│   ├── ContactPage.jsx         rotta /contatti per le campagne
│   ├── PrivacyPage.jsx         informativa (titolare e P.IVA inseriti; indirizzo e regione
│   │                            Supabase ancora segnaposto)
│   ├── CookieBanner.jsx + pixel.js  Meta Pixel solo dopo consenso; trackLead() al submit
│   ├── leads.js                submitLead() (insert su Supabase) + demoUrl()
│   ├── supabaseClient.js       Client Supabase — NIENTE fallback hardcoded (a differenza
│   │                            della dashboard): se mancano le env var mostra errore chiaro
│   │                            invece di scrivere lead nel progetto Supabase sbagliato
│   └── theme.js                Palette/font — copiati da Dashboard Atleta360/src/theme.js,
│                                tenere sincronizzati manualmente se cambia il brand
├── public/                     loghi ufficiali (logo-icona = favicon, logo-esteso-bianco in hero,
│                                silhouette-navy per il palco), og-image.jpg, logo Oasi Volley
├── supabase/                   Migrazioni SQL di questo repo (leads.sql, leads-consenso.sql,
│                                notify-lead-email.sql, demo-seed.sql) — DOPO quelle della dashboard
└── vercel.json                 rewrite SPA (serve /contatti)
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

## Demo target

Dopo l'invio del form, il visitatore va su `demo.atleta-360.com/?demo=atleta` (o
`?demo=societa`) — un secondo deploy Vercel del repo `Dashboard Atleta360`, puntato
sullo stesso progetto Supabase, che riconosce `?demo=` e fa login automatico con un
account demo fisso (vedi `src/demoMode.js` in quel repo).

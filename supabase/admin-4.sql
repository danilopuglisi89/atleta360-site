-- ============================================================
-- Atleta360 — quarta migrazione (2026-10-15): il registro delle visite.
-- Da eseguire nel progetto del sito (rdpzkbynpptxryufhfpq). Sicuro da ri-eseguire.
--
-- Una riga per pagina aperta: quando, da dove, città approssimativa (la
-- ricava Vercel), telefono o computer, fin dove ha letto, cosa ha fatto.
-- NIENTE indirizzo IP, niente cookie: l'id è casuale e vive solo finché la
-- pagina è aperta, quindi due visite della stessa persona non si collegano.
-- Scrive solo il server (chiave di servizio): nessuna policy per anon o
-- authenticated. Le righe più vecchie di 13 mesi le cancella la sveglia.
-- ============================================================

create table if not exists public.visite (
  id              uuid primary key,
  inizio          timestamptz not null default now(),
  ultimo          timestamptz not null default now(),
  pagina          text not null,
  fonte           text,
  fonte_dettaglio text,
  citta           text,
  regione         text,
  paese           text,
  dispositivo     text,
  sistema         text,
  browser         text,
  profondita      smallint not null default 0,
  secondi         integer not null default 0,
  azioni          jsonb not null default '[]'::jsonb,
  lead_id         uuid references public.leads(id) on delete set null
);
alter table public.visite enable row level security;
create index if not exists visite_inizio on public.visite (inizio desc);

-- controllo: deve uscire una riga con "visite"
select table_name from information_schema.tables where table_schema = 'public' and table_name = 'visite';

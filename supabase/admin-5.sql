-- ============================================================
-- Atleta360 — quinta migrazione (2026-10-15): iscrizioni ai webinar.
-- Da eseguire nel progetto del sito (rdpzkbynpptxryufhfpq). Sicuro da ri-eseguire.
-- Scrive solo il server (api/iscrizione.js, chiave di servizio): nessuna
-- policy per anon o authenticated.
-- ============================================================

create table if not exists public.iscrizioni (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  evento               text not null,            -- es. "2026-12-03", oppure "prossimo"
  nome                 text not null,
  cognome              text not null,
  email                text not null,
  telefono             text,
  societa              text,
  ruolo                text,
  consenso_privacy     boolean not null default false,
  consenso_marketing   boolean not null default false,  -- "voglio ricevere novità su Atleta360"
  consenso_data        timestamptz,
  informativa_versione text,
  origine              text,
  origine_dettaglio    text,
  sospetto             boolean not null default false,
  presente             boolean,                         -- da segnare dopo il webinar
  note                 text,
  unique (evento, email)
);
alter table public.iscrizioni enable row level security;

-- controllo: deve uscire una riga con "iscrizioni"
select table_name from information_schema.tables where table_schema = 'public' and table_name = 'iscrizioni';

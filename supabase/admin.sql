-- ============================================================
-- Atleta360 — pannello /admin: stato dei lead, contatori anonimi, opzioni.
-- Da eseguire DOPO leads.sql e leads-consenso.sql, nello stesso progetto
-- Supabase del sito (NON in "atleta360Oasi", quello delle atlete vere).
-- Incolla tutto nel SQL Editor e premi Run. È sicuro da ri-eseguire.
--
-- Chi legge e scrive queste tabelle: SOLO le funzioni del sito su Vercel,
-- con la chiave di servizio. Nessuna policy per anon/authenticated: lo
-- stesso database serve anche la demo, che entra con un account demo
-- autenticato — una policy "authenticated" le mostrerebbe i contatti veri.
-- ============================================================

-- 1. Lead: stato commerciale e note di Danilo
alter table public.leads
  add column if not exists stato text not null default 'nuovo',
  add column if not exists note text,
  add column if not exists aggiornato_il timestamptz;

alter table public.leads drop constraint if exists leads_stato_check;
alter table public.leads add constraint leads_stato_check
  check (stato in ('nuovo', 'contattato', 'cliente', 'perso'));

-- 2. Contatori anonimi per giorno: solo "quante volte", mai "chi".
--    Niente IP, niente cookie, niente identificativi: un numero per evento.
create table if not exists public.contatori (
  giorno    date not null,
  evento    text not null,
  conteggio integer not null default 0,
  primary key (giorno, evento)
);
alter table public.contatori enable row level security;

create or replace function public.incrementa_contatore(p_evento text)
returns void
language sql
set search_path = public
as $$
  insert into public.contatori (giorno, evento, conteggio)
  values ((now() at time zone 'Europe/Rome')::date, p_evento, 1)
  on conflict (giorno, evento)
  do update set conteggio = public.contatori.conteggio + 1;
$$;

-- le funzioni in public sono eseguibili da chiunque per impostazione
-- predefinita: questa no, solo dal server
revoke execute on function public.incrementa_contatore(text) from public, anon, authenticated;
grant execute on function public.incrementa_contatore(text) to service_role;

-- 3. Opzioni del sito: una riga sola, modificata dal pannello
create table if not exists public.impostazioni (
  id            integer primary key default 1 check (id = 1),
  valori        jsonb not null default '{}'::jsonb,
  aggiornato_il timestamptz not null default now()
);
alter table public.impostazioni enable row level security;
insert into public.impostazioni (id) values (1) on conflict (id) do nothing;

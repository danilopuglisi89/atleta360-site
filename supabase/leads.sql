-- ============================================================
-- Atleta360.it — tabella dei lead raccolti dal form della landing page.
-- Incolla TUTTO nel SQL Editor di Supabase (progetto dedicato ad atleta360.it)
-- e premi Run. È sicuro da ri-eseguire.
-- ============================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('atleta', 'societa')),
  nome        text not null,
  cognome     text not null,
  email       text not null,
  telefono    text not null,
  societa     text,
  ruolo       text,
  created_at  timestamptz not null default now()
);

alter table public.leads enable row level security;

-- I visitatori anonimi possono solo INSERIRE (mai leggere/modificare/cancellare).
drop policy if exists "leads insert public" on public.leads;
create policy "leads insert public" on public.leads
  for insert
  to anon
  with check (true);

-- Nessuna policy di select/update/delete: default-deny per tutti (anon e authenticated).
-- I lead si consultano dal Table Editor di Supabase (o con la service role key).

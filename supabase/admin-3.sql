-- ============================================================
-- Atleta360 — terza migrazione (2026-10-11): da dove arriva ogni contatto.
-- Da eseguire DOPO admin-2.sql, nel progetto del sito (rdpzkbynpptxryufhfpq).
-- Sicuro da ri-eseguire. Senza, il modulo salva lo stesso (senza provenienza).
-- ============================================================

alter table public.leads
  add column if not exists origine text,             -- instagram, google, diretto…
  add column if not exists origine_dettaglio text;   -- utm_source / medium / campaign, o il sito

-- il modulo pubblico può scriverle (si aggiungono ai permessi di admin-2.sql)
grant insert (origine, origine_dettaglio) on public.leads to anon;

alter table public.leads drop constraint if exists leads_lunghezze_origine;
alter table public.leads add constraint leads_lunghezze_origine check (
  char_length(coalesce(origine, '')) <= 30
  and char_length(coalesce(origine_dettaglio, '')) <= 200
) not valid;

-- controllo: le ultime due righe devono essere origine e origine_dettaglio
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'leads' order by ordinal_position;

-- ============================================================
-- Atleta360.it — tracciamento del consenso privacy sui lead.
-- Da eseguire DOPO leads.sql, nello stesso progetto Supabase.
-- Sicuro da ri-eseguire.
-- ============================================================

alter table public.leads
  add column if not exists consenso_privacy boolean not null default false,
  add column if not exists consenso_data timestamptz,
  add column if not exists informativa_versione text;

comment on column public.leads.consenso_privacy is 'Checkbox di consenso accettata dall''utente prima dell''invio (obbligatoria lato form).';
comment on column public.leads.consenso_data is 'Timestamp del consenso, per poterlo dimostrare (GDPR art. 7).';
comment on column public.leads.informativa_versione is 'Versione del testo informativa accettata (es. "v1"), utile se in futuro cambia.';

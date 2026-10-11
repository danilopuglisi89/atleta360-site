-- ============================================================
-- Atleta360 — pannello /admin, seconda migrazione (2026-10-11).
-- Da eseguire DOPO admin.sql, nello stesso progetto Supabase del sito
-- (rdpzkbynpptxryufhfpq — NON "atleta360Oasi", quello delle atlete vere).
-- Incolla tutto nel SQL Editor e premi Run. È sicuro da ri-eseguire.
--
-- Il sito e il pannello funzionano anche PRIMA di questa migrazione: le
-- funzioni nuove (richiami, diario, lead sospetti) si accendono dopo.
-- ============================================================

-- 0. Colonne che dovevano già esserci. Il 2026-10-11 è emerso che nel database
--    vero mancava consenso_privacy: leads-consenso.sql non era mai stato
--    eseguito lì, e il modulo (che manda quelle colonne) non salvava nulla.
alter table public.leads
  add column if not exists consenso_privacy boolean not null default false,
  add column if not exists consenso_data timestamptz,
  add column if not exists informativa_versione text,
  add column if not exists stato text not null default 'nuovo',
  add column if not exists note text,
  add column if not exists aggiornato_il timestamptz;

-- 1. Colonne nuove: lead sospetti, data del richiamo, diario dei contatti
alter table public.leads
  add column if not exists sospetto boolean not null default false,
  add column if not exists ricontatta_il date,
  add column if not exists diario jsonb not null default '[]'::jsonb;

-- 2. Il pubblico può inserire SOLO i campi del modulo.
--    Prima la chiave pubblica poteva scrivere anche stato, note, data di
--    arrivo nel futuro e testi di qualsiasi lunghezza. Ora stato/note/date
--    prendono i valori predefiniti e non si possono falsificare.
revoke all on public.leads from anon, authenticated;
grant insert (tipo, nome, cognome, email, telefono, societa, ruolo,
              consenso_privacy, consenso_data, informativa_versione, sospetto)
  on public.leads to anon;

-- 3. Lunghezze massime: un testo da 1 MB bloccherebbe il pannello.
--    "not valid" = vale per i nuovi inserimenti, non ricontrolla i vecchi.
alter table public.leads drop constraint if exists leads_lunghezze;
alter table public.leads add constraint leads_lunghezze check (
  char_length(nome) <= 100 and char_length(cognome) <= 100
  and char_length(email) <= 254 and char_length(telefono) <= 40
  and char_length(coalesce(societa, '')) <= 200
  and char_length(coalesce(ruolo, '')) <= 120
  and char_length(coalesce(informativa_versione, '')) <= 20
  and char_length(coalesce(note, '')) <= 4000
) not valid;


-- 4. Controllo: l'elenco delle colonne (deve comparire anche consenso_privacy)
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'leads' order by ordinal_position;

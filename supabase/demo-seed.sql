-- ============================================================
-- Atleta360.it — dati finti per la demo pubblica.
-- Da eseguire SOLO nel nuovo progetto Supabase dedicato ad atleta-360.com,
-- DOPO aver incollato (in ordine) tutte le migrazioni della dashboard:
--   schema.sql -> data-model.sql -> profile-fields.sql -> mister-permission.sql
--   -> chat.sql -> chat-v2.sql -> athlete-card.sql -> chat-reactions.sql -> admin-delete.sql
-- (le trovi nel repo "atleta360" / Dashboard Atleta360, cartella supabase/)
--
-- PASSO MANUALE OBBLIGATORIO PRIMA DI QUESTO SCRIPT:
--   Supabase -> Authentication -> Add user -> crea questi due utenti con
--   "Auto Confirm User" spuntato (così non serve email di conferma):
--     - demo.atleta@atleta-360.com   / password: Atleta360!
--     - demo.societa@atleta-360.com / password: Atleta360!
--   (password diversa? aggiornala anche in demoMode.js nel repo Dashboard Atleta360)
--   Il trigger handle_new_user() creerà da solo una riga 'pending' in profiles
--   per ciascuno: questo script la promuove ad approvata.
-- ============================================================

update public.profiles set
  first_name = 'Demo', last_name = 'Atleta', role = 'athlete', category = 'atleta',
  status = 'approved', athlete_id = 'Demo Atleta'
where email = 'demo.atleta@atleta-360.com';

update public.profiles set
  first_name = 'Demo', last_name = 'Società', role = 'admin', category = 'direzione',
  status = 'approved'
where email = 'demo.societa@atleta-360.com';

-- Roster fittizio (include "Demo Atleta", che deve combaciare con l'athlete_id sopra).
insert into public.athletes (identifier, position) values
  ('Demo Atleta', 'Schiacciatrice'),
  ('Giulia R.', 'Palleggiatrice'),
  ('Sara M.', 'Libero'),
  ('Elena T.', 'Centrale')
on conflict (identifier) do nothing;

-- Rilevamenti fittizi (stessi 6 focus già seminati da data-model.sql), per
-- avere grafici popolati fin da subito nella demo.
insert into public.assessments (athlete_id, scores, created_at)
select a.id, s.scores, s.ts from (values
  ('Demo Atleta', '{"reset":8,"focus":7,"body":8,"comunicazione":7,"coachability":8,"tattica":7}'::jsonb, now() - interval '30 days'),
  ('Demo Atleta', '{"reset":8,"focus":8,"body":9,"comunicazione":8,"coachability":8,"tattica":8}'::jsonb, now() - interval '7 days'),
  ('Giulia R.',   '{"reset":6,"focus":9,"body":7,"comunicazione":9,"coachability":7,"tattica":8}'::jsonb, now() - interval '14 days'),
  ('Sara M.',     '{"reset":7,"focus":7,"body":8,"comunicazione":6,"coachability":9,"tattica":6}'::jsonb, now() - interval '10 days'),
  ('Elena T.',    '{"reset":9,"focus":6,"body":7,"comunicazione":7,"coachability":7,"tattica":9}'::jsonb, now() - interval '5 days')
) as s(identifier, scores, ts)
join public.athletes a on a.identifier = s.identifier
where not exists (
  select 1 from public.assessments x where x.athlete_id = a.id and x.created_at = s.ts
);

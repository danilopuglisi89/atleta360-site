-- ============================================================
-- Atleta360.it — Email di notifica a ogni nuovo lead dalla landing page.
-- Trigger sul database: a ogni nuova riga in public.leads invia una
-- email via Resend usando l'estensione pg_net (chiamate HTTP dal database).
-- Stesso pattern di supabase/notify-email.sql nel repo Dashboard Atleta360.
--
-- COME USARE:
--   1. Esegui prima supabase/leads.sql in questo progetto (se non l'hai già fatto).
--   2. Sostituisci re_INCOLLA_LA_TUA_CHIAVE_RESEND con la tua API key di Resend
--      (puoi riusare la stessa già usata per la dashboard di Oasi, o generarne una nuova).
--   3. Incolla tutto nel SQL Editor di Supabase e premi Run.
--
-- Nota: il mittente resta onboarding@resend.dev e il destinatario è la tua
-- email, quindi non serve verificare nessun dominio su Resend.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name text := trim(coalesce(new.nome, '') || ' ' || coalesce(new.cognome, ''));
  tipo_label text := case new.tipo when 'atleta' then 'Atleta' else 'Società sportiva' end;
begin
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer re_INCOLLA_LA_TUA_CHIAVE_RESEND',
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', 'Atleta360 <onboarding@resend.dev>',
      'to', jsonb_build_array('info@danilopuglisi.com'),
      'subject', 'Nuovo lead atleta-360.com: ' || coalesce(full_name, '(senza nome)') || ' (' || tipo_label || ')',
      'html',
        '<div style="font-family:Arial,sans-serif;color:#0C1330">' ||
        '<h2 style="color:#0A1650">Nuova richiesta demo — Atleta360</h2>' ||
        '<p><strong>' || coalesce(full_name, '(senza nome)') || '</strong> ' ||
        '<span style="color:#B4520A">(' || tipo_label || ')</span></p>' ||
        '<p>Email: ' || coalesce(new.email, '') || '<br>Telefono: ' || coalesce(new.telefono, '') || '</p>' ||
        coalesce('<p>Società: ' || new.societa || '</p>', '') ||
        coalesce('<p>Ruolo: ' || new.ruolo || '</p>', '') ||
        '</div>'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_new_lead_notify on public.leads;
create trigger on_new_lead_notify
  after insert on public.leads
  for each row execute function public.notify_new_lead();

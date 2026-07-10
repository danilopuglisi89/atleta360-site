# Atleta360 — landing page (atleta-360.com)

Landing page pubblica di [atleta-360.com](https://atleta-360.com): raccoglie i contatti di chi
vuole provare la demo (atleta o società sportiva) e li fa entrare nella demo live della
dashboard [Atleta360](https://oasi.danilopuglisi.com), popolata con dati finti.

## Setup locale

1. `npm install`
2. Copia `.env.example` in `.env` e incolla URL + anon key del progetto Supabase
   dedicato ad atleta-360.com (vedi sotto).
3. `npm run dev`

## Setup del progetto Supabase (una tantum)

Questo sito usa un progetto Supabase **separato** da quello di produzione della dashboard
Oasi — niente dati reali qui dentro.

1. Crea un nuovo progetto su [supabase.com](https://supabase.com).
2. **Project Settings → API**: copia **Project URL** e la chiave **anon public**, mettile
   in `.env` (locale) e nelle Environment Variables del progetto Vercel di questo sito.
3. Nello **SQL Editor**, incolla ed esegui **in ordine** le migrazioni della dashboard
   (dal repo `Dashboard Atleta360`, cartella `supabase/`): `schema.sql` → `data-model.sql`
   → `profile-fields.sql` → `mister-permission.sql` → `chat.sql` → `chat-v2.sql` →
   `athlete-card.sql` (richiede chat.sql + chat-v2.sql già eseguiti) → `chat-reactions.sql`
   → `admin-delete.sql`.
4. Poi esegui, sempre in ordine, i file di questo repo: `supabase/leads.sql` →
   `supabase/notify-lead-email.sql` (sostituendo la chiave Resend) → `supabase/demo-seed.sql`
   (segui le istruzioni in testa al file: prima crei i 2 utenti demo da Authentication →
   Add user, poi esegui lo script).

## Deploy

Vercel, stesso account già usato per oasi.danilopuglisi.com. `git push` su `main`
ripubblica in automatico. Env var richieste: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Demo

Dopo l'invio del form, il visitatore viene mandato su `demo.atleta-360.com/?demo=atleta`
(o `?demo=societa`) — un secondo deploy Vercel del repo `Dashboard Atleta360`, puntato
su questo stesso progetto Supabase, che riconosce il parametro `?demo=` e fa login
automatico con un account demo fisso (vedi `src/demoMode.js` in quel repo).

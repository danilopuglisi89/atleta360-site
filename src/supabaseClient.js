/*
 * Configurazione Supabase del sito atleta-360.com (progetto dedicato, separato
 * da quello di produzione della dashboard Oasi). A differenza della dashboard,
 * qui NON c'è un fallback hardcoded: se le variabili d'ambiente mancano,
 * meglio mostrare un errore chiaro che scrivere lead nel progetto sbagliato.
 *
 * La libreria viene importata solo al primo invio del form: pesa ~55 KB
 * compressi e serve unicamente lì, non deve rallentare la prima schermata.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

let client = null;

export async function getSupabase() {
  if (!supabaseConfigured) return null;
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(url, anon);
  }
  return client;
}

import { createClient } from "@supabase/supabase-js";

/*
 * Configurazione Supabase del sito atleta360.it (progetto dedicato, separato
 * da quello di produzione della dashboard Oasi). A differenza della dashboard,
 * qui NON c'è un fallback hardcoded: se le variabili d'ambiente mancano,
 * meglio mostrare un errore chiaro che scrivere lead nel progetto sbagliato.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

export const supabase = supabaseConfigured ? createClient(url, anon) : null;

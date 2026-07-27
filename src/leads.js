import { supabase } from "./supabaseClient";

export const PRIVACY_VERSION = "v1";

export async function submitLead({ tipo, nome, cognome, email, telefono, societa, ruolo, consenso }) {
  const { error } = await supabase.from("leads").insert({
    tipo,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    societa: societa?.trim() || null,
    ruolo: ruolo?.trim() || null,
    consenso_privacy: !!consenso,
    consenso_data: consenso ? new Date().toISOString() : null,
    informativa_versione: consenso ? PRIVACY_VERSION : null,
  });
  return error;
}

export function demoUrl(tipo) {
  return `https://demo.atleta-360.com/?demo=${tipo === "atleta" ? "atleta" : "societa"}`;
}

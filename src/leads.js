import { supabase } from "./supabaseClient";

export async function submitLead({ tipo, nome, cognome, email, telefono, societa, ruolo }) {
  const { error } = await supabase.from("leads").insert({
    tipo,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    societa: societa?.trim() || null,
    ruolo: ruolo?.trim() || null,
  });
  return error;
}

export function demoUrl(tipo) {
  return `https://demo.atleta360.it/?demo=${tipo === "atleta" ? "atleta" : "societa"}`;
}

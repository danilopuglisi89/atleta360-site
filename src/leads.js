import { getSupabase } from "./supabaseClient";

export const PRIVACY_VERSION = "v1";

/* Avviso via mail a Danilo. È volutamente "best effort": il lead è già
   salvato, quindi un problema qui non deve mai bloccare chi ha compilato.
   Il tempo massimo evita che una risposta lenta ritardi l'ingresso in demo. */
async function avvisaPerMail(dati) {
  try {
    const stop = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => stop?.abort(), 2500);
    await fetch("/api/notifica-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dati),
      signal: stop?.signal,
      keepalive: true,
    });
    clearTimeout(timer);
  } catch {
    // in locale l'endpoint non esiste, e in produzione un errore qui non
    // deve avere conseguenze per chi sta entrando nella demo
  }
}

export async function submitLead({ tipo, nome, cognome, email, telefono, societa, ruolo, consenso, troppoVeloce }) {
  const supabase = await getSupabase();
  if (!supabase) return new Error("Supabase non configurato");
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
  if (error) return error;

  // compilazione sospetta: il contatto resta salvato, ma non fa suonare la
  // casella — si controlla con calma dal database
  if (troppoVeloce) return null;

  // il lead è al sicuro nel database: adesso l'avviso, che può anche fallire
  await avvisaPerMail({
    tipo,
    nome: nome.trim(),
    cognome: cognome.trim(),
    email: email.trim(),
    telefono: telefono.trim(),
    societa: societa?.trim() || "",
    ruolo: ruolo?.trim() || "",
  });
  return null;
}

export function demoUrl(tipo) {
  return `https://demo.atleta-360.com/?demo=${tipo === "atleta" ? "atleta" : "societa"}`;
}

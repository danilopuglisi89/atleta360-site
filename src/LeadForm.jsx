import { useState } from "react";
import { ArrowLeft, AlertCircle, User, Building2 } from "lucide-react";
import { C, font, display } from "./theme";
import { submitLead } from "./leads";

const inputStyle = {
  ...font, fontSize: 14, color: C.ink, background: "#fff",
  border: `1px solid ${C.grid}`, borderRadius: 10, padding: "11px 13px",
  outline: "none", width: "100%", boxSizing: "border-box",
};
const labelStyle = { ...font, fontSize: 12.5, color: C.muted, fontWeight: 500, marginBottom: 6, display: "block" };

function Field({ label, optional, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}{!optional && <span style={{ color: C.orange }}> *</span>}</label>
      <input {...props} style={inputStyle} />
    </div>
  );
}

const primaryBtn = {
  ...font, width: "100%", marginTop: 8, padding: "12px 16px", borderRadius: 11, border: "none",
  background: C.orange, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
};

const linkBtn = {
  ...font, background: "none", border: "none", padding: 0, cursor: "pointer",
  color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500,
  display: "inline-flex", alignItems: "center", gap: 6,
};

export default function LeadForm({ tipo, onBack, onSuccess, onOpenPrivacy }) {
  const [form, setForm] = useState({ nome: "", cognome: "", email: "", telefono: "", societa: "", ruolo: "" });
  const [consenso, setConsenso] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!consenso) { setError("Devi accettare l'informativa privacy per continuare."); return; }
    setBusy(true);
    const err = await submitLead({ tipo, ...form, consenso });
    setBusy(false);
    if (err) { setError("Non siamo riusciti a inviare i dati. Riprova tra poco."); return; }
    onSuccess(tipo);
  };

  const Icon = tipo === "atleta" ? User : Building2;
  const tipoLabel = tipo === "atleta" ? "Atleta" : "Società sportiva";

  return (
    <div style={{
      ...font, position: "relative", zIndex: 2, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <button onClick={onBack} style={{ ...linkBtn, marginBottom: 18 }}>
          <ArrowLeft size={15} /> Indietro
        </button>

        <div style={{ background: C.card, borderRadius: 18, padding: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.28)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: C.orangeSoft,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={18} color={C.orange} />
            </div>
            <div style={{ ...display, fontSize: 17, fontWeight: 700, color: C.ink }}>{tipoLabel}</div>
          </div>
          <p style={{ ...font, fontSize: 13, color: C.muted, marginTop: 6, marginBottom: 20, lineHeight: 1.5 }}>
            Lascia i tuoi dati e avvia subito la demo di Atleta360.
          </p>

          <form onSubmit={submit}>
            <Field label="Nome" value={form.nome} onChange={upd("nome")} autoComplete="given-name" required />
            <Field label="Cognome" value={form.cognome} onChange={upd("cognome")} autoComplete="family-name" required />
            <Field label="Email" type="email" value={form.email} onChange={upd("email")} autoComplete="email" required />
            <Field label="Numero di telefono" type="tel" value={form.telefono} onChange={upd("telefono")} autoComplete="tel" required />
            <Field label="Società sportiva" optional value={form.societa} onChange={upd("societa")} autoComplete="organization" />
            <Field label="Ruolo" optional value={form.ruolo} onChange={upd("ruolo")} placeholder="es. allenatore, dirigente, atleta…" />

            <label style={{
              ...font, display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5,
              color: C.muted, lineHeight: 1.5, marginTop: 4, marginBottom: 16, cursor: "pointer",
            }}>
              <input
                type="checkbox"
                checked={consenso}
                onChange={(e) => setConsenso(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, accentColor: C.orange }}
              />
              <span>
                Ho letto e accetto l'
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  style={{ ...font, background: "none", border: "none", padding: 0, color: C.orange, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  informativa sulla privacy
                </button>
                {" "}e acconsento al trattamento dei miei dati per essere ricontattato in merito ad Atleta360.
                <span style={{ color: C.orange }}> *</span>
              </span>
            </label>

            {error && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FDECEC", color: "#B4232A",
                borderRadius: 10, padding: "10px 12px", ...font, fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.7 : 1, cursor: busy ? "default" : "pointer" }}>
              {busy ? "Attendi…" : "Avvia la demo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

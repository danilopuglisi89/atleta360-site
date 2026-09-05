import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowLeft, AlertCircle, User, Building2, ShieldCheck } from "lucide-react";
import { C, font, display } from "./theme";
import { submitLead } from "./leads";

function Field({ label, optional, hint, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="a360-label">
        {label}
        {optional
          ? <span className="a360-label-opt"> (facoltativo)</span>
          : <span style={{ color: C.orange }}> *</span>}
      </label>
      <input {...props} className="a360-input" />
      {hint && <div className="a360-hint">{hint}</div>}
    </div>
  );
}

export default function LeadForm({ tipo, onBack, onSuccess, onOpenPrivacy, compact = false, animateIn = false, hideTitle = false }) {
  const [form, setForm] = useState({ nome: "", cognome: "", email: "", telefono: "", societa: "", ruolo: "" });
  const [consenso, setConsenso] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const cardRef = useRef(null);

  /* Entrata cinematica (dopo l'uscita della hero): la card sale dal fondo e
     si mette a fuoco. */
  useEffect(() => {
    if (!animateIn || !cardRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = cardRef.current;
    const tw = gsap.fromTo(el,
      { opacity: 0, y: 48, scale: 0.96, filter: "blur(12px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out", clearProps: "filter" });
    // rete di sicurezza: il form deve comparire anche se le animazioni sono sospese
    const safety = setTimeout(() => { if (tw.progress() < 1) gsap.set(el, { opacity: 1, y: 0, scale: 1, clearProps: "filter" }); }, 1500);
    return () => { clearTimeout(safety); tw.kill(); };
  }, [animateIn]);

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
      ...font, position: "relative", zIndex: 2, minHeight: compact ? undefined : "100vh",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div ref={cardRef} style={{ width: "100%", maxWidth: 460, opacity: animateIn ? 0 : 1 }}>
        {onBack && (
          <button onClick={onBack} className="a360-back">
            <ArrowLeft size={15} /> Indietro
          </button>
        )}

        <div className="a360-form-card">
          {!hideTitle && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: "rgba(255,122,24,0.16)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={18} color={C.orange} />
                </div>
                <div style={{ ...display, fontSize: 17, fontWeight: 700, color: "#fff" }}>{tipoLabel}</div>
              </div>
              <p style={{ ...font, fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 6, marginBottom: 20, lineHeight: 1.5 }}>
                Lascia i tuoi dati e avvia subito la demo di Atleta360.
              </p>
            </>
          )}

          <form onSubmit={submit}>
            <Field label="Nome" value={form.nome} onChange={upd("nome")} autoComplete="given-name" required />
            <Field label="Cognome" value={form.cognome} onChange={upd("cognome")} autoComplete="family-name" required />
            <Field label="Email" type="email" value={form.email} onChange={upd("email")} autoComplete="email" required />
            {/* telefono facoltativo: obbligatorio era il campo che faceva
                abbandonare di più, e per mandare la demo basta l'email */}
            <Field label="Numero di telefono" optional type="tel" value={form.telefono} onChange={upd("telefono")} autoComplete="tel"
              hint="Se lo lasci, posso richiamarti invece di scrivere." />
            <Field label="Società sportiva" optional value={form.societa} onChange={upd("societa")} autoComplete="organization" />
            <Field label="Ruolo" optional value={form.ruolo} onChange={upd("ruolo")} placeholder="es. allenatore, dirigente, atleta…" />

            <label className="a360-consent">
              <input
                type="checkbox"
                checked={consenso}
                onChange={(e) => setConsenso(e.target.checked)}
                style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, accentColor: C.orange }}
              />
              <span>
                Ho letto e accetto l'
                <button type="button" onClick={onOpenPrivacy} className="a360-link-inline">
                  informativa sulla privacy
                </button>
                {" "}e acconsento al trattamento dei miei dati per essere ricontattato in merito ad Atleta360.
                <span style={{ color: C.orange }}> *</span>
              </span>
            </label>

            {error && (
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-start",
                background: "rgba(220,60,60,0.14)", border: "1px solid rgba(255,120,120,0.35)", color: "#FFB4B4",
                borderRadius: 10, padding: "10px 12px", ...font, fontSize: 13, lineHeight: 1.5, marginBottom: 14,
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="a360-btn a360-btn-primary a360-submit"
              style={{ opacity: busy ? 0.7 : 1, cursor: busy ? "default" : "pointer" }}>
              {busy ? "Attendi…" : "Avvia la demo"}
            </button>

            {/* la riga che toglie attrito proprio dove si decide */}
            <div className="a360-reassure">
              <ShieldCheck size={14} /> Niente spam. Rispondo entro 24 ore.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

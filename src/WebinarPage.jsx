import { useRef, useState } from "react";
import { Check, BadgeCheck, ShieldCheck, CalendarDays, MonitorPlay, AlertCircle, CalendarPlus, Download, MessageCircle } from "lucide-react";
import { C, font, display, T, R } from "./theme";
import { WEBINAR, webinarFinito, linkGoogleCalendar, scaricaIcs } from "./webinar";
import { WHATSAPP_URL } from "./cinematic/contactsConfig";
import { fonte } from "./fonte";
import { azione } from "./visita";
import { conta } from "./analytics";

/* Pagina del webinar gratuito (atleta-360.com/webinar). Stesso impianto di
   /contatti: a sinistra il perché, a destra l'iscrizione. L'iscrizione va al
   server (api/iscrizione.js), non direttamente al database: la tabella
   "iscrizioni" non ha permessi per il pubblico. */

const RUOLI = ["Allenatore / allenatrice", "Dirigente", "Responsabile del settore giovanile", "Genitore", "Atleta", "Altro"];

function Campo({ label, facoltativo, id, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="a360-label" htmlFor={id}>
        {label}
        {facoltativo ? <span className="a360-label-opt"> (facoltativo)</span> : <span style={{ color: C.orange }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Iscrizione({ onOpenPrivacy, prossimo }) {
  const [f, setF] = useState({ nome: "", cognome: "", email: "", telefono: "", societa: "", ruolo: "" });
  const [privacy, setPrivacy] = useState(false);
  const [aggiornamenti, setAggiornamenti] = useState(false);
  const [stato, setStato] = useState(null); // null | "invio" | "fatto" | errore
  const esca = useRef("");
  const aperto = useRef(Date.now());
  const upd = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const invia = async (e) => {
    e.preventDefault();
    if (!privacy) { setStato("Devi accettare l'informativa privacy per iscriverti."); return; }
    setStato("invio");
    const { categoria, dettaglio } = fonte();
    try {
      const r = await fetch("/api/iscrizione", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: prossimo ? "prossimo" : WEBINAR.id, ...f, privacy, aggiornamenti,
          origine: categoria, origine_dettaglio: dettaglio,
          sito_web: esca.current, secondi: Math.round((Date.now() - aperto.current) / 1000),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.motivo || "errore");
      azione("webinar.iscritto");
      setStato("fatto");
    } catch {
      conta("form.errore.altro");
      setStato("Non sono riuscito a registrare l'iscrizione. Riprova tra poco, oppure scrivimi su WhatsApp.");
    }
  };

  if (stato === "fatto") {
    return (
      <div className="a360-webinar-fatto">
        <span className="a360-check grande"><Check size={22} strokeWidth={3} /></span>
        <h2 style={{ ...display, color: "#fff", fontSize: T.h3, margin: "6px 0 8px" }}>{prossimo ? "Ti avviso io" : "Sei iscritto"}</h2>
        <p style={{ ...font, color: "rgba(255,255,255,0.75)", fontSize: T.body, lineHeight: 1.6, margin: "0 0 18px" }}>
          {prossimo
            ? "Appena fisso la data del prossimo incontro ti scrivo."
            : <>Ti mando il link per collegarti per email qualche giorno prima. Intanto segnalo in agenda: <strong style={{ color: "#fff" }}>{WEBINAR.quandoTesto}</strong>.</>}
        </p>
        {!prossimo && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="a360-btn a360-btn-primary" href={linkGoogleCalendar()} target="_blank" rel="noreferrer"><CalendarPlus size={16} /> Google Calendar</a>
            <button type="button" className="a360-btn a360-btn-ghost" onClick={scaricaIcs}><Download size={16} /> Apple / Outlook</button>
          </div>
        )}
        <p style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: T.kicker, margin: "18px 0 0" }}>
          Nel frattempo puoi <a href="/contatti" style={{ color: C.orange }}>provare la demo di Atleta360</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={invia} noValidate={false}>
      <h2 style={{ ...display, color: "#fff", fontSize: T.h3, margin: "0 0 14px" }}>
        {prossimo ? "Avvisami per il prossimo incontro" : "Iscriviti gratis"}
      </h2>
      <div className="a360-esca" aria-hidden="true">
        <label htmlFor="sito_web_w">Non compilare questo campo</label>
        <input id="sito_web_w" type="text" tabIndex={-1} autoComplete="off" defaultValue="" onChange={(e) => { esca.current = e.target.value; }} />
      </div>
      <div className="a360-campi-2">
        <Campo label="Nome" id="w-nome"><input id="w-nome" className="a360-input" value={f.nome} onChange={upd("nome")} autoComplete="given-name" maxLength={100} required /></Campo>
        <Campo label="Cognome" id="w-cognome"><input id="w-cognome" className="a360-input" value={f.cognome} onChange={upd("cognome")} autoComplete="family-name" maxLength={100} required /></Campo>
      </div>
      <Campo label="Email" id="w-email"><input id="w-email" className="a360-input" type="email" value={f.email} onChange={upd("email")} autoComplete="email" maxLength={254} required /></Campo>
      <Campo label="Ruolo" id="w-ruolo">
        <select id="w-ruolo" className="a360-input" value={f.ruolo} onChange={upd("ruolo")} required>
          <option value="" disabled>Scegli…</option>
          {RUOLI.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Campo>
      <Campo label="Società sportiva" facoltativo id="w-societa"><input id="w-societa" className="a360-input" value={f.societa} onChange={upd("societa")} autoComplete="organization" maxLength={200} /></Campo>
      <Campo label="Telefono" facoltativo id="w-tel"><input id="w-tel" className="a360-input" type="tel" value={f.telefono} onChange={upd("telefono")} autoComplete="tel" maxLength={40} /></Campo>

      <label className="a360-consent">
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, accentColor: C.orange }} />
        <span>
          Ho letto l'<button type="button" onClick={onOpenPrivacy} className="a360-link-inline">informativa sulla privacy</button>{" "}
          e acconsento al trattamento dei miei dati per {prossimo ? "essere avvisato del prossimo incontro" : "partecipare al webinar e ricevere il link"}.
          <span style={{ color: C.orange }}> *</span>
        </span>
      </label>
      <label className="a360-consent">
        <input type="checkbox" checked={aggiornamenti} onChange={(e) => setAggiornamenti(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, accentColor: C.orange }} />
        <span>Voglio ricevere anche novità e proposte su Atleta360 (facoltativo, ti cancelli quando vuoi).</span>
      </label>

      {stato && stato !== "invio" && (
        <div className="a360-errore-form"><AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{stato}
          {stato.includes("WhatsApp") && <> <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" style={{ color: "#FFD7B0" }}><MessageCircle size={13} /> Apri WhatsApp</a></>}
        </span></div>
      )}

      <button type="submit" disabled={stato === "invio"} className="a360-btn a360-btn-primary a360-submit"
        style={{ opacity: stato === "invio" ? 0.7 : 1 }}>
        {stato === "invio" ? "Attendi…" : prossimo ? "Avvisami" : "Mi iscrivo"}
      </button>
      <div className="a360-reassure"><ShieldCheck size={14} /> Gratis. Niente spam: solo il link e un promemoria.</div>
    </form>
  );
}

export default function WebinarPage({ onOpenPrivacy }) {
  const finito = webinarFinito();
  return (
    <div className="a360-contact">
      <div className="a360-contact-inner">
        <div className="a360-contact-copy">
          <a href="/" aria-label="Vai alla home di Atleta360" className="a360-contact-logo">
            <img src="/logo-esteso-bianco.png" alt="Atleta360 — Mental Coach | Pallavolo"
              style={{ height: 62, display: "block", filter: "drop-shadow(0 0 22px rgba(255,122,24,0.3))" }} />
          </a>
          <div className="a360-webinar-etichetta">Webinar gratuito{finito ? " · concluso" : ""}</div>
          <h1 style={{ ...display, color: "#fff", fontWeight: 700, fontSize: T.h2, lineHeight: 1.15, margin: "0 0 10px", letterSpacing: -0.5 }}>
            {WEBINAR.titolo}
          </h1>
          <p style={{ ...font, color: "rgba(255,255,255,0.8)", fontSize: T.body, lineHeight: 1.6, margin: "0 0 18px" }}>{WEBINAR.sottotitolo}</p>

          <div className="a360-webinar-quando">
            <span><CalendarDays size={16} /> {WEBINAR.quandoTesto}</span>
            <span><MonitorPlay size={16} /> {WEBINAR.dove}</span>
          </div>

          <ul className="a360-contact-list">
            {WEBINAR.punti.map((p) => (
              <li key={p}><span className="a360-check"><Check size={13} strokeWidth={3} /></span><span>{p}</span></li>
            ))}
          </ul>
          <div className="a360-webinar-perchi" style={{ ...font, color: "rgba(255,255,255,0.65)", fontSize: T.small, lineHeight: 1.6, margin: "0 0 22px" }}>{WEBINAR.perChi}</div>

          <div className="a360-contact-proof">
            <div className="a360-proof-person">
              <img src="/danilo.jpg" alt="Danilo Puglisi" width="56" height="56" loading="lazy" />
              <div>
                <div style={{ ...display, color: "#fff", fontWeight: 700, fontSize: T.body }}>Con Danilo Puglisi</div>
                <div style={{ ...font, color: "rgba(255,255,255,0.6)", fontSize: T.micro, marginTop: 2 }}>Consulente e formatore · Carrara</div>
                <div className="a360-proof-badge">
                  <BadgeCheck size={12} color={C.orange} />
                  <span>Esperto di settore — Regione Toscana, n° 531</span>
                </div>
              </div>
            </div>
            <div className="a360-proof-club">
              <span style={{ ...font, color: "rgba(255,255,255,0.55)", fontSize: T.micro }}>Con il caso di</span>
              <img src="/oasi-volley-logo.png" alt="Oasi Volley Viareggio" height="34" loading="lazy" />
            </div>
          </div>
        </div>

        <div className="a360-contact-form a360-form-card">
          {finito && (
            <p style={{ ...font, color: "rgba(255,255,255,0.75)", fontSize: T.small, lineHeight: 1.6, margin: "0 0 16px", padding: "10px 12px", borderRadius: R.sm, background: "rgba(255,255,255,0.06)" }}>
              Questo incontro si è già tenuto. Lascia la tua email e ti avviso del prossimo.
            </p>
          )}
          <Iscrizione onOpenPrivacy={onOpenPrivacy} prossimo={finito} />
        </div>
      </div>
    </div>
  );
}

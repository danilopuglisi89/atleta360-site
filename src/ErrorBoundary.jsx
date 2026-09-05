import { Component } from "react";
import { C, font, display } from "./theme";
import { WHATSAPP_URL, CONTACT_EMAIL, PHONE_DISPLAY } from "./cinematic/contactsConfig";

/* Rete di protezione: senza, un errore in un qualsiasi componente lascia la
   pagina completamente bianca — su un sito che esiste per raccogliere contatti
   è il guasto peggiore, perché il visitatore se ne va e noi non lo sappiamo.
   Qui almeno resta il marchio e un modo diretto per scrivere a Danilo. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // lasciamo traccia in console: è l'unico segnale che abbiamo finché non
    // c'è un servizio di monitoraggio collegato
    console.error("[Atleta360] errore non gestito:", error);
    try {
      if (window.va) window.va("event", { name: "errore_pagina", data: { messaggio: String(error?.message || error).slice(0, 120) } });
    } catch { /* la segnalazione non deve a sua volta rompere nulla */ }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div style={{
        ...font, minHeight: "100vh", position: "relative", zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, textAlign: "center",
        background: "radial-gradient(120% 80% at 50% 0%, #17297A 0%, #0A1650 46%, #05091F 100%)",
      }}>
        <div style={{ maxWidth: 460 }}>
          <img src="/logo-esteso-bianco.png" alt="Atleta360" height="56"
            style={{ marginBottom: 26, filter: "drop-shadow(0 0 24px rgba(255,122,24,0.4))" }} />
          <h1 style={{ ...display, color: "#fff", fontWeight: 700, fontSize: 24, margin: "0 0 12px" }}>
            Qualcosa non ha funzionato
          </h1>
          <p style={{ ...font, color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6, margin: "0 0 26px" }}>
            Ci scusiamo per l'inconveniente. Puoi riprovare a caricare la pagina — oppure
            scrivimi direttamente: ti do io l'accesso alla demo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button className="a360-btn a360-btn-primary" onClick={() => window.location.reload()}>
              Ricarica la pagina
            </button>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="a360-btn a360-btn-ghost">
              Scrivi su WhatsApp
            </a>
          </div>
          <p style={{ ...font, color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 24, lineHeight: 1.7 }}>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: C.orange }}>{CONTACT_EMAIL}</a>
            <br />{PHONE_DISPLAY}
          </p>
        </div>
      </div>
    );
  }
}

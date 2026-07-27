import { ArrowLeft } from "lucide-react";
import { C, font, display } from "./theme";

const h2 = { ...display, fontSize: 17, fontWeight: 700, color: C.ink, marginTop: 28, marginBottom: 10 };
const p = { ...font, fontSize: 14, color: C.muted, lineHeight: 1.7, margin: "0 0 12px" };

export default function PrivacyPage({ onBack }) {
  return (
    <div style={{ ...font, minHeight: "100vh", background: C.surface, padding: "40px 20px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button
          onClick={onBack}
          style={{
            ...font, background: "none", border: "none", padding: 0, cursor: "pointer",
            color: C.orange, fontSize: 13, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24,
          }}
        >
          <ArrowLeft size={15} /> Torna al sito
        </button>

        <h1 style={{ ...display, fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>
          Informativa sulla privacy
        </h1>
        <p style={{ ...font, fontSize: 12.5, color: C.muted, marginTop: 6 }}>
          Versione 1 — ultimo aggiornamento: da completare
        </p>

        <div style={{
          background: "#FFF6E9", border: "1px solid #FFE0B0", borderRadius: 12,
          padding: "12px 14px", marginTop: 20, ...font, fontSize: 12.5, color: "#8A5A00", lineHeight: 1.6,
        }}>
          Bozza generata automaticamente: i campi tra parentesi quadre vanno completati
          e l'intero testo va validato da chi segue la privacy prima di considerarlo definitivo.
        </div>

        <h2 style={h2}>1. Titolare del trattamento</h2>
        <p style={p}>
          Il titolare del trattamento dei dati raccolti tramite questo sito è
          [RAGIONE SOCIALE / NOME E COGNOME], con sede in [INDIRIZZO],
          P.IVA/C.F. [P.IVA O CODICE FISCALE]. Per qualsiasi richiesta relativa al
          trattamento dei tuoi dati puoi scrivere a{" "}
          <a href="mailto:info@danilopuglisi.com" style={{ color: C.orange }}>info@danilopuglisi.com</a>.
        </p>

        <h2 style={h2}>2. Quali dati raccogliamo</h2>
        <p style={p}>
          Quando compili il modulo di richiesta demo raccogliamo: nome, cognome, indirizzo email,
          numero di telefono e, se li indichi, il nome della società sportiva e il tuo ruolo.
          Non raccogliamo altri dati personali tramite questo sito.
        </p>

        <h2 style={h2}>3. Perché li usiamo</h2>
        <p style={p}>
          Usiamo questi dati per: (a) darti accesso alla demo del prodotto Atleta360 che hai richiesto;
          (b) ricontattarti per presentarti il prodotto o rispondere a tue domande;
          (c) tenere traccia di chi ha mostrato interesse, a fini organizzativi interni.
          Non usiamo i tuoi dati per finalità diverse da queste e non li cediamo a terzi per scopi
          commerciali di terzi.
        </p>

        <h2 style={h2}>4. Base giuridica</h2>
        <p style={p}>
          Il trattamento si basa sul consenso che presti selezionando la casella dedicata prima
          di inviare il modulo (art. 6.1.a del Regolamento UE 2016/679 — GDPR). Puoi revocare il
          consenso in qualsiasi momento scrivendo all'indirizzo email sopra indicato, senza che
          questo pregiudichi la liceità del trattamento già effettuato.
        </p>

        <h2 style={h2}>5. Dove sono conservati i dati</h2>
        <p style={p}>
          I dati sono conservati su Supabase, infrastruttura cloud ospitata nella regione
          [REGIONE DATA CENTER — da confermare, es. "Unione Europea" o "Stati Uniti"].
          {" "}Se il fornitore si trova fuori dall'Unione Europea, il trasferimento avviene sulla
          base delle garanzie previste dal fornitore stesso (clausole contrattuali standard).
        </p>

        <h2 style={h2}>6. Per quanto tempo</h2>
        <p style={p}>
          Conserviamo i tuoi dati per il tempo necessario a gestire la tua richiesta di demo e,
          successivamente, per un massimo di [DURATA — es. 24 mesi] dall'ultimo contatto,
          salvo tu chieda prima la cancellazione.
        </p>

        <h2 style={h2}>7. I tuoi diritti</h2>
        <p style={p}>
          In qualsiasi momento puoi chiedere di accedere ai tuoi dati, correggerli, cancellarli,
          limitarne l'uso o riceverli in formato portabile, scrivendo a{" "}
          <a href="mailto:info@danilopuglisi.com" style={{ color: C.orange }}>info@danilopuglisi.com</a>.
          Puoi anche proporre reclamo al Garante per la protezione dei dati personali
          (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer" style={{ color: C.orange }}>garanteprivacy.it</a>).
        </p>

        <h2 style={h2}>8. Cookie e strumenti di analisi</h2>
        <p style={p}>
          Questo sito usa uno strumento di analisi (Vercel Analytics) che misura in forma
          aggregata quante persone visitano la pagina, senza utilizzare cookie di profilazione
          né identificare singoli visitatori.
        </p>
      </div>
    </div>
  );
}

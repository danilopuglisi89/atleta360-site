import { useState } from "react";
import {
  Mail, Megaphone, PauseCircle, Link2, Check, AlertCircle, RotateCcw, Info, Send, ExternalLink,
  MessageSquareText, CalendarRange, Smartphone, ShieldOff,
} from "lucide-react";
import { chiama, dataOra, nonContare, impostaNonContare } from "./util";

const DEMO_PREDEFINITE = {
  demo_url_atleta: "https://demo.atleta-360.com/?demo=atleta",
  demo_url_societa: "https://demo.atleta-360.com/?demo=societa",
};

function Interruttore({ id, acceso, onChange, etichetta, descrizione }) {
  return (
    <div className="ad-interruttore-riga">
      <div>
        <label htmlFor={id} className="ad-interruttore-etichetta">{etichetta}</label>
        {descrizione && <p className="ad-piccolo">{descrizione}</p>}
      </div>
      <button id={id} role="switch" aria-checked={acceso} className={`ad-interruttore${acceso ? " acceso" : ""}`}
        onClick={() => onChange(!acceso)}>
        <span className="ad-interruttore-pallino" />
        <span className="ad-sr">{acceso ? "Acceso" : "Spento"}</span>
      </button>
    </div>
  );
}

function Campo({ id, etichetta, errore, conteggio, max, ...props }) {
  const Tag = props.rows ? "textarea" : "input";
  return (
    <div className="ad-campo-gruppo">
      <label htmlFor={id} className="ad-etichetta">{etichetta}</label>
      <Tag id={id} className={`ad-campo${errore ? " errato" : ""}`} maxLength={max} aria-invalid={!!errore} {...props} />
      <div className="ad-campo-piede">
        {errore ? <span className="ad-errore-inline"><AlertCircle size={14} /> {errore}</span> : <span />}
        {max && <span className="ad-piccolo">{(conteggio || 0)}/{max}</span>}
      </div>
    </div>
  );
}

const MESSAGGI_ERRORE = {
  avviso_mail_a: "Indirizzo email non valido",
  messaggio_testo: "Scrivi il testo, oppure spegni il messaggio",
  messaggio_link: "Usa un indirizzo https:// o un percorso del sito come /contatti",
  demo_url_atleta: "Serve un indirizzo completo che inizi con https://",
  demo_url_societa: "Serve un indirizzo completo che inizi con https://",
};

/* Un pulsante che fa una cosa sola e dice com'è andata. */
function Azione({ Icona, testo, esegui, conferma, classe = "ad-btn-leggero" }) {
  const [esito, setEsito] = useState(null);
  const via = async () => {
    if (conferma && !window.confirm(conferma)) return;
    setEsito({ attesa: true });
    setEsito(await esegui());
  };
  return (
    <div className="ad-riga-salva">
      <button className={`ad-btn ${classe} ad-btn-piccolo`} onClick={via} disabled={esito?.attesa}><Icona size={14} /> {esito?.attesa ? "Un momento…" : testo}</button>
      {esito && !esito.attesa && (esito.ok
        ? <span className="ad-ok"><Check size={15} /> {esito.testo}</span>
        : <span className="ad-errore-inline"><AlertCircle size={15} /> {esito.testo}</span>)}
    </div>
  );
}

export default function Opzioni({ opzioni, aggiornate, predefinito, migrazione, onSalvate }) {
  const [v, setV] = useState(opzioni);
  const [errori, setErrori] = useState({});
  const [stato, setStato] = useState(null);
  const [avvisi, setAvvisi] = useState({});
  const [nonContarmi, setNonContarmi] = useState(nonContare);
  const cambia = (k) => (x) => { setV((o) => ({ ...o, [k]: x?.target ? x.target.value : x })); setErrori((e) => ({ ...e, [k]: null })); };

  // le bandierine si salvano dalla Panoramica, non da qui: fuori dal confronto
  const senzaSegni = (o) => JSON.stringify({ ...o, segni: null });
  const modificato = senzaSegni(v) !== senzaSegni(opzioni);

  const salva = async () => {
    setStato("in corso");
    const r = await chiama("opzioni.salva", { valori: v });
    if (r.ok) { onSalvate(r.opzioni); setV(r.opzioni); setAvvisi(r.avvisi || {}); setStato("fatto"); setTimeout(() => setStato(null), 2500); return; }
    setStato(r.motivo || "non salvato");
    if (r.campi) setErrori(Object.fromEntries(r.campi.map((c) => [c, MESSAGGI_ERRORE[c] || "Valore non valido"])));
  };

  if (migrazione !== "ok") {
    return (
      <div className="ad-sezione">
        <h2>Opzioni</h2>
        <p className="ad-nota avviso"><AlertCircle size={16} /> Le opzioni si attivano dopo aver eseguito <code>supabase/admin.sql</code> nel database del sito. Finché manca, il sito usa i valori predefiniti.</p>
      </div>
    );
  }

  return (
    <div className="ad-sezione">
      <div className="ad-sezione-testa">
        <h2>Opzioni</h2>
        {aggiornate && <span className="ad-piccolo">Ultima modifica: {dataOra(aggiornate)}</span>}
      </div>
      <p className="ad-nota"><Info size={16} /> Le modifiche arrivano sul sito entro un minuto.</p>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><Mail size={17} /> Avviso via mail</h3></div>
        <Interruttore id="o-mail" acceso={v.avviso_mail_attivo} onChange={cambia("avviso_mail_attivo")}
          etichetta="Mandami una mail a ogni nuovo contatto"
          descrizione="Spento, i contatti si salvano comunque: li trovi nella scheda Contatti." />
        <Campo id="o-mail-a" etichetta="Destinatario" type="email" value={v.avviso_mail_a}
          placeholder={predefinito} onChange={cambia("avviso_mail_a")} errore={errori.avviso_mail_a}
          disabled={!v.avviso_mail_attivo} />
        <p className="ad-piccolo">Vuoto = {predefinito}</p>
        <Azione Icona={Send} testo="Manda una mail di prova" esegui={async () => {
          const r = await chiama("mail.prova", { a: v.avviso_mail_a });
          return { ok: r.ok, testo: r.ok ? `Inviata a ${r.a}: controlla la casella (anche lo spam)` : (r.motivo || "non inviata") };
        }} />
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><CalendarRange size={17} /> Riepilogo del lunedì</h3></div>
        <Interruttore id="o-riep" acceso={v.riepilogo_attivo} onChange={cambia("riepilogo_attivo")}
          etichetta="Ogni lunedì mattina, una mail con la settimana"
          descrizione="Pagine viste e contatti rispetto alla settimana prima, chi aspetta ancora, chi va richiamato." />
        <Azione Icona={Send} testo="Mandamelo adesso" esegui={async () => {
          const r = await chiama("riepilogo.prova");
          return { ok: r.ok && r.inviato, testo: r.ok && r.inviato ? "Inviato" : (r.motivo || "non inviato") };
        }} />
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><MessageSquareText size={17} /> Messaggi pronti</h3></div>
        <p className="ad-piccolo">Email e WhatsApp della scheda contatto partono con questo testo già scritto. <code>{"{nome}"}</code> e <code>{"{societa}"}</code> si riempiono da soli.</p>
        <Campo id="o-mod-o" etichetta="Oggetto dell'email" value={v.modello_oggetto} max={120} conteggio={v.modello_oggetto.length} onChange={cambia("modello_oggetto")} />
        <Campo id="o-mod-a" etichetta="Testo per gli atleti" rows={3} value={v.modello_atleta} max={1000} conteggio={v.modello_atleta.length} onChange={cambia("modello_atleta")} />
        <Campo id="o-mod-s" etichetta="Testo per le società" rows={3} value={v.modello_societa} max={1000} conteggio={v.modello_societa.length} onChange={cambia("modello_societa")} />
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><Megaphone size={17} /> Messaggio in evidenza</h3></div>
        <Interruttore id="o-msg" acceso={v.messaggio_attivo} onChange={cambia("messaggio_attivo")}
          etichetta="Mostra un messaggio in cima al sito"
          descrizione="Per una novità, un evento, le iscrizioni aperte. Chi lo vede può chiuderlo." />
        <Campo id="o-msg-t" etichetta="Testo" value={v.messaggio_testo} max={160} conteggio={v.messaggio_testo.length}
          placeholder="Es. Aperte le adesioni per la stagione 2026/27" onChange={cambia("messaggio_testo")} errore={errori.messaggio_testo} />
        <Campo id="o-msg-l" etichetta="Link (facoltativo)" value={v.messaggio_link}
          placeholder="/contatti oppure https://…" onChange={cambia("messaggio_link")} errore={errori.messaggio_link} />
        {v.messaggio_testo && (
          <div className="ad-anteprima">
            <span className="ad-piccolo">Anteprima</span>
            <div className="a360-avviso ad-avviso-anteprima">
              <span className="a360-avviso-punto" aria-hidden="true" />
              <span>{v.messaggio_testo}</span>
              {v.messaggio_link && <span className="a360-avviso-link">Scopri →</span>}
            </div>
          </div>
        )}
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><PauseCircle size={17} /> Modulo delle richieste</h3></div>
        <Interruttore id="o-pausa" acceso={v.modulo_in_pausa} onChange={cambia("modulo_in_pausa")}
          etichetta="Metti in pausa le richieste di demo"
          descrizione="Al posto del modulo compaiono il tuo WhatsApp e la tua email. Utile se la demo è in manutenzione o sei in ferie." />
        <Campo id="o-pausa-t" etichetta="Messaggio (facoltativo)" rows={3} value={v.modulo_pausa_testo} max={300}
          conteggio={v.modulo_pausa_testo.length} onChange={cambia("modulo_pausa_testo")}
          placeholder="Le richieste di demo sono momentaneamente in pausa. Scrivimi su WhatsApp o per email: ti rispondo entro 24 ore." />
      </section>

      <section className="ad-card">
        <div className="ad-card-testa">
          <h3><Link2 size={17} /> Link della demo</h3>
          <button className="ad-btn ad-btn-leggero ad-btn-piccolo" onClick={() => setV((o) => ({ ...o, ...DEMO_PREDEFINITE }))}>
            <RotateCcw size={14} /> Predefiniti
          </button>
        </div>
        <p className="ad-piccolo">Dove arriva chi ha compilato il modulo. Cambiali solo se sposti la demo.</p>
        {[["demo_url_atleta", "Atleta"], ["demo_url_societa", "Società"]].map(([k, t]) => (
          <div key={k}>
            <Campo id={`o-${k}`} etichetta={t} value={v[k]} onChange={cambia(k)} errore={errori[k]} />
            <div className="ad-riga-salva ad-sotto-campo">
              <a className="ad-btn ad-btn-leggero ad-btn-piccolo" href={v[k]} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Apri e prova</a>
              {avvisi[k] && <span className="ad-errore-inline"><AlertCircle size={15} /> Salvato, ma il link {avvisi[k]}: controllalo</span>}
            </div>
          </div>
        ))}
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><Smartphone size={17} /> Questo dispositivo</h3></div>
        <Interruttore id="o-noconta" acceso={nonContarmi} onChange={(si) => { impostaNonContare(si); setNonContarmi(si); try { localStorage.setItem("a360_non_contare_scelto", "1"); } catch { /* storage bloccato */ } }}
          etichetta="Non contare le mie visite al sito"
          descrizione="Vale solo per questo browser e si applica subito, senza salvare. Così le tue prove non gonfiano pagine viste e conversione. Attivalo su ogni telefono e computer che usi." />
      </section>

      <section className="ad-card">
        <div className="ad-card-testa"><h3><ShieldOff size={17} /> Sicurezza</h3></div>
        <p className="ad-piccolo">Chiude il pannello su tutti gli altri telefoni e computer dove sei entrato (questo resta aperto). Usalo se hai perso un telefono o se qualcuno ha visto la password.</p>
        <Azione Icona={ShieldOff} testo="Esci da tutti i dispositivi" classe="ad-btn-pericolo-leggero"
          conferma="Chiudere il pannello su tutti gli altri dispositivi?"
          esegui={async () => { const r = await chiama("sessioni.chiudiTutte"); return { ok: r.ok, testo: r.ok ? "Fatto: gli altri dovranno rimettere la password" : (r.motivo || "non riuscito") }; }} />
      </section>

      <div className={`ad-barra-salva${modificato || stato ? " visibile" : ""}`}>
        {stato === "fatto" ? <span className="ad-ok"><Check size={16} /> Salvato</span>
          : stato && stato !== "in corso" ? <span className="ad-errore-inline"><AlertCircle size={15} /> {stato}</span>
          : <span>Modifiche non salvate</span>}
        <div className="ad-riga-salva">
          <button className="ad-btn ad-btn-leggero" onClick={() => { setV(opzioni); setErrori({}); setStato(null); }} disabled={!modificato}>Annulla</button>
          <button className="ad-btn ad-btn-primario" onClick={salva} disabled={!modificato || stato === "in corso"}>
            {stato === "in corso" ? "Salvo…" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}

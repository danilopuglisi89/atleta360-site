import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink, RefreshCw } from "lucide-react";
import { chiama, numero, dataOra, dataBreve, giorniFa, quandoFa, giorniIndietro, somma, statoDi, oltre24Mesi, giornoCorto } from "./util";

const TIPI_ERRORE = {
  colonna: "colonna mancante nel database",
  permesso: "permesso negato dal database",
  controllo: "dati rifiutati da un controllo",
  altro: "errore non riconosciuto",
  rete: "connessione del visitatore",
};

/* Il modulo salva davvero? Il risultato del controllo automatico, rifatto a richiesta. */
function ControlloModulo({ iniziale }) {
  const [c, setC] = useState(iniziale);
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState(null);
  const rifai = async () => {
    setAttesa(true); setErrore(null);
    const r = await chiama("controllo.modulo");
    setAttesa(false);
    if (r.ok) setC(r.controllo); else setErrore(r.motivo || "controllo non riuscito");
  };
  const livello = !c ? "info" : c.esito === "ok" ? "ok" : c.esito === "problema" ? "problema" : "attenzione";
  return (
    <Controllo livello={livello} titolo="Il modulo salva davvero">
      {!c ? "Non ancora controllato: la prova parte ogni mattina con la sveglia, o adesso col pulsante."
        : c.esito === "ok" ? `Sì. Ultima prova ${dataOra(c.quando)}: colonne, permessi e regole del database a posto.`
        : c.esito === "problema" ? `NO: ${c.dettaglio}. Chi compila il modulo vede un errore e il contatto va perso. (prova del ${dataOra(c.quando)})`
        : `Prova non eseguita: ${c.dettaglio}.`}
      {" "}La prova tenta di salvare un contatto che il database rifiuta sempre: non lascia niente.
      <span className="ad-riga-salva ad-sotto-testo">
        <button className="ad-btn ad-btn-leggero ad-btn-piccolo" onClick={rifai} disabled={attesa}>
          <RefreshCw size={14} className={attesa ? "ad-gira" : ""} /> {attesa ? "Controllo…" : "Controlla adesso"}
        </button>
        {errore && <span className="ad-errore-inline">{errore}</span>}
      </span>
    </Controllo>
  );
}

const ICONE = {
  ok: [CheckCircle2, "Ok"],
  attenzione: [AlertTriangle, "Attenzione"],
  problema: [XCircle, "Problema"],
  info: [Info, "Info"],
};

function Controllo({ livello, titolo, children }) {
  const [Icona, parola] = ICONE[livello];
  return (
    <li className={`ad-controllo ad-livello-${livello}`}>
      <Icona size={20} aria-hidden="true" />
      <div>
        <div className="ad-controllo-testa"><strong>{titolo}</strong><span className="ad-livello-parola">{parola}</span></div>
        <p>{children}</p>
      </div>
    </li>
  );
}

const ultimoGiorno = (contatori, filtro) => contatori.filter((c) => filtro(c.evento)).map((c) => c.giorno).sort().pop() || null;

const LINK = [
  ["Google Search Console", "https://search.google.com/search-console?resource_id=https%3A%2F%2Fatleta-360.com%2F"],
  ["Bing Webmaster Tools", "https://www.bing.com/webmasters/home?siteUrl=https://atleta-360.com/"],
  ["Vercel (pubblicazioni e analisi)", "https://vercel.com/danilopuglisi/atleta360-site"],
  ["Supabase (database)", "https://supabase.com/dashboard/project/rdpzkbynpptxryufhfpq"],
  ["Resend (mail inviate)", "https://resend.com/emails"],
];

export default function Salute({ dati, vaiA }) {
  const { salute, contatori, leads, opzioni, ultimoRiepilogo, ultimoControllo } = dati;
  const oggi = salute.oggi;
  const ult30 = giorniIndietro(oggi, 30);
  const ult7 = giorniIndietro(oggi, 7);
  const mail = (e) => somma(contatori, ult30, (x) => x === `mail.${e}`);
  const sveglia = ultimoGiorno(contatori, (e) => e === "sistema.sveglia");
  const visita = ultimoGiorno(contatori, (e) => e.startsWith("visita."));
  const accesso = ultimoGiorno(contatori, (e) => e === "accesso.ok");
  const veri = leads.filter((l) => !l.sospetto);
  const ultimoLead = veri[0]?.created_at;
  // il sito promette "rispondo entro 24 ore": chi è ancora "nuovo" dal giorno prima aspetta
  const inAttesa = veri.filter((l) => statoDi(l) === "nuovo" && giorniFa(l.created_at, oggi) >= 1);
  const sospetti = leads.filter((l) => l.sospetto).length;
  const vecchi = leads.filter((l) => oltre24Mesi(l, oggi)).length;
  const errati7 = somma(contatori, ult7, (e) => e === "accesso.errato");
  const erratiOggi = somma(contatori, [oggi], (e) => e === "accesso.errato");
  const cancellazioni = contatori.filter((c) => c.evento === "gdpr.cancellazione").sort((a, b) => b.giorno.localeCompare(a.giorno));
  const destinatario = opzioni.avviso_mail_a || salute.destinatarioPredefinito;
  // richieste che il database ha rifiutato sotto gli occhi di un visitatore
  const errori = Object.keys(TIPI_ERRORE).map((t) => ({ t, n: somma(contatori, ult30, (e) => e === `form.errore.${t}`) })).filter((x) => x.n);
  const erroriVeri = errori.filter((x) => x.t !== "rete").reduce((a, x) => a + x.n, 0);
  const ultimoErrore = ultimoGiorno(contatori, (e) => e.startsWith("form.errore.") && e !== "form.errore.rete");

  return (
    <div className="ad-sezione">
      <h2>Salute del sito</h2>
      <ul className="ad-controlli">
        {salute.database === "ok"
          ? <Controllo livello="ok" titolo="Database">Raggiungibile, risposta in {numero(salute.latenzaMs)} ms.</Controllo>
          : <Controllo livello="problema" titolo="Database">Non risponde: {salute.errori[0] || "errore sconosciuto"}. Se è fermo da giorni, potrebbe essere in pausa: riattivalo da Supabase. Finché non torna, la lista dei contatti qui è vuota ma i contatti NON sono spariti.</Controllo>}

        {salute.migrazione === "ok"
          ? <Controllo livello="ok" titolo="Tabelle del pannello">Presenti: stato dei contatti, contatori e opzioni.</Controllo>
          : <Controllo livello="problema" titolo="Tabelle del pannello">Manca la migrazione: esegui <code>supabase/admin.sql</code> nel SQL Editor del database del sito.</Controllo>}

        <ControlloModulo iniziale={ultimoControllo} />

        {errori.length
          ? <Controllo livello={erroriVeri ? "problema" : "info"} titolo="Richieste non salvate">
              Ultimi 30 giorni: {errori.map((x) => `${numero(x.n)} per ${TIPI_ERRORE[x.t]}`).join(", ")}.
              {erroriVeri ? ` L'ultima ${quandoFa(ultimoErrore)}: quei contatti sono persi. Premi «Controlla adesso» qui sopra.` : " Sono problemi di rete di chi visitava, non del sito."}
            </Controllo>
          : <Controllo livello="ok" titolo="Richieste non salvate">Nessuna negli ultimi 30 giorni.</Controllo>}

        {salute.migrazione5 === "ok"
          ? null
          : <Controllo livello="attenzione" titolo="Iscrizioni ai webinar">Esegui <code>supabase/admin-5.sql</code>: senza, la pagina /webinar non riesce a salvare gli iscritti.</Controllo>}

        {salute.migrazione3 === "ok"
          ? null
          : <Controllo livello="attenzione" titolo="Provenienza dei contatti">Esegui <code>supabase/admin-3.sql</code>: senza, i contatti si salvano ma non dicono da dove arrivano (le visite per canale si contano già).</Controllo>}

        {salute.migrazione2 === "ok"
          ? <Controllo livello="ok" titolo="Protezione e richiami">Il modulo pubblico può scrivere solo i suoi campi; richiami, diario e lead sospetti attivi.</Controllo>
          : <Controllo livello="attenzione" titolo="Protezione e richiami">Esegui <code>supabase/admin-2.sql</code> nel SQL Editor del database del sito: chiude la scrittura libera dei campi interni dal modulo pubblico e accende richiami, diario e lead sospetti.</Controllo>}

        {sveglia && giorniFa(sveglia, oggi) <= 2
          ? <Controllo livello="ok" titolo="Sveglia del database">Ultima {quandoFa(sveglia)}. Ogni mattina tiene sveglio Supabase, che altrimenti dopo una settimana senza uso si mette in pausa (e con lui modulo e demo).</Controllo>
          : <Controllo livello="attenzione" titolo="Sveglia del database">{sveglia ? `Ultima ${quandoFa(sveglia)}: dovrebbe girare ogni mattina.` : "Non ancora eseguita: parte ogni mattina alle 6 (ora UTC), dal primo giorno dopo la pubblicazione."}</Controllo>}

        {!salute.configurazione.mail
          ? <Controllo livello="problema" titolo="Avviso via mail">Chiave Resend assente su Vercel: i contatti si salvano ma non ti arriva la mail.</Controllo>
          : !opzioni.avviso_mail_attivo
            ? <Controllo livello="attenzione" titolo="Avviso via mail">Spento dalle Opzioni: i contatti arrivano solo qui.</Controllo>
            : mail("errore") > 0
              ? <Controllo livello="attenzione" titolo="Avviso via mail">{numero(mail("errore"))} invii falliti negli ultimi 30 giorni ({numero(mail("inviata"))} riusciti). Prova con «Manda una mail di prova» nelle Opzioni: ti dice il motivo.</Controllo>
              : <Controllo livello="ok" titolo="Avviso via mail">Attivo verso {destinatario}. Ultimi 30 giorni: {numero(mail("inviata"))} inviate, {numero(mail("scartata"))} scartate come spam.</Controllo>}

        {salute.configurazione.mail && (
          <Controllo livello={salute.mittenteDiProva && opzioni.avviso_mail_a ? "attenzione" : "info"} titolo="Mittente delle mail">
            {salute.mittente}.{" "}
            {salute.mittenteDiProva
              ? "È il mittente di prova di Resend: consegna solo all'indirizzo con cui hai aperto l'account Resend. Se cambi destinatario, fai una mail di prova; per mandare altrove serve un dominio verificato su Resend e NOTIFICA_DA su Vercel."
              : "Dominio verificato su Resend."}
          </Controllo>
        )}

        <Controllo livello={opzioni.riepilogo_attivo ? "info" : "attenzione"} titolo="Riepilogo del lunedì">
          {opzioni.riepilogo_attivo
            ? `Acceso: ogni lunedì mattina una mail con la settimana. ${ultimoRiepilogo ? `Ultimo: ${dataBreve(`${ultimoRiepilogo}T12:00:00Z`)}.` : "Non ancora partito."}`
            : "Spento dalle Opzioni."}
        </Controllo>

        {inAttesa.length
          ? <Controllo livello="attenzione" titolo="Contatti in attesa">{inAttesa.length === 1 ? "1 contatto è" : `${inAttesa.length} contatti sono`} ancora «nuovi» da ieri o prima, ma il sito promette risposta entro un giorno. Il più vecchio: {dataBreve(inAttesa[inAttesa.length - 1].created_at)}.</Controllo>
          : <Controllo livello="ok" titolo="Contatti in attesa">Nessuno aspetta da ieri.</Controllo>}

        <Controllo livello="info" titolo="Ultimo contatto">{ultimoLead ? `${dataOra(ultimoLead)} (${quandoFa(ultimoLead)}).` : "Nessuno ancora."}</Controllo>

        {sospetti > 0 && (
          <Controllo livello="info" titolo="Contatti sospetti">{sospetti === 1 ? "1 contatto compilato" : `${sospetti} contatti compilati`} in meno di 2,5 secondi: di solito programmi automatici. Non contano nelle statistiche; li trovi in Contatti col filtro «Sospetti».</Controllo>
        )}

        {vecchi > 0 && (
          <Controllo livello="attenzione" titolo="Conservazione dei dati">{vecchi === 1 ? "1 contatto ha" : `${vecchi} contatti hanno`} superato i 24 mesi dall'ultimo contatto che l'informativa promette come limite. In Contatti, filtro «Oltre 24 mesi», li elimini in un colpo.</Controllo>
        )}

        {visita
          ? <Controllo livello={giorniFa(visita, oggi) > 7 ? "attenzione" : "ok"} titolo="Contatori delle visite">Ultima visita registrata {quandoFa(visita)}.</Controllo>
          : <Controllo livello="info" titolo="Contatori delle visite">Nessuna visita registrata ancora: si contano da quando il pannello è attivo.</Controllo>}

        <Controllo livello={erratiOggi >= 10 ? "problema" : errati7 >= 10 ? "attenzione" : "ok"} titolo="Accessi al pannello">
          {errati7 ? `${numero(errati7)} password sbagliate negli ultimi 7 giorni (${numero(erratiOggi)} oggi).` : "Nessuna password sbagliata negli ultimi 7 giorni."}
          {accesso ? ` Ultimo accesso riuscito: ${quandoFa(accesso)}.` : ""}
          {erratiOggi >= 10 ? " Se non sei stato tu, cambia ADMIN_PASSWORD su Vercel e usa «Esci da tutti i dispositivi» nelle Opzioni." : ""}
        </Controllo>

        {cancellazioni.length > 0 && (
          <Controllo livello="info" titolo="Cancellazioni eseguite">
            Registro anonimo (senza dati personali): {cancellazioni.slice(0, 8).map((c) => `${giornoCorto(c.giorno)} (${c.conteggio})`).join(", ")}.
          </Controllo>
        )}

        <Controllo livello="info" titolo="Collegamento con l'Assistente AI">
          {salute.configurazione.hub
            ? "Chiave HUB_CHIAVE presente: l'hub può leggere il bollettino da /api/hub."
            : "Non collegato: per mandare il bollettino del sito nel briefing dell'Assistente AI serve HUB_CHIAVE su Vercel (qui e nell'hub)."}
        </Controllo>

        <Controllo livello={opzioni.modulo_in_pausa ? "attenzione" : "info"} titolo="Modulo delle richieste">
          {opzioni.modulo_in_pausa ? "In pausa: chi arriva vede i tuoi contatti diretti invece del modulo." : "Attivo."}
          {opzioni.messaggio_attivo ? ` Messaggio in evidenza acceso: «${opzioni.messaggio_testo}».` : ""}
        </Controllo>

        <Controllo livello="info" titolo="Versione pubblicata">
          {salute.versione.commit ? `${salute.versione.commit} — ${salute.versione.messaggio || ""} (${salute.versione.ambiente})` : `ambiente ${salute.versione.ambiente}`}
        </Controllo>
      </ul>

      <section className="ad-card">
        <div className="ad-card-testa"><h3>Strumenti esterni</h3></div>
        <ul className="ad-link">
          {LINK.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer">{t} <ExternalLink size={14} /></a></li>)}
          <li><button className="ad-link-btn" onClick={() => vaiA("opzioni")}>Opzioni del sito</button></li>
        </ul>
      </section>
    </div>
  );
}

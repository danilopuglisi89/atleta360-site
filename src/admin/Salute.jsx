import { CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink } from "lucide-react";
import { numero, dataOra, dataBreve, giorniFa, giorniIndietro, somma } from "./util";

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
const fa = (g) => { const n = giorniFa(`${g}T12:00:00Z`); return n <= 0 ? "oggi" : n === 1 ? "ieri" : `${n} giorni fa`; };

const LINK = [
  ["Google Search Console", "https://search.google.com/search-console?resource_id=https%3A%2F%2Fatleta-360.com%2F"],
  ["Bing Webmaster Tools", "https://www.bing.com/webmasters/home?siteUrl=https://atleta-360.com/"],
  ["Vercel (pubblicazioni e analisi)", "https://vercel.com/danilopuglisi/atleta360-site"],
  ["Supabase (database)", "https://supabase.com/dashboard/project/rdpzkbynpptxryufhfpq"],
  ["Resend (mail inviate)", "https://resend.com/emails"],
];

export default function Salute({ dati }) {
  const { salute, contatori, leads, opzioni } = dati;
  const ult30 = giorniIndietro(salute.oggi, 30);
  const mail = (e) => somma(contatori, ult30, (x) => x === `mail.${e}`);
  const sveglia = ultimoGiorno(contatori, (e) => e === "sistema.sveglia");
  const visita = ultimoGiorno(contatori, (e) => e.startsWith("visita."));
  const ultimoLead = leads[0]?.created_at;
  // il sito promette "rispondo entro 24 ore": chi è ancora "nuovo" dopo un giorno aspetta
  const inAttesa = leads.filter((l) => (l.stato || "nuovo") === "nuovo" && giorniFa(l.created_at) >= 1);

  return (
    <div className="ad-sezione">
      <h2>Salute del sito</h2>
      <ul className="ad-controlli">
        {salute.database === "ok"
          ? <Controllo livello="ok" titolo="Database">Raggiungibile, risposta in {numero(salute.latenzaMs)} ms.</Controllo>
          : <Controllo livello="problema" titolo="Database">Non risponde: {salute.errori[0] || "errore sconosciuto"}. Se è fermo da giorni, potrebbe essere in pausa: riattivalo da Supabase.</Controllo>}

        {salute.migrazione === "ok"
          ? <Controllo livello="ok" titolo="Tabelle del pannello">Presenti: stato dei contatti, contatori e opzioni.</Controllo>
          : <Controllo livello="problema" titolo="Tabelle del pannello">Manca la migrazione: esegui <code>supabase/admin.sql</code> nel SQL Editor del database del sito.</Controllo>}

        {sveglia && giorniFa(`${sveglia}T12:00:00Z`) <= 2
          ? <Controllo livello="ok" titolo="Sveglia del database">Ultima {fa(sveglia)}. Ogni mattina tiene sveglio Supabase, che altrimenti dopo una settimana senza uso si mette in pausa (e con lui modulo e demo).</Controllo>
          : <Controllo livello="attenzione" titolo="Sveglia del database">{sveglia ? `Ultima ${fa(sveglia)}: dovrebbe girare ogni mattina.` : "Non ancora eseguita: parte ogni mattina alle 6 (ora UTC), dal primo giorno dopo la pubblicazione."}</Controllo>}

        {!salute.configurazione.mail
          ? <Controllo livello="problema" titolo="Avviso via mail">Chiave Resend assente su Vercel: i contatti si salvano ma non ti arriva la mail.</Controllo>
          : !opzioni.avviso_mail_attivo
            ? <Controllo livello="attenzione" titolo="Avviso via mail">Spento dalle Opzioni: i contatti arrivano solo qui.</Controllo>
            : mail("errore") > 0
              ? <Controllo livello="attenzione" titolo="Avviso via mail">{numero(mail("errore"))} invii falliti negli ultimi 30 giorni ({numero(mail("inviata"))} riusciti). Controlla su Resend.</Controllo>
              : <Controllo livello="ok" titolo="Avviso via mail">Attivo verso {opzioni.avviso_mail_a || salute.destinatarioPredefinito}. Ultimi 30 giorni: {numero(mail("inviata"))} inviate, {numero(mail("scartata"))} scartate come spam.</Controllo>}

        {inAttesa.length
          ? <Controllo livello="attenzione" titolo="Contatti in attesa">{inAttesa.length === 1 ? "1 contatto è" : `${inAttesa.length} contatti sono`} ancora «nuovi» da più di 24 ore, ma il sito promette risposta entro un giorno. Il più vecchio: {dataBreve(inAttesa[inAttesa.length - 1].created_at)}.</Controllo>
          : <Controllo livello="ok" titolo="Contatti in attesa">Nessuno aspetta da più di 24 ore.</Controllo>}

        <Controllo livello="info" titolo="Ultimo contatto">{ultimoLead ? `${dataOra(ultimoLead)} (${giorniFa(ultimoLead) === 0 ? "oggi" : `${giorniFa(ultimoLead)} giorni fa`}).` : "Nessuno ancora."}</Controllo>

        {visita
          ? <Controllo livello={giorniFa(`${visita}T12:00:00Z`) > 7 ? "attenzione" : "ok"} titolo="Contatori delle visite">Ultima visita registrata {fa(visita)}.</Controllo>
          : <Controllo livello="info" titolo="Contatori delle visite">Nessuna visita registrata ancora: si contano da quando il pannello è attivo.</Controllo>}

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
        </ul>
      </section>
    </div>
  );
}

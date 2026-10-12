import { useCallback, useEffect, useState } from "react";
import { BarChart3, Users, SlidersHorizontal, HeartPulse, RefreshCw, LogOut, Lock, AlertCircle } from "lucide-react";
import { chiama, seSessioneScade, statoDi, daRichiamare, impostaNonContare, giorniIndietro } from "./util";
import Panoramica from "./Panoramica";
import Contatti from "./Contatti";
import Opzioni from "./Opzioni";
import Salute from "./Salute";

const SCHEDE = [
  { id: "panoramica", etichetta: "Panoramica", Icona: BarChart3 },
  { id: "contatti", etichetta: "Contatti", Icona: Users },
  { id: "opzioni", etichetta: "Opzioni", Icona: SlidersHorizontal },
  { id: "salute", etichetta: "Salute", Icona: HeartPulse },
];
const schedaDa = (h) => (SCHEDE.some((s) => s.id === h) ? h : "panoramica");

/* Al primo accesso da un browser lo si segna come "di Danilo": le sue visite
   di prova non gonfiano i contatori. Si cambia dalle Opzioni. */
function segnaQuestoBrowser() {
  try {
    if (localStorage.getItem("a360_non_contare_scelto")) return;
    localStorage.setItem("a360_non_contare_scelto", "1");
    impostaNonContare(true);
  } catch { /* storage bloccato */ }
}

function Accesso({ onDentro, configurazione }) {
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(null);
  const [attesa, setAttesa] = useState(false);

  const entra = async (e) => {
    e.preventDefault();
    setAttesa(true); setErrore(null);
    const r = await chiama("login", { password });
    setAttesa(false);
    if (r.ok) { segnaQuestoBrowser(); onDentro(); }
    else setErrore(r.motivo || "Accesso non riuscito");
  };

  const nonPronto = configurazione && !configurazione.password;

  return (
    <div className="ad-accesso">
      <form className="ad-accesso-card" onSubmit={entra}>
        <img src="/logo-esteso.png" alt="Atleta360" height="40" />
        <h1>Pannello</h1>
        {nonPronto ? (
          <p className="ad-avviso"><AlertCircle size={16} /> La password del pannello non è ancora impostata su Vercel (ADMIN_PASSWORD).</p>
        ) : (
          <>
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" autoComplete="current-password" autoFocus
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {errore && <p className="ad-errore" role="alert"><AlertCircle size={16} /> {errore}</p>}
            <button className="ad-btn ad-btn-primario" disabled={attesa || !password}>
              <Lock size={16} /> {attesa ? "Verifico…" : "Entra"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default function Admin() {
  const [stato, setStato] = useState("verifica"); // verifica | fuori | dentro
  const [configurazione, setConfigurazione] = useState(null);
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState(null);
  const [carico, setCarico] = useState(false);
  const [scheda, setScheda] = useState(() => schedaDa(location.hash.slice(1)));
  // da aprire nella scheda Contatti (dalla Panoramica: "Al servizio", ricerca…)
  const [daAprire, setDaAprire] = useState(null);

  useEffect(() => { history.replaceState(null, "", `#${scheda}`); }, [scheda]);
  useEffect(() => {
    const cambio = () => setScheda(schedaDa(location.hash.slice(1)));
    window.addEventListener("hashchange", cambio);
    return () => window.removeEventListener("hashchange", cambio);
  }, []);

  // sessione scaduta durante il lavoro (anche da un'altra scheda): di nuovo la password
  useEffect(() => { seSessioneScade(() => { setDati(null); setStato("fuori"); }); return () => seSessioneScade(null); }, []);

  const carica = useCallback(async () => {
    setCarico(true); setErrore(null);
    const r = await chiama("dati");
    setCarico(false);
    if (r.stato === 401) { setStato("fuori"); return; }
    if (!r.ok) { setErrore(r.motivo || "Impossibile caricare i dati"); return; }
    // "caricato" cambia a ogni lettura dal server: le Opzioni si riallineano
    // (prima restavano ai valori del primo caricamento anche dopo "Aggiorna")
    setDati({ ...r, caricato: Date.now() });
  }, []);

  useEffect(() => {
    chiama("sessione").then((r) => {
      setConfigurazione(r.configurazione || null);
      if (r.dentro) { setStato("dentro"); carica(); } else setStato("fuori");
    });
  }, [carica]);

  const esci = async () => { await chiama("logout"); setDati(null); setStato("fuori"); };

  /* Modifiche locali senza ricaricare tutto: la lista resta dov'era. */
  const aggiornaLead = (lead) => setDati((d) => ({ ...d, leads: d.leads.map((l) => (l.id === lead.id ? lead : l)) }));
  const rimuoviLead = (ids) => setDati((d) => ({ ...d, leads: d.leads.filter((l) => !ids.includes(l.id)) }));
  const aggiornaOpzioni = (opzioni) => setDati((d) => ({ ...d, opzioni, opzioniAggiornate: new Date().toISOString() }));
  const apriContatto = (id) => { setDaAprire(id); setScheda("contatti"); };

  if (stato === "verifica") return <div className="ad-caricamento">Caricamento…</div>;
  if (stato === "fuori") return <Accesso configurazione={configurazione} onDentro={() => { setStato("dentro"); carica(); }} />;

  const veri = dati?.leads?.filter((l) => !l.sospetto) || [];
  const daFare = veri.filter((l) => statoDi(l) === "nuovo" || daRichiamare(l)).length;
  const erroriModulo = dati ? dati.contatori.filter((c) => c.evento.startsWith("form.errore.") && c.evento !== "form.errore.rete"
    && c.giorno >= giorniIndietro(dati.salute.oggi, 7)[0]).length : 0;
  const allarmi = dati ? (dati.salute.database !== "ok" ? 1 : 0) + (dati.salute.migrazione !== "ok" ? 1 : 0)
    + (dati.ultimoControllo?.esito === "problema" ? 1 : 0) + (erroriModulo ? 1 : 0) : 0;

  return (
    <div className="ad-app">
      <header className="ad-barra">
        <a href="/" className="ad-logo" title="Vai al sito"><img src="/logo-esteso.png" alt="Atleta360" height="30" /></a>
        <span className="ad-titolo">Pannello</span>
        <div className="ad-barra-azioni">
          <button className="ad-btn ad-btn-leggero" onClick={carica} disabled={carico} aria-label="Aggiorna i dati">
            <RefreshCw size={16} className={carico ? "ad-gira" : ""} /> <span className="ad-solo-largo">Aggiorna</span>
          </button>
          <button className="ad-btn ad-btn-leggero" onClick={esci} aria-label="Esci">
            <LogOut size={16} /> <span className="ad-solo-largo">Esci</span>
          </button>
        </div>
      </header>

      <nav className="ad-schede" role="tablist" aria-label="Sezioni del pannello">
        {SCHEDE.map(({ id, etichetta, Icona }) => (
          <button key={id} role="tab" aria-selected={scheda === id}
            className={`ad-scheda${scheda === id ? " attiva" : ""}`} onClick={() => setScheda(id)}>
            <Icona size={17} /> {etichetta}
            {id === "contatti" && daFare > 0 && <span className="ad-conta" aria-label={`${daFare} da fare`}>{daFare}</span>}
            {id === "salute" && allarmi > 0 && <span className="ad-conta ad-conta-allarme" aria-label="problemi da guardare">!</span>}
          </button>
        ))}
      </nav>

      <main className="ad-contenuto">
        {errore && <p className="ad-errore" role="alert"><AlertCircle size={16} /> {errore}</p>}
        {dati && !dati.salute.leadOk && (
          <p className="ad-errore" role="alert"><AlertCircle size={16} />
            I contatti non si sono potuti leggere dal database: quelli che vedi (o non vedi) non sono la situazione vera. Dettagli nella scheda Salute.
          </p>
        )}
        {dati && dati.salute.leadOk && !dati.salute.leadCompleti && (
          <p className="ad-avviso" role="alert"><AlertCircle size={16} /> I contatti sono più di 20.000: qui vedi solo i più recenti.</p>
        )}
        {!dati ? <div className="ad-caricamento">{errore ? "" : "Caricamento dei dati…"}</div> : (
          <>
            {scheda === "panoramica" && <Panoramica dati={dati} vaiA={setScheda} apriContatto={apriContatto} onAggiorna={aggiornaLead}
              onSegni={(segni) => setDati((d) => ({ ...d, opzioni: { ...d.opzioni, segni } }))} />}
            {scheda === "contatti" && <Contatti leads={dati.leads} opzioni={dati.opzioni} migrazione2={dati.salute.migrazione2}
              daAprire={daAprire} onAperto={() => setDaAprire(null)} onAggiorna={aggiornaLead} onRimuovi={rimuoviLead} />}
            {scheda === "opzioni" && <Opzioni key={dati.caricato} opzioni={dati.opzioni} aggiornate={dati.opzioniAggiornate}
              predefinito={dati.salute.destinatarioPredefinito} salute={dati.salute} migrazione={dati.salute.migrazione} onSalvate={aggiornaOpzioni} />}
            {scheda === "salute" && <Salute dati={dati} vaiA={setScheda} />}
          </>
        )}
      </main>
    </div>
  );
}

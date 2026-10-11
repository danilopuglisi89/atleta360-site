import { useCallback, useEffect, useState } from "react";
import { BarChart3, Users, SlidersHorizontal, HeartPulse, RefreshCw, LogOut, Lock, AlertCircle } from "lucide-react";
import { chiama } from "./util";
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

function Accesso({ onDentro, configurazione }) {
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(null);
  const [attesa, setAttesa] = useState(false);

  const entra = async (e) => {
    e.preventDefault();
    setAttesa(true); setErrore(null);
    const r = await chiama("login", { password });
    setAttesa(false);
    if (r.ok) onDentro();
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
  const [scheda, setScheda] = useState(() => (location.hash.slice(1) || "panoramica"));

  useEffect(() => { history.replaceState(null, "", `#${scheda}`); }, [scheda]);

  const carica = useCallback(async () => {
    setCarico(true); setErrore(null);
    const r = await chiama("dati");
    setCarico(false);
    if (r.stato === 401) { setStato("fuori"); return; }
    if (!r.ok) { setErrore(r.motivo || "Impossibile caricare i dati"); return; }
    setDati(r);
  }, []);

  useEffect(() => {
    chiama("sessione").then((r) => {
      setConfigurazione(r.configurazione || null);
      if (r.dentro) { setStato("dentro"); carica(); } else setStato("fuori");
    }).catch(() => setStato("fuori"));
  }, [carica]);

  const esci = async () => { await chiama("logout"); setDati(null); setStato("fuori"); };

  /* Modifiche locali senza ricaricare tutto: la lista resta dov'era. */
  const aggiornaLead = (lead) => setDati((d) => ({ ...d, leads: d.leads.map((l) => (l.id === lead.id ? lead : l)) }));
  const rimuoviLead = (id) => setDati((d) => ({ ...d, leads: d.leads.filter((l) => l.id !== id) }));
  const aggiornaOpzioni = (opzioni) => setDati((d) => ({ ...d, opzioni, opzioniAggiornate: new Date().toISOString() }));

  if (stato === "verifica") return <div className="ad-caricamento">Caricamento…</div>;
  if (stato === "fuori") return <Accesso configurazione={configurazione} onDentro={() => { setStato("dentro"); carica(); }} />;

  const nuovi = dati?.leads?.filter((l) => (l.stato || "nuovo") === "nuovo").length || 0;
  const allarmi = dati ? (dati.salute.database !== "ok" ? 1 : 0) + (dati.salute.migrazione !== "ok" ? 1 : 0) : 0;

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
            {id === "contatti" && nuovi > 0 && <span className="ad-conta" aria-label={`${nuovi} nuovi`}>{nuovi}</span>}
            {id === "salute" && allarmi > 0 && <span className="ad-conta ad-conta-allarme" aria-label="problemi da guardare">!</span>}
          </button>
        ))}
      </nav>

      <main className="ad-contenuto">
        {errore && <p className="ad-errore" role="alert"><AlertCircle size={16} /> {errore}</p>}
        {!dati ? <div className="ad-caricamento">Caricamento dei dati…</div> : (
          <>
            {scheda === "panoramica" && <Panoramica dati={dati} vaiA={setScheda} />}
            {scheda === "contatti" && <Contatti leads={dati.leads} onAggiorna={aggiornaLead} onRimuovi={rimuoviLead} />}
            {scheda === "opzioni" && <Opzioni opzioni={dati.opzioni} aggiornate={dati.opzioniAggiornate}
              predefinito={dati.salute.destinatarioPredefinito} migrazione={dati.salute.migrazione} onSalvate={aggiornaOpzioni} />}
            {scheda === "salute" && <Salute dati={dati} />}
          </>
        )}
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Search, Download, X, Mail, Phone, MessageCircle, Trash2, AlertCircle, Check, ShieldCheck } from "lucide-react";
import { chiama, dataOra, dataBreve, STATI, etichettaStato, etichettaTipo, whatsapp, scaricaCsv } from "./util";

function Scheda({ lead, onChiudi, onAggiorna, onRimuovi }) {
  const [note, setNote] = useState(lead.note || "");
  const [salvataggio, setSalvataggio] = useState(null); // null | "in corso" | "fatto" | errore
  const [conferma, setConferma] = useState(false);
  const [elimina, setElimina] = useState(null);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onChiudi();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onChiudi]);

  const salva = async (modifiche) => {
    setSalvataggio("in corso");
    const r = await chiama("lead.aggiorna", { id: lead.id, ...modifiche });
    if (r.ok) { onAggiorna(r.lead); setSalvataggio("fatto"); setTimeout(() => setSalvataggio(null), 1500); }
    else setSalvataggio(r.motivo || "non salvato");
  };

  const cancella = async () => {
    setElimina("in corso");
    const r = await chiama("lead.elimina", { id: lead.id });
    if (r.ok) { onRimuovi(lead.id); onChiudi(); }
    else setElimina(r.motivo || "non eliminato");
  };

  const wa = whatsapp(lead.telefono);
  const nome = `${lead.nome} ${lead.cognome}`.trim();

  return (
    <div className="ad-velo" onClick={onChiudi}>
      <aside className="ad-scheda-lead" role="dialog" aria-modal="true" aria-label={nome} onClick={(e) => e.stopPropagation()}>
        <div className="ad-scheda-testa">
          <div>
            <h3>{nome}</h3>
            <span className={`ad-tipo ad-tipo-${lead.tipo}`}>{etichettaTipo(lead.tipo)}</span>
          </div>
          <button className="ad-btn ad-btn-icona" onClick={onChiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>

        <div className="ad-azioni-rapide">
          <a className="ad-btn ad-btn-primario" href={`mailto:${lead.email}`}><Mail size={16} /> Email</a>
          {wa && <a className="ad-btn ad-btn-leggero" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
          {lead.telefono && <a className="ad-btn ad-btn-leggero" href={`tel:${lead.telefono.replace(/\s/g, "")}`}><Phone size={16} /> Chiama</a>}
        </div>

        <dl className="ad-dati">
          <dt>Email</dt><dd>{lead.email}</dd>
          <dt>Telefono</dt><dd>{lead.telefono || "—"}</dd>
          <dt>Società</dt><dd>{lead.societa || "—"}</dd>
          <dt>Ruolo</dt><dd>{lead.ruolo || "—"}</dd>
          <dt>Ricevuto</dt><dd>{dataOra(lead.created_at)}</dd>
          <dt>Consenso</dt>
          <dd>{lead.consenso_privacy
            ? <><ShieldCheck size={14} /> {dataOra(lead.consenso_data)}{lead.informativa_versione ? ` · informativa ${lead.informativa_versione}` : ""}</>
            : "non registrato (lead precedente al consenso)"}</dd>
        </dl>

        <label className="ad-etichetta">Stato</label>
        <div className="ad-segmenti ad-segmenti-pieni" role="radiogroup" aria-label="Stato">
          {STATI.map((s) => (
            <button key={s.id} role="radio" aria-checked={(lead.stato || "nuovo") === s.id}
              className={(lead.stato || "nuovo") === s.id ? "attivo" : ""} onClick={() => salva({ stato: s.id })}>
              {s.etichetta}
            </button>
          ))}
        </div>

        <label className="ad-etichetta" htmlFor="note">Note</label>
        <textarea id="note" className="ad-campo" rows={4} value={note} maxLength={4000}
          placeholder="Cosa vi siete detti, prossimo passo…" onChange={(e) => setNote(e.target.value)} />
        <div className="ad-riga-salva">
          <button className="ad-btn ad-btn-primario" disabled={note === (lead.note || "") || salvataggio === "in corso"}
            onClick={() => salva({ note })}>Salva note</button>
          {salvataggio === "fatto" && <span className="ad-ok"><Check size={15} /> Salvato</span>}
          {salvataggio && !["fatto", "in corso"].includes(salvataggio) && <span className="ad-errore-inline"><AlertCircle size={15} /> {salvataggio}</span>}
        </div>
        {lead.aggiornato_il && <p className="ad-piccolo">Ultima modifica: {dataOra(lead.aggiornato_il)}</p>}

        <div className="ad-zona-pericolo">
          {!conferma ? (
            <button className="ad-btn ad-btn-pericolo-leggero" onClick={() => setConferma(true)}>
              <Trash2 size={16} /> Elimina contatto
            </button>
          ) : (
            <div className="ad-conferma">
              <p><strong>Eliminare {nome} per sempre?</strong> Serve quando qualcuno chiede la cancellazione dei suoi dati (GDPR). Non si può annullare.</p>
              <div className="ad-riga-salva">
                <button className="ad-btn ad-btn-pericolo" onClick={cancella} disabled={elimina === "in corso"}>
                  <Trash2 size={16} /> Elimina definitivamente
                </button>
                <button className="ad-btn ad-btn-leggero" onClick={() => setConferma(false)}>Annulla</button>
              </div>
              {elimina && elimina !== "in corso" && <span className="ad-errore-inline"><AlertCircle size={15} /> {elimina}</span>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function Contatti({ leads, onAggiorna, onRimuovi }) {
  const [cerca, setCerca] = useState("");
  const [stato, setStato] = useState("tutti");
  const [tipo, setTipo] = useState("tutti");
  const [aperto, setAperto] = useState(null);

  const filtrati = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return leads.filter((l) =>
      (stato === "tutti" || (l.stato || "nuovo") === stato) &&
      (tipo === "tutti" || l.tipo === tipo) &&
      (!q || [l.nome, l.cognome, l.email, l.societa, l.ruolo, l.telefono].some((v) => String(v || "").toLowerCase().includes(q))));
  }, [leads, cerca, stato, tipo]);

  const conteggi = useMemo(() => Object.fromEntries(STATI.map((s) => [s.id, leads.filter((l) => (l.stato || "nuovo") === s.id).length])), [leads]);
  const leadAperto = aperto && leads.find((l) => l.id === aperto);

  const esporta = () => scaricaCsv(`atleta360-contatti-${new Date().toISOString().slice(0, 10)}.csv`, filtrati, [
    { titolo: "Ricevuto", valore: (l) => dataOra(l.created_at) },
    { titolo: "Tipo", valore: (l) => etichettaTipo(l.tipo) },
    { titolo: "Nome", valore: (l) => l.nome },
    { titolo: "Cognome", valore: (l) => l.cognome },
    { titolo: "Email", valore: (l) => l.email },
    { titolo: "Telefono", valore: (l) => l.telefono },
    { titolo: "Società", valore: (l) => l.societa },
    { titolo: "Ruolo", valore: (l) => l.ruolo },
    { titolo: "Stato", valore: (l) => etichettaStato(l.stato) },
    { titolo: "Note", valore: (l) => l.note },
    { titolo: "Consenso privacy", valore: (l) => (l.consenso_privacy ? dataOra(l.consenso_data) : "") },
  ]);

  return (
    <div className="ad-sezione">
      <div className="ad-sezione-testa">
        <h2>Contatti <span className="ad-conta-testo">{filtrati.length} di {leads.length}</span></h2>
        <button className="ad-btn ad-btn-leggero" onClick={esporta} disabled={!filtrati.length}>
          <Download size={16} /> Esporta CSV
        </button>
      </div>

      <div className="ad-filtri">
        <label className="ad-cerca">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Cerca nome, email, società…" value={cerca}
            onChange={(e) => setCerca(e.target.value)} aria-label="Cerca nei contatti" />
        </label>
        <select className="ad-campo ad-select" value={stato} onChange={(e) => setStato(e.target.value)} aria-label="Filtra per stato">
          <option value="tutti">Tutti gli stati</option>
          {STATI.map((s) => <option key={s.id} value={s.id}>{s.etichetta} ({conteggi[s.id]})</option>)}
        </select>
        <select className="ad-campo ad-select" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtra per tipo">
          <option value="tutti">Atleti e società</option>
          <option value="atleta">Solo atleti</option>
          <option value="societa">Solo società</option>
        </select>
      </div>

      {!leads.length ? (
        <p className="ad-vuoto">Nessun contatto ancora. Arriveranno qui appena qualcuno compila il modulo.</p>
      ) : !filtrati.length ? (
        <p className="ad-vuoto">Nessun contatto con questi filtri.</p>
      ) : (
        <ul className="ad-lista">
          {filtrati.map((l) => (
            <li key={l.id}>
              <button className="ad-riga-lead" onClick={() => setAperto(l.id)}>
                <span className="ad-riga-nome">
                  <strong>{l.nome} {l.cognome}</strong>
                  <span className="ad-riga-sotto">{l.societa || l.email}</span>
                </span>
                <span className={`ad-tipo ad-tipo-${l.tipo}`}>{etichettaTipo(l.tipo)}</span>
                <span className={`ad-stato ad-stato-${l.stato || "nuovo"}`}>{etichettaStato(l.stato)}</span>
                <span className="ad-riga-data">{dataBreve(l.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {leadAperto && <Scheda key={leadAperto.id} lead={leadAperto} onChiudi={() => setAperto(null)}
        onAggiorna={onAggiorna} onRimuovi={onRimuovi} />}
    </div>
  );
}

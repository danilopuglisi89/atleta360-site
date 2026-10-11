import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Download, X, Mail, Phone, MessageCircle, Trash2, AlertCircle, Check, ShieldCheck,
  CalendarClock, NotebookPen, Users2, ShieldAlert, Globe, Instagram, Thermometer, Info,
} from "lucide-react";
import {
  chiama, dataOra, dataBreve, dataIso, oggiRoma, spostaGiorno, giorniFa, quandoFa,
  STATI, statoDi, etichettaStato, etichettaTipo, whatsapp, riempi, scaricaCsv,
  temperatura, daRichiamare, oltre24Mesi, doppioni, ultimoTocco,
} from "./util";

const RICHIAMI = [["Domani", 1], ["Fra 3 giorni", 3], ["Fra una settimana", 7], ["Fra un mese", 30]];

function Termometro({ lead, conTesto }) {
  const t = temperatura(lead);
  if (!t) return conTesto ? null : <span className="ad-termo ad-termo-vuoto" aria-hidden="true" />;
  return (
    <span className={`ad-termo ad-termo-${t.id}${conTesto ? " con-testo" : ""}`} title={`${t.etichetta}: ${t.nota}`}>
      {conTesto ? <><Thermometer size={13} /> {t.etichetta} · {t.nota}</> : <span className="ad-sr">{t.etichetta}</span>}
    </span>
  );
}

function Scheda({ lead, opzioni, gruppo, tutti, migrazione2, onChiudi, onApri, onAggiorna, onRimuovi }) {
  const [note, setNote] = useState(lead.note || "");
  const [voce, setVoce] = useState("");
  const [salvataggio, setSalvataggio] = useState(null); // null | "in corso" | "fatto" | errore
  const [conferma, setConferma] = useState(false);
  const [elimina, setElimina] = useState(null);
  const sporco = note !== (lead.note || "") || voce.trim() !== "";
  const sporcoRef = useRef(sporco);
  sporcoRef.current = sporco;

  /* Chiudere con appunti non salvati li perdeva in silenzio (Esc anche dentro il campo). */
  const chiudi = () => {
    if (sporcoRef.current && !window.confirm("Hai scritto qualcosa che non è ancora salvato. Chiudere lo stesso?")) return;
    onChiudi();
  };
  const apriAltro = (id) => {
    if (sporcoRef.current && !window.confirm("Hai scritto qualcosa che non è ancora salvato. Passare all'altra richiesta?")) return;
    onApri(id);
  };
  const chiudiRef = useRef(chiudi);
  chiudiRef.current = chiudi;

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && chiudiRef.current();
    window.addEventListener("keydown", esc);
    const via = (e) => { if (sporcoRef.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", via);
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("beforeunload", via); };
  }, []);

  const esegui = async (azione, dati, dopo) => {
    setSalvataggio("in corso");
    const r = await chiama(azione, { id: lead.id, ...dati });
    if (r.ok) { onAggiorna(r.lead); dopo?.(); setSalvataggio("fatto"); setTimeout(() => setSalvataggio(null), 1500); }
    else setSalvataggio(r.motivo || "non salvato");
  };
  const salva = (modifiche) => esegui("lead.aggiorna", modifiche);

  const cancella = async () => {
    setElimina("in corso");
    const r = await chiama("lead.elimina", { id: lead.id });
    if (r.ok) { onRimuovi([lead.id]); onChiudi(); }
    else setElimina(r.motivo || "non eliminato");
  };

  const testo = riempi(lead.tipo === "atleta" ? opzioni.modello_atleta : opzioni.modello_societa, lead);
  const oggetto = riempi(opzioni.modello_oggetto, lead);
  const wa = whatsapp(lead.telefono, testo);
  const nome = `${lead.nome} ${lead.cognome}`.trim();
  const oggi = oggiRoma();
  const diario = Array.isArray(lead.diario) ? [...lead.diario].reverse() : [];
  const altri = gruppo ? tutti.filter((l) => gruppo.has(l.id) && l.id !== lead.id) : [];
  const cerca = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

  return (
    <div className="ad-velo" onClick={chiudi}>
      <aside className="ad-scheda-lead" role="dialog" aria-modal="true" aria-label={nome} onClick={(e) => e.stopPropagation()}>
        <div className="ad-scheda-testa">
          <div>
            <h3>{nome}</h3>
            <div className="ad-etichette">
              <span className={`ad-tipo ad-tipo-${lead.tipo}`}>{etichettaTipo(lead.tipo)}</span>
              <Termometro lead={lead} conTesto />
            </div>
          </div>
          <button className="ad-btn ad-btn-icona" onClick={chiudi} aria-label="Chiudi"><X size={18} /></button>
        </div>

        {lead.sospetto && (
          <p className="ad-avviso"><ShieldAlert size={16} /> Sospetto: il modulo è stato compilato in meno di 2,5 secondi, di solito è un programma. Non ti è arrivata la mail.</p>
        )}

        <div className="ad-azioni-rapide">
          <a className="ad-btn ad-btn-primario" href={`mailto:${lead.email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`}><Mail size={16} /> Email</a>
          {wa && <a className="ad-btn ad-btn-leggero" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
          {lead.telefono && <a className="ad-btn ad-btn-leggero" href={`tel:${lead.telefono.replace(/\s/g, "")}`}><Phone size={16} /> Chiama</a>}
        </div>
        <p className="ad-piccolo">Email e WhatsApp si aprono col messaggio già scritto (lo cambi dalle Opzioni).</p>

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

        {lead.societa && (
          <div className="ad-scout">
            <span className="ad-etichetta">Prima di chiamare</span>
            <div className="ad-azioni-rapide">
              <a className="ad-btn ad-btn-leggero ad-btn-piccolo" href={cerca(`${lead.societa} pallavolo`)} target="_blank" rel="noreferrer"><Globe size={14} /> Cerca la società</a>
              <a className="ad-btn ad-btn-leggero ad-btn-piccolo" href={cerca(`${lead.societa} site:instagram.com`)} target="_blank" rel="noreferrer"><Instagram size={14} /> Su Instagram</a>
            </div>
          </div>
        )}

        {altri.length > 0 && (
          <div className="ad-doppioni">
            <span className="ad-etichetta"><Users2 size={14} /> Ha scritto altre {altri.length === 1 ? "una volta" : `${altri.length} volte`}</span>
            <ul>
              {altri.map((l) => (
                <li key={l.id}><button className="ad-link-btn" onClick={() => apriAltro(l.id)}>
                  {dataBreve(l.created_at)} · {etichettaTipo(l.tipo)} · {etichettaStato(statoDi(l))}
                </button></li>
              ))}
            </ul>
          </div>
        )}

        <label className="ad-etichetta">Stato</label>
        <div className="ad-segmenti ad-segmenti-pieni" role="radiogroup" aria-label="Stato">
          {STATI.map((s) => (
            <button key={s.id} role="radio" aria-checked={statoDi(lead) === s.id}
              className={statoDi(lead) === s.id ? "attivo" : ""} onClick={() => salva({ stato: s.id })}>
              {s.etichetta}
            </button>
          ))}
        </div>

        <label className="ad-etichetta" htmlFor="ricontatta"><CalendarClock size={14} /> Ricontatta il</label>
        {migrazione2 !== "ok" ? (
          <p className="ad-piccolo">Si attiva dopo aver eseguito <code>supabase/admin-2.sql</code>.</p>
        ) : (
          <>
            <div className="ad-riga-salva">
              <input id="ricontatta" type="date" className="ad-campo ad-campo-data" value={lead.ricontatta_il || ""}
                onChange={(e) => salva({ ricontatta_il: e.target.value || null })} />
              {lead.ricontatta_il && <button className="ad-btn ad-btn-leggero ad-btn-piccolo" onClick={() => salva({ ricontatta_il: null })}>Togli</button>}
            </div>
            <div className="ad-pillole">
              {RICHIAMI.map(([t, n]) => (
                <button key={n} className="ad-pillola" onClick={() => salva({ ricontatta_il: spostaGiorno(oggi, n) })}>{t}</button>
              ))}
            </div>
            {daRichiamare(lead, oggi) && <p className="ad-avviso"><CalendarClock size={16} /> Da richiamare {lead.ricontatta_il === oggi ? "oggi" : `dal ${dataBreve(`${lead.ricontatta_il}T12:00:00Z`)}`}.</p>}
          </>
        )}

        <label className="ad-etichetta" htmlFor="note">Appunti</label>
        <textarea id="note" className="ad-campo" rows={3} value={note} maxLength={4000}
          placeholder="Chi è, cosa gli interessa…" onChange={(e) => setNote(e.target.value)} />
        <div className="ad-riga-salva">
          <button className="ad-btn ad-btn-primario" disabled={note === (lead.note || "") || salvataggio === "in corso"}
            onClick={() => salva({ note })}>Salva appunti</button>
          {salvataggio === "fatto" && <span className="ad-ok"><Check size={15} /> Salvato</span>}
          {salvataggio && !["fatto", "in corso"].includes(salvataggio) && <span className="ad-errore-inline"><AlertCircle size={15} /> {salvataggio}</span>}
        </div>

        <label className="ad-etichetta" htmlFor="diario"><NotebookPen size={14} /> Diario dei contatti</label>
        {migrazione2 !== "ok" ? (
          <p className="ad-piccolo">Si attiva dopo aver eseguito <code>supabase/admin-2.sql</code>.</p>
        ) : (
          <>
            <div className="ad-diario-nuovo">
              <input id="diario" className="ad-campo" value={voce} maxLength={2000} placeholder="Es. chiamato, richiamare giovedì"
                onChange={(e) => setVoce(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && voce.trim()) esegui("lead.diario", { testo: voce }, () => setVoce("")); }} />
              <button className="ad-btn ad-btn-leggero" disabled={!voce.trim() || salvataggio === "in corso"}
                onClick={() => esegui("lead.diario", { testo: voce }, () => setVoce(""))}>Aggiungi</button>
            </div>
            {diario.length > 0 && (
              <ol className="ad-diario">
                {diario.map((v) => (
                  <li key={v.quando}>
                    <span className="ad-diario-quando">{dataOra(v.quando)}</span>
                    <span className="ad-diario-testo">{v.testo}</span>
                    <button className="ad-btn ad-btn-icona ad-btn-mini" aria-label="Togli questa voce"
                      onClick={() => window.confirm("Togliere questa voce dal diario?") && esegui("lead.diario", { togli: v.quando })}><X size={14} /></button>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
        {lead.aggiornato_il && <p className="ad-piccolo">Ultima modifica: {dataOra(lead.aggiornato_il)}</p>}

        <div className="ad-zona-pericolo">
          {!conferma ? (
            <button className="ad-btn ad-btn-pericolo-leggero" onClick={() => setConferma(true)}>
              <Trash2 size={16} /> Elimina contatto
            </button>
          ) : (
            <div className="ad-conferma">
              <p><strong>Eliminare {nome} per sempre?</strong> Serve quando qualcuno chiede la cancellazione dei suoi dati (GDPR). Non si può annullare.</p>
              <p>Restano copie altrove, da cancellare a mano: la <strong>mail di avviso</strong> nella tua casella, lo <strong>storico su Resend</strong> e i <strong>CSV</strong> che hai scaricato.</p>
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

const PERIODI = [["sempre", "Da sempre"], ["7", "Ultimi 7 giorni"], ["30", "Ultimi 30 giorni"], ["90", "Ultimi 90 giorni"], ["365", "Ultimo anno"]];
const ORDINI = [["recenti", "Più recenti"], ["vecchi", "Più vecchi"], ["richiamo", "Richiamo più vicino"], ["freddi", "I più freddi"], ["nome", "Nome A-Z"]];

export default function Contatti({ leads, opzioni, migrazione2, daAprire, onAperto, onAggiorna, onRimuovi }) {
  const [cerca, setCerca] = useState("");
  const [stato, setStato] = useState("tutti");
  const [tipo, setTipo] = useState("tutti");
  const [periodo, setPeriodo] = useState("sempre");
  const [ordine, setOrdine] = useState("recenti");
  const [aperto, setAperto] = useState(null);
  const [eliminaMolti, setEliminaMolti] = useState(null);
  const oggi = oggiRoma();

  useEffect(() => { if (daAprire) { setAperto(daAprire); onAperto?.(); } }, [daAprire, onAperto]);

  const gruppi = useMemo(() => doppioni(leads), [leads]);

  const filtrati = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    const giorni = periodo === "sempre" ? null : Number(periodo);
    const lista = leads.filter((l) => {
      const st = statoDi(l);
      const passaStato = stato === "tutti" ? true
        : stato === "richiamare" ? daRichiamare(l, oggi)
        : stato === "sospetti" ? l.sospetto
        : stato === "vecchi" ? oltre24Mesi(l, oggi)
        : st === stato && !l.sospetto;
      const testi = [l.nome, l.cognome, l.email, l.societa, l.ruolo, l.telefono, l.note, ...(Array.isArray(l.diario) ? l.diario.map((v) => v.testo) : [])];
      return passaStato &&
        (tipo === "tutti" || l.tipo === tipo) &&
        (!giorni || giorniFa(l.created_at, oggi) < giorni) &&
        (!q || testi.some((v) => String(v || "").toLowerCase().includes(q)));
    });
    const freddo = (l) => (temperatura(l) ? giorniFa(ultimoTocco(l), oggi) : -1);
    const per = {
      recenti: (a, b) => b.created_at.localeCompare(a.created_at),
      vecchi: (a, b) => a.created_at.localeCompare(b.created_at),
      richiamo: (a, b) => (a.ricontatta_il || "9999").localeCompare(b.ricontatta_il || "9999") || b.created_at.localeCompare(a.created_at),
      freddi: (a, b) => freddo(b) - freddo(a),
      nome: (a, b) => `${a.nome} ${a.cognome}`.localeCompare(`${b.nome} ${b.cognome}`, "it"),
    }[ordine];
    return [...lista].sort(per);
  }, [leads, cerca, stato, tipo, periodo, ordine, oggi]);

  const conteggi = useMemo(() => ({
    ...Object.fromEntries(STATI.map((s) => [s.id, leads.filter((l) => statoDi(l) === s.id && !l.sospetto).length])),
    richiamare: leads.filter((l) => daRichiamare(l, oggi)).length,
    sospetti: leads.filter((l) => l.sospetto).length,
    vecchi: leads.filter((l) => oltre24Mesi(l, oggi)).length,
  }), [leads, oggi]);
  const leadAperto = aperto && leads.find((l) => l.id === aperto);

  const esporta = () => scaricaCsv(`atleta360-contatti-${oggi}.csv`, filtrati, [
    { titolo: "Ricevuto", valore: (l) => dataIso(l.created_at) },
    { titolo: "Tipo", valore: (l) => etichettaTipo(l.tipo) },
    { titolo: "Nome", valore: (l) => l.nome },
    { titolo: "Cognome", valore: (l) => l.cognome },
    { titolo: "Email", valore: (l) => l.email },
    { titolo: "Telefono", valore: (l) => l.telefono, testo: true },
    { titolo: "Società", valore: (l) => l.societa },
    { titolo: "Ruolo", valore: (l) => l.ruolo },
    { titolo: "Stato", valore: (l) => etichettaStato(statoDi(l)) },
    { titolo: "Ricontatta il", valore: (l) => l.ricontatta_il || "" },
    { titolo: "Appunti", valore: (l) => l.note },
    { titolo: "Diario", valore: (l) => (Array.isArray(l.diario) ? l.diario.map((v) => `${dataIso(v.quando)} ${v.testo}`).join(" | ") : "") },
    { titolo: "Sospetto", valore: (l) => (l.sospetto ? "sì" : "") },
    { titolo: "Consenso privacy", valore: (l) => (l.consenso_privacy ? dataIso(l.consenso_data) : "") },
  ]);

  const cancellaTutti = async () => {
    setEliminaMolti("in corso");
    const ids = filtrati.map((l) => l.id);
    let fatti = [];
    for (let i = 0; i < ids.length; i += 200) {
      const r = await chiama("lead.eliminaMolti", { ids: ids.slice(i, i + 200) });
      if (!r.ok) { setEliminaMolti(r.motivo || "non eliminati"); onRimuovi(fatti); return; }
      fatti = fatti.concat(r.eliminati || []);
    }
    onRimuovi(fatti);
    setEliminaMolti(null);
  };

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
          <input type="search" placeholder="Cerca nome, email, società, appunti…" value={cerca}
            onChange={(e) => setCerca(e.target.value)} aria-label="Cerca nei contatti" />
        </label>
        <select className="ad-campo ad-select" value={stato} onChange={(e) => setStato(e.target.value)} aria-label="Filtra per stato">
          <option value="tutti">Tutti gli stati</option>
          {STATI.map((s) => <option key={s.id} value={s.id}>{s.etichetta} ({conteggi[s.id]})</option>)}
          <option value="richiamare">Da richiamare ({conteggi.richiamare})</option>
          <option value="sospetti">Sospetti ({conteggi.sospetti})</option>
          <option value="vecchi">Oltre 24 mesi ({conteggi.vecchi})</option>
        </select>
        <select className="ad-campo ad-select" value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Filtra per tipo">
          <option value="tutti">Atleti e società</option>
          <option value="atleta">Solo atleti</option>
          <option value="societa">Solo società</option>
        </select>
        <select className="ad-campo ad-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Filtra per data di arrivo">
          {PERIODI.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
        <select className="ad-campo ad-select" value={ordine} onChange={(e) => setOrdine(e.target.value)} aria-label="Ordina">
          {ORDINI.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      <p className="ad-legenda"><Thermometer size={14} aria-hidden="true" /> Termometro:
        <span><i className="ad-termo ad-termo-caldo" /> sentito da meno di 3 giorni</span>
        <span><i className="ad-termo ad-termo-tiepido" /> 3-6</span>
        <span><i className="ad-termo ad-termo-freddo" /> 7-13</span>
        <span><i className="ad-termo ad-termo-ghiaccio" /> 14 e oltre, in panchina</span>
      </p>

      {stato === "vecchi" && filtrati.length > 0 && (
        <div className="ad-conferma">
          <p><Info size={15} /> L'informativa promette di tenere i dati al massimo <strong>24 mesi dall'ultimo contatto</strong>. Questi {filtrati.length} li hanno superati.</p>
          {eliminaMolti !== "conferma" ? (
            <div className="ad-riga-salva">
              <button className="ad-btn ad-btn-pericolo-leggero" onClick={() => setEliminaMolti("conferma")} disabled={eliminaMolti === "in corso"}>
                <Trash2 size={16} /> Elimina questi {filtrati.length}
              </button>
              {eliminaMolti && eliminaMolti !== "in corso" && <span className="ad-errore-inline"><AlertCircle size={15} /> {eliminaMolti}</span>}
            </div>
          ) : (
            <div className="ad-riga-salva">
              <button className="ad-btn ad-btn-pericolo" onClick={cancellaTutti}><Trash2 size={16} /> Sì, elimina definitivamente</button>
              <button className="ad-btn ad-btn-leggero" onClick={() => setEliminaMolti(null)}>Annulla</button>
            </div>
          )}
        </div>
      )}

      {!leads.length ? (
        <p className="ad-vuoto">Nessun contatto ancora. Arriveranno qui appena qualcuno compila il modulo.</p>
      ) : !filtrati.length ? (
        <p className="ad-vuoto">Nessun contatto con questi filtri.</p>
      ) : (
        <ul className="ad-lista">
          {filtrati.map((l) => {
            const volte = gruppi.get(l.id)?.size || 1;
            return (
              <li key={l.id}>
                <button className="ad-riga-lead" onClick={() => setAperto(l.id)}>
                  <span className="ad-riga-nome">
                    <strong><Termometro lead={l} /> {l.nome} {l.cognome}</strong>
                    <span className="ad-riga-sotto">
                      {l.societa || l.email}
                      {volte > 1 && <span className="ad-segno"><Users2 size={12} /> {volte} richieste</span>}
                      {l.sospetto && <span className="ad-segno ad-segno-sospetto"><ShieldAlert size={12} /> sospetto</span>}
                      {daRichiamare(l, oggi) && <span className="ad-segno ad-segno-richiamo"><CalendarClock size={12} /> richiamare</span>}
                    </span>
                  </span>
                  <span className={`ad-tipo ad-tipo-${l.tipo}`}>{etichettaTipo(l.tipo)}</span>
                  <span className={`ad-stato ad-stato-${statoDi(l)}`}>{etichettaStato(statoDi(l))}</span>
                  <span className="ad-riga-data" title={dataOra(l.created_at)}>{giorniFa(l.created_at, oggi) < 7 ? quandoFa(l.created_at) : dataBreve(l.created_at)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {leadAperto && <Scheda key={leadAperto.id} lead={leadAperto} opzioni={opzioni} gruppo={gruppi.get(leadAperto.id)} tutti={leads}
        migrazione2={migrazione2} onChiudi={() => setAperto(null)} onApri={setAperto}
        onAggiorna={onAggiorna} onRimuovi={onRimuovi} />}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Download, Copy, Check, Trash2, AlertCircle, Mail, ShieldAlert, Megaphone, UserCheck, UserX } from "lucide-react";
import { chiama, dataOra, dataIso, scaricaCsv, oggiRoma } from "./util";

/* Iscritti ai webinar (tabella "iscrizioni", supabase/admin-5.sql).
   Il link del webinar lo mandi tu: "Copia le email" le mette in fila per il
   campo Ccn, così nessuno vede gli indirizzi degli altri. Si può scrivere
   per altro (proposte su Atleta360) solo a chi ha spuntato "novità". */

const nomeEvento = (e) => (e === "prossimo" ? "Avvisami per il prossimo" : `Webinar del ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${e}T12:00:00Z`))}`);

export default function Iscritti({ iscrizioni, migrazione5, onAggiorna, onRimuovi }) {
  const eventi = useMemo(() => [...new Set(iscrizioni.map((i) => i.evento))].sort().reverse(), [iscrizioni]);
  const [evento, setEvento] = useState(() => eventi.find((e) => e !== "prossimo") || eventi[0] || "");
  const [copiato, setCopiato] = useState(null);
  const [errore, setErrore] = useState(null);

  const lista = iscrizioni.filter((i) => i.evento === evento);
  const veri = lista.filter((i) => !i.sospetto);
  const conNovita = veri.filter((i) => i.consenso_marketing);

  const copia = async (quali, chiave) => {
    try { await navigator.clipboard.writeText(quali.map((i) => i.email).join(", ")); setCopiato(chiave); setTimeout(() => setCopiato(null), 2000); }
    catch { setErrore("Il browser non permette di copiare: usa l'esportazione CSV."); }
  };
  const segna = async (i, presente) => {
    const r = await chiama("iscrizione.aggiorna", { id: i.id, presente });
    if (r.ok) onAggiorna(r.iscrizione); else setErrore(r.motivo || "non salvato");
  };
  const elimina = async (i) => {
    if (!window.confirm(`Eliminare l'iscrizione di ${i.nome} ${i.cognome}? Serve per le richieste di cancellazione (GDPR). Non si può annullare.`)) return;
    const r = await chiama("iscrizione.elimina", { id: i.id });
    if (r.ok) onRimuovi(i.id); else setErrore(r.motivo || "non eliminata");
  };
  const esporta = () => scaricaCsv(`atleta360-iscritti-${evento}-${oggiRoma()}.csv`, lista, [
    { titolo: "Iscritto il", valore: (i) => dataIso(i.created_at) },
    { titolo: "Nome", valore: (i) => i.nome }, { titolo: "Cognome", valore: (i) => i.cognome },
    { titolo: "Email", valore: (i) => i.email }, { titolo: "Telefono", valore: (i) => i.telefono, testo: true },
    { titolo: "Ruolo", valore: (i) => i.ruolo }, { titolo: "Società", valore: (i) => i.societa },
    { titolo: "Novità su Atleta360", valore: (i) => (i.consenso_marketing ? "sì" : "no") },
    { titolo: "Presente", valore: (i) => (i.presente == null ? "" : i.presente ? "sì" : "no") },
    { titolo: "Arrivato da", valore: (i) => [i.origine, i.origine_dettaglio].filter(Boolean).join(" · ") },
    { titolo: "Sospetto", valore: (i) => (i.sospetto ? "sì" : "") },
  ]);

  if (migrazione5 !== "ok") {
    return <p className="ad-nota avviso"><AlertCircle size={16} /> Gli iscritti ai webinar si salvano dopo aver eseguito <code>supabase/admin-5.sql</code> nel database del sito. Fino ad allora la pagina /webinar non riesce a registrare le iscrizioni.</p>;
  }

  return (
    <>
      <div className="ad-filtri">
        <select className="ad-campo ad-select" value={evento} onChange={(e) => setEvento(e.target.value)} aria-label="Webinar">
          {!eventi.length && <option value="">Nessun iscritto ancora</option>}
          {eventi.map((e) => <option key={e} value={e}>{nomeEvento(e)} ({iscrizioni.filter((i) => i.evento === e).length})</option>)}
        </select>
        <button className="ad-btn ad-btn-leggero" onClick={() => copia(veri, "tutti")} disabled={!veri.length}>
          {copiato === "tutti" ? <><Check size={16} /> Copiate</> : <><Copy size={16} /> Copia le email ({veri.length})</>}
        </button>
        <button className="ad-btn ad-btn-leggero" onClick={() => copia(conNovita, "novita")} disabled={!conNovita.length} title="Solo chi ha accettato di ricevere proposte su Atleta360">
          {copiato === "novita" ? <><Check size={16} /> Copiate</> : <><Megaphone size={16} /> Solo chi vuole novità ({conNovita.length})</>}
        </button>
        <button className="ad-btn ad-btn-leggero" onClick={esporta} disabled={!lista.length}><Download size={16} /> CSV</button>
      </div>
      <p className="ad-piccolo">Le email vanno incollate nel campo <strong>Ccn</strong>, così nessuno vede gli indirizzi degli altri. Proposte commerciali solo a chi ha detto sì alle novità.</p>
      {errore && <p className="ad-errore" role="alert"><AlertCircle size={16} /> {errore}</p>}

      {!lista.length ? <p className="ad-vuoto">Nessun iscritto ancora. Il link da far girare è <strong>atleta-360.com/webinar</strong>.</p> : (
        <ul className="ad-lista">
          {lista.map((i) => (
            <li key={i.id} className="ad-iscritto">
              <div className="ad-riga-nome">
                <strong>{i.nome} {i.cognome}</strong>
                <span className="ad-riga-sotto">
                  {[i.ruolo, i.societa].filter(Boolean).join(" · ") || i.email}
                  {i.consenso_marketing && <span className="ad-segno ad-segno-richiamo"><Megaphone size={12} /> novità sì</span>}
                  {i.sospetto && <span className="ad-segno ad-segno-sospetto"><ShieldAlert size={12} /> sospetto</span>}
                </span>
                <span className="ad-piccolo">{i.email}{i.telefono ? ` · ${i.telefono}` : ""} · iscritto {dataOra(i.created_at)}{i.origine ? ` · da ${i.origine}` : ""}</span>
              </div>
              <div className="ad-azioni-rapide">
                <a className="ad-btn ad-btn-leggero ad-btn-piccolo" href={`mailto:${i.email}`}><Mail size={14} /> Scrivi</a>
                {i.evento !== "prossimo" && <>
                  <button className={`ad-btn ad-btn-piccolo ${i.presente === true ? "ad-btn-primario" : "ad-btn-leggero"}`} onClick={() => segna(i, i.presente === true ? null : true)} aria-pressed={i.presente === true}><UserCheck size={14} /> C'era</button>
                  <button className={`ad-btn ad-btn-piccolo ${i.presente === false ? "ad-btn-primario" : "ad-btn-leggero"}`} onClick={() => segna(i, i.presente === false ? null : false)} aria-pressed={i.presente === false}><UserX size={14} /> Assente</button>
                </>}
                <button className="ad-btn ad-btn-icona ad-btn-mini" onClick={() => elimina(i)} aria-label="Elimina l'iscrizione"><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

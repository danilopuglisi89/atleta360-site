import { useEffect, useMemo, useState } from "react";
import {
  Eye, Smartphone, Clock, ScrollText, MousePointerClick, AlertCircle, Info, Search, MapPin,
  Monitor, Tablet, UserCheck,
} from "lucide-react";
import { chiama, numero, percento, dataBreve, giornoDi, oggiRoma, giorniFa } from "./util";

const PERIODI = [[1, "Oggi"], [7, "7 giorni"], [30, "30 giorni"], [90, "90 giorni"]];

const AZIONI = {
  "scelta.atleta": "ha scelto «atleta»",
  "scelta.societa": "ha scelto «società»",
  "form.aperto": "ha aperto il modulo",
  "form.inviato": "ha inviato la richiesta",
  "form.errore": "errore nel modulo",
  privacy: "ha letto la privacy",
  whatsapp: "ha cliccato WhatsApp",
  demo: "è entrato in demo",
  "webinar.iscritto": "si è iscritto al webinar",
};
const FONTI = {
  instagram: "Instagram", facebook: "Facebook", google: "Ricerca", linkedin: "LinkedIn", whatsapp: "WhatsApp",
  danilopuglisi: "danilopuglisi.com", email: "Email", diretto: "Diretto", altro: "Altro sito",
};
// codici ISO 3166-2 delle regioni italiane, come li manda Vercel
const REGIONI = {
  21: "Piemonte", 23: "Valle d'Aosta", 25: "Lombardia", 32: "Trentino-Alto Adige", 34: "Veneto",
  36: "Friuli-Venezia Giulia", 42: "Liguria", 45: "Emilia-Romagna", 52: "Toscana", 55: "Umbria",
  57: "Marche", 62: "Lazio", 65: "Abruzzo", 67: "Molise", 72: "Campania", 75: "Puglia",
  77: "Basilicata", 78: "Calabria", 82: "Sicilia", 88: "Sardegna",
};
const PAESI = new Intl.DisplayNames(["it"], { type: "region" });

const luogo = (v) => {
  const reg = v.paese === "IT" ? (REGIONI[v.regione] || v.regione) : null;
  const paese = v.paese && v.paese !== "IT" ? (() => { try { return PAESI.of(v.paese); } catch { return v.paese; } })() : null;
  return [v.citta, reg, paese].filter(Boolean).join(", ") || "sconosciuto";
};
const durata = (s) => (!s ? "pochi istanti" : s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);
const ora = (d) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
const quando = (d) => { const n = giorniFa(d); return `${n === 0 ? "oggi" : n === 1 ? "ieri" : dataBreve(d)} ${ora(d)}`; };
const oraDelGiorno = (d) => Number(new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "numeric", hourCycle: "h23" }).format(new Date(d)));
const IconaDispositivo = ({ tipo }) => (tipo === "telefono" ? <Smartphone size={14} /> : tipo === "tablet" ? <Tablet size={14} /> : <Monitor size={14} />);

function Classifica({ titolo, righe, totale }) {
  const max = Math.max(1, ...righe.map((r) => r.n));
  return (
    <section className="ad-card">
      <div className="ad-card-testa"><h3>{titolo}</h3></div>
      {!righe.length ? <p className="ad-vuoto">Ancora niente.</p> : (
        <ul className="ad-origini">
          {righe.map((r) => (
            <li key={r.nome}>
              <span>{r.nome}</span>
              <div className="ad-imbuto-traccia piccola"><div className="ad-imbuto-barra" style={{ width: `${(r.n / max) * 100}%` }} /></div>
              <strong title={percento(r.n, totale)}>{numero(r.n)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const conta = (lista, chiave, limite = 8) => {
  const m = new Map();
  for (const v of lista) { const k = chiave(v); if (k) m.set(k, (m.get(k) || 0) + 1); }
  return [...m].map(([nome, n]) => ({ nome, n })).sort((a, b) => b.n - a.n).slice(0, limite);
};

export default function Visite({ leads, apriContatto }) {
  const [giorni, setGiorni] = useState(7);
  const [dati, setDati] = useState(null);
  const [errore, setErrore] = useState(null);
  const [soloAttivi, setSoloAttivi] = useState(false);
  const [cerca, setCerca] = useState("");
  const [quante, setQuante] = useState(60);

  useEffect(() => {
    let vivo = true;
    setErrore(null);
    chiama("visite.elenco", { giorni: giorni === 1 ? 2 : giorni }).then((r) => {
      if (!vivo) return;
      if (r.ok) setDati(r); else setErrore(r.motivo || "registro non leggibile");
    });
    return () => { vivo = false; };
  }, [giorni]);

  const oggi = oggiRoma();
  const visite = useMemo(() => {
    // una riga senza data valida non deve far crollare la scheda intera
    const tutte = (dati?.visite || []).filter((v) => v.inizio && !Number.isNaN(new Date(v.inizio).getTime()));
    // "Oggi" = giorno di calendario a Roma (si carica anche ieri per sicurezza sul fuso)
    return giorni === 1 ? tutte.filter((v) => giornoDi(v.inizio) === oggi) : tutte;
  }, [dati, giorni, oggi]);
  const nomi = useMemo(() => Object.fromEntries(leads.map((l) => [l.id, `${l.nome} ${l.cognome}`.trim()])), [leads]);

  const n = visite.length;
  const daTelefono = visite.filter((v) => v.dispositivo === "telefono").length;
  const attivi = visite.filter((v) => (v.azioni || []).length > 0).length;
  const tempoMedio = n ? Math.round(visite.reduce((t, v) => t + (v.secondi || 0), 0) / n) : 0;
  const letturaMedia = n ? Math.round(visite.reduce((t, v) => t + (v.profondita || 0), 0) / n) : 0;
  const perOra = useMemo(() => {
    const h = Array(24).fill(0);
    for (const v of visite) h[oraDelGiorno(v.inizio)]++;
    return h;
  }, [visite]);
  const maxOra = Math.max(1, ...perOra);

  const registro = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return visite.filter((v) => (!soloAttivi || (v.azioni || []).length) &&
      (!q || [v.citta, v.fonte, v.fonte_dettaglio, v.pagina, v.sistema, v.browser, luogo(v), nomi[v.lead_id]].some((x) => String(x || "").toLowerCase().includes(q))));
  }, [visite, soloAttivi, cerca, nomi]);

  return (
    <div className="ad-sezione">
      <div className="ad-sezione-testa">
        <h2>Visite</h2>
        <div className="ad-segmenti" role="radiogroup" aria-label="Periodo">
          {PERIODI.map(([g, t]) => (
            <button key={g} role="radio" aria-checked={giorni === g} className={giorni === g ? "attivo" : ""} onClick={() => { setGiorni(g); setQuante(60); }}>{t}</button>
          ))}
        </div>
      </div>

      {errore && <p className="ad-errore" role="alert"><AlertCircle size={16} /> {errore}</p>}
      {dati?.mancaTabella && (
        <p className="ad-nota avviso"><AlertCircle size={16} /> Il registro si accende dopo aver eseguito <code>supabase/admin-4.sql</code> nel database del sito. Fino ad allora le visite non vengono salvate una per una.</p>
      )}
      <p className="ad-nota"><Info size={16} /> Una riga per ogni pagina aperta, senza cookie né indirizzo IP: di chi non compila il modulo non si sa il nome, solo da dove arriva, la città approssimativa e cosa ha fatto. Le tue visite (questo browser) non si contano.</p>

      {!dati && !errore ? <div className="ad-caricamento">Caricamento del registro…</div> : (
        <>
          <div className="ad-tessere">
            <div className="ad-tessera"><span className="ad-tessera-etichetta"><Eye size={15} /> Visite</span><span className="ad-tessera-valore">{numero(n)}</span><span className="ad-tessera-nota">pagine aperte</span></div>
            <div className="ad-tessera"><span className="ad-tessera-etichetta"><Smartphone size={15} /> Dal telefono</span><span className="ad-tessera-valore">{percento(daTelefono, n)}</span><span className="ad-tessera-nota">{numero(daTelefono)} su {numero(n)}</span></div>
            <div className="ad-tessera"><span className="ad-tessera-etichetta"><Clock size={15} /> Tempo medio</span><span className="ad-tessera-valore">{n ? durata(tempoMedio) : "—"}</span><span className="ad-tessera-nota">con la pagina davanti</span></div>
            <div className="ad-tessera"><span className="ad-tessera-etichetta"><ScrollText size={15} /> Lettura media</span><span className="ad-tessera-valore">{n ? `${letturaMedia}%` : "—"}</span><span className="ad-tessera-nota">della pagina</span></div>
            <div className="ad-tessera"><span className="ad-tessera-etichetta"><MousePointerClick size={15} /> Hanno fatto qualcosa</span><span className="ad-tessera-valore">{percento(attivi, n)}</span><span className="ad-tessera-nota">scelta, modulo, WhatsApp…</span></div>
          </div>

          <div className="ad-griglia-2">
            <Classifica titolo="Da dove arrivano" totale={n} righe={conta(visite, (v) => (v.fonte_dettaglio ? `${FONTI[v.fonte] || v.fonte} · ${v.fonte_dettaglio}` : FONTI[v.fonte] || v.fonte))} />
            <Classifica titolo="Città" totale={n} righe={conta(visite, (v) => luogo(v))} />
          </div>
          <div className="ad-griglia-2">
            <Classifica titolo="Dispositivi" totale={n} righe={conta(visite, (v) => [v.dispositivo, v.sistema].filter(Boolean).join(" · "))} />
            <Classifica titolo="Pagina d'arrivo" totale={n} righe={conta(visite, (v) => (v.pagina === "contatti" ? "/contatti (campagne)" : v.pagina === "webinar" ? "/webinar" : "home"))} />
          </div>

          <section className="ad-card">
            <div className="ad-card-testa"><h3>A che ora</h3></div>
            {!n ? <p className="ad-vuoto">Ancora niente.</p> : (
              <div className="ad-ore" role="img" aria-label="Visite per ora del giorno">
                {perOra.map((x, h) => (
                  <div key={h} className="ad-ora" title={`${h}:00 – ${h}:59: ${x} ${x === 1 ? "visita" : "visite"}`}>
                    <div className="ad-ora-barra" style={{ height: `${(x / maxOra) * 100}%` }} />
                    <span>{h % 3 === 0 ? h : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ad-card">
            <div className="ad-card-testa">
              <h3>Registro <span className="ad-conta-testo">{numero(registro.length)}</span></h3>
              <label className="ad-spunta"><input type="checkbox" checked={soloAttivi} onChange={(e) => setSoloAttivi(e.target.checked)} /> Solo chi ha fatto qualcosa</label>
            </div>
            <label className="ad-cerca ad-cerca-piccola">
              <Search size={16} aria-hidden="true" />
              <input type="search" placeholder="Cerca città, canale, dispositivo, nome…" value={cerca} onChange={(e) => setCerca(e.target.value)} aria-label="Cerca nel registro" />
            </label>
            {!registro.length ? <p className="ad-vuoto">Nessuna visita {soloAttivi || cerca ? "con questi filtri" : "in questo periodo"}.</p> : (
              <ol className="ad-registro">
                {registro.slice(0, quante).map((v) => (
                  <li key={v.id} className={v.lead_id ? "con-lead" : ""}>
                    <div className="ad-registro-testa">
                      <strong>{quando(v.inizio)}</strong>
                      <span className="ad-segno"><MapPin size={12} /> {luogo(v)}</span>
                      <span className="ad-segno"><IconaDispositivo tipo={v.dispositivo} /> {[v.sistema, v.browser].filter((x) => x && x !== "altro").join(" · ") || v.dispositivo}</span>
                    </div>
                    <div className="ad-registro-corpo">
                      <span>{v.pagina === "home" ? "home" : `/${v.pagina}`} · da <b>{FONTI[v.fonte] || v.fonte}</b>{v.fonte_dettaglio ? ` (${v.fonte_dettaglio})` : ""}</span>
                      <span className="ad-piccolo">rimasto {durata(v.secondi)} · letto il {v.profondita || 0}%</span>
                    </div>
                    {((v.azioni || []).length > 0 || v.lead_id) && (
                      <div className="ad-pillole">
                        {(v.azioni || []).map((a) => <span key={a} className={`ad-segno${a === "form.errore" ? " ad-segno-sospetto" : a === "form.inviato" ? " ad-segno-richiamo" : ""}`}>{AZIONI[a] || a}</span>)}
                        {v.lead_id && (nomi[v.lead_id]
                          ? <button className="ad-pillola" onClick={() => apriContatto(v.lead_id)}><UserCheck size={13} /> {nomi[v.lead_id]}</button>
                          : <span className="ad-segno">contatto eliminato</span>)}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {registro.length > quante && (
              <button className="ad-btn ad-btn-leggero" onClick={() => setQuante((q) => q + 100)}>Mostra altre {Math.min(100, registro.length - quante)}</button>
            )}
            {dati && !dati.completo && <p className="ad-piccolo">Più di 10.000 visite nel periodo: qui ci sono le più recenti.</p>}
          </section>
        </>
      )}
    </div>
  );
}

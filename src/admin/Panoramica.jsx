import { useMemo, useState } from "react";
import {
  Eye, UserPlus, Percent, Inbox, Info, Table2, BarChart3, CalendarDays, Flag, X, Plus,
  Siren, ArrowRight, Mail, MessageCircle, SkipForward, Trophy, Lock, AlertCircle,
} from "lucide-react";
import {
  chiama, giorniIndietro, giornoDi, spostaGiorno, somma, perGiorno, numero, percento, giornoCorto, giornoLungo,
  dataBreve, etichettaTipo, eVisita, variazione, statoDi, daRichiamare, temperatura, ultimoTocco, giorniFa,
  whatsapp, riempi,
} from "./util";

const PERIODI = [7, 30, 90];

/* Scala "pulita" per l'asse: 1, 2, 5 × 10^n. */
function massimoPulito(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/* Barre per giorno, una serie sola: niente legenda (la nomina il titolo),
   niente doppio asse. Al passaggio del mouse il valore del giorno.
   Le bandierine (post, eventi) sono linee arancio sopra il giorno. */
function Grafico({ titolo, serie, unita, segni = [] }) {
  const [sopra, setSopra] = useState(null);
  const [tabella, setTabella] = useState(false);
  const W = 640, H = 190, sx = 34, sb = 24, st = 14;
  const pw = W - sx - 6, ph = H - sb - st;
  const max = massimoPulito(Math.max(...serie.map((d) => d.valore), 0));
  const passo = pw / serie.length;
  const larg = Math.max(2, passo - 2); // 2px di spazio fra le barre
  const totale = serie.reduce((t, d) => t + d.valore, 0);
  const etichetteX = serie.length <= 7 ? 1 : Math.ceil(serie.length / 6);
  const segniDi = (g) => segni.filter((s) => s.giorno === g);

  return (
    <section className="ad-card">
      <div className="ad-card-testa">
        <h3>{titolo}</h3>
        <button className="ad-btn ad-btn-leggero ad-btn-piccolo" onClick={() => setTabella((t) => !t)}
          aria-pressed={tabella}>
          {tabella ? <><BarChart3 size={15} /> Grafico</> : <><Table2 size={15} /> Tabella</>}
        </button>
      </div>
      {totale === 0 ? (
        <p className="ad-vuoto">Ancora nessun dato in questo periodo.</p>
      ) : tabella ? (
        <div className="ad-tabella-scorre">
          <table className="ad-tabella">
            <thead><tr><th>Giorno</th><th className="num">{unita}</th></tr></thead>
            <tbody>{[...serie].reverse().map((d) => (
              <tr key={d.giorno}><td>{giornoCorto(d.giorno)}{segniDi(d.giorno).map((s) => <span key={s.testo} className="ad-segno ad-segno-bandiera"><Flag size={11} /> {s.testo}</span>)}</td>
                <td className="num">{numero(d.valore)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div className="ad-grafico" onMouseLeave={() => setSopra(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titolo}: ${numero(totale)} in totale`}>
            {[0, 0.5, 1].map((f) => {
              const y = st + ph - f * ph;
              return (
                <g key={f}>
                  <line x1={sx} x2={W - 6} y1={y} y2={y} className="ad-griglia" />
                  <text x={sx - 6} y={y + 4} textAnchor="end" className="ad-asse">{numero(Math.round(max * f))}</text>
                </g>
              );
            })}
            {serie.map((d, i) => {
              const h = (d.valore / max) * ph;
              const x = sx + i * passo + 1;
              const y = st + ph - h;
              const r = Math.min(4, h, larg / 2);
              // estremità arrotondata solo in cima, base dritta sull'asse
              const path = h <= 0 ? null : `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + larg - r} Q${x + larg},${y} ${x + larg},${y + r} V${y + h} Z`;
              const bandiere = segniDi(d.giorno);
              return (
                <g key={d.giorno}>
                  {bandiere.length > 0 && (
                    <g className="ad-bandiera">
                      <line x1={x + larg / 2} x2={x + larg / 2} y1={2} y2={st + ph} />
                      <path d={`M${x + larg / 2},2 h8 l-3,3.5 l3,3.5 h-8 Z`} />
                    </g>
                  )}
                  {path && <path d={path} className={`ad-barra-dato${sopra === i ? " attiva" : ""}`} />}
                  {i % etichetteX === 0 && (
                    <text x={x + larg / 2} y={H - 6} textAnchor="middle" className="ad-asse">{giornoCorto(d.giorno)}</text>
                  )}
                  {/* bersaglio del mouse: tutta la colonna, non solo la barra */}
                  <rect x={sx + i * passo} y={st} width={passo} height={ph} fill="transparent"
                    onMouseEnter={() => setSopra(i)}>
                    <title>{`${giornoCorto(d.giorno)}: ${numero(d.valore)} ${unita.toLowerCase()}${bandiere.map((s) => ` · ${s.testo}`).join("")}`}</title>
                  </rect>
                </g>
              );
            })}
          </svg>
          {sopra != null && (
            <div className="ad-tooltip" style={{ left: `${((sx + sopra * passo + passo / 2) / W) * 100}%` }}>
              <b><strong>{numero(serie[sopra].valore)}</strong> {unita.toLowerCase()}</b>
              <span>{giornoCorto(serie[sopra].giorno)}</span>
              {segniDi(serie[sopra].giorno).map((s) => <span key={s.testo} className="ad-tooltip-segno">⚑ {s.testo}</span>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Tessera({ Icona, etichetta, valore, nota, confronto, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`ad-tessera${onClick ? " cliccabile" : ""}`} onClick={onClick}>
      <span className="ad-tessera-etichetta"><Icona size={15} /> {etichetta}</span>
      <span className="ad-tessera-valore">{valore}</span>
      {confronto && <span className={`ad-tessera-confronto ${confronto.verso}`}>{confronto.testo}</span>}
      {nota && <span className="ad-tessera-nota">{nota}</span>}
    </Tag>
  );
}

/* ---- Timeout: quando i numeri dicono che qualcosa non va ---- */
function Timeout({ contatori, leads, inizioConteggi, oggi, vaiA }) {
  const ult2 = giorniIndietro(oggi, 3).slice(0, 2); // ieri e l'altro ieri
  const ult7 = giorniIndietro(oggi, 7);
  const allarmi = [];
  const contaDaGiorni = inizioConteggi ? giorniFa(inizioConteggi, oggi) : 0;

  if (contaDaGiorni >= 3 && somma(contatori, ult2, eVisita) === 0) {
    allarmi.push({
      titolo: "Nessuna visita da due giorni",
      testo: "O il sito non risponde, o nessuno ci arriva più.",
      mosse: [["Apri il sito", "/"], ["Pubblicazioni su Vercel", "https://vercel.com/danilopuglisi/atleta360-site"], ["Rilancia un post su Atleta360", null]],
    });
  }
  const moduli7 = somma(contatori, ult7, (e) => e === "form.aperto");
  const lead7 = leads.filter((l) => !l.sospetto && ult7.includes(giornoDi(l.created_at))).length;
  if (moduli7 >= 8 && lead7 === 0) {
    allarmi.push({
      titolo: `Il modulo si è aperto ${moduli7} volte, ma nessuno l'ha inviato`,
      testo: "Può essere un modulo rotto, o una richiesta che spaventa. Prova a compilarlo tu.",
      mosse: [["Prova il modulo", "/contatti"], ["Guarda la Salute", "#salute"]],
    });
  }
  const errori = somma(contatori, ult7, (e) => e === "mail.errore");
  if (errori > 0) {
    allarmi.push({
      titolo: `${errori} ${errori === 1 ? "mail di avviso non partita" : "mail di avviso non partite"} questa settimana`,
      testo: "I contatti sono salvati, ma non ti è arrivato l'avviso.",
      mosse: [["Manda una mail di prova", "#opzioni"]],
    });
  }
  const inAttesa = leads.filter((l) => !l.sospetto && statoDi(l) === "nuovo" && giorniFa(l.created_at, oggi) >= 1).length;
  if (inAttesa > 0) {
    allarmi.push({
      titolo: `${inAttesa} ${inAttesa === 1 ? "persona aspetta" : "persone aspettano"} da più di un giorno`,
      testo: "Il sito promette una risposta entro 24 ore.",
      mosse: [["Vai ai contatti", "#contatti"]],
    });
  }
  if (!allarmi.length) return null;

  return (
    <section className="ad-card ad-timeout" aria-label="Timeout: cose da guardare">
      <div className="ad-card-testa"><h3><Siren size={18} /> Timeout! {allarmi.length === 1 ? "Una cosa da guardare" : `${allarmi.length} cose da guardare`}</h3></div>
      <ul className="ad-timeout-lista">
        {allarmi.map((a) => (
          <li key={a.titolo}>
            <strong>{a.titolo}</strong>
            <span>{a.testo}</span>
            <div className="ad-pillole">
              {a.mosse.map(([t, href]) => href
                ? (href.startsWith("#")
                  ? <button key={t} className="ad-pillola" onClick={() => vaiA(href.slice(1))}>{t} <ArrowRight size={13} /></button>
                  : <a key={t} className="ad-pillola" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{t} <ArrowRight size={13} /></a>)
                : <span key={t} className="ad-pillola muta">{t}</span>)}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- Al servizio: una persona alla volta, la prossima da chiamare ---- */
function coda(leads, oggi) {
  const veri = leads.filter((l) => !l.sospetto);
  const richiami = veri.filter((l) => daRichiamare(l, oggi)).sort((a, b) => a.ricontatta_il.localeCompare(b.ricontatta_il));
  const nuovi = veri.filter((l) => statoDi(l) === "nuovo" && !daRichiamare(l, oggi)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const freddi = veri.filter((l) => statoDi(l) === "contattato" && !daRichiamare(l, oggi) && !l.ricontatta_il && giorniFa(ultimoTocco(l), oggi) >= 7)
    .sort((a, b) => ultimoTocco(a).localeCompare(ultimoTocco(b)));
  return [
    ...richiami.map((l) => ({ l, perche: l.ricontatta_il === oggi ? "da richiamare oggi" : `da richiamare dal ${giornoCorto(l.ricontatta_il)}` })),
    ...nuovi.map((l) => ({ l, perche: `nuovo, arrivato ${giorniFa(l.created_at, oggi) === 0 ? "oggi" : giorniFa(l.created_at, oggi) === 1 ? "ieri" : `${giorniFa(l.created_at, oggi)} giorni fa`}` })),
    ...freddi.map((l) => ({ l, perche: `contattato, poi ${giorniFa(ultimoTocco(l), oggi)} giorni di silenzio` })),
  ];
}

function AlServizio({ leads, opzioni, oggi, apriContatto }) {
  const lista = useMemo(() => coda(leads, oggi), [leads, oggi]);
  const [salta, setSalta] = useState(0);
  if (!lista.length) {
    return (
      <section className="ad-card ad-servizio vuoto">
        <div className="ad-card-testa"><h3>Al servizio</h3></div>
        <p className="ad-vuoto">Nessuno da chiamare adesso: tutti sentiti, nessun richiamo in scadenza.</p>
      </section>
    );
  }
  const { l, perche } = lista[salta % lista.length];
  const testo = riempi(l.tipo === "atleta" ? opzioni.modello_atleta : opzioni.modello_societa, l);
  const wa = whatsapp(l.telefono, testo);
  const t = temperatura(l);
  return (
    <section className="ad-card ad-servizio">
      <div className="ad-card-testa">
        <h3>Al servizio <span className="ad-conta-testo">{(salta % lista.length) + 1} di {lista.length}</span></h3>
        {lista.length > 1 && <button className="ad-btn ad-btn-leggero ad-btn-piccolo" onClick={() => setSalta((n) => n + 1)}><SkipForward size={14} /> Il prossimo</button>}
      </div>
      <div className="ad-servizio-corpo">
        <div>
          <strong className="ad-servizio-nome">{l.nome} {l.cognome}</strong>
          <span className="ad-piccolo">{etichettaTipo(l.tipo)}{l.societa ? ` · ${l.societa}` : ""} · {perche}{t ? ` · ${t.etichetta.toLowerCase()}` : ""}</span>
        </div>
        <div className="ad-azioni-rapide">
          <button className="ad-btn ad-btn-primario" onClick={() => apriContatto(l.id)}>Apri la scheda</button>
          {wa && <a className="ad-btn ad-btn-leggero" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
          <a className="ad-btn ad-btn-leggero" href={`mailto:${l.email}?subject=${encodeURIComponent(riempi(opzioni.modello_oggetto, l))}&body=${encodeURIComponent(testo)}`}><Mail size={16} /> Email</a>
        </div>
      </div>
    </section>
  );
}

/* ---- Il tabellone del set: la settimana come una partita ---- */
const lunediDi = (g) => {
  const d = new Date(`${g}T12:00:00Z`).getUTCDay(); // 0 = domenica
  return spostaGiorno(g, d === 0 ? -6 : 1 - d);
};

function punteggio(leadsPerGiorno, lunedi, oggi) {
  let noi = 0, loro = 0;
  for (let i = 0; i < 7; i++) {
    const g = spostaGiorno(lunedi, i);
    if (g > oggi) break;
    const n = leadsPerGiorno.get(g) || 0;
    if (n) noi += n; else if (g < oggi) loro += 1; // oggi non è ancora perso: la giornata è in corso
  }
  return { noi, loro };
}

function Tabellone({ leads, oggi }) {
  const perGiornoLead = useMemo(() => {
    const m = new Map();
    for (const l of leads) if (!l.sospetto) { const g = giornoDi(l.created_at); m.set(g, (m.get(g) || 0) + 1); }
    return m;
  }, [leads]);
  const questo = lunediDi(oggi);
  const ora = punteggio(perGiornoLead, questo, oggi);
  const passate = [1, 2, 3, 4].map((k) => {
    const lun = spostaGiorno(questo, -7 * k);
    // settimana chiusa: "oggi" è il lunedì dopo, così conta anche la domenica
    return { lun, ...punteggio(perGiornoLead, lun, spostaGiorno(lun, 7)) };
  });
  return (
    <section className="ad-card">
      <div className="ad-card-testa"><h3>Il tabellone della settimana</h3></div>
      <p className="ad-piccolo">Ogni contatto è un punto per te, ogni giorno senza contatti un punto per il Silenzio.</p>
      <div className="ad-tabellone" aria-label={`Tu ${ora.noi}, Silenzio ${ora.loro}`}>
        <div><span>Tu</span><strong>{ora.noi}</strong></div>
        <em>–</em>
        <div><span>Silenzio</span><strong>{ora.loro}</strong></div>
      </div>
      <ul className="ad-set-passati">
        {passate.map((p) => (
          <li key={p.lun} className={p.noi > p.loro ? "vinto" : p.noi < p.loro ? "perso" : "pari"}>
            <span>dal {giornoCorto(p.lun)}</span><strong>{p.noi}–{p.loro}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- La sala trofei ---- */
function trofei(leads, contatori) {
  const veri = leads.filter((l) => !l.sospetto).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const perGiornoLead = new Map();
  for (const l of veri) { const g = giornoDi(l.created_at); perGiornoLead.set(g, (perGiornoLead.get(g) || 0) + 1); }
  const visitePerGiorno = new Map();
  for (const c of contatori) if (eVisita(c.evento)) visitePerGiorno.set(c.giorno, (visitePerGiorno.get(c.giorno) || 0) + c.conteggio);
  const record = Math.max(0, ...visitePerGiorno.values());
  const giornoRecord = [...visitePerGiorno].find(([, v]) => v === record)?.[0];
  const muro = [...perGiornoLead].find(([, n]) => n >= 3);
  const cliente = veri.find((l) => statoDi(l) === "cliente");
  const lampo = veri.find((l) => Array.isArray(l.diario) && l.diario[0] && (new Date(l.diario[0].quando) - new Date(l.created_at)) < 864e5);
  const club = veri.find((l) => l.tipo === "societa");
  return [
    { id: "battuta", nome: "Prima battuta", come: "il primo contatto", ok: veri.length > 0, nota: veri[0] && dataBreve(veri[0].created_at) },
    { id: "societa", nome: "Primo club", come: "la prima società sportiva", ok: Boolean(club), nota: club?.societa || (club && dataBreve(club.created_at)) },
    { id: "ace", nome: "Ace", come: "10 contatti", ok: veri.length >= 10, nota: `${Math.min(veri.length, 10)}/10` },
    { id: "muro", nome: "Muro a tre", come: "3 contatti nello stesso giorno", ok: Boolean(muro), nota: muro && giornoCorto(muro[0]) },
    { id: "lampo", nome: "Ricezione lampo", come: "una voce di diario entro 24 ore dall'arrivo", ok: Boolean(lampo), nota: lampo && `${lampo.nome}` },
    { id: "pipe", nome: "Pipe perfetta", come: "il primo cliente", ok: Boolean(cliente), nota: cliente && `${cliente.nome} ${cliente.cognome}` },
    { id: "palazzetto", nome: "Palazzetto pieno", come: "50 pagine viste in un giorno", ok: record >= 50, nota: record ? `record: ${numero(record)}${giornoRecord ? ` il ${giornoCorto(giornoRecord)}` : ""}` : null },
    { id: "cento", nome: "Cento in battuta", come: "100 contatti", ok: veri.length >= 100, nota: `${Math.min(veri.length, 100)}/100` },
  ];
}

function SalaTrofei({ leads, contatori }) {
  const lista = trofei(leads, contatori);
  const vinti = lista.filter((t) => t.ok).length;
  return (
    <section className="ad-card">
      <div className="ad-card-testa"><h3><Trophy size={17} /> Sala trofei <span className="ad-conta-testo">{vinti} di {lista.length}</span></h3></div>
      <ul className="ad-trofei">
        {lista.map((t) => (
          <li key={t.id} className={t.ok ? "vinto" : ""} title={t.come}>
            {t.ok ? <Trophy size={20} /> : <Lock size={18} />}
            <strong>{t.nome}</strong>
            <span>{t.ok ? (t.nota || t.come) : t.come}{!t.ok && t.nota ? ` · ${t.nota}` : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- Le bandierine: un post, un evento, un cambio al sito, e cosa è successo dopo ---- */
function Bandierine({ segni, contatori, leads, oggi, onSegni }) {
  const [giorno, setGiorno] = useState(oggi);
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState(null);

  const salva = async (nuovi) => {
    setStato("in corso");
    const r = await chiama("segni.salva", { segni: nuovi });
    if (r.ok) { onSegni(r.segni); setStato(null); setTesto(""); } else setStato(r.motivo || "non salvato");
  };

  /* Effetto: pagine viste nei 3 giorni dal segno, contro la media dei 7 giorni prima. */
  const effetto = (g) => {
    const dopo = [0, 1, 2].map((i) => spostaGiorno(g, i)).filter((x) => x <= oggi);
    const prima = [1, 2, 3, 4, 5, 6, 7].map((i) => spostaGiorno(g, -i));
    const v = somma(contatori, dopo, eVisita);
    const media = somma(contatori, prima, eVisita) / 7;
    const lead = leads.filter((l) => !l.sospetto && dopo.includes(giornoDi(l.created_at))).length;
    const atteso = media * dopo.length;
    return { v, lead, giorni: dopo.length, diff: atteso ? Math.round(((v - atteso) / atteso) * 100) : null };
  };

  return (
    <section className="ad-card">
      <div className="ad-card-testa"><h3><Flag size={17} /> Bandierine sul grafico</h3></div>
      <p className="ad-piccolo">Segna il giorno di un post su Caterino IG, di un evento o di una modifica al sito: compare sul grafico delle visite e qui vedi cosa è successo nei tre giorni dopo.</p>
      <div className="ad-bandierine-nuova">
        <input type="date" className="ad-campo ad-campo-data" value={giorno} max={oggi} onChange={(e) => setGiorno(e.target.value)} aria-label="Giorno" />
        <input className="ad-campo" value={testo} maxLength={60} placeholder="Es. post Instagram sulla demo" onChange={(e) => setTesto(e.target.value)} aria-label="Cosa è successo" />
        <button className="ad-btn ad-btn-leggero" disabled={!testo.trim() || !giorno || stato === "in corso"}
          onClick={() => salva([...segni, { giorno, testo }])}><Plus size={16} /> Segna</button>
      </div>
      {stato && stato !== "in corso" && <span className="ad-errore-inline"><AlertCircle size={15} /> {stato}</span>}
      {segni.length > 0 && (
        <ul className="ad-bandierine">
          {[...segni].reverse().map((s) => {
            const e = effetto(s.giorno);
            return (
              <li key={`${s.giorno}${s.testo}`}>
                <span className="ad-bandierine-giorno">{giornoLungo(s.giorno)}</span>
                <span className="ad-bandierine-testo">{s.testo}</span>
                <span className="ad-piccolo">
                  {numero(e.v)} pagine viste e {e.lead} {e.lead === 1 ? "contatto" : "contatti"} in {e.giorni} {e.giorni === 1 ? "giorno" : "giorni"}
                  {e.diff != null ? ` · ${e.diff > 0 ? "+" : ""}${e.diff}% sul solito` : ""}
                </span>
                <button className="ad-btn ad-btn-icona ad-btn-mini" aria-label="Togli la bandierina"
                  onClick={() => salva(segni.filter((x) => x !== s))}><X size={14} /></button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Panoramica({ dati, vaiA, apriContatto, onSegni }) {
  const [periodo, setPeriodo] = useState(30);
  const { leads: tutti, contatori, salute, opzioni, inizioConteggi } = dati;
  const leads = useMemo(() => tutti.filter((l) => !l.sospetto), [tutti]);
  const oggi = salute.oggi;
  const giorni = useMemo(() => giorniIndietro(oggi, periodo), [oggi, periodo]);
  const giorniPrima = useMemo(() => giorniIndietro(spostaGiorno(oggi, -periodo), periodo), [oggi, periodo]);
  const set = useMemo(() => new Set(giorni), [giorni]);
  const setPrima = useMemo(() => new Set(giorniPrima), [giorniPrima]);

  const leadPeriodo = useMemo(() => leads.filter((l) => set.has(giornoDi(l.created_at))), [leads, set]);
  const leadPrima = useMemo(() => leads.filter((l) => setPrima.has(giornoDi(l.created_at))), [leads, setPrima]);
  const visite = somma(contatori, giorni, eVisita);
  const visitePrima = somma(contatori, giorniPrima, eVisita);
  const moduli = somma(contatori, giorni, (e) => e === "form.aperto");
  const nuovi = leads.filter((l) => statoDi(l) === "nuovo").length;
  const richiami = leads.filter((l) => daRichiamare(l, oggi)).length;
  const visiteOggi = somma(contatori, [oggi], eVisita);
  const leadOggi = leads.filter((l) => giornoDi(l.created_at) === oggi).length;

  const serieVisite = perGiorno(contatori, giorni, eVisita);
  const serieLead = giorni.map((g) => ({ giorno: g, valore: leadPeriodo.filter((l) => giornoDi(l.created_at) === g).length }));
  const segni = Array.isArray(opzioni.segni) ? opzioni.segni : [];

  // da quando esistono i contatori: prima di quel giorno le visite non sono registrate
  const periodoPrimaDeiConteggi = !inizioConteggi || giorni[0] < inizioConteggi;
  // il confronto ha senso solo se anche il periodo prima era contato
  const confrontabile = inizioConteggi && giorniPrima[0] >= inizioConteggi;

  /* Passi uno dentro l'altro. La scelta atleta/società NON è un passo: su
     /contatti il modulo è aperto subito, senza scelta, e l'imbuto superava il 100%.
     La scelta ha la sua tabella qui sotto. */
  const passi = [
    { etichetta: "Pagine viste", valore: visite },
    { etichetta: "Modulo aperto", valore: moduli },
    { etichetta: "Richiesta inviata (lead)", valore: leadPeriodo.length },
  ];
  const base = Math.max(passi[0].valore, 1);

  const perTipo = ["atleta", "societa"].map((t) => ({
    tipo: t,
    lead: leadPeriodo.filter((l) => l.tipo === t).length,
    scelte: somma(contatori, giorni, (e) => e === `scelta.${t}`),
  }));
  const origini = [
    ["hero", "Apertura della pagina"], ["demo-preview", "Anteprima della demo"],
    ["header", "Barra in alto"], ["chiusura", "Chiusura della pagina"],
  ].map(([id, etichetta]) => ({ etichetta, valore: somma(contatori, giorni, (e) => e === `origine.${id}`) }));
  const maxOrigine = Math.max(...origini.map((o) => o.valore), 1);

  return (
    <div className="ad-sezione">
      <div className="ad-sezione-testa">
        <h2>Panoramica</h2>
        <div className="ad-segmenti" role="radiogroup" aria-label="Periodo">
          {PERIODI.map((p) => (
            <button key={p} role="radio" aria-checked={periodo === p} className={periodo === p ? "attivo" : ""}
              onClick={() => setPeriodo(p)}>{p} giorni</button>
          ))}
        </div>
      </div>

      <Timeout contatori={contatori} leads={leads} inizioConteggi={inizioConteggi} oggi={oggi} vaiA={vaiA} />

      {periodoPrimaDeiConteggi && (
        <p className="ad-nota"><Info size={16} />
          {inizioConteggi
            ? `Le visite si contano dal ${dataBreve(`${inizioConteggi}T12:00:00Z`)}: prima di quel giorno il sito non le registrava. I lead invece ci sono tutti.`
            : "Le visite non sono ancora state registrate: si contano da quando il pannello è attivo. I lead invece ci sono tutti."}
        </p>
      )}

      <div className="ad-tessere">
        <Tessera Icona={Eye} etichetta="Pagine viste" valore={numero(visite)} nota={`ultimi ${periodo} giorni`}
          confronto={confrontabile ? variazione(visite, visitePrima) : null} />
        <Tessera Icona={UserPlus} etichetta="Lead" valore={numero(leadPeriodo.length)} nota={`${numero(leads.length)} in totale`}
          confronto={variazione(leadPeriodo.length, leadPrima.length)} />
        <Tessera Icona={Percent} etichetta="Conversione" valore={percento(leadPeriodo.length, visite)} nota="lead su pagine viste" />
        <Tessera Icona={CalendarDays} etichetta="Oggi" valore={numero(visiteOggi)} nota={`pagine viste · ${leadOggi} ${leadOggi === 1 ? "lead" : "lead"}`} />
        <Tessera Icona={Inbox} etichetta="Da fare" valore={numero(nuovi + richiami)}
          nota={`${nuovi} ${nuovi === 1 ? "nuovo" : "nuovi"} · ${richiami} da richiamare`} onClick={() => vaiA("contatti")} />
      </div>

      <AlServizio leads={tutti} opzioni={opzioni} oggi={oggi} apriContatto={apriContatto} />

      <section className="ad-card">
        <div className="ad-card-testa"><h3>Il percorso</h3></div>
        <ol className="ad-imbuto">
          {passi.map((p, i) => (
            <li key={p.etichetta}>
              <div className="ad-imbuto-riga">
                <span>{p.etichetta}</span>
                <strong>{numero(p.valore)}</strong>
              </div>
              <div className="ad-imbuto-traccia"><div className="ad-imbuto-barra" style={{ width: `${(p.valore / base) * 100}%` }} /></div>
              {i > 0 && <span className="ad-imbuto-passo">{percento(p.valore, passi[i - 1].valore)} del passo prima</span>}
            </li>
          ))}
        </ol>
      </section>

      <div className="ad-griglia-2">
        <Grafico titolo="Pagine viste per giorno" serie={serieVisite} unita="Pagine viste" segni={segni} />
        <Grafico titolo="Lead per giorno" serie={serieLead} unita="Lead" segni={segni} />
      </div>

      <Bandierine segni={segni} contatori={contatori} leads={leads} oggi={oggi} onSegni={onSegni} />

      <div className="ad-griglia-2">
        <section className="ad-card">
          <div className="ad-card-testa"><h3>Atleta o società</h3></div>
          <table className="ad-tabella">
            <thead><tr><th>Percorso</th><th className="num">Scelte</th><th className="num">Lead</th><th className="num">Conv.</th></tr></thead>
            <tbody>{perTipo.map((r) => (
              <tr key={r.tipo}><td>{etichettaTipo(r.tipo)}</td><td className="num">{numero(r.scelte)}</td>
                <td className="num">{numero(r.lead)}</td><td className="num">{percento(r.lead, r.scelte)}</td></tr>
            ))}</tbody>
          </table>
        </section>
        <section className="ad-card">
          <div className="ad-card-testa"><h3>Da dove scelgono</h3></div>
          <ul className="ad-origini">
            {origini.map((o) => (
              <li key={o.etichetta}>
                <span>{o.etichetta}</span>
                <div className="ad-imbuto-traccia piccola"><div className="ad-imbuto-barra" style={{ width: `${(o.valore / maxOrigine) * 100}%` }} /></div>
                <strong>{numero(o.valore)}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="ad-griglia-2">
        <Tabellone leads={leads} oggi={oggi} />
        <SalaTrofei leads={leads} contatori={contatori} />
      </div>
    </div>
  );
}

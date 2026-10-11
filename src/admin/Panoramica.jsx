import { useMemo, useState } from "react";
import { Eye, UserPlus, Percent, Inbox, Info, Table2, BarChart3 } from "lucide-react";
import { giorniIndietro, giornoDi, somma, perGiorno, numero, percento, giornoCorto, dataBreve, etichettaTipo } from "./util";

const PERIODI = [7, 30, 90];

const eVisita = (e) => e.startsWith("visita.");

/* Scala "pulita" per l'asse: 1, 2, 5 × 10^n. */
function massimoPulito(v) {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/* Barre per giorno, una serie sola: niente legenda (la nomina il titolo),
   niente doppio asse. Al passaggio del mouse il valore del giorno. */
function Grafico({ titolo, serie, unita }) {
  const [sopra, setSopra] = useState(null);
  const [tabella, setTabella] = useState(false);
  const W = 640, H = 190, sx = 34, sb = 24, st = 10;
  const pw = W - sx - 6, ph = H - sb - st;
  const max = massimoPulito(Math.max(...serie.map((d) => d.valore), 0));
  const passo = pw / serie.length;
  const larg = Math.max(2, passo - 2); // 2px di spazio fra le barre
  const totale = serie.reduce((t, d) => t + d.valore, 0);
  const etichetteX = serie.length <= 7 ? 1 : Math.ceil(serie.length / 6);

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
              <tr key={d.giorno}><td>{giornoCorto(d.giorno)}</td><td className="num">{numero(d.valore)}</td></tr>
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
              return (
                <g key={d.giorno}>
                  {path && <path d={path} className={`ad-barra-dato${sopra === i ? " attiva" : ""}`} />}
                  {i % etichetteX === 0 && (
                    <text x={x + larg / 2} y={H - 6} textAnchor="middle" className="ad-asse">{giornoCorto(d.giorno)}</text>
                  )}
                  {/* bersaglio del mouse: tutta la colonna, non solo la barra */}
                  <rect x={sx + i * passo} y={st} width={passo} height={ph} fill="transparent"
                    onMouseEnter={() => setSopra(i)}>
                    <title>{`${giornoCorto(d.giorno)}: ${numero(d.valore)} ${unita.toLowerCase()}`}</title>
                  </rect>
                </g>
              );
            })}
          </svg>
          {sopra != null && (
            <div className="ad-tooltip" style={{ left: `${((sx + sopra * passo + passo / 2) / W) * 100}%` }}>
              <b><strong>{numero(serie[sopra].valore)}</strong> {unita.toLowerCase()}</b>
              <span>{giornoCorto(serie[sopra].giorno)}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Tessera({ Icona, etichetta, valore, nota, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`ad-tessera${onClick ? " cliccabile" : ""}`} onClick={onClick}>
      <span className="ad-tessera-etichetta"><Icona size={15} /> {etichetta}</span>
      <span className="ad-tessera-valore">{valore}</span>
      {nota && <span className="ad-tessera-nota">{nota}</span>}
    </Tag>
  );
}

export default function Panoramica({ dati, vaiA }) {
  const [periodo, setPeriodo] = useState(30);
  const { leads, contatori, salute } = dati;
  const giorni = useMemo(() => giorniIndietro(salute.oggi, periodo), [salute.oggi, periodo]);
  const set = useMemo(() => new Set(giorni), [giorni]);

  const leadPeriodo = useMemo(() => leads.filter((l) => set.has(giornoDi(l.created_at))), [leads, set]);
  const visite = somma(contatori, giorni, eVisita);
  const moduli = somma(contatori, giorni, (e) => e === "form.aperto");
  const nuovi = leads.filter((l) => (l.stato || "nuovo") === "nuovo").length;

  const serieVisite = perGiorno(contatori, giorni, eVisita);
  const serieLead = giorni.map((g) => ({ giorno: g, valore: leadPeriodo.filter((l) => giornoDi(l.created_at) === g).length }));

  // da quando esistono i contatori: prima di quel giorno le visite non sono registrate
  const inizioConteggi = contatori.filter((c) => !c.evento.startsWith("sistema.") && !c.evento.startsWith("mail.")).map((c) => c.giorno).sort()[0];
  const periodoPrimaDeiConteggi = !inizioConteggi || giorni[0] < inizioConteggi;

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

      {periodoPrimaDeiConteggi && (
        <p className="ad-nota"><Info size={16} />
          {inizioConteggi
            ? `Le visite si contano dal ${dataBreve(inizioConteggi)}: prima di quel giorno il sito non le registrava. I lead invece ci sono tutti.`
            : "Le visite non sono ancora state registrate: si contano da quando il pannello è attivo. I lead invece ci sono tutti."}
        </p>
      )}

      <div className="ad-tessere">
        <Tessera Icona={Eye} etichetta="Pagine viste" valore={numero(visite)} nota={`ultimi ${periodo} giorni`} />
        <Tessera Icona={UserPlus} etichetta="Lead" valore={numero(leadPeriodo.length)} nota={`${numero(leads.length)} in totale`} />
        <Tessera Icona={Percent} etichetta="Conversione" valore={percento(leadPeriodo.length, visite)} nota="lead su pagine viste" />
        <Tessera Icona={Inbox} etichetta="Da contattare" valore={numero(nuovi)} nota="stato «nuovo»" onClick={() => vaiA("contatti")} />
      </div>

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
        <Grafico titolo="Pagine viste per giorno" serie={serieVisite} unita="Pagine viste" />
        <Grafico titolo="Lead per giorno" serie={serieLead} unita="Lead" />
      </div>

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
    </div>
  );
}

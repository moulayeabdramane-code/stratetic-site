/** Statistiques : CA mensuel / annuel, encaissements, top clients, impayés. */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/hooks.js';
import { formatNumber } from '../../../shared/format.js';
import { Money } from '../components/ui.jsx';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Histogramme groupé (CA HT facturé / encaissé), en SVG pur. */
function MonthlyChart({ data }) {
  const W = 720, H = 260, L = 64, B = 28, T = 12;
  const max = Math.max(1, ...data.flatMap((m) => [m.ht, m.collected]));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  const bw = (W - L) / 12;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chiffre d'affaires mensuel">
      <g className="grid">
        {ticks.map((t) => <line key={t} x1={L} x2={W} y1={y(t)} y2={y(t)} />)}
      </g>
      {ticks.map((t) => <text key={t} x={L - 8} y={y(t) + 4} textAnchor="end">{compact(t)}</text>)}
      {data.map((m, i) => {
        const x = L + i * bw;
        return (
          <g key={i}>
            <rect x={x + bw * 0.16} y={y(m.ht)} width={bw * 0.32} height={Math.max(0, y(0) - y(m.ht))} rx="2" fill="#022539">
              <title>{`${MONTHS[i]} — facturé HT : ${formatNumber(m.ht)}`}</title>
            </rect>
            <rect x={x + bw * 0.52} y={y(m.collected)} width={bw * 0.32} height={Math.max(0, y(0) - y(m.collected))} rx="2" fill="#a1be01">
              <title>{`${MONTHS[i]} — encaissé : ${formatNumber(m.collected)}`}</title>
            </rect>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle">{MONTHS[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function niceStep(max) {
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
}
const compact = (v) => (v >= 1e6 ? `${formatNumber(v / 1e6, v % 1e6 ? 1 : 0)} M` : v >= 1e3 ? `${formatNumber(v / 1e3)} k` : formatNumber(v));

export default function Stats() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [s] = useLoad(() => api.get(`/stats?year=${year}`), [year]);
  if (!s) return <div className="empty-state">Chargement…</div>;
  const maxClient = Math.max(1, ...s.topClients.map((c) => c.ht));

  return (
    <>
      <div className="page-head">
        <div><h1>Statistiques</h1><div className="sub">Factures émises non annulées, montants convertis en devise de référence.</div></div>
        <span className="spacer" />
        <select style={{ width: 120 }} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Année">
          {s.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="content stack">
        <div className="kpis">
          <div className="card kpi"><div className="eyebrow">CA {year} HT</div><div className="v"><Money value={s.totalHT} /></div><div className="h">{s.invoiceCount} facture(s)</div></div>
          <div className="card kpi"><div className="eyebrow">Encaissé {year}</div><div className="v"><Money value={s.collected} /></div><div className="h">TTC facturé : <Money value={s.totalTTC} /></div></div>
          <div className="card kpi"><div className="eyebrow">Impayés (total)</div><div className="v"><Money value={s.unpaid} /></div><div className="h">Toutes années confondues</div></div>
          <div className={`card kpi ${s.overdueCount ? 'alert' : ''}`}><div className="eyebrow">En retard</div><div className="v"><Money value={s.overdue} /></div><div className="h">{s.overdueCount} facture(s)</div></div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Chiffre d'affaires mensuel {year}</h2><span className="spacer" />
            <div className="legend"><span><i style={{ background: '#022539' }} />Facturé HT</span><span><i style={{ background: '#a1be01' }} />Encaissé</span></div>
          </div>
          <div className="card-pad"><MonthlyChart data={s.monthly} /></div>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-head"><h2>Meilleurs clients {year}</h2></div>
            <div className="card-pad">
              {s.topClients.length === 0 && <p className="muted" style={{ margin: 0 }}>Aucune facture émise sur la période.</p>}
              <div className="bar-list">
                {s.topClients.map((c) => (
                  <div className="item" key={c.name}>
                    <span>{c.name} <span className="muted small">({c.count})</span></span>
                    <Money value={c.ht} />
                    <div className="track"><div className="fill" style={{ width: `${(c.ht / maxClient) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h2>Chiffre d'affaires annuel</h2></div>
            <table className="table">
              <thead><tr><th>Année</th><th className="right">Factures</th><th className="right">HT</th><th className="right">TTC</th></tr></thead>
              <tbody>
                {s.yearly.length === 0 && <tr><td colSpan="4" className="empty">—</td></tr>}
                {s.yearly.map((y) => (
                  <tr key={y.year} style={{ cursor: 'default' }}><td>{y.year}</td><td className="right num">{y.count}</td><td className="right"><Money value={y.ht} /></td><td className="right"><Money value={y.ttc} /></td></tr>
                ))}
              </tbody>
            </table>
            <div className="card-pad small muted">Proformas {year} : {s.proformas.total} émise(s), {s.proformas.converted} convertie(s){s.proformas.total ? ` (${Math.round((s.proformas.converted / s.proformas.total) * 100)} %)` : ''}.</div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Tableau de bord : indicateurs, alertes de retard, liste filtrable / triable. */
import { useState } from 'react';
import { api, download, qs } from '../lib/api.js';
import { navigate, useDebounced, useLoad, useLocalPref } from '../lib/hooks.js';
import { formatDateShort } from '../../../shared/format.js';
import Icon from '../components/Icon.jsx';
import { Money, StatusBadge, TypeTag, useSettings } from '../components/ui.jsx';

const STATUSES = [
  ['', 'Tous les statuts'], ['brouillon', 'Brouillon'], ['emise', 'Émise'], ['envoyee', 'Envoyée'],
  ['impayee', 'Impayée (émise ou envoyée)'], ['en_retard', 'En retard'], ['payee', 'Payée'],
  ['annulee', 'Annulée'], ['convertie', 'Convertie'],
];

export default function Dashboard({ alerts }) {
  const { nextNumbers } = useSettings();
  const [f, setF] = useLocalPref('dashboard-filters', { type: '', status: '', q: '', from: '', to: '', sort: 'updated', dir: 'desc' });
  const set = (k, v) => setF({ ...f, [k]: v });
  const q = useDebounced(f.q, 250);
  const query = { ...f, q };
  const [rows, , error] = useLoad(() => api.get(`/documents${qs(query)}`), [JSON.stringify(query)]);
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const [stats] = useLoad(() => api.get(`/stats?year=${year}`), []);

  const sortBy = (k) => setF({ ...f, sort: k, dir: f.sort === k && f.dir === 'desc' ? 'asc' : 'desc' });
  const Th = ({ k, children, className = '' }) => (
    <th className={`sortable ${className}`} onClick={() => sortBy(k)} aria-sort={f.sort === k ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {children}{f.sort === k ? (f.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
  const hasFilters = f.type || f.status || f.q || f.from || f.to;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tableau de bord</h1>
          <div className="sub">Prochains numéros : <span className="doc-num">{nextNumbers.facture}</span> · <span className="doc-num">{nextNumbers.proforma}</span></div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => navigate('/nouveau/proforma')}><Icon name="file" />Nouvelle proforma</button>
        <button className="btn primary" onClick={() => navigate('/nouveau/facture')}><Icon name="plus" />Nouvelle facture</button>
      </div>
      <div className="content stack">
        {alerts.length > 0 && (
          <div className="banner danger" role="alert">
            <Icon name="alert" size={20} />
            <div>
              <strong>{alerts.length} facture{alerts.length > 1 ? 's' : ''} en retard de paiement</strong>
              <ul>
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <a href={`#/documents/${a.id}`}>{a.number}</a> — {a.clientName} — échéance {formatDateShort(a.dueDate)} — solde <Money value={a.balance} currency={a.currency} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="kpis">
          <div className="card kpi">
            <div className="eyebrow">CA du mois (HT)</div>
            <div className="v"><Money value={stats?.monthly?.[month]?.ht} /></div>
            <div className="h">{stats?.monthly?.[month]?.count || 0} facture(s)</div>
          </div>
          <div className="card kpi">
            <div className="eyebrow">CA {year} (HT)</div>
            <div className="v"><Money value={stats?.totalHT} /></div>
            <div className="h">Encaissé : <Money value={stats?.collected} /></div>
          </div>
          <div className="card kpi">
            <div className="eyebrow">Impayés</div>
            <div className="v"><Money value={stats?.unpaid} /></div>
            <div className="h">Factures émises non soldées</div>
          </div>
          <div className={`card kpi ${stats?.overdueCount ? 'alert' : ''}`}>
            <div className="eyebrow">En retard</div>
            <div className="v"><Money value={stats?.overdue} /></div>
            <div className="h">{stats?.overdueCount || 0} facture(s) échue(s)</div>
          </div>
        </div>

        <div className="card">
          <div className="filters">
            <label className="field search"><span>Recherche</span>
              <input type="search" placeholder="Numéro, client, désignation…" value={f.q} onChange={(e) => set('q', e.target.value)} />
            </label>
            <label className="field"><span>Type</span>
              <select value={f.type} onChange={(e) => set('type', e.target.value)}>
                <option value="">Tous</option><option value="facture">Factures</option><option value="proforma">Proformas</option>
              </select>
            </label>
            <label className="field"><span>Statut</span>
              <select value={f.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field"><span>Du</span><input type="date" value={f.from} onChange={(e) => set('from', e.target.value)} /></label>
            <label className="field"><span>Au</span><input type="date" value={f.to} onChange={(e) => set('to', e.target.value)} /></label>
            <div className="row-flex">
              {hasFilters && <button className="btn ghost sm" onClick={() => setF({ ...f, type: '', status: '', q: '', from: '', to: '' })}>Effacer</button>}
              <button className="btn sm" title="Exporter la liste filtrée en CSV" onClick={() => download(`api/export/csv${qs(query)}`)}><Icon name="download" />CSV</button>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <Th k="type">Type</Th>
                  <Th k="number">Numéro</Th>
                  <Th k="client">Client</Th>
                  <Th k="issueDate">Émission</Th>
                  <Th k="dueDate">Échéance</Th>
                  <Th k="amount" className="right">Montant</Th>
                  <th className="right">Solde</th>
                  <Th k="status">Statut</Th>
                </tr>
              </thead>
              <tbody>
                {error && <tr><td colSpan="8" className="empty">{error.message}</td></tr>}
                {rows && rows.length === 0 && (
                  <tr><td colSpan="8" className="empty">{hasFilters ? 'Aucun document ne correspond aux filtres.' : 'Aucun document pour le moment : créez votre première facture.'}</td></tr>
                )}
                {rows?.map((r) => (
                  <tr key={r.id} className={r.displayStatus === 'en_retard' ? 'overdue' : ''} onClick={() => navigate(`/documents/${r.id}`)}>
                    <td><TypeTag type={r.type} /></td>
                    <td className="doc-num">{r.number || <span className="muted">—</span>}</td>
                    <td>{r.clientName || <span className="muted">Sans client</span>}</td>
                    <td className="num">{formatDateShort(r.issueDate)}</td>
                    <td className="num">{formatDateShort(r.dueDate)}</td>
                    <td className="right"><Money value={r.netToPay} currency={r.currency} /></td>
                    <td className="right">{r.type === 'facture' && r.number && !['annulee'].includes(r.status) ? <Money value={r.balance} currency={r.currency} /> : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={r.displayStatus} label={r.statusLabel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

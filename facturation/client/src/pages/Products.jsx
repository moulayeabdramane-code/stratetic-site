/** Catalogue produits / services à prix pré-enregistrés. */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { useDebounced, useLoad } from '../lib/hooks.js';
import { formatRate } from '../../../shared/format.js';
import Icon from '../components/Icon.jsx';
import { Field, Modal, Money, useConfirm, useSettings, useToast } from '../components/ui.jsx';

export default function Products() {
  const { settings } = useSettings();
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 200);
  const [rows, reload] = useLoad(() => api.get(`/products?all=1&q=${encodeURIComponent(dq)}`), [dq]);
  const [edit, setEdit] = useState(null);
  const [confirm, confirmDialog] = useConfirm();
  const EMPTY = { name: '', detail: '', unitPrice: 0, vatRate: settings.defaultVatRate, currency: settings.baseCurrency, active: true };

  const save = async () => {
    try {
      if (edit.id) await api.put(`/products/${edit.id}`, edit); else await api.post('/products', edit);
      toast('Article enregistré'); setEdit(null); reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (p) => {
    if (!(await confirm({ title: "Supprimer l'article", message: `Supprimer « ${p.name} » du catalogue ? Les documents existants ne sont pas modifiés.`, danger: true, confirmLabel: 'Supprimer' }))) return;
    await api.del(`/products/${p.id}`); toast('Article supprimé'); reload();
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Catalogue</h1><div className="sub">Produits et services proposés à la saisie des lignes.</div></div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setEdit(EMPTY)}><Icon name="plus" />Nouvel article</button>
      </div>
      <div className="content">
        <div className="card">
          <div className="filters" style={{ gridTemplateColumns: '1fr' }}>
            <input type="search" placeholder="Rechercher un article" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un article" />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Désignation</th><th className="right">Prix unitaire</th><th className="right">TVA</th><th>État</th><th /></tr></thead>
              <tbody>
                {rows?.length === 0 && <tr><td colSpan="5" className="empty">Catalogue vide.</td></tr>}
                {rows?.map((p) => (
                  <tr key={p.id} onClick={() => setEdit(p)}>
                    <td><strong>{p.name}</strong>{p.detail && <div className="small muted">{p.detail}</div>}</td>
                    <td className="right"><Money value={p.unitPrice} currency={p.currency} /></td>
                    <td className="right num">{formatRate(p.vatRate)}</td>
                    <td>{p.active ? <span className="badge payee">Actif</span> : <span className="badge brouillon">Masqué</span>}</td>
                    <td className="right" onClick={(e) => e.stopPropagation()}><button className="btn ghost icon" aria-label="Supprimer" onClick={() => remove(p)}><Icon name="trash" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {edit && (
        <Modal title={edit.id ? "Modifier l'article" : 'Nouvel article'} onClose={() => setEdit(null)} footer={<>
          <button className="btn" onClick={() => setEdit(null)}>Annuler</button>
          <button className="btn primary" onClick={save}>Enregistrer</button>
        </>}>
          <div className="stack">
            <Field label="Désignation"><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Détail" hint="ligne grise sous la désignation"><textarea rows={2} value={edit.detail} onChange={(e) => setEdit({ ...edit, detail: e.target.value })} /></Field>
            <div className="grid-3">
              <Field label="Prix unitaire"><input type="number" min="0" step="any" value={edit.unitPrice} onChange={(e) => setEdit({ ...edit, unitPrice: e.target.value })} /></Field>
              <Field label="Devise">
                <select value={edit.currency} onChange={(e) => setEdit({ ...edit, currency: e.target.value })}>
                  {settings.currencies.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </Field>
              <Field label="TVA">
                <select value={edit.vatRate} onChange={(e) => setEdit({ ...edit, vatRate: Number(e.target.value) })}>
                  {settings.vatRates.map((r) => <option key={r} value={r}>{formatRate(r)}</option>)}
                </select>
              </Field>
            </div>
            <label className="check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Proposé à la saisie</label>
          </div>
        </Modal>
      )}
      {confirmDialog}
    </>
  );
}

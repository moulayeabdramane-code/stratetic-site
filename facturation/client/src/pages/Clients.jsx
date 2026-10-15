/** Base clients : recherche, fiche, duplication intelligente. */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { navigate, useDebounced, useLoad } from '../lib/hooks.js';
import Icon from '../components/Icon.jsx';
import { Field, Modal, useConfirm, useToast } from '../components/ui.jsx';

const EMPTY = { name: '', addressLines: [], email: '', phone: '', taxIds: [{ label: 'NIF', value: '' }], notes: '' };

export default function Clients() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 200);
  const [rows, reload] = useLoad(() => api.get(`/clients?q=${encodeURIComponent(dq)}`), [dq]);
  const [edit, setEdit] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  const save = async () => {
    try {
      const body = { ...edit, addressLines: edit.addressText.split('\n') };
      if (edit.id) await api.put(`/clients/${edit.id}`, body); else await api.post('/clients', body);
      toast('Client enregistré');
      setEdit(null);
      reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (c) => {
    if (!(await confirm({ title: 'Supprimer le client', message: `Supprimer « ${c.name} » ?`, danger: true, confirmLabel: 'Supprimer' }))) return;
    try { await api.del(`/clients/${c.id}`); toast('Client supprimé'); reload(); } catch (e) { toast(e.message, 'error'); }
  };
  const quick = async (c, type) => {
    try {
      const d = await api.post(`/clients/${c.id}/quick-document`, { type });
      toast('Brouillon créé avec les lignes habituelles du client');
      navigate(`/documents/${d.id}`);
    } catch (e) { toast(e.message, 'error'); }
  };
  const open = (c) => setEdit({ ...c, addressText: c.addressLines.join('\n') });

  return (
    <>
      <div className="page-head">
        <div><h1>Clients</h1><div className="sub">Fiches réutilisables : elles alimentent l'auto-complétion des documents.</div></div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => open(EMPTY)}><Icon name="plus" />Nouveau client</button>
      </div>
      <div className="content">
        <div className="card">
          <div className="filters" style={{ gridTemplateColumns: '1fr' }}>
            <input type="search" placeholder="Rechercher un client (nom, e-mail, NIF…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un client" />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Client</th><th>Contact</th><th>Identifiants</th><th className="right">Documents</th><th /></tr></thead>
              <tbody>
                {rows?.length === 0 && <tr><td colSpan="5" className="empty">Aucun client. Ils sont aussi créés automatiquement à l'émission d'un document.</td></tr>}
                {rows?.map((c) => (
                  <tr key={c.id} onClick={() => open(c)}>
                    <td><strong>{c.name}</strong><div className="small muted">{c.addressLines.join(', ')}</div></td>
                    <td className="small">{c.email}<div className="muted">{c.phone}</div></td>
                    <td className="small">{c.taxIds.map((t) => `${t.label} ${t.value}`).join(' · ')}</td>
                    <td className="right num">{c.documentCount}</td>
                    <td className="right" onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn sm" title="Nouvelle facture avec les lignes habituelles" onClick={() => quick(c, 'facture')}><Icon name="repeat" />Facture</button>{' '}
                      <button className="btn sm ghost" title="Nouvelle proforma avec les lignes habituelles" onClick={() => quick(c, 'proforma')}>Proforma</button>{' '}
                      <button className="btn ghost icon" aria-label="Supprimer" onClick={() => remove(c)}><Icon name="trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Modifier le client' : 'Nouveau client'} onClose={() => setEdit(null)} footer={<>
          <button className="btn" onClick={() => setEdit(null)}>Annuler</button>
          <button className="btn primary" onClick={save}>Enregistrer</button>
        </>}>
          <div className="stack">
            <Field label="Nom ou raison sociale"><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Adresse" hint="une ligne par ligne imprimée"><textarea rows={3} value={edit.addressText} onChange={(e) => setEdit({ ...edit, addressText: e.target.value })} /></Field>
            <div className="grid-2">
              <Field label="E-mail"><input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
              <Field label="Téléphone"><input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            </div>
            <div>
              <div className="label-text" style={{ marginBottom: 6 }}>Identifiants fiscaux</div>
              {edit.taxIds.map((t, i) => (
                <div className="row-flex" key={i} style={{ marginBottom: 6, flexWrap: 'nowrap' }}>
                  <input style={{ width: 110 }} value={t.label} aria-label="Libellé" onChange={(e) => setEdit({ ...edit, taxIds: edit.taxIds.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <input value={t.value} aria-label="Valeur" onChange={(e) => setEdit({ ...edit, taxIds: edit.taxIds.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <button className="btn ghost icon" aria-label="Retirer" onClick={() => setEdit({ ...edit, taxIds: edit.taxIds.filter((_, j) => j !== i) })}><Icon name="x" /></button>
                </div>
              ))}
              <button className="btn sm ghost" onClick={() => setEdit({ ...edit, taxIds: [...edit.taxIds, { label: '', value: '' }] })}><Icon name="plus" />Identifiant</button>
            </div>
            <Field label="Notes"><textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
      {confirmDialog}
    </>
  );
}

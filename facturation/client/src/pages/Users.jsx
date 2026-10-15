/** Gestion des comptes (administrateurs uniquement). */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/hooks.js';
import { formatDateTime } from '../../../shared/format.js';
import Icon from '../components/Icon.jsx';
import { Field, Modal, useConfirm, useToast } from '../components/ui.jsx';

const ROLES = { admin: 'Administrateur', utilisateur: 'Utilisateur' };

/** Affiche un mot de passe provisoire une seule fois, avec bouton copier. */
function TempPassword({ email, password, onClose }) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(password); toast('Mot de passe copié'); } catch { toast('Copie impossible : sélectionnez-le à la main', 'error'); }
  };
  return (
    <Modal title="Mot de passe provisoire" onClose={onClose} footer={<button className="btn primary" onClick={onClose}>J'ai transmis le mot de passe</button>}>
      <div className="stack">
        <p style={{ margin: 0 }}>Transmettez ces identifiants à la personne concernée. Ce mot de passe <strong>ne sera plus affiché</strong> ; il devra être changé à la première connexion.</p>
        <div className="temp-pass">
          <div><span className="muted small">E-mail</span><div>{email}</div></div>
          <div><span className="muted small">Mot de passe</span><div className="doc-num" style={{ fontSize: 18 }}>{password}</div></div>
          <button className="btn sm" onClick={copy}><Icon name="copy" />Copier</button>
        </div>
      </div>
    </Modal>
  );
}

export default function Users({ me }) {
  const toast = useToast();
  const [rows, reload] = useLoad(() => api.get('/users'), []);
  const [edit, setEdit] = useState(null);
  const [temp, setTemp] = useState(null);
  const [confirm, confirmDialog] = useConfirm();

  const save = async () => {
    try {
      if (edit.id) {
        await api.put(`/users/${edit.id}`, { name: edit.name, email: edit.email, role: edit.role, active: edit.active });
        toast('Compte mis à jour');
      } else {
        const r = await api.post('/users', { name: edit.name, email: edit.email, role: edit.role });
        setTemp({ email: r.user.email, password: r.temporaryPassword });
      }
      setEdit(null);
      reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const reset = async (u) => {
    if (!(await confirm({ title: 'Réinitialiser le mot de passe', message: `Un nouveau mot de passe provisoire sera créé pour ${u.name}. Ses sessions ouvertes seront fermées.`, confirmLabel: 'Réinitialiser' }))) return;
    try {
      const r = await api.post(`/users/${u.id}/reset-password`);
      setTemp({ email: u.email, password: r.temporaryPassword });
      reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (u) => {
    if (!(await confirm({ title: 'Supprimer le compte', message: `Supprimer le compte de ${u.name} ? L'historique des documents conserve son nom.`, danger: true, confirmLabel: 'Supprimer' }))) return;
    try { await api.del(`/users/${u.id}`); toast('Compte supprimé'); reload(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <div className="page-head">
        <div><h1>Utilisateurs</h1><div className="sub">Comptes ayant accès à la facturation. Les utilisateurs n'ont pas accès aux paramètres ni à cette page.</div></div>
        <span className="spacer" />
        <button className="btn primary" onClick={() => setEdit({ name: '', email: '', role: 'utilisateur', active: true })}><Icon name="plus" />Nouveau compte</button>
      </div>
      <div className="content">
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th>État</th><th>Dernière connexion</th><th /></tr></thead>
            <tbody>
              {rows?.map((u) => (
                <tr key={u.id} onClick={() => setEdit({ ...u })}>
                  <td><strong>{u.name}</strong>{u.id === me.id && <span className="muted small"> (vous)</span>}</td>
                  <td>{u.email}</td>
                  <td>{ROLES[u.role]}</td>
                  <td>
                    {!u.active ? <span className="badge annulee">Désactivé</span>
                      : u.mustChange ? <span className="badge convertie">Mot de passe provisoire</span>
                        : <span className="badge payee">Actif</span>}
                  </td>
                  <td className="num small">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : <span className="muted">Jamais</span>}</td>
                  <td className="right" onClick={(e) => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn sm ghost" onClick={() => reset(u)}><Icon name="lock" />Réinitialiser</button>
                    {u.id !== me.id && <button className="btn ghost icon" aria-label="Supprimer" onClick={() => remove(u)}><Icon name="trash" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => setEdit(null)} footer={<>
          <button className="btn" onClick={() => setEdit(null)}>Annuler</button>
          <button className="btn primary" onClick={save} disabled={!edit.name.trim() || !edit.email.trim()}>{edit.id ? 'Enregistrer' : 'Créer le compte'}</button>
        </>}>
          <div className="stack">
            <div className="grid-2">
              <Field label="Nom"><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="E-mail (identifiant)"><input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            </div>
            <Field label="Rôle">
              <select value={edit.role} disabled={edit.id === me.id} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                <option value="utilisateur">Utilisateur — documents, clients, catalogue, statistiques</option>
                <option value="admin">Administrateur — tout, y compris paramètres et comptes</option>
              </select>
            </Field>
            {edit.id && edit.id !== me.id && (
              <label className="check"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Compte actif</label>
            )}
            {!edit.id && <p className="small muted" style={{ margin: 0 }}>Un mot de passe provisoire sera généré et affiché une seule fois.</p>}
          </div>
        </Modal>
      )}
      {temp && <TempPassword {...temp} onClose={() => setTemp(null)} />}
      {confirmDialog}
    </>
  );
}

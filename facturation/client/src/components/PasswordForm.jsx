/** Changement de son mot de passe (forcé au premier login, ou volontaire). */
import { useState } from 'react';
import { api } from '../lib/api.js';
import { Field } from './ui.jsx';

export const MIN_PASSWORD = 10;

export default function PasswordForm({ onDone, onCancel, forced }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.next !== f.confirm) { setError('Les deux nouveaux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    setError('');
    try {
      const { user } = await api.post('/auth/password', { current: f.current, next: f.next });
      onDone(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={submit}>
      {forced && <div className="banner info"><div><strong>Choisissez votre mot de passe</strong>Le mot de passe provisoire doit être remplacé avant de continuer.</div></div>}
      <Field label={forced ? 'Mot de passe provisoire' : 'Mot de passe actuel'}>
        <input type="password" autoComplete="current-password" required autoFocus value={f.current} onChange={set('current')} />
      </Field>
      <Field label="Nouveau mot de passe" hint={`${MIN_PASSWORD} caractères minimum`}>
        <input type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={f.next} onChange={set('next')} />
      </Field>
      <Field label="Confirmation">
        <input type="password" autoComplete="new-password" required value={f.confirm} onChange={set('confirm')} />
      </Field>
      {error && <div className="banner danger" role="alert">{error}</div>}
      <div className="row-flex" style={{ justifyContent: 'flex-end' }}>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Annuler</button>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </form>
  );
}

/** Écran de connexion. */
import { useState } from 'react';
import { api } from '../lib/api.js';

export default function Login({ onLogged }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await api.post('/auth/login', { email, password });
      onLogged(user);
    } catch (err) {
      setError(err.message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand"><img src="template/assets/logo.png" alt="Agence STRATETIC" /></div>
        <div className="auth-body">
          <h1>Facturation</h1>
          <p className="muted small" style={{ marginTop: 4 }}>Connectez-vous pour accéder aux factures et proformas.</p>
          <label className="field"><span>E-mail</span>
            <input type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field"><span>Mot de passe</span>
            <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="banner danger" role="alert">{error}</div>}
          <button className="btn primary" type="submit" disabled={busy} style={{ width: '100%' }}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        </div>
      </form>
    </div>
  );
}

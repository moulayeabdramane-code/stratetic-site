/**
 * Application : connexion, structure (barre latérale), routage et données partagées.
 *
 *   anonyme            -> écran de connexion
 *   mot de passe provisoire -> changement obligatoire
 *   connecté           -> application (pages « Paramètres » et « Utilisateurs » réservées aux admins)
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from './lib/api.js';
import { useLocalPref, useRoute } from './lib/hooks.js';
import { logoUrl } from './lib/logo.js';
import Icon from './components/Icon.jsx';
import PasswordForm from './components/PasswordForm.jsx';
import { Modal, SettingsContext, ToastProvider } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Editor from './pages/Editor.jsx';
import Clients from './pages/Clients.jsx';
import Products from './pages/Products.jsx';
import Stats from './pages/Stats.jsx';
import Verify from './pages/Verify.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';

const NAV = [
  { path: '/', label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/nouveau/facture', label: 'Nouvelle facture', icon: 'plus' },
  { path: '/nouveau/proforma', label: 'Nouvelle proforma', icon: 'file' },
  { path: '/clients', label: 'Clients', icon: 'users' },
  { path: '/catalogue', label: 'Catalogue', icon: 'box' },
  { path: '/statistiques', label: 'Statistiques', icon: 'chart' },
  { path: '/verifier', label: 'Vérifier', icon: 'shield' },
  { path: '/utilisateurs', label: 'Utilisateurs', icon: 'lock', admin: true },
  { path: '/parametres', label: 'Paramètres', icon: 'settings', admin: true },
];

function ThemeToggle() {
  const [theme, setTheme] = useLocalPref('theme', 'auto');
  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <div className="theme-toggle" role="group" aria-label="Thème">
      {[['light', 'Clair'], ['dark', 'Sombre'], ['auto', 'Auto']].map(([k, l]) => (
        <button key={k} className={theme === k ? 'on' : ''} onClick={() => setTheme(k)}>{l}</button>
      ))}
    </div>
  );
}

/** Porte d'entrée : vérifie la session avant d'afficher l'application. */
export default function App() {
  const [auth, setAuth] = useState({ state: 'loading' });

  const check = useCallback(async () => {
    try {
      const { user, authDisabled } = await api.get('/auth/me');
      setAuth({ state: user.mustChange ? 'mustchange' : 'ok', user, authDisabled });
    } catch {
      setAuth({ state: 'anonymous' });
    }
  }, []);
  useEffect(() => { check(); }, [check]);
  useEffect(() => {
    const anon = () => setAuth({ state: 'anonymous' });
    window.addEventListener('auth:required', anon);
    window.addEventListener('auth:mustchange', check);
    return () => { window.removeEventListener('auth:required', anon); window.removeEventListener('auth:mustchange', check); };
  }, [check]);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setAuth({ state: 'anonymous' });
  };

  if (auth.state === 'loading') return <div className="empty-state">Chargement…</div>;
  if (auth.state === 'anonymous') return <Login onLogged={() => check()} />;
  if (auth.state === 'mustchange') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand"><img src="template/assets/logo.png" alt="Agence STRATETIC" /></div>
          <div className="auth-body">
            <h1>Bienvenue, {auth.user.name}</h1>
            <PasswordForm forced onDone={() => check()} onCancel={logout} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <ToastProvider>
      <Shell user={auth.user} authDisabled={auth.authDisabled} onLogout={logout} />
    </ToastProvider>
  );
}

function Shell({ user, authDisabled, onLogout }) {
  const path = useRoute();
  const [ctx, setCtx] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pwd, setPwd] = useState(false);
  const isAdmin = user.role === 'admin';

  const reloadSettings = async () => setCtx(await api.get('/settings'));
  const reloadAlerts = async () => setAlerts(await api.get('/alerts').catch(() => []));
  useEffect(() => { reloadSettings(); }, []);
  // Alerte « factures en retard » rafraîchie à chaque navigation et toutes les 5 min
  useEffect(() => { reloadAlerts(); }, [path]);
  useEffect(() => { const t = setInterval(reloadAlerts, 300000); return () => clearInterval(t); }, []);

  if (!ctx) return <div className="empty-state">Chargement…</div>;

  let page;
  const m = path.match(/^\/documents\/(\d+)$/);
  const n = path.match(/^\/nouveau\/(facture|proforma)$/);
  if (m) page = <Editor key={m[1]} id={Number(m[1])} />;
  else if (n) page = <Editor key={`new-${n[1]}`} newType={n[1]} />;
  else if (path === '/clients') page = <Clients />;
  else if (path === '/catalogue') page = <Products />;
  else if (path === '/statistiques') page = <Stats />;
  else if (path === '/verifier') page = <Verify />;
  else if (path === '/parametres' && isAdmin) page = <Settings onSaved={reloadSettings} />;
  else if (path === '/utilisateurs' && isAdmin && !authDisabled) page = <Users me={user} />;
  else page = <Dashboard alerts={alerts} />;

  const nav = NAV.filter((it) => !it.admin || (isAdmin && !(it.path === '/utilisateurs' && authDisabled)));
  return (
    <SettingsContext.Provider value={{ ...ctx, user, reload: reloadSettings }}>
      <div className="app">
        <aside className="sidebar">
          <a className="brand" href="#/" aria-label="Tableau de bord"><img src={logoUrl(ctx.settings.issuer.logo)} alt={ctx.settings.issuer.name} /></a>
          <nav className="nav">
            {nav.map((it) => (
              <a key={it.path} href={`#${it.path}`} className={path === it.path ? 'active' : ''} title={it.label}>
                <Icon name={it.icon} /><span className="lbl">{it.label}</span>
                {it.path === '/' && alerts.length > 0 && <span className="count" title="Factures en retard">{alerts.length}</span>}
              </a>
            ))}
          </nav>
          <div className="bottom">
            {!authDisabled && <>
              <div className="who" title={user.email}>{user.name}</div>
              <div className="account-links">
                <button onClick={() => setPwd(true)}>Mot de passe</button>
                <button onClick={onLogout}>Se déconnecter</button>
              </div>
            </>}
            <ThemeToggle />
          </div>
        </aside>
        <main className="main">{page}</main>
      </div>
      {pwd && (
        <Modal title="Changer mon mot de passe" onClose={() => setPwd(false)}>
          <PasswordForm onDone={() => setPwd(false)} onCancel={() => setPwd(false)} />
        </Modal>
      )}
    </SettingsContext.Provider>
  );
}

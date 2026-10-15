/**
 * Authentification par comptes utilisateurs (voir services/users.js).
 *
 * - Cookie de session `fact_sid` : HttpOnly, SameSite=Lax, Secure en HTTPS.
 * - Toute l'API exige une session, sauf /api/auth/login et /api/auth/me.
 * - Un compte dont le mot de passe doit être changé n'a accès qu'à /api/auth/*.
 * - Protection CSRF : les requêtes qui modifient des données doivent venir de
 *   la même origine (en-tête Origin) — en plus de SameSite=Lax.
 * - AUTH_DISABLED=1 désactive la connexion (usage local sur un seul PC).
 *
 * L'utilisateur connecté est disponible partout via currentUser() (journal).
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { sessionUser } from './services/users.js';
import { BASE_PATH } from './paths.js';

const context = new AsyncLocalStorage();
export const currentUser = () => context.getStore()?.user || null;

export const COOKIE = 'fact_sid';
const LOCAL_USER = { id: 0, name: 'Local', email: '', role: 'admin', mustChange: false };

/** Chemins de l'API accessibles sans session (relatifs à /api). */
const PUBLIC = new Set(['/auth/login', '/auth/me', '/auth/logout']);
/** Chemins accessibles quand le mot de passe doit être changé. */
const BEFORE_CHANGE = new Set(['/auth/me', '/auth/logout', '/auth/password']);

export const readToken = (req) => new RegExp(`(?:^|;\\s*)${COOKIE}=([a-f0-9]{64})`).exec(req.headers.cookie || '')?.[1] || null;

export function setSessionCookie(req, res, token, maxAgeSec) {
  const secure = req.secure ? '; Secure' : '';
  // Cookie limité au chemin de l'application (ex. /facturation) : jamais envoyé au site principal
  res.append('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Path=${BASE_PATH || '/'}; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`);
}

export function clearSessionCookie(req, res) {
  setSessionCookie(req, res, '', 0);
}

/** Refuse les requêtes d'écriture venant d'une autre origine. */
function sameOrigin(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origin = req.headers.origin;
  if (!origin) return true; // clients non navigateurs, ou navigateurs anciens (SameSite=Lax couvre)
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

/** Garde de l'API (à monter sur /api). */
export function apiGuard({ disabled = process.env.AUTH_DISABLED === '1' } = {}) {
  return (req, res, next) => {
    if (!sameOrigin(req)) return res.status(403).json({ error: 'Requête refusée (origine différente).' });
    if (disabled) return context.run({ user: LOCAL_USER }, next);

    const token = readToken(req);
    const user = token ? sessionUser(token) : null;
    if (!user) {
      if (PUBLIC.has(req.path)) return context.run({ user: null }, next);
      return res.status(401).json({ error: 'Session expirée : reconnectez-vous.', login: true });
    }
    if (user.mustChange && !BEFORE_CHANGE.has(req.path)) {
      return res.status(403).json({ error: 'Changez votre mot de passe pour continuer.', mustChangePassword: true });
    }
    context.run({ user, token }, next);
  };
}

/** Réservé aux administrateurs. */
export function requireAdmin(req, res, next) {
  if (currentUser()?.role === 'admin') return next();
  res.status(403).json({ error: 'Action réservée aux administrateurs.' });
}

export const authDisabled = () => process.env.AUTH_DISABLED === '1';
export const currentToken = () => context.getStore()?.token || null;

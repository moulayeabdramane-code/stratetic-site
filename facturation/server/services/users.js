/**
 * Comptes utilisateurs, sessions et protection contre la force brute.
 *
 * - Mots de passe : scrypt (sel aléatoire de 16 octets par compte), comparaison
 *   à temps constant. Le mot de passe en clair n'est jamais stocké.
 * - Sessions : jeton aléatoire de 32 octets remis dans un cookie HttpOnly ; la
 *   base ne conserve que son empreinte SHA-256 (un vol de la base ne donne pas
 *   accès aux sessions). Durée 7 jours, prolongée à l'usage.
 * - Force brute : 5 échecs (par adresse IP ou par e-mail) -> blocage 15 min.
 */
import crypto from 'node:crypto';
import { getDb, now } from '../db/database.js';

const err = (status, message) => Object.assign(new Error(message), { status });

export const ROLES = ['admin', 'utilisateur'];
export const MIN_PASSWORD = 10;
const SESSION_DAYS = 7;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Mots de passe
// ---------------------------------------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64, SCRYPT).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const candidate = crypto.scryptSync(String(password), salt, 64, SCRYPT);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

/** Empreinte factice : on calcule un scrypt même pour un e-mail inconnu (pas d'énumération par le temps). */
const DUMMY = hashPassword('compte-inexistant');

export function checkPasswordPolicy(password, email = '') {
  const p = String(password || '');
  if (p.length < MIN_PASSWORD) throw err(400, `Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`);
  if (email && p.toLowerCase() === String(email).toLowerCase()) throw err(400, "Le mot de passe ne peut pas être l'adresse e-mail.");
}

/** Mot de passe lisible aléatoire (sans caractères ambigus). */
export function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length), (b) => chars[b % chars.length]).join('');
}

// ---------------------------------------------------------------------------
// Comptes
// ---------------------------------------------------------------------------

const toUser = (r) => r && {
  id: r.id, name: r.name, email: r.email, role: r.role, mustChange: !!r.must_change, active: !!r.active,
  lastLoginAt: r.last_login_at, createdAt: r.created_at, updatedAt: r.updated_at,
};

const normEmail = (e) => String(e || '').trim().toLowerCase();

export function countUsers() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

export function listUsers() {
  return getDb().prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE').all().map(toUser);
}

export function getUser(id) {
  return toUser(getDb().prepare('SELECT * FROM users WHERE id = ?').get(id));
}

export function createUser({ name, email, role = 'utilisateur', password, mustChange = true }) {
  const e = normEmail(email);
  if (!String(name || '').trim()) throw err(400, 'Le nom est obligatoire.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw err(400, 'Adresse e-mail invalide.');
  if (!ROLES.includes(role)) throw err(400, 'Rôle invalide.');
  checkPasswordPolicy(password, e);
  if (getDb().prepare('SELECT 1 FROM users WHERE email = ?').get(e)) throw err(409, 'Un compte existe déjà avec cette adresse.');
  const { salt, hash } = hashPassword(password);
  const t = now();
  const r = getDb().prepare(`INSERT INTO users (name, email, role, salt, hash, must_change, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(String(name).trim(), e, role, salt, hash, mustChange ? 1 : 0, t, t);
  return getUser(Number(r.lastInsertRowid));
}

function activeAdmins(exceptId = 0) {
  return getDb().prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id <> ?`).get(exceptId).n;
}

export function updateUser(id, { name, email, role, active }, actorId) {
  const u = getUser(id);
  if (!u) throw err(404, 'Compte introuvable.');
  const next = {
    name: name != null ? String(name).trim() : u.name,
    email: email != null ? normEmail(email) : u.email,
    role: role ?? u.role,
    active: active ?? u.active,
  };
  if (!next.name) throw err(400, 'Le nom est obligatoire.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) throw err(400, 'Adresse e-mail invalide.');
  if (!ROLES.includes(next.role)) throw err(400, 'Rôle invalide.');
  if (id === actorId && (next.role !== 'admin' || !next.active)) {
    throw err(409, 'Vous ne pouvez pas retirer vos propres droits administrateur ni désactiver votre compte.');
  }
  if (u.role === 'admin' && (next.role !== 'admin' || !next.active) && activeAdmins(id) === 0) {
    throw err(409, 'Il doit rester au moins un administrateur actif.');
  }
  const dup = getDb().prepare('SELECT id FROM users WHERE email = ? AND id <> ?').get(next.email, id);
  if (dup) throw err(409, 'Un compte existe déjà avec cette adresse.');
  getDb().prepare('UPDATE users SET name = ?, email = ?, role = ?, active = ?, updated_at = ? WHERE id = ?')
    .run(next.name, next.email, next.role, next.active ? 1 : 0, now(), id);
  if (!next.active) deleteUserSessions(id);
  return getUser(id);
}

/** Réinitialisation par un administrateur : nouveau mot de passe provisoire à changer. */
export function resetPassword(id, password) {
  const u = getUser(id);
  if (!u) throw err(404, 'Compte introuvable.');
  checkPasswordPolicy(password, u.email);
  const { salt, hash } = hashPassword(password);
  getDb().prepare('UPDATE users SET salt = ?, hash = ?, must_change = 1, updated_at = ? WHERE id = ?').run(salt, hash, now(), id);
  deleteUserSessions(id);
  return getUser(id);
}

/** Changement de son propre mot de passe (l'ancien est exigé). */
export function changeOwnPassword(id, current, next, keepTokenHash) {
  const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row || !verifyPassword(current, row.salt, row.hash)) throw err(400, 'Mot de passe actuel incorrect.');
  checkPasswordPolicy(next, row.email);
  if (verifyPassword(next, row.salt, row.hash)) throw err(400, "Le nouveau mot de passe doit être différent de l'ancien.");
  const { salt, hash } = hashPassword(next);
  getDb().prepare('UPDATE users SET salt = ?, hash = ?, must_change = 0, updated_at = ? WHERE id = ?').run(salt, hash, now(), id);
  // Les autres appareils sont déconnectés ; la session courante est conservée.
  getDb().prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(id, keepTokenHash || '');
  return getUser(id);
}

export function deleteUser(id, actorId) {
  const u = getUser(id);
  if (!u) throw err(404, 'Compte introuvable.');
  if (id === actorId) throw err(409, 'Vous ne pouvez pas supprimer votre propre compte.');
  if (u.role === 'admin' && activeAdmins(id) === 0) throw err(409, 'Il doit rester au moins un administrateur actif.');
  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
}

/**
 * Premier démarrage : crée le compte administrateur.
 * INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD si définis, sinon mot de passe
 * généré et affiché une seule fois dans les journaux. Changement exigé à la
 * première connexion dans tous les cas.
 */
export function ensureInitialAdmin(env = process.env) {
  if (countUsers() > 0) return null;
  const email = normEmail(env.INITIAL_ADMIN_EMAIL || 'admin@stratetic.art');
  const generated = !env.INITIAL_ADMIN_PASSWORD;
  const password = env.INITIAL_ADMIN_PASSWORD || generatePassword();
  createUser({ name: env.INITIAL_ADMIN_NAME || 'Administrateur', email, role: 'admin', password, mustChange: true });
  return { email, password: generated ? password : null };
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const tokenHash = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const expiry = () => new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();

export function createSession(userId, { ip = '', userAgent = '' } = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  getDb().prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?)')
    .run(tokenHash(token), userId, now(), expiry(), String(ip).slice(0, 64), String(userAgent).slice(0, 200));
  getDb().prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), userId);
  return { token, maxAgeSec: SESSION_DAYS * 86400 };
}

/** Utilisateur d'une session valide (et prolongation au-delà d'un jour d'ancienneté). */
export function sessionUser(token) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return null;
  const h = tokenHash(token);
  const row = getDb().prepare(`SELECT s.expires_at, u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?`).get(h);
  if (!row) return null;
  if (row.expires_at < now() || !row.active) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(h);
    return null;
  }
  if (Date.parse(row.expires_at) - Date.now() < (SESSION_DAYS - 1) * 86400000) {
    getDb().prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(expiry(), h);
  }
  return { ...toUser(row), tokenHash: h };
}

export function deleteSession(token) {
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash(token));
}

export function deleteUserSessions(userId) {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function purgeExpiredSessions() {
  getDb().prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
}

// ---------------------------------------------------------------------------
// Connexion et force brute
// ---------------------------------------------------------------------------

const failures = new Map(); // clé (ip:… ou email:…) -> { count, until }

function isLocked(key) {
  const f = failures.get(key);
  return !!f && f.until > Date.now();
}
function recordFailure(key) {
  const f = failures.get(key) || { count: 0, until: 0 };
  f.count += 1;
  if (f.count >= MAX_FAILURES) { f.until = Date.now() + LOCK_MS; f.count = 0; }
  failures.set(key, f);
}

/** Pour les tests. */
export function resetLoginThrottle() { failures.clear(); }

/**
 * Vérifie les identifiants. Renvoie l'utilisateur ou lève une erreur 401/429.
 * Le message d'échec est identique que l'e-mail existe ou non.
 */
export function authenticate(email, password, ip = '') {
  const e = normEmail(email);
  const keys = [`ip:${ip}`, `email:${e}`];
  if (keys.some(isLocked)) throw err(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
  const row = getDb().prepare('SELECT * FROM users WHERE email = ?').get(e);
  const ok = row ? verifyPassword(password, row.salt, row.hash) : (verifyPassword(password, DUMMY.salt, DUMMY.hash), false);
  if (!ok || !row.active) {
    keys.forEach(recordFailure);
    throw err(401, 'E-mail ou mot de passe incorrect.');
  }
  keys.forEach((k) => failures.delete(k));
  return toUser(row);
}

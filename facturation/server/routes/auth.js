/**
 * Connexion, déconnexion, mot de passe et gestion des comptes (préfixe /api).
 */
import express from 'express';
import * as users from '../services/users.js';
import {
  authDisabled, clearSessionCookie, currentToken, currentUser, readToken, requireAdmin, setSessionCookie,
} from '../auth.js';

export const authRoutes = express.Router();
const id = (req) => Number(req.params.id);
const wrap = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { next(e); } };

authRoutes.post('/auth/login', wrap((req, res) => {
  const { email, password } = req.body || {};
  const user = users.authenticate(email, password, req.ip);
  const { token, maxAgeSec } = users.createSession(user.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
  setSessionCookie(req, res, token, maxAgeSec);
  res.json({ user });
}));

authRoutes.post('/auth/logout', wrap((req, res) => {
  const token = readToken(req);
  if (token) users.deleteSession(token);
  clearSessionCookie(req, res);
  res.json({ ok: true });
}));

authRoutes.get('/auth/me', (req, res) => {
  const u = currentUser();
  if (!u) return res.status(401).json({ error: 'Non connecté.', authDisabled: authDisabled() });
  res.json({ user: u, authDisabled: authDisabled() });
});

authRoutes.post('/auth/password', wrap((req, res) => {
  if (authDisabled()) return res.status(400).json({ error: 'Connexion désactivée sur ce poste.' });
  const { current, next } = req.body || {};
  const u = users.changeOwnPassword(currentUser().id, current, next, currentToken() && users.tokenHash(currentToken()));
  res.json({ user: u });
}));

// ----- Comptes (administrateurs) -----

authRoutes.get('/users', requireAdmin, (req, res) => res.json(users.listUsers()));

authRoutes.post('/users', requireAdmin, wrap((req, res) => {
  const password = req.body?.password || users.generatePassword();
  const u = users.createUser({ ...req.body, password, mustChange: true });
  // Le mot de passe provisoire n'est renvoyé qu'une fois, pour être transmis à la personne.
  res.status(201).json({ user: u, temporaryPassword: password });
}));

authRoutes.put('/users/:id', requireAdmin, wrap((req, res) => res.json(users.updateUser(id(req), req.body || {}, currentUser().id))));

authRoutes.post('/users/:id/reset-password', requireAdmin, wrap((req, res) => {
  const password = users.generatePassword();
  res.json({ user: users.resetPassword(id(req), password), temporaryPassword: password });
}));

authRoutes.delete('/users/:id', requireAdmin, wrap((req, res) => { users.deleteUser(id(req), currentUser().id); res.status(204).end(); }));

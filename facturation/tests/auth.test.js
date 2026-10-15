import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

const { openDatabase, getDb } = await import('../server/db/database.js');
const users = await import('../server/services/users.js');
const { apiGuard } = await import('../server/auth.js');
const { api } = await import('../server/routes/api.js');

openDatabase(':memory:');

// Application identique à la production (garde + API), sur un port libre
const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api', apiGuard({ disabled: false }), api);
const server = app.listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());

/** Petit client HTTP qui conserve le cookie de session. */
function client() {
  let cookie = '';
  const call = async (method, url, body, headers = {}) => {
    const r = await fetch(BASE + url, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = r.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
    const data = r.status === 204 ? null : await r.json().catch(() => null);
    return { status: r.status, data, setCookie: set };
  };
  return { call, get cookie() { return cookie; } };
}

const ADMIN = { email: 'admin@stratetic.art', password: 'Mot-de-passe-initial-1' };

test('premier démarrage : administrateur créé, changement de mot de passe exigé', () => {
  const created = users.ensureInitialAdmin({ INITIAL_ADMIN_EMAIL: ADMIN.email, INITIAL_ADMIN_PASSWORD: ADMIN.password });
  assert.equal(created.email, ADMIN.email);
  assert.equal(users.ensureInitialAdmin({}), null, 'jamais recréé ensuite');
  const row = getDb().prepare('SELECT * FROM users').get();
  assert.notEqual(row.hash, ADMIN.password);
  assert.match(row.salt, /^[0-9a-f]{32}$/);
  assert.equal(row.must_change, 1);
});

test('sans session : API refusée (401), échec de connexion avec un message neutre', async () => {
  const c = client();
  assert.equal((await c.call('GET', '/api/documents')).status, 401);
  const bad = await c.call('POST', '/api/auth/login', { email: ADMIN.email, password: 'faux-mot-de-passe' });
  const unknown = await c.call('POST', '/api/auth/login', { email: 'inconnu@x.org', password: 'faux-mot-de-passe' });
  assert.equal(bad.status, 401);
  assert.equal(bad.data.error, unknown.data.error);
  users.resetLoginThrottle();
});

test('connexion : cookie HttpOnly, jeton stocké seulement sous forme d’empreinte', async () => {
  const c = client();
  const r = await c.call('POST', '/api/auth/login', ADMIN);
  assert.equal(r.status, 200);
  assert.match(r.setCookie, /fact_sid=[a-f0-9]{64}; HttpOnly; Path=\/; Max-Age=604800; SameSite=Lax/);
  const token = c.cookie.split('=')[1];
  const stored = getDb().prepare('SELECT token_hash FROM sessions').all().map((s) => s.token_hash);
  assert.ok(!stored.includes(token));
  assert.ok(stored.includes(users.tokenHash(token)));
});

test('mot de passe provisoire : tout est bloqué jusqu’au changement', async () => {
  const c = client();
  await c.call('POST', '/api/auth/login', ADMIN);
  const blocked = await c.call('GET', '/api/documents');
  assert.equal(blocked.status, 403);
  assert.equal(blocked.data.mustChangePassword, true);
  assert.equal((await c.call('POST', '/api/auth/password', { current: ADMIN.password, next: 'court' })).status, 400);
  const ok = await c.call('POST', '/api/auth/password', { current: ADMIN.password, next: 'Nouveau-mot-de-passe-2' });
  assert.equal(ok.status, 200);
  assert.equal((await c.call('GET', '/api/documents')).status, 200);
  ADMIN.password = 'Nouveau-mot-de-passe-2';
});

test('force brute : 5 échecs -> blocage, même avec le bon mot de passe', async () => {
  users.resetLoginThrottle();
  const c = client();
  for (let i = 0; i < 5; i++) await c.call('POST', '/api/auth/login', { email: ADMIN.email, password: `mauvais-${i}` });
  const locked = await c.call('POST', '/api/auth/login', ADMIN);
  assert.equal(locked.status, 429);
  users.resetLoginThrottle();
  assert.equal((await c.call('POST', '/api/auth/login', ADMIN)).status, 200);
});

test('rôles : un utilisateur n’accède ni aux paramètres en écriture, ni aux comptes, ni à l’import', async () => {
  const admin = client();
  await admin.call('POST', '/api/auth/login', ADMIN);
  const created = await admin.call('POST', '/api/users', { name: 'Assistante', email: 'assistante@stratetic.art', role: 'utilisateur' });
  assert.equal(created.status, 201);
  assert.ok(created.data.temporaryPassword.length >= 14);

  const u = client();
  await u.call('POST', '/api/auth/login', { email: 'assistante@stratetic.art', password: created.data.temporaryPassword });
  await u.call('POST', '/api/auth/password', { current: created.data.temporaryPassword, next: 'Assistante-2026-ok' });
  assert.equal((await u.call('GET', '/api/documents')).status, 200);
  assert.equal((await u.call('GET', '/api/users')).status, 403);
  assert.equal((await u.call('PUT', '/api/settings', {})).status, 403);
  assert.equal((await u.call('POST', '/api/import/json', {})).status, 403);
});

test('protection CSRF : écriture refusée depuis une autre origine', async () => {
  const c = client();
  await c.call('POST', '/api/auth/login', ADMIN);
  const r = await c.call('POST', '/api/documents', { type: 'facture' }, { origin: 'https://site-malveillant.example' });
  assert.equal(r.status, 403);
  const same = await c.call('POST', '/api/documents', { type: 'facture' }, { origin: BASE });
  assert.equal(same.status, 201);
});

test('déconnexion et désactivation ferment les sessions', async () => {
  const c = client();
  await c.call('POST', '/api/auth/login', ADMIN);
  await c.call('POST', '/api/auth/logout');
  assert.equal((await c.call('GET', '/api/documents')).status, 401);

  const admin = client();
  await admin.call('POST', '/api/auth/login', ADMIN);
  const target = users.listUsers().find((x) => x.email === 'assistante@stratetic.art');
  const u = client();
  await u.call('POST', '/api/auth/login', { email: target.email, password: 'Assistante-2026-ok' });
  await admin.call('PUT', `/api/users/${target.id}`, { active: false });
  assert.equal((await u.call('GET', '/api/documents')).status, 401);
});

test('au moins un administrateur : impossible de se supprimer ou de se rétrograder', async () => {
  const admin = client();
  await admin.call('POST', '/api/auth/login', ADMIN);
  const me = (await admin.call('GET', '/api/auth/me')).data.user;
  assert.equal((await admin.call('DELETE', `/api/users/${me.id}`)).status, 409);
  assert.equal((await admin.call('PUT', `/api/users/${me.id}`, { role: 'utilisateur' })).status, 409);
});

test('journal : l’auteur de chaque action est enregistré', async () => {
  const admin = client();
  await admin.call('POST', '/api/auth/login', ADMIN);
  const d = await admin.call('POST', '/api/documents', { type: 'proforma' });
  const audit = await admin.call('GET', `/api/documents/${d.data.id}/audit`);
  assert.equal(audit.data[0].user, 'Administrateur');
});

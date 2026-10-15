import './helpers.js';
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

// L'application est publiée sous https://stratetic.art/facturation
process.env.BASE_PATH = '/facturation/';

const { BASE_PATH, CLIENT_DIST, normalizeBasePath } = await import('../server/paths.js');
const { openDatabase } = await import('../server/db/database.js');
const users = await import('../server/services/users.js');
const { createApp } = await import('../server/app.js');

openDatabase(':memory:');
users.createUser({ name: 'Admin', email: 'admin@stratetic.art', role: 'admin', password: 'Mot-de-passe-solide-1', mustChange: false });

const server = createApp().listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;
test.after(() => server.close());
const hasClient = fs.existsSync(`${CLIENT_DIST}/index.html`);

const req = (path, opts = {}) => fetch(BASE + path, { redirect: 'manual', ...opts });
const login = (prefix) => req(`${prefix}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@stratetic.art', password: 'Mot-de-passe-solide-1' }),
});

test('BASE_PATH normalisé (barre finale retirée, valeur invalide refusée)', () => {
  assert.equal(BASE_PATH, '/facturation');
  assert.equal(normalizeBasePath(''), '');
  assert.equal(normalizeBasePath('/facturation///'), '/facturation');
  assert.throws(() => normalizeBasePath('/fact"><script>'));
});

test('/facturation sans barre finale -> redirection vers /facturation/', async () => {
  const r = await req('/facturation');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('location'), '/facturation/');
});

test('interface servie avec <base href="/facturation/">', { skip: !hasClient && 'interface non compilée' }, async () => {
  for (const path of ['/facturation/', '/']) { // préfixe conservé ou retiré par le proxy
    const html = await (await req(path)).text();
    assert.match(html, /<base href="\/facturation\/">/);
    assert.doesNotMatch(html, /(src|href)="\/(assets|api|template)/, 'aucune adresse absolue');
  }
});

test('API et sonde de santé : préfixe conservé ou retiré par le proxy', async () => {
  assert.equal((await req('/facturation/healthz')).status, 200);
  assert.equal((await req('/healthz')).status, 200);
  assert.equal((await req('/facturation/api/documents')).status, 401);
  assert.equal((await req('/api/documents')).status, 401);
  const unknown = await req('/facturation/api/inexistant');
  assert.equal(unknown.status, 401); // l'API reste protégée, même pour une adresse inconnue
});

test('cookie de session limité à /facturation (jamais envoyé au site principal)', async () => {
  for (const prefix of ['/facturation', '']) {
    const r = await login(prefix);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /; Path=\/facturation;/);
  }
});

test('aperçu : polices et logo cherchés sous /facturation/template/', async () => {
  const cookie = (await login('/facturation')).headers.get('set-cookie').split(';')[0];
  const r = await req('/facturation/api/preview', {
    method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ type: 'facture' }),
  });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<base href="\/facturation\/template\/">/);
  const missing = await req('/facturation/api/inexistant', { headers: { cookie } });
  assert.equal(missing.status, 404);
});

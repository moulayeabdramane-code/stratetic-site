import { patchSettings } from './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { openDatabase, getDb } = await import('../server/db/database.js');
const docs = await import('../server/services/documents.js');
const { exportJson, importJson } = await import('../server/services/backup.js');
const { signDocument } = await import('../server/services/qr.js');

openDatabase(':memory:');

const client = { name: 'CLIENT EXEMPLE', addressLines: ['BP 10 000 Niamey, Niger'], taxIds: [{ label: 'NIF', value: '00000' }] };
const line = { designation: 'Forfait', quantity: 1, unitPrice: 100000, vatRate: 0 };
const draft = (extra = {}) => docs.createDraft({ type: 'facture', issueDate: '2026-10-14', dueDate: '2026-11-13', client, lines: [line], ...extra });

test('le premier numéro reprend la valeur de départ configurée (044 -> 045)', () => {
  const d = docs.issueDocument(draft().id);
  assert.equal(d.number, 'FAC-2026-045');
  assert.equal(d.status, 'emise');
  assert.ok(d.signature);
});

test('séries indépendantes facture / proforma', () => {
  const p = docs.issueDocument(draft({ type: 'proforma' }).id);
  assert.equal(p.number, 'PRO-2026-001');
  const f = docs.issueDocument(draft().id);
  assert.equal(f.number, 'FAC-2026-046');
});

test("une émission en erreur ne consomme aucun numéro", () => {
  const bad = draft({ lines: [{ designation: '', quantity: 0, unitPrice: 10 }] });
  assert.throws(() => docs.issueDocument(bad.id), /désignation manquante/);
  const ok = docs.issueDocument(draft().id);
  assert.equal(ok.number, 'FAC-2026-047');
});

test('un brouillon n\'a pas de numéro et reste modifiable', () => {
  const d = draft();
  assert.equal(d.number, null);
  const u = docs.updateDraft(d.id, { lines: [{ ...line, unitPrice: 5000 }] });
  assert.equal(u.totals.netToPay, 5000);
  docs.deleteDraft(d.id);
  assert.equal(docs.getDocument(d.id), null);
});

test('document émis : contenu, numéro et suppression verrouillés (même en SQL direct)', () => {
  const d = docs.issueDocument(draft().id);
  assert.throws(() => docs.updateDraft(d.id, { lines: [] }), /ne peut plus être modifié/);
  assert.throws(() => docs.deleteDraft(d.id), /ne peut plus être modifié/);
  const db = getDb();
  assert.throws(() => db.prepare('UPDATE documents SET number = ? WHERE id = ?').run('FAC-2026-999', d.id), /verrouillés/);
  assert.throws(() => db.prepare('DELETE FROM documents WHERE id = ?').run(d.id), /suppression interdite/);
});

test('compteur : ni saut ni retour arrière possibles', () => {
  const db = getDb();
  assert.throws(() => db.prepare("UPDATE counters SET last = last + 5 WHERE type = 'facture'").run(), /Compteur verrouillé/);
  assert.throws(() => db.prepare("UPDATE counters SET last = 1 WHERE type = 'facture'").run(), /Compteur verrouillé/);
  assert.throws(() => db.prepare('DELETE FROM counters').run(), /Compteur verrouillé/);
});

test('chronologie : pas de date antérieure au dernier document émis', () => {
  const d = draft({ issueDate: '2026-01-05', dueDate: '2026-02-04' });
  assert.throws(() => docs.issueDocument(d.id), /antérieure/);
  docs.deleteDraft(d.id);
});

test('conversion proforma -> facture en un clic', () => {
  const p = docs.issueDocument(draft({ type: 'proforma', issueDate: '2026-10-15', dueDate: '2026-11-14', deposit: 20000 }).id);
  const f = docs.convertProforma(p.id, { issueDate: '2026-10-20' });
  assert.equal(f.type, 'facture');
  assert.match(f.number, /^FAC-2026-\d{3}$/);
  assert.equal(f.sourceNumber, p.number);
  assert.equal(f.deposit, 20000);
  assert.equal(f.totals.netToPay, 80000);
  assert.equal(f.dueDate, '2026-11-19');
  const after = docs.getDocument(p.id);
  assert.equal(after.status, 'convertie');
  assert.equal(after.convertedToNumber, f.number);
  assert.throws(() => docs.convertProforma(p.id), /déjà été convertie/);
});

test('paiements partiels, solde, statut payé et retard', () => {
  const d = docs.issueDocument(draft({ issueDate: '2026-10-21', dueDate: '2026-10-21' }).id);
  assert.equal(docs.displayStatus({ type: 'facture', status: 'emise', due_date: '2026-10-21', net_to_pay: 100000 }, 0, '2026-10-22'), 'en_retard');
  let r = docs.addPayment(d.id, { date: '2026-10-25', amount: 40000, method: 'Virement' });
  assert.equal(r.balance, 60000);
  assert.equal(r.status, 'emise');
  r = docs.markPaid(d.id, { date: '2026-10-30' });
  assert.equal(r.status, 'payee');
  assert.equal(r.balance, 0);
  r = docs.deletePayment(d.id, r.payments[1].id);
  assert.equal(r.status, 'emise');
});

test('annulation : motif obligatoire, numéro conservé', () => {
  const d = docs.issueDocument(draft({ issueDate: '2026-10-21', dueDate: '2026-11-21' }).id);
  assert.throws(() => docs.cancelDocument(d.id, ''), /motif/);
  const c = docs.cancelDocument(d.id, 'Erreur de client');
  assert.equal(c.status, 'annulee');
  assert.equal(c.number, d.number);
});

test('duplication : nouveau brouillon, mêmes client et lignes', () => {
  const src = docs.listDocuments({ type: 'facture' }).find((x) => x.number);
  const dup = docs.duplicateDocument(src.id);
  assert.equal(dup.number, null);
  assert.equal(dup.client.name, 'CLIENT EXEMPLE');
  assert.equal(dup.lines[0].designation, 'Forfait');
  docs.deleteDraft(dup.id);
});

test('signature du QR code', () => {
  const d = docs.listDocuments({}).find((x) => x.number);
  const full = docs.getDocument(d.id);
  assert.equal(full.signature, signDocument({ number: full.number, issueDate: full.issueDate, netToPay: full.totals.netToPay, currency: full.currency }));
  assert.notEqual(full.signature, signDocument({ number: full.number, issueDate: full.issueDate, netToPay: 1, currency: full.currency }));
});

test('sauvegarde JSON puis restauration à l\'identique (verrous rétablis)', () => {
  const before = exportJson();
  const counts = importJson(before);
  assert.equal(counts.documents, before.tables.documents.length);
  const after = exportJson();
  assert.deepEqual(after.tables.documents, before.tables.documents);
  assert.throws(() => getDb().prepare('DELETE FROM counters').run(), /Compteur verrouillé/);
});

test('la clé des QR codes voyage avec la sauvegarde JSON', () => {
  const backup = exportJson();
  assert.match(backup.secretKey, /^[0-9a-f]{64}$/);
  const doc = docs.getDocument(docs.listDocuments({}).find((x) => x.number).id);
  const verifies = () => doc.signature === signDocument({ number: doc.number, issueDate: doc.issueDate, netToPay: doc.totals.netToPay, currency: doc.currency });
  assert.ok(verifies());

  // Une autre installation (autre clé) ne reconnaît pas nos QR codes…
  importJson({ ...backup, secretKey: 'a'.repeat(64) });
  assert.ok(!verifies());
  // …jusqu'à la restauration de notre sauvegarde, qui ramène la clé d'origine.
  const res = importJson(backup);
  assert.equal(res.secretKey, true);
  assert.ok(verifies());

  // Sauvegarde ancienne sans clé : la clé actuelle est conservée.
  const { secretKey, ...old } = backup;
  void secretKey;
  importJson(old);
  assert.ok(verifies());
  assert.throws(() => importJson({ ...backup, secretKey: 'pas-une-clé' }), /Clé de vérification invalide/);
});

test('numérotation continue : pas de remise à zéro', () => {
  patchSettings((s) => { s.numbering.reset = 'continuous'; s.numbering.start.proforma = { continu: 10 }; });
  const a = docs.issueDocument(draft({ type: 'proforma', issueDate: '2026-12-30', dueDate: '2027-01-30' }).id);
  const b = docs.issueDocument(draft({ type: 'proforma', issueDate: '2027-01-02', dueDate: '2027-02-02' }).id);
  assert.equal(a.number, 'PRO-2026-011');
  assert.equal(b.number, 'PRO-2027-012');
});

test('numérotation annuelle : remise à zéro au 1er janvier', () => {
  patchSettings((s) => { s.numbering.reset = 'annual'; });
  const b = docs.issueDocument(draft({ issueDate: '2027-01-03', dueDate: '2027-02-02' }).id);
  assert.equal(b.number, 'FAC-2027-001');
});

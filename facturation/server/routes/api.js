/**
 * API REST de l'application (préfixe /api).
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { getDb } from '../db/database.js';
import { BASE_PATH, PDF_DIR, UPLOADS_DIR } from '../paths.js';
import { loadSettings, saveSettings } from '../services/settings.js';
import { listCounters, peekNextNumber } from '../services/numbering.js';
import * as clients from '../services/clients.js';
import * as products from '../services/products.js';
import * as docs from '../services/documents.js';
import { renderInvoiceHtml } from '../services/renderer.js';
import { renderPdf } from '../services/pdf.js';
import { getStats } from '../services/stats.js';
import { exportJson, importJson, exportCsv } from '../services/backup.js';
import { fillTemplate, sendDocumentMail, smtpStatus } from '../services/mail.js';
import { parsePayload, signDocument } from '../services/qr.js';
import { todayISO } from '../../shared/format.js';
import { requireAdmin } from '../auth.js';
import { authRoutes } from './auth.js';

export const api = express.Router();

// Connexion et comptes utilisateurs
api.use(authRoutes);

/** Enveloppe async -> gestion d'erreur centralisée. */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const id = (req) => Number(req.params.id);
const notFound = (v) => { if (!v) throw Object.assign(new Error('Introuvable.'), { status: 404 }); return v; };

// ----- Paramètres -----------------------------------------------------------

api.get('/settings', h((req, res) => {
  const s = loadSettings();
  const db = getDb();
  const today = todayISO();
  res.json({
    settings: s,
    counters: listCounters(db),
    issuedCount: db.prepare('SELECT COUNT(*) AS n FROM documents WHERE number IS NOT NULL').get().n,
    nextNumbers: {
      facture: peekNextNumber(db, s, 'facture', today),
      proforma: peekNextNumber(db, s, 'proforma', today),
    },
    smtp: smtpStatus(s),
  });
}));

api.put('/settings', requireAdmin, h((req, res) => {
  const db = getDb();
  const saved = saveSettings(req.body, {
    issuedCount: db.prepare('SELECT COUNT(*) AS n FROM documents WHERE number IS NOT NULL').get().n,
    existingCounters: listCounters(db),
  });
  res.json(saved);
}));

/** Remplacement du logo (data URL PNG/JPEG/SVG). */
api.post('/settings/logo', requireAdmin, h((req, res) => {
  const m = /^data:image\/(png|jpeg|svg\+xml);base64,(.+)$/.exec(req.body?.dataUrl || '');
  if (!m) throw Object.assign(new Error('Image invalide (PNG, JPEG ou SVG attendu).'), { status: 400 });
  const ext = { png: 'png', jpeg: 'jpg', 'svg+xml': 'svg' }[m[1]];
  // Stocké avec les données (volume persistant en ligne), servi sous /uploads
  const name = `uploads/logo-${Date.now()}.${ext}`;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, path.basename(name)), Buffer.from(m[2], 'base64'));
  const s = loadSettings();
  s.issuer.logo = name;
  res.json(saveSettings(s, { issuedCount: 0, existingCounters: [] }));
}));

// ----- Clients ---------------------------------------------------------------

api.get('/clients', h((req, res) => res.json(clients.listClients(req.query.q || ''))));
api.get('/clients/:id', h((req, res) => res.json(notFound(clients.getClient(id(req))))));
api.post('/clients', h((req, res) => res.status(201).json(clients.createClient(req.body))));
api.put('/clients/:id', h((req, res) => res.json(clients.updateClient(id(req), req.body))));
api.delete('/clients/:id', h((req, res) => { clients.deleteClient(id(req)); res.status(204).end(); }));
/** Duplication intelligente : brouillon avec les lignes habituelles du client. */
api.post('/clients/:id/quick-document', h((req, res) =>
  res.status(201).json(docs.quickDocumentForClient(id(req), req.body?.type || 'facture'))));

// ----- Catalogue -------------------------------------------------------------

api.get('/products', h((req, res) => res.json(products.listProducts(req.query.q || '', { includeInactive: req.query.all === '1' }))));
api.post('/products', h((req, res) => res.status(201).json(products.createProduct(req.body))));
api.put('/products/:id', h((req, res) => res.json(products.updateProduct(id(req), req.body))));
api.delete('/products/:id', h((req, res) => { products.deleteProduct(id(req)); res.status(204).end(); }));

// ----- Documents -------------------------------------------------------------

api.get('/documents', h((req, res) => res.json(docs.listDocuments(req.query))));
api.get('/alerts', h((req, res) => res.json(docs.overdueDocuments())));
api.post('/documents', h((req, res) => res.status(201).json(docs.createDraft(req.body || {}))));
api.get('/documents/:id', h((req, res) => res.json(notFound(docs.getDocument(id(req))))));
api.put('/documents/:id', h((req, res) => res.json(docs.updateDraft(id(req), req.body))));
api.delete('/documents/:id', h((req, res) => { docs.deleteDraft(id(req)); res.status(204).end(); }));
api.get('/documents/:id/audit', h((req, res) => res.json(docs.getAudit(id(req)))));

api.post('/documents/:id/issue', h((req, res) => res.json(docs.issueDocument(id(req)))));
api.post('/documents/:id/convert', h((req, res) => res.status(201).json(docs.convertProforma(id(req)))));
api.post('/documents/:id/duplicate', h((req, res) => res.status(201).json(docs.duplicateDocument(id(req), req.body || {}))));
api.post('/documents/:id/sent', h((req, res) => res.json(docs.markSent(id(req), { via: req.body?.via || 'manuel' }))));
api.post('/documents/:id/paid', h((req, res) => res.json(docs.markPaid(id(req), req.body || {}))));
api.post('/documents/:id/cancel', h((req, res) => res.json(docs.cancelDocument(id(req), req.body?.reason))));
api.post('/documents/:id/payments', h((req, res) => res.status(201).json(docs.addPayment(id(req), req.body || {}))));
api.delete('/documents/:id/payments/:pid', h((req, res) => res.json(docs.deletePayment(id(req), Number(req.params.pid)))));

/** Aperçu HTML d'un document enregistré. */
api.get('/documents/:id/preview', h(async (req, res) => {
  const doc = notFound(docs.getDocument(id(req)));
  res.type('html').send(await renderInvoiceHtml(doc, loadSettings(), { baseHref: `${BASE_PATH}/template/` }));
}));

/** Aperçu HTML en direct d'un brouillon non enregistré (éditeur). */
api.post('/preview', h(async (req, res) => {
  const doc = docs.previewDocument(req.body || {});
  res.type('html').send(await renderInvoiceHtml(doc, loadSettings(), { baseHref: `${BASE_PATH}/template/` }));
}));

const safeName = (s) => String(s).replace(/[^A-Za-z0-9._-]/g, '_');

/**
 * PDF d'un document. Les documents émis sont archivés à la 1re génération
 * (data/pdf/NUMERO.pdf) : le fichier envoyé au client ne change plus jamais.
 */
export async function documentPdf(doc) {
  const settings = loadSettings();
  if (!doc.number) return (await renderPdf(doc, settings)).buffer;
  const file = path.join(PDF_DIR, `${safeName(doc.number)}.pdf`);
  if (fs.existsSync(file)) return fs.readFileSync(file);
  const { buffer } = await renderPdf(doc, settings);
  fs.mkdirSync(PDF_DIR, { recursive: true });
  fs.writeFileSync(file, buffer);
  return buffer;
}

api.get('/documents/:id/pdf', h(async (req, res) => {
  const doc = notFound(docs.getDocument(id(req)));
  const pdf = await documentPdf(doc);
  const name = `${doc.number || `brouillon-${doc.id}`}${doc.status === 'annulee' ? '-ANNULE' : ''}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${req.query.download ? 'attachment' : 'inline'}; filename="${safeName(name)}"`,
  }).send(pdf);
}));

/** Contenu proposé pour l'e-mail (objet, corps, destinataire). */
api.get('/documents/:id/email', h((req, res) => {
  const doc = notFound(docs.getDocument(id(req)));
  const s = loadSettings();
  res.json({
    to: doc.client?.email || '',
    subject: fillTemplate(s.email.subject, doc, s),
    body: fillTemplate(s.email.body, doc, s),
    smtp: smtpStatus(s),
  });
}));

api.post('/documents/:id/email', h(async (req, res) => {
  const doc = notFound(docs.getDocument(id(req)));
  if (!doc.number) throw Object.assign(new Error("Émettez le document avant de l'envoyer."), { status: 409 });
  const { to, cc, subject, body } = req.body || {};
  if (!to) throw Object.assign(new Error('Destinataire manquant.'), { status: 400 });
  const settings = loadSettings();
  const pdf = await documentPdf(doc);
  const info = await sendDocumentMail({ settings, doc, pdf, to, cc, subject, body });
  res.json({ ...info, document: docs.markSent(doc.id, { via: 'smtp', to }) });
}));

// ----- Statistiques, export, vérification ------------------------------------

api.get('/stats', h((req, res) => res.json(getStats(Number(req.query.year) || new Date().getFullYear()))));

api.get('/export/json', h((req, res) => {
  const stamp = todayISO();
  res.set('Content-Disposition', `attachment; filename="sauvegarde-facturation-${stamp}.json"`);
  res.json(exportJson());
}));

api.post('/import/json', requireAdmin, h((req, res) => res.json({ restored: importJson(req.body) })));

api.get('/export/csv', h((req, res) => {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="historique-factures-${todayISO()}.csv"`,
  }).send(exportCsv(req.query));
}));

/** Vérifie le contenu d'un QR code (ou un numéro + code saisis). */
api.post('/verify', h((req, res) => {
  const parsed = parsePayload(req.body?.text) || (req.body?.number && req.body?.code
    ? { number: req.body.number.trim(), code: req.body.code.trim().toUpperCase() } : null);
  if (!parsed) return res.json({ valid: false, reason: 'Contenu illisible : numéro ou code absent.' });
  const doc = docs.getDocumentByNumber(parsed.number);
  if (!doc) return res.json({ valid: false, reason: `Aucun document ${parsed.number} dans la base.` });
  const expected = signDocument({ number: doc.number, issueDate: doc.issueDate, netToPay: doc.totals.netToPay, currency: doc.currency });
  res.json({
    valid: expected === parsed.code && doc.signature === expected,
    reason: expected === parsed.code ? null : 'Le code ne correspond pas : document altéré ou contrefait.',
    document: { id: doc.id, number: doc.number, type: doc.type, client: doc.client?.name, issueDate: doc.issueDate,
      netToPay: doc.totals.netToPay, currency: doc.currency, status: doc.displayStatus, statusLabel: doc.statusLabel },
  });
}));

// ----- Erreurs ----------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
api.use((err, req, res, next) => {
  const status = err.status || (/verrouill|interdite/i.test(err.message) ? 409 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message, errors: err.errors });
});

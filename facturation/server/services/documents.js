/**
 * Cycle de vie des documents (proformas et factures).
 *
 *   brouillon ──émettre──▶ emise ──envoyer──▶ envoyee ──paiements──▶ payee
 *       │                    │                   │
 *       └──supprimer         └──────annuler──────┴──▶ annulee
 *   proforma ──convertir──▶ facture émise (nouveau numéro FAC) ; proforma = convertie
 *
 * « En retard » est un état calculé : facture émise/envoyée, échéance dépassée,
 * solde restant > 0.
 */
import { getDb, transaction, now, parse } from '../db/database.js';
import { computeTotals } from '../../shared/totals.js';
import { todayISO, addDays } from '../../shared/format.js';
import { allocateNumber } from './numbering.js';
import { signDocument } from './qr.js';
import { upsertClientFromDocument, getClient } from './clients.js';
import { loadSettings } from './settings.js';
import { currentUser } from '../auth.js';

const err = (status, message) => Object.assign(new Error(message), { status });

export const STATUS_LABELS = {
  brouillon: 'Brouillon',
  emise: 'Émise',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
  convertie: 'Convertie',
};

// ---------------------------------------------------------------------------
// Journal
// ---------------------------------------------------------------------------

export function log(documentId, action, details = null, db = getDb()) {
  const u = currentUser();
  const user = u ? u.name || u.email || null : null;
  // Les sauvegardes automatiques d'un brouillon sont regroupées (une entrée / 15 min)
  if (action === 'modification') {
    const last = db.prepare('SELECT id, action, at, user FROM audit_log WHERE document_id = ? ORDER BY id DESC LIMIT 1').get(documentId);
    if (last?.action === 'modification' && (last.user ?? null) === user && Date.now() - Date.parse(last.at) < 15 * 60 * 1000) {
      db.prepare('UPDATE audit_log SET at = ? WHERE id = ?').run(now(), last.id);
      return;
    }
  }
  db.prepare('INSERT INTO audit_log (document_id, action, details, at, user) VALUES (?, ?, ?, ?, ?)')
    .run(documentId, action, details ? JSON.stringify(details) : null, now(), user);
}

export function getAudit(documentId) {
  return getDb().prepare('SELECT * FROM audit_log WHERE document_id = ? ORDER BY id').all(documentId)
    .map((r) => ({ id: r.id, action: r.action, details: parse(r.details, null), at: r.at, user: r.user }));
}

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

function currencyInfo(settings, code) {
  return settings.currencies.find((c) => c.code === code) || settings.currencies.find((c) => c.code === settings.baseCurrency);
}

/** Valeurs par défaut d'un nouveau document. */
export function defaults(type, settings, today = todayISO()) {
  const t = type === 'proforma' ? 'proforma' : 'facture';
  const base = currencyInfo(settings, settings.baseCurrency);
  return {
    type: t,
    issueDate: today,
    dueDate: addDays(today, settings.documents.paymentTermsDays?.[t] ?? 30),
    currency: base.code,
    exchangeRate: 1,
    client: { name: '', addressLines: [], email: '', phone: '', taxIds: [] },
    lines: [{ designation: '', detail: '', quantity: 1, unitPrice: 0, discount: 0, vatRate: settings.defaultVatRate ?? 0 }],
    globalDiscount: { type: 'percent', value: 0 },
    deposit: 0,
    depositLabel: 'Acompte versé',
    conditions: settings.documents.defaultConditions || '',
    period: '',
    paymentMethod: '',
    watermark: t === 'proforma' ? !!settings.documents.watermark?.proforma : false,
    showQr: !!settings.documents.qrCode?.enabled,
    includeTerms: false,
    notes: '',
  };
}

/** Nettoie une saisie (brouillon) : types, bornes, champs inconnus ignorés. */
function normalize(input, settings, previous = {}) {
  const d = { ...defaults(input.type || previous.type, settings), ...previous, ...input };
  const cur = currencyInfo(settings, d.currency);
  const iso = (v, fb) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? v : fb);
  const issueDate = iso(d.issueDate, todayISO());
  return {
    type: d.type === 'proforma' ? 'proforma' : 'facture',
    issueDate,
    dueDate: iso(d.dueDate, issueDate),
    currency: cur.code,
    exchangeRate: cur.code === settings.baseCurrency ? 1 : Number(d.exchangeRate) > 0 ? Number(d.exchangeRate) : Number(cur.rate) || 1,
    client: {
      id: d.client?.id || null,
      name: String(d.client?.name || '').trim(),
      addressLines: (d.client?.addressLines || []).map(String).filter((l) => l.trim()),
      email: String(d.client?.email || '').trim(),
      phone: String(d.client?.phone || '').trim(),
      taxIds: (d.client?.taxIds || []).filter((t) => t && (t.label || t.value)),
    },
    lines: (d.lines || []).map((l) => ({
      productId: l.productId || null,
      designation: String(l.designation || ''),
      detail: String(l.detail || ''),
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      discount: Math.min(Math.max(Number(l.discount) || 0, 0), 100),
      vatRate: Number(l.vatRate) || 0,
    })),
    globalDiscount: {
      type: d.globalDiscount?.type === 'amount' ? 'amount' : 'percent',
      value: Math.max(Number(d.globalDiscount?.value) || 0, 0),
    },
    deposit: Math.max(Number(d.deposit) || 0, 0),
    depositLabel: String(d.depositLabel || 'Acompte versé'),
    conditions: String(d.conditions ?? ''),
    period: String(d.period || ''),
    paymentMethod: String(d.paymentMethod || ''),
    watermark: !!d.watermark,
    showQr: d.showQr !== false,
    includeTerms: !!d.includeTerms,
    notes: String(d.notes || ''),
  };
}

const DATA_KEYS = ['client', 'lines', 'globalDiscount', 'deposit', 'depositLabel', 'conditions', 'period',
  'paymentMethod', 'watermark', 'showQr', 'includeTerms', 'notes'];
const pickData = (doc) => Object.fromEntries(DATA_KEYS.map((k) => [k, doc[k]]));

// ---------------------------------------------------------------------------
// Lecture
// ---------------------------------------------------------------------------

function paidAmount(db, id) {
  return db.prepare('SELECT COALESCE(SUM(amount), 0) AS s FROM payments WHERE document_id = ?').get(id).s;
}

export function displayStatus(row, paid, today = todayISO()) {
  if (row.type === 'facture' && ['emise', 'envoyee'].includes(row.status)
      && row.due_date && row.due_date < today && paid < row.net_to_pay) {
    return 'en_retard';
  }
  return row.status;
}

function toDoc(row, db = getDb()) {
  if (!row) return null;
  const data = parse(row.data, {});
  const paid = paidAmount(db, row.id);
  const payments = db.prepare('SELECT * FROM payments WHERE document_id = ? ORDER BY date, id').all(row.id)
    .map((p) => ({ id: p.id, date: p.date, amount: p.amount, method: p.method, note: p.note, createdAt: p.created_at }));
  const ds = displayStatus(row, paid);
  return {
    id: row.id,
    type: row.type,
    number: row.number,
    status: row.status,
    displayStatus: ds,
    statusLabel: STATUS_LABELS[ds],
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    exchangeRate: row.exchange_rate,
    ...data,
    clientId: row.client_id,
    totals: parse(row.totals, null),
    issuerSnapshot: parse(row.issuer_snapshot, null),
    signature: row.signature,
    sourceId: row.source_id,
    convertedToId: row.converted_to_id,
    sourceNumber: row.source_id ? db.prepare('SELECT number FROM documents WHERE id = ?').get(row.source_id)?.number : null,
    convertedToNumber: row.converted_to_id ? db.prepare('SELECT number FROM documents WHERE id = ?').get(row.converted_to_id)?.number : null,
    paid,
    balance: Math.max(row.net_to_pay - paid, 0),
    payments,
    issuedAt: row.issued_at,
    sentAt: row.sent_at,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDocument(id) {
  return toDoc(getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id));
}

export function getDocumentByNumber(number) {
  return toDoc(getDb().prepare('SELECT * FROM documents WHERE number = ?').get(number));
}

const SORTS = {
  number: 'd.number', issueDate: 'd.issue_date', dueDate: 'd.due_date', client: 'd.client_name COLLATE NOCASE',
  amount: 'd.net_to_pay', status: 'd.status', updated: 'd.updated_at', type: 'd.type',
};

/**
 * Liste filtrée pour le tableau de bord.
 * @param {{type?, status?, clientId?, q?, from?, to?, sort?, dir?}} f
 */
export function listDocuments(f = {}) {
  const db = getDb();
  const today = todayISO();
  const where = ['1=1'];
  const args = [];
  if (f.type) { where.push('d.type = ?'); args.push(f.type); }
  if (f.clientId) { where.push('d.client_id = ?'); args.push(Number(f.clientId)); }
  if (f.from) { where.push('d.issue_date >= ?'); args.push(f.from); }
  if (f.to) { where.push('d.issue_date <= ?'); args.push(f.to); }
  if (f.q) {
    where.push('(d.number LIKE ? OR d.client_name LIKE ? OR d.data LIKE ?)');
    args.push(`%${f.q}%`, `%${f.q}%`, `%${f.q}%`);
  }
  const paidSql = '(SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.document_id = d.id)';
  if (f.status === 'en_retard') {
    where.push(`d.type = 'facture' AND d.status IN ('emise','envoyee') AND d.due_date < ? AND ${paidSql} < d.net_to_pay`);
    args.push(today);
  } else if (f.status === 'impayee') {
    where.push(`d.type = 'facture' AND d.status IN ('emise','envoyee')`);
  } else if (f.status) {
    where.push('d.status = ?'); args.push(f.status);
  }
  const sort = SORTS[f.sort] || 'd.updated_at';
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const rows = db.prepare(`SELECT d.*, ${paidSql} AS paid FROM documents d WHERE ${where.join(' AND ')}
    ORDER BY ${sort} ${dir}, d.id DESC`).all(...args);
  return rows.map((r) => {
    const ds = displayStatus(r, r.paid, today);
    return {
      id: r.id, type: r.type, number: r.number, status: r.status, displayStatus: ds, statusLabel: STATUS_LABELS[ds],
      clientId: r.client_id, clientName: r.client_name, issueDate: r.issue_date, dueDate: r.due_date,
      currency: r.currency, exchangeRate: r.exchange_rate, totalHT: r.total_ht, netToPay: r.net_to_pay,
      paid: r.paid, balance: Math.max(r.net_to_pay - r.paid, 0),
      convertedToId: r.converted_to_id, sourceId: r.source_id, updatedAt: r.updated_at,
    };
  });
}

/** Factures en retard (alertes visuelles). */
export function overdueDocuments() {
  return listDocuments({ status: 'en_retard', sort: 'dueDate', dir: 'asc' });
}

// ---------------------------------------------------------------------------
// Écriture — brouillons
// ---------------------------------------------------------------------------

function writeDraft(db, id, doc, settings) {
  const cur = currencyInfo(settings, doc.currency);
  const totals = computeTotals(doc, cur.decimals);
  const t = now();
  const cols = [doc.type, doc.client.id, doc.client.name, JSON.stringify(pickData(doc)), JSON.stringify(totals),
    doc.issueDate, doc.dueDate, doc.currency, doc.exchangeRate, totals.totalHT, totals.netToPay];
  if (id == null) {
    const r = db.prepare(`INSERT INTO documents (type, client_id, client_name, data, totals, issue_date, due_date,
      currency, exchange_rate, total_ht, net_to_pay, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brouillon', ?, ?)`).run(...cols, t, t);
    return Number(r.lastInsertRowid);
  }
  db.prepare(`UPDATE documents SET type = ?, client_id = ?, client_name = ?, data = ?, totals = ?, issue_date = ?,
    due_date = ?, currency = ?, exchange_rate = ?, total_ht = ?, net_to_pay = ?, updated_at = ? WHERE id = ?`)
    .run(...cols, t, id);
  return id;
}

export function createDraft(input = {}) {
  const settings = loadSettings();
  const doc = normalize(input, settings);
  const id = writeDraft(getDb(), null, doc, settings);
  log(id, 'création', { type: doc.type });
  return getDocument(id);
}

function requireDraft(id) {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!row) throw err(404, 'Document introuvable.');
  if (row.number) throw err(409, 'Document émis : il ne peut plus être modifié.');
  if (row.status !== 'brouillon') throw err(409, 'Ce brouillon est clos (converti ou annulé).');
  return row;
}

/** Sauvegarde (automatique ou manuelle) d'un brouillon. */
export function updateDraft(id, input) {
  const row = requireDraft(id);
  const settings = loadSettings();
  const previous = { type: row.type, issueDate: row.issue_date, dueDate: row.due_date, currency: row.currency,
    exchangeRate: row.exchange_rate, ...parse(row.data, {}) };
  const doc = normalize(input, settings, previous);
  writeDraft(getDb(), id, doc, settings);
  log(id, 'modification');
  return getDocument(id);
}

export function deleteDraft(id) {
  requireDraft(id);
  const db = getDb();
  db.prepare('DELETE FROM audit_log WHERE document_id = ?').run(id);
  db.prepare('UPDATE documents SET source_id = NULL WHERE source_id = ?').run(id);
  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// Émission
// ---------------------------------------------------------------------------

/** Contrôles avant émission ; renvoie la liste des erreurs. */
export function validateForIssue(doc) {
  const errors = [];
  if (!doc.client?.name) errors.push('Le nom du client est obligatoire.');
  if (!doc.lines?.length) errors.push('Ajoutez au moins une ligne.');
  doc.lines?.forEach((l, i) => {
    if (!l.designation.trim()) errors.push(`Ligne ${i + 1} : désignation manquante.`);
    if (!(l.quantity > 0)) errors.push(`Ligne ${i + 1} : quantité invalide.`);
    if (l.unitPrice < 0) errors.push(`Ligne ${i + 1} : prix unitaire négatif.`);
  });
  if (doc.dueDate < doc.issueDate) errors.push("L'échéance est antérieure à la date d'émission.");
  return errors;
}

/** Instantané des paramètres émetteur, figé dans le document émis. */
function snapshot(settings) {
  const { issuer, bank, footer, documents, theme } = settings;
  return { issuer, bank, footer, documents, theme };
}

/** Émission à l'intérieur d'une transaction ouverte. */
function issueInTx(db, id, settings) {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  const doc = normalize({}, settings, {
    type: row.type, issueDate: row.issue_date, dueDate: row.due_date, currency: row.currency,
    exchangeRate: row.exchange_rate, ...parse(row.data, {}),
  });
  const errors = validateForIssue(doc);
  if (errors.length) throw Object.assign(err(400, errors.join(' ')), { errors });

  // Chronologie : un numéro supérieur ne peut pas porter une date antérieure.
  const last = db.prepare(`SELECT number, issue_date FROM documents WHERE type = ? AND number IS NOT NULL
    ORDER BY issue_date DESC, seq DESC LIMIT 1`).get(doc.type);
  if (last && last.issue_date > doc.issueDate) {
    throw err(409, `La date d'émission ne peut pas être antérieure à celle du dernier document émis (${last.number} du ${last.issue_date}).`);
  }

  const cur = currencyInfo(settings, doc.currency);
  const totals = computeTotals(doc, cur.decimals);
  const { number, seriesYear, seq } = allocateNumber(db, settings, doc.type, doc.issueDate);
  const signature = signDocument({ number, issueDate: doc.issueDate, netToPay: totals.netToPay, currency: doc.currency });
  const t = now();
  db.prepare(`UPDATE documents SET number = ?, series_year = ?, seq = ?, status = 'emise', data = ?, totals = ?,
    issuer_snapshot = ?, total_ht = ?, net_to_pay = ?, signature = ?, issued_at = ?, updated_at = ?,
    client_id = ?, client_name = ? WHERE id = ?`)
    .run(number, seriesYear, seq, JSON.stringify(pickData(doc)), JSON.stringify(totals), JSON.stringify(snapshot(settings)),
      totals.totalHT, totals.netToPay, signature, t, t, doc.client.id, doc.client.name, id);
  log(id, 'émission', { number }, db);
  return number;
}

export function issueDocument(id) {
  const row = requireDraft(id);
  const settings = loadSettings();
  // Enregistre / met à jour la fiche client avant l'émission
  const data = parse(row.data, {});
  const client = upsertClientFromDocument(data.client);
  if (client) {
    data.client = { ...data.client, id: client.id };
    getDb().prepare('UPDATE documents SET data = ?, client_id = ? WHERE id = ?').run(JSON.stringify(data), client.id, id);
  }
  transaction((db) => issueInTx(db, id, settings));
  return getDocument(id);
}

// ---------------------------------------------------------------------------
// Conversion, duplication
// ---------------------------------------------------------------------------

/** Convertit une proforma en facture définitive (numéro FAC suivant, émise). */
export function convertProforma(id, { issueDate = todayISO() } = {}) {
  const settings = loadSettings();
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!row) throw err(404, 'Document introuvable.');
  if (row.type !== 'proforma') throw err(400, 'Seule une proforma peut être convertie.');
  if (row.status === 'convertie') throw err(409, 'Cette proforma a déjà été convertie.');
  if (row.status === 'annulee') throw err(409, 'Une proforma annulée ne peut pas être convertie.');

  const data = parse(row.data, {});
  const client = upsertClientFromDocument(data.client);
  if (client) data.client = { ...data.client, id: client.id };
  const doc = normalize({
    ...data,
    type: 'facture',
    issueDate,
    dueDate: addDays(issueDate, settings.documents.paymentTermsDays?.facture ?? 30),
    currency: row.currency,
    exchangeRate: row.exchange_rate,
    watermark: false,
  }, settings);

  const newId = transaction((db) => {
    const fid = writeDraft(db, null, doc, settings);
    db.prepare('UPDATE documents SET source_id = ? WHERE id = ?').run(id, fid);
    log(fid, 'création', { from: row.number || `brouillon #${id}` }, db);
    issueInTx(db, fid, settings);
    db.prepare(`UPDATE documents SET status = 'convertie', converted_to_id = ?, updated_at = ? WHERE id = ?`).run(fid, now(), id);
    const number = db.prepare('SELECT number FROM documents WHERE id = ?').get(fid).number;
    log(id, 'conversion', { facture: number }, db);
    return fid;
  });
  return getDocument(newId);
}

/** Duplique un document en nouveau brouillon (dates du jour). */
export function duplicateDocument(id, { type } = {}) {
  const src = getDocument(id);
  if (!src) throw err(404, 'Document introuvable.');
  const settings = loadSettings();
  const t = type || src.type;
  const base = defaults(t, settings);
  const doc = createDraft({
    ...base,
    type: t,
    currency: src.currency,
    exchangeRate: src.exchangeRate,
    client: src.client,
    lines: src.lines,
    globalDiscount: src.globalDiscount,
    conditions: src.conditions,
    paymentMethod: src.paymentMethod,
    showQr: src.showQr,
  });
  log(doc.id, 'duplication', { from: src.number || `brouillon #${src.id}` });
  return doc;
}

/**
 * Duplication intelligente : nouveau brouillon pour un client, avec les lignes
 * de son dernier document.
 */
export function quickDocumentForClient(clientId, type = 'facture') {
  const client = getClient(clientId);
  if (!client) throw err(404, 'Client introuvable.');
  const last = getDb().prepare('SELECT id FROM documents WHERE client_id = ? ORDER BY created_at DESC, id DESC LIMIT 1').get(clientId);
  const settings = loadSettings();
  const lastDoc = last ? getDocument(last.id) : null;
  const doc = createDraft({
    ...defaults(type, settings),
    client: { id: client.id, name: client.name, addressLines: client.addressLines, email: client.email, phone: client.phone, taxIds: client.taxIds },
    ...(lastDoc ? { lines: lastDoc.lines, currency: lastDoc.currency, exchangeRate: lastDoc.exchangeRate, conditions: lastDoc.conditions, paymentMethod: lastDoc.paymentMethod } : {}),
  });
  if (lastDoc) log(doc.id, 'duplication', { from: lastDoc.number || `brouillon #${lastDoc.id}`, mode: 'client' });
  return doc;
}

// ---------------------------------------------------------------------------
// Statuts : envoi, paiement, annulation
// ---------------------------------------------------------------------------

function requireIssued(id) {
  const row = getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!row) throw err(404, 'Document introuvable.');
  if (!row.number) throw err(409, "Le document doit d'abord être émis.");
  return row;
}

export function markSent(id, details = {}) {
  const row = requireIssued(id);
  const db = getDb();
  if (row.status === 'emise') {
    db.prepare(`UPDATE documents SET status = 'envoyee', sent_at = ?, updated_at = ? WHERE id = ?`).run(now(), now(), id);
  } else if (!row.sent_at) {
    db.prepare('UPDATE documents SET sent_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), id);
  }
  log(id, 'envoi', details);
  return getDocument(id);
}

function refreshPaidStatus(db, id) {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  const paid = paidAmount(db, id);
  if (paid >= row.net_to_pay && ['emise', 'envoyee'].includes(row.status)) {
    db.prepare(`UPDATE documents SET status = 'payee', paid_at = ?, updated_at = ? WHERE id = ?`).run(now(), now(), id);
    log(id, 'paiement complet', null, db);
  } else if (paid < row.net_to_pay && row.status === 'payee') {
    db.prepare(`UPDATE documents SET status = ?, paid_at = NULL, updated_at = ? WHERE id = ?`)
      .run(row.sent_at ? 'envoyee' : 'emise', now(), id);
  }
}

export function addPayment(id, { date = todayISO(), amount, method = '', note = '' }) {
  const row = requireIssued(id);
  if (row.type !== 'facture') throw err(400, 'Les paiements ne concernent que les factures.');
  if (['annulee'].includes(row.status)) throw err(409, 'Facture annulée.');
  const a = Number(amount);
  if (!(a > 0)) throw err(400, 'Montant invalide.');
  transaction((db) => {
    db.prepare('INSERT INTO payments (document_id, date, amount, method, note, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, date, a, method, note, now());
    log(id, 'paiement', { date, amount: a, method }, db);
    refreshPaidStatus(db, id);
  });
  return getDocument(id);
}

export function deletePayment(id, paymentId) {
  requireIssued(id);
  transaction((db) => {
    const p = db.prepare('SELECT * FROM payments WHERE id = ? AND document_id = ?').get(paymentId, id);
    if (!p) throw err(404, 'Paiement introuvable.');
    db.prepare('DELETE FROM payments WHERE id = ?').run(paymentId);
    log(id, 'paiement supprimé', { date: p.date, amount: p.amount }, db);
    refreshPaidStatus(db, id);
  });
  return getDocument(id);
}

/** Marque une facture payée en totalité (enregistre le solde comme paiement). */
export function markPaid(id, { date = todayISO(), method = '' } = {}) {
  const doc = getDocument(id);
  if (!doc) throw err(404, 'Document introuvable.');
  if (doc.balance <= 0) throw err(409, 'Aucun solde restant.');
  return addPayment(id, { date, amount: doc.balance, method, note: 'Solde' });
}

export function cancelDocument(id, reason) {
  const row = requireIssued(id);
  if (row.status === 'annulee') throw err(409, 'Document déjà annulé.');
  if (row.status === 'convertie') throw err(409, 'Une proforma convertie ne peut pas être annulée.');
  if (!String(reason || '').trim()) throw err(400, "Le motif d'annulation est obligatoire.");
  getDb().prepare(`UPDATE documents SET status = 'annulee', cancelled_at = ?, cancel_reason = ?, updated_at = ? WHERE id = ?`)
    .run(now(), reason, now(), id);
  log(id, 'annulation', { reason });
  return getDocument(id);
}

/** Construit un document « virtuel » (non enregistré) pour l'aperçu en direct. */
export function previewDocument(input) {
  const settings = loadSettings();
  return { ...normalize(input, settings), number: null };
}

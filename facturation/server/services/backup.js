/**
 * Sauvegarde / restauration complète (JSON) et export CSV de l'historique.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getDb, transaction } from '../db/database.js';
import { DATA_DIR } from '../paths.js';
import { loadSettings } from './settings.js';
import { listDocuments, STATUS_LABELS } from './documents.js';
import { getSecret, isValidSecret, setSecret } from './qr.js';

const TABLES = ['clients', 'products', 'counters', 'documents', 'payments', 'audit_log'];
const FORMAT = 'facturation-stratetic/backup';

export function exportJson() {
  const db = getDb();
  // La clé des QR codes (data/secret.key) fait partie de la sauvegarde :
  // sans elle, les QR des factures déjà émises ne seraient plus vérifiables.
  const out = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), settings: loadSettings(), secretKey: getSecret(), tables: {} };
  for (const t of TABLES) out.tables[t] = db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all();
  return out;
}

/**
 * Restauration complète : remplace toutes les données par celles de la sauvegarde.
 * Une copie de la base actuelle est faite au préalable dans data/backups/.
 */
export function importJson(backup) {
  if (backup?.format !== FORMAT || !backup.tables) {
    throw Object.assign(new Error("Fichier de sauvegarde non reconnu."), { status: 400 });
  }
  if (backup.secretKey != null && !isValidSecret(backup.secretKey)) {
    throw Object.assign(new Error('Clé de vérification invalide dans la sauvegarde.'), { status: 400 });
  }
  const db = getDb();
  const dir = path.join(DATA_DIR, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(dir, `avant-import-${stamp}.json`), JSON.stringify(exportJson()));

  // Les verrous empêchent la suppression : on les lève le temps de la restauration.
  const triggers = db.prepare(`SELECT name, sql FROM sqlite_master WHERE type = 'trigger'`).all();
  transaction(() => {
    for (const t of triggers) db.exec(`DROP TRIGGER ${t.name}`);
    db.exec('PRAGMA defer_foreign_keys = ON');
    for (const t of [...TABLES].reverse()) db.exec(`DELETE FROM ${t}`);
    for (const t of TABLES) {
      for (const row of backup.tables[t] || []) {
        const cols = Object.keys(row);
        db.prepare(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
          .run(...cols.map((c) => row[c]));
      }
    }
    for (const t of triggers) db.exec(t.sql);
  });
  // Clé restaurée seulement après le succès de la restauration des données.
  // Une ancienne sauvegarde sans clé conserve la clé actuelle.
  if (backup.secretKey) setSecret(backup.secretKey);
  return {
    ...Object.fromEntries(TABLES.map((t) => [t, (backup.tables[t] || []).length])),
    secretKey: !!backup.secretKey,
  };
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Export CSV (séparateur « ; », compatible Excel français, BOM UTF-8). */
export function exportCsv(filters = {}) {
  const rows = listDocuments({ ...filters, sort: filters.sort || 'issueDate', dir: filters.dir || 'asc' });
  const header = ['Type', 'Numéro', 'Statut', 'Client', "Date d'émission", 'Échéance', 'Devise', 'Taux',
    'Total HT', 'Net à payer', 'Payé', 'Solde'];
  const num = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
  const lines = rows.map((r) => [
    r.type === 'proforma' ? 'Proforma' : 'Facture', r.number || '(brouillon)', STATUS_LABELS[r.displayStatus],
    r.clientName, r.issueDate, r.dueDate, r.currency, num(r.exchangeRate), num(r.totalHT), num(r.netToPay),
    num(r.paid), num(r.balance),
  ].map(csvCell).join(';'));
  return '﻿' + [header.join(';'), ...lines].join('\r\n');
}

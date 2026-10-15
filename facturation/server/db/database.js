/**
 * Accès SQLite via le module natif de Node (node:sqlite, aucune dépendance).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR } from '../paths.js';

const SCHEMA = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

let db = null;

/** Ouvre (et initialise si besoin) la base. `file` = ':memory:' pour les tests. */
export function openDatabase(file = path.join(DATA_DIR, 'factures.db')) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

/** Évolutions du schéma pour les bases déjà créées. */
function migrate(d) {
  const cols = d.prepare('PRAGMA table_info(audit_log)').all().map((c) => c.name);
  if (!cols.includes('user')) d.exec('ALTER TABLE audit_log ADD COLUMN user TEXT');
}

export function getDb() {
  if (!db) openDatabase();
  return db;
}

export function closeDatabase() {
  db?.close();
  db = null;
}

/**
 * Exécute `fn` dans une transaction exclusive (BEGIN IMMEDIATE) :
 * tout réussit ou rien n'est écrit. Garantit l'absence de trou de numérotation.
 */
export function transaction(fn) {
  const d = getDb();
  d.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(d);
    d.exec('COMMIT');
    return result;
  } catch (err) {
    d.exec('ROLLBACK');
    throw err;
  }
}

/** Horodatage ISO (UTC). */
export const now = () => new Date().toISOString();

/** Parse JSON tolérant. */
export const parse = (text, fallback) => {
  if (text == null || text === '') return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
};

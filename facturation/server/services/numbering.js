/**
 * Numérotation des documents.
 *
 * - Deux séries indépendantes : facture (FAC) et proforma (PRO).
 * - Remise à zéro annuelle (`numbering.reset = "annual"`) ou numérotation
 *   continue (`"continuous"`, compteur stocké avec year = 0).
 * - Le numéro n'est attribué qu'à l'émission, dans la même transaction que
 *   l'enregistrement du document : en cas d'erreur, rien n'est consommé.
 * - Le déclencheur `counters_strict_increment` interdit tout saut ou recul.
 */
import { formatDocNumber } from '../../shared/format.js';

/** Valeur de départ configurée (dernier numéro déjà utilisé hors application). */
function startValue(settings, type, seriesYear) {
  const key = seriesYear === 0 ? 'continu' : String(seriesYear);
  return Number(settings.numbering.start?.[type]?.[key]) || 0;
}

/**
 * Attribue le numéro suivant. DOIT être appelé à l'intérieur d'une transaction.
 * @returns {{number:string, seriesYear:number, seq:number}}
 */
export function allocateNumber(db, settings, type, issueDate) {
  const n = settings.numbering;
  const year = Number(issueDate.slice(0, 4));
  const seriesYear = n.reset === 'continuous' ? 0 : year;

  let row = db.prepare('SELECT last FROM counters WHERE type = ? AND year = ?').get(type, seriesYear);
  if (!row) {
    const start = startValue(settings, type, seriesYear);
    db.prepare('INSERT INTO counters (type, year, last) VALUES (?, ?, ?)').run(type, seriesYear, start);
    row = { last: start };
  }
  const seq = row.last + 1;
  db.prepare('UPDATE counters SET last = ? WHERE type = ? AND year = ?').run(seq, type, seriesYear);
  const number = formatDocNumber(n.format, n.prefixes[type], year, seq, n.padding);
  return { number, seriesYear, seq };
}

/** Aperçu du prochain numéro (sans le réserver). */
export function peekNextNumber(db, settings, type, issueDate) {
  const n = settings.numbering;
  const year = Number(issueDate.slice(0, 4));
  const seriesYear = n.reset === 'continuous' ? 0 : year;
  const row = db.prepare('SELECT last FROM counters WHERE type = ? AND year = ?').get(type, seriesYear);
  const last = row ? row.last : startValue(settings, type, seriesYear);
  return formatDocNumber(n.format, n.prefixes[type], year, last + 1, n.padding);
}

export function listCounters(db) {
  return db.prepare('SELECT type, year, last FROM counters ORDER BY type, year').all();
}

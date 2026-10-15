/**
 * Statistiques : chiffre d'affaires (HT, en devise de référence), top clients,
 * impayés et retards. Seules les factures émises non annulées sont comptées.
 * Les montants en devise étrangère sont convertis au taux saisi sur la facture.
 */
import { getDb } from '../db/database.js';
import { todayISO } from '../../shared/format.js';

const VALID = `d.type = 'facture' AND d.number IS NOT NULL AND d.status <> 'annulee'`;
const PAID = '(SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.document_id = d.id)';

export function getStats(year = new Date().getFullYear()) {
  const db = getDb();
  const y = String(year);
  const today = todayISO();

  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, ht: 0, ttc: 0, count: 0, collected: 0 }));
  for (const r of db.prepare(`SELECT CAST(substr(d.issue_date, 6, 2) AS INTEGER) AS m,
      SUM(d.total_ht * d.exchange_rate) AS ht, SUM(d.net_to_pay * d.exchange_rate) AS ttc, COUNT(*) AS n
      FROM documents d WHERE ${VALID} AND substr(d.issue_date, 1, 4) = ? GROUP BY m`).all(y)) {
    Object.assign(monthly[r.m - 1], { ht: r.ht, ttc: r.ttc, count: r.n });
  }
  // Encaissements par mois de paiement
  for (const r of db.prepare(`SELECT CAST(substr(p.date, 6, 2) AS INTEGER) AS m, SUM(p.amount * d.exchange_rate) AS s
      FROM payments p JOIN documents d ON d.id = p.document_id
      WHERE d.status <> 'annulee' AND substr(p.date, 1, 4) = ? GROUP BY m`).all(y)) {
    monthly[r.m - 1].collected = r.s;
  }

  const yearly = db.prepare(`SELECT substr(d.issue_date, 1, 4) AS year, SUM(d.total_ht * d.exchange_rate) AS ht,
      SUM(d.net_to_pay * d.exchange_rate) AS ttc, COUNT(*) AS count
      FROM documents d WHERE ${VALID} GROUP BY year ORDER BY year`).all();

  const topClients = db.prepare(`SELECT d.client_id AS clientId, d.client_name AS name,
      SUM(d.total_ht * d.exchange_rate) AS ht, COUNT(*) AS count
      FROM documents d WHERE ${VALID} AND substr(d.issue_date, 1, 4) = ?
      GROUP BY COALESCE(d.client_id, d.client_name) ORDER BY ht DESC LIMIT 10`).all(y);

  const open = db.prepare(`SELECT d.id, d.number, d.client_name AS clientName, d.due_date AS dueDate,
      d.net_to_pay AS net, d.exchange_rate AS rate, ${PAID} AS paid
      FROM documents d WHERE ${VALID} AND d.status IN ('emise', 'envoyee')`).all();
  let unpaid = 0, overdue = 0, overdueCount = 0;
  for (const o of open) {
    const bal = Math.max(o.net - o.paid, 0) * o.rate;
    unpaid += bal;
    if (o.dueDate && o.dueDate < today && bal > 0) { overdue += bal; overdueCount += 1; }
  }

  const proformas = db.prepare(`SELECT COUNT(*) AS total, SUM(status = 'convertie') AS converted
      FROM documents WHERE type = 'proforma' AND number IS NOT NULL AND substr(issue_date, 1, 4) = ?`).get(y);

  const years = db.prepare(`SELECT DISTINCT substr(issue_date, 1, 4) AS y FROM documents WHERE number IS NOT NULL ORDER BY y DESC`)
    .all().map((r) => Number(r.y));

  return {
    year: Number(year),
    years: years.includes(Number(year)) ? years : [Number(year), ...years],
    monthly,
    yearly,
    totalHT: monthly.reduce((s, m) => s + m.ht, 0),
    totalTTC: monthly.reduce((s, m) => s + m.ttc, 0),
    collected: monthly.reduce((s, m) => s + m.collected, 0),
    invoiceCount: monthly.reduce((s, m) => s + m.count, 0),
    topClients,
    unpaid,
    overdue,
    overdueCount,
    proformas: { total: proformas.total || 0, converted: proformas.converted || 0 },
  };
}

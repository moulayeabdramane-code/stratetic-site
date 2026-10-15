/** Catalogue produits / services (prix pré-enregistrés). */
import { getDb, now } from '../db/database.js';

const toProduct = (r) => r && {
  id: r.id,
  name: r.name,
  detail: r.detail || '',
  unitPrice: r.unit_price,
  vatRate: r.vat_rate,
  currency: r.currency,
  active: !!r.active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
};

const check = (p) => {
  if (!String(p.name || '').trim()) throw Object.assign(new Error('La désignation est obligatoire.'), { status: 400 });
  if (!(Number(p.unitPrice) >= 0)) throw Object.assign(new Error('Prix unitaire invalide.'), { status: 400 });
};

export function listProducts(q = '', { includeInactive = false } = {}) {
  const where = [includeInactive ? '1=1' : 'active = 1'];
  const args = [];
  if (q) { where.push('(name LIKE ? OR detail LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
  return getDb().prepare(`SELECT * FROM products WHERE ${where.join(' AND ')} ORDER BY name COLLATE NOCASE`).all(...args).map(toProduct);
}

export function getProduct(id) {
  return toProduct(getDb().prepare('SELECT * FROM products WHERE id = ?').get(id));
}

export function createProduct(p) {
  check(p);
  const t = now();
  const r = getDb().prepare(`INSERT INTO products (name, detail, unit_price, vat_rate, currency, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(String(p.name).trim(), p.detail || '', Number(p.unitPrice), Number(p.vatRate) || 0, p.currency || 'XOF', p.active === false ? 0 : 1, t, t);
  return getProduct(Number(r.lastInsertRowid));
}

export function updateProduct(id, p) {
  check(p);
  getDb().prepare(`UPDATE products SET name = ?, detail = ?, unit_price = ?, vat_rate = ?, currency = ?, active = ?, updated_at = ? WHERE id = ?`)
    .run(String(p.name).trim(), p.detail || '', Number(p.unitPrice), Number(p.vatRate) || 0, p.currency || 'XOF', p.active === false ? 0 : 1, now(), id);
  return getProduct(id);
}

export function deleteProduct(id) {
  getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
}

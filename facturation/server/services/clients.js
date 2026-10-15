/** Base clients (réutilisable, auto-complétion). */
import { getDb, now, parse } from '../db/database.js';

const toClient = (r) => r && {
  id: r.id,
  name: r.name,
  addressLines: parse(r.address_lines, []),
  email: r.email || '',
  phone: r.phone || '',
  taxIds: parse(r.tax_ids, []),
  notes: r.notes || '',
  createdAt: r.created_at,
  updatedAt: r.updated_at,
};

const clean = (c) => ({
  name: String(c.name || '').trim(),
  addressLines: (c.addressLines || []).map((l) => String(l).trim()).filter(Boolean),
  email: String(c.email || '').trim(),
  phone: String(c.phone || '').trim(),
  taxIds: (c.taxIds || []).filter((t) => t && (t.label || t.value)).map((t) => ({ label: String(t.label || '').trim(), value: String(t.value || '').trim() })),
  notes: String(c.notes || ''),
});

export function listClients(q = '') {
  const db = getDb();
  const rows = q
    ? db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM documents d WHERE d.client_id = c.id) AS doc_count
                  FROM clients c WHERE c.name LIKE ? OR c.email LIKE ? OR c.tax_ids LIKE ?
                  ORDER BY c.name COLLATE NOCASE LIMIT 50`).all(`%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM documents d WHERE d.client_id = c.id) AS doc_count
                  FROM clients c ORDER BY c.name COLLATE NOCASE`).all();
  return rows.map((r) => ({ ...toClient(r), documentCount: r.doc_count }));
}

export function getClient(id) {
  return toClient(getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id));
}

export function createClient(input) {
  const c = clean(input);
  if (!c.name) throw Object.assign(new Error('Le nom du client est obligatoire.'), { status: 400 });
  const t = now();
  const r = getDb().prepare(`INSERT INTO clients (name, address_lines, email, phone, tax_ids, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(c.name, JSON.stringify(c.addressLines), c.email, c.phone, JSON.stringify(c.taxIds), c.notes, t, t);
  return getClient(Number(r.lastInsertRowid));
}

export function updateClient(id, input) {
  const c = clean(input);
  if (!c.name) throw Object.assign(new Error('Le nom du client est obligatoire.'), { status: 400 });
  getDb().prepare(`UPDATE clients SET name = ?, address_lines = ?, email = ?, phone = ?, tax_ids = ?, notes = ?, updated_at = ?
    WHERE id = ?`).run(c.name, JSON.stringify(c.addressLines), c.email, c.phone, JSON.stringify(c.taxIds), c.notes, now(), id);
  return getClient(id);
}

export function deleteClient(id) {
  const used = getDb().prepare('SELECT COUNT(*) AS n FROM documents WHERE client_id = ? AND number IS NOT NULL').get(id).n;
  if (used > 0) {
    throw Object.assign(new Error('Ce client a des documents émis : il ne peut pas être supprimé.'), { status: 409 });
  }
  getDb().prepare('UPDATE documents SET client_id = NULL WHERE client_id = ?').run(id);
  getDb().prepare('DELETE FROM clients WHERE id = ?').run(id);
}

/** Retrouve ou crée un client à partir des coordonnées saisies sur un document. */
export function upsertClientFromDocument(client) {
  if (!client?.name) return null;
  if (client.id) {
    const existing = getClient(client.id);
    if (existing) return updateClient(client.id, { ...existing, ...client });
  }
  const same = getDb().prepare('SELECT id FROM clients WHERE name = ? COLLATE NOCASE').get(client.name.trim());
  if (same) return updateClient(same.id, { ...getClient(same.id), ...client });
  return createClient(client);
}

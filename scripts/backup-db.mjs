// Sauvegarde nocturne de la base SQLite (tâche planifiée Coolify).
// VACUUM INTO produit une copie cohérente même pendant des écritures.
// Usage : node scripts/backup-db.mjs
import { mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URI || "file:/data/stratetic.db";
const dir = process.env.BACKUP_DIR || "/data/backups";
const KEEP_DAYS = 14;

mkdirSync(dir, { recursive: true });
const target = path.join(dir, `stratetic-${new Date().toISOString().slice(0, 10)}.db`);
// VACUUM INTO échoue si le fichier cible existe déjà (relance le même jour).
rmSync(target, { force: true });

const client = createClient({ url });
await client.execute({ sql: "VACUUM INTO ?", args: [target] });
client.close();

const limit = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
for (const name of readdirSync(dir)) {
  const file = path.join(dir, name);
  if (/^stratetic-\d{4}-\d{2}-\d{2}\.db$/.test(name) && statSync(file).mtimeMs < limit) {
    rmSync(file);
  }
}
console.log(`[backup] ${target}`);

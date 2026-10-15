/**
 * Environnement de test isolé : base et paramètres dans un dossier temporaire.
 * À importer AVANT tout module serveur.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'facturation-test-'));
fs.copyFileSync(new URL('../config/settings.json', import.meta.url), path.join(dir, 'settings.json'));
process.env.FACTURATION_DATA_DIR = path.join(dir, 'data');
process.env.FACTURATION_CONFIG = path.join(dir, 'settings.json');

export const TMP = dir;

/** Modifie les paramètres de test. */
export function patchSettings(fn) {
  const f = process.env.FACTURATION_CONFIG;
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  fn(s);
  fs.writeFileSync(f, JSON.stringify(s, null, 2));
  // garantit un mtime différent pour invalider le cache
  const t = new Date(Date.now() + Math.random() * 1000);
  fs.utimesSync(f, t, t);
}

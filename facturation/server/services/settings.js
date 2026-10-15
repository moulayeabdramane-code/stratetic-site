/**
 * Lecture / écriture des paramètres (config/settings.json).
 *
 * Le fichier reste lisible et modifiable à la main ; l'écran « Paramètres »
 * de l'application écrit dans ce même fichier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONFIG_FILE, DEFAULT_CONFIG_FILE } from '../paths.js';

let cache = null;
let cacheMtime = 0;

export function loadSettings() {
  // Premier démarrage en ligne : le volume de données est vide -> paramètres par défaut
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.copyFileSync(DEFAULT_CONFIG_FILE, CONFIG_FILE);
  }
  const stat = fs.statSync(CONFIG_FILE);
  if (!cache || stat.mtimeMs !== cacheMtime) {
    cache = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    cacheMtime = stat.mtimeMs;
  }
  return structuredClone(cache);
}

/** Clés de numérotation verrouillées dès qu'un document a été émis. */
const LOCKED_NUMBERING_KEYS = ['reset', 'format', 'padding', 'prefixes'];

/**
 * Enregistre de nouveaux paramètres.
 * @param {object} next     paramètres complets
 * @param {{issuedCount:number, existingCounters:{type:string,year:number}[]}} ctx
 */
export function saveSettings(next, { issuedCount = 0, existingCounters = [] } = {}) {
  const current = loadSettings();
  const merged = { ...current, ...next };

  // Verrouillage du compteur : format et préfixes figés après la 1re émission
  if (issuedCount > 0) {
    for (const k of LOCKED_NUMBERING_KEYS) {
      if (JSON.stringify(next.numbering?.[k]) !== JSON.stringify(current.numbering[k])) {
        throw Object.assign(
          new Error('La numérotation est verrouillée : des documents ont déjà été émis.'),
          { status: 409 },
        );
      }
    }
  }
  // Les valeurs de départ d'un compteur déjà créé ne peuvent plus changer
  for (const { type, year } of existingCounters) {
    const key = year === 0 ? 'continu' : String(year);
    const before = current.numbering.start?.[type]?.[key];
    const after = next.numbering?.start?.[type]?.[key];
    if (before !== after) {
      throw Object.assign(
        new Error(`Le compteur ${type} ${key} est déjà utilisé : sa valeur de départ est verrouillée.`),
        { status: 409 },
      );
    }
  }
  validate(merged);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  cache = null;
  return loadSettings();
}

function validate(s) {
  const fail = (msg) => { throw Object.assign(new Error(msg), { status: 400 }); };
  if (!s.issuer?.name) fail("Le nom de l'émetteur est obligatoire.");
  if (!['annual', 'continuous'].includes(s.numbering?.reset)) fail('Mode de numérotation invalide.');
  if (!/\{SEQ\}/.test(s.numbering?.format || '')) fail('Le format de numéro doit contenir {SEQ}.');
  if (!s.currencies?.some((c) => c.code === s.baseCurrency)) fail('Devise de référence inconnue.');
  for (const c of s.currencies) {
    if (!c.code || !c.label || !(Number(c.rate) > 0)) fail(`Devise ${c.code || '?'} incomplète.`);
  }
  for (const [k, v] of Object.entries(s.theme || {})) {
    if (!/^#[0-9a-f]{6}$/i.test(v)) fail(`Couleur invalide pour ${k}.`);
  }
}

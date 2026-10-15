/** Chemins absolus du projet (indépendants du répertoire courant). */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = process.env.FACTURATION_DATA_DIR || path.join(ROOT, 'data');
/** Paramètres de départ livrés avec l'application. */
export const DEFAULT_CONFIG_FILE = path.join(ROOT, 'config', 'settings.json');
/**
 * Paramètres utilisés. En ligne, FACTURATION_CONFIG=/app/data/settings.json : ils
 * sont alors stockés avec les données (volume persistant) et créés au premier
 * démarrage à partir de DEFAULT_CONFIG_FILE.
 */
export const CONFIG_FILE = process.env.FACTURATION_CONFIG || DEFAULT_CONFIG_FILE;
export const TEMPLATE_DIR = path.join(ROOT, 'server', 'template');
export const PDF_DIR = path.join(DATA_DIR, 'pdf');
/** Logos téléversés (avec les données, donc conservés entre deux déploiements). */
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const CLIENT_DIST = path.join(ROOT, 'client', 'dist');

/**
 * Chemin public de l'application, vu par le navigateur : « » (racine, usage local)
 * ou « /facturation » (en ligne sur https://stratetic.art/facturation).
 * Variable d'environnement BASE_PATH ; normalisé sans barre finale.
 */
export function normalizeBasePath(value = '') {
  const v = String(value).trim().replace(/\/+$/, '');
  if (!v) return '';
  if (!/^\/[A-Za-z0-9._~/-]*$/.test(v)) throw new Error(`BASE_PATH invalide : « ${value} »`);
  return v.startsWith('/') ? v : `/${v}`;
}
export const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);

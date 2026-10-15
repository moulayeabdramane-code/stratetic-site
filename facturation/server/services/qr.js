/**
 * QR code de vérification.
 *
 * Le QR contient un résumé lisible du document et une signature HMAC-SHA256
 * (10 caractères) calculée avec une clé secrète locale (data/secret.key).
 * L'écran « Vérifier » de l'application recalcule la signature : toute
 * altération du numéro, de la date ou du montant est détectée.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { DATA_DIR } from '../paths.js';
import { formatDateShort, formatMoney } from '../../shared/format.js';

const SECRET_FILE = path.join(DATA_DIR, 'secret.key');
let secret = null;

/** Clé secrète (créée au premier usage). Incluse dans les sauvegardes JSON. */
export function getSecret() {
  if (secret) return secret;
  if (!fs.existsSync(SECRET_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  }
  secret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  return secret;
}

export const isValidSecret = (key) => /^[0-9a-f]{64}$/.test(String(key || ''));

/** Remplace la clé (restauration d'une sauvegarde). */
export function setSecret(key) {
  if (!isValidSecret(key)) throw Object.assign(new Error('Clé de vérification invalide dans la sauvegarde.'), { status: 400 });
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SECRET_FILE, key, { mode: 0o600 });
  secret = key;
}

/** Signature courte d'un document émis. */
export function signDocument({ number, issueDate, netToPay, currency }) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(`${number}|${issueDate}|${netToPay}|${currency}`)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
}

/** Texte encodé dans le QR code. */
export function buildPayload(doc, currencyInfo, issuerName) {
  return [
    `${issuerName} — ${doc.number}`,
    `Date : ${formatDateShort(doc.issueDate)}`,
    `Montant : ${formatMoney(doc.totals.netToPay, currencyInfo).replace(/ /g, ' ')}`,
    `Code : ${doc.signature}`,
  ].join('\n');
}

/**
 * Vérifie un contenu de QR scanné (ou saisi) contre la base.
 * @returns {{number:string, code:string}|null}
 */
export function parsePayload(text) {
  // 1re ligne : « ÉMETTEUR — NUMÉRO » (tiret long, demi-cadratin ou simple selon le lecteur)
  const firstLine = String(text || '').trim().split(/\r?\n/)[0] || '';
  const number = /[—–-]\s+(\S+)\s*$/.exec(firstLine)?.[1];
  const code = /Code\s*:\s*([0-9A-F]{10})/i.exec(text || '')?.[1]?.toUpperCase();
  return number && code ? { number, code } : null;
}

/** SVG du QR code (fond transparent, modules dans la couleur du thème). */
export async function qrSvg(payload, color = '#022539') {
  return QRCode.toString(payload, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: color, light: '#0000' },
  });
}

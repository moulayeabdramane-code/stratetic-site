/**
 * Formats d'affichage partagés (serveur + interface) : montants, dates, numéros.
 */

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** Espace insécable utilisée comme séparateur de milliers (rendu « 100 000 »). */
const NBSP = ' ';

/** Arrondi bancaire simple à `decimals` décimales (évite 0.1 + 0.2). */
export function round(value, decimals = 0) {
  const f = 10 ** decimals;
  return Math.round((Number(value) || 0) * f + Number.EPSILON * Math.sign(value || 0)) / f;
}

/**
 * Formate un nombre : séparateur de milliers = espace, décimale = virgule.
 * @param {number} value
 * @param {number} decimals
 */
export function formatNumber(value, decimals = 0) {
  const v = round(value, decimals);
  const negative = v < 0;
  const [int, dec] = Math.abs(v).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return (negative ? '−' : '') + grouped + (dec ? `,${dec}` : '');
}

/**
 * Montant avec libellé de devise : « 100 000 FCFA ».
 * @param {number} value
 * @param {{label:string, decimals:number}} currency
 */
export function formatMoney(value, currency) {
  return `${formatNumber(value, currency?.decimals ?? 0)}${NBSP}${currency?.label ?? 'FCFA'}`;
}

/** Date ISO (AAAA-MM-JJ) -> « 14 octobre 2026 ». */
export function formatDateLong(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`;
}

/** Date ISO -> « 14/10/2026 ». */
export function formatDateShort(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Date-heure ISO -> « 14/10/2026 08:11 » (heure locale). */
export function formatDateTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}

/** Nom du mois : « septembre 2026 » à partir de « 2026-09 ». */
export function formatMonth(yyyymm) {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Date du jour au format ISO local (AAAA-MM-JJ). */
export function todayISO(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Ajoute `days` jours à une date ISO. */
export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Number(days || 0)));
  return dt.toISOString().slice(0, 10);
}

/**
 * Construit un numéro de document à partir du format configuré.
 * Jetons : {PREFIX} {YEAR} {SEQ}
 * @example formatDocNumber('{PREFIX}-{YEAR}-{SEQ}', 'FAC', 2026, 44, 3) // FAC-2026-044
 */
export function formatDocNumber(format, prefix, year, seq, padding = 3) {
  return format
    .replace('{PREFIX}', prefix)
    .replace('{YEAR}', String(year))
    .replace('{SEQ}', String(seq).padStart(padding, '0'));
}

/** Taux en pourcentage : 19 -> « 19 % », 5.5 -> « 5,5 % ». */
export function formatRate(rate) {
  return `${String(Number(rate) || 0).replace('.', ',')}${NBSP}%`;
}

/**
 * Calcul des totaux d'une facture — fonction pure, utilisée à l'identique par
 * l'interface (affichage en direct) et par le serveur (valeurs figées à l'émission).
 *
 * Ordre de calcul :
 *   1. ligne : brut = qté × P.U. ; remise ligne (%) ; net ligne arrondi à la devise
 *   2. sous-total HT = Σ nets lignes
 *   3. remise globale (% ou montant) répartie au prorata sur les bases de TVA
 *   4. TVA par taux = base × taux, arrondie par taux
 *   5. TTC = HT net + TVA ; net à payer = TTC − acompte
 */
import { round } from './format.js';

/**
 * @typedef {Object} Line
 * @property {string} designation
 * @property {string} [detail]
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} [discount]  remise en %
 * @property {number} [vatRate]   TVA en %
 */

/**
 * @param {{lines: Line[], globalDiscount?: {type:'percent'|'amount', value:number}, deposit?: number}} doc
 * @param {number} decimals décimales de la devise (0 pour le FCFA)
 */
export function computeTotals(doc, decimals = 0) {
  const lines = (doc.lines || []).map((l) => {
    const quantity = Number(l.quantity) || 0;
    const unitPrice = Number(l.unitPrice) || 0;
    const discountRate = Math.min(Math.max(Number(l.discount) || 0, 0), 100);
    const gross = round(quantity * unitPrice, decimals);
    const discountAmount = round((gross * discountRate) / 100, decimals);
    return {
      gross,
      discountRate,
      discountAmount,
      net: round(gross - discountAmount, decimals),
      vatRate: Number(l.vatRate) || 0,
    };
  });

  const subtotal = round(lines.reduce((s, l) => s + l.net, 0), decimals);

  // Remise globale
  const gd = doc.globalDiscount || {};
  let globalDiscount = 0;
  if (gd.type === 'percent' && Number(gd.value) > 0) {
    globalDiscount = round((subtotal * Math.min(Number(gd.value), 100)) / 100, decimals);
  } else if (gd.type === 'amount' && Number(gd.value) > 0) {
    globalDiscount = round(Math.min(Number(gd.value), subtotal), decimals);
  }
  const totalHT = round(subtotal - globalDiscount, decimals);
  const ratio = subtotal > 0 ? totalHT / subtotal : 0;

  // TVA ventilée par taux (la remise globale réduit chaque base au prorata)
  const byRate = new Map();
  for (const l of lines) {
    byRate.set(l.vatRate, (byRate.get(l.vatRate) || 0) + l.net * ratio);
  }
  const vat = [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, base]) => ({
      rate,
      base: round(base, decimals),
      amount: round((base * rate) / 100, decimals),
    }));
  const totalVAT = round(vat.reduce((s, v) => s + v.amount, 0), decimals);
  const totalTTC = round(totalHT + totalVAT, decimals);
  const deposit = round(Math.min(Math.max(Number(doc.deposit) || 0, 0), totalTTC), decimals);
  const netToPay = round(totalTTC - deposit, decimals);

  return {
    lines,
    subtotal,
    globalDiscount,
    globalDiscountRate: gd.type === 'percent' ? Number(gd.value) || 0 : null,
    totalHT,
    vat,
    totalVAT,
    totalTTC,
    deposit,
    netToPay,
  };
}

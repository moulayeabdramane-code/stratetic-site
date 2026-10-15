import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals } from '../shared/totals.js';
import { formatMoney, formatDocNumber, formatDateLong, addDays } from '../shared/format.js';

test('facture du modèle : 1 × 100 000, TVA 0 %', () => {
  const t = computeTotals({ lines: [{ quantity: 1, unitPrice: 100000, vatRate: 0 }] });
  assert.equal(t.totalHT, 100000);
  assert.equal(t.totalVAT, 0);
  assert.equal(t.netToPay, 100000);
});

test('remises ligne et globale, TVA multiple, acompte', () => {
  const t = computeTotals({
    lines: [
      { quantity: 2, unitPrice: 50000, discount: 10, vatRate: 19 }, // 100 000 - 10 % = 90 000
      { quantity: 1, unitPrice: 10000, vatRate: 0 },                // 10 000
    ],
    globalDiscount: { type: 'percent', value: 10 },                 // -10 000
    deposit: 30000,
  });
  assert.equal(t.subtotal, 100000);
  assert.equal(t.globalDiscount, 10000);
  assert.equal(t.totalHT, 90000);
  assert.deepEqual(t.vat.map((v) => [v.rate, v.base, v.amount]), [[0, 9000, 0], [19, 81000, 15390]]);
  assert.equal(t.totalTTC, 105390);
  assert.equal(t.netToPay, 75390);
});

test('arrondis en devise à 2 décimales', () => {
  const t = computeTotals({ lines: [{ quantity: 3, unitPrice: 33.335, vatRate: 19 }] }, 2);
  assert.equal(t.totalHT, 100.01);
  assert.equal(t.totalVAT, 19);
  assert.equal(t.totalTTC, 119.01);
});

test('acompte plafonné au TTC, remise en montant plafonnée', () => {
  const t = computeTotals({ lines: [{ quantity: 1, unitPrice: 1000 }], globalDiscount: { type: 'amount', value: 5000 }, deposit: 99999 });
  assert.equal(t.totalHT, 0);
  assert.equal(t.netToPay, 0);
});

test('formats', () => {
  assert.equal(formatMoney(100000, { label: 'FCFA', decimals: 0 }), '100 000 FCFA');
  assert.equal(formatDocNumber('{PREFIX}-{YEAR}-{SEQ}', 'FAC', 2026, 44, 3), 'FAC-2026-044');
  assert.equal(formatDateLong('2026-10-14'), '14 octobre 2026');
  assert.equal(formatDateLong('2026-11-01'), '1er novembre 2026');
  assert.equal(addDays('2026-10-14', 30), '2026-11-13');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { integerToWords, amountToWords } from '../shared/numberToWords.js';

const XOF = { decimals: 0, words: { singular: 'franc CFA', plural: 'francs CFA' } };
const EUR = { decimals: 2, words: { singular: 'euro', plural: 'euros', subSingular: 'centime', subPlural: 'centimes' } };

test('montant du modèle', () => {
  assert.equal(amountToWords(100000, XOF), 'Cent mille francs CFA');
});

test('règles du français', () => {
  const cases = {
    0: 'zéro', 1: 'un', 16: 'seize', 17: 'dix-sept', 21: 'vingt et un', 22: 'vingt-deux',
    70: 'soixante-dix', 71: 'soixante et onze', 72: 'soixante-douze', 80: 'quatre-vingts',
    81: 'quatre-vingt-un', 90: 'quatre-vingt-dix', 91: 'quatre-vingt-onze', 99: 'quatre-vingt-dix-neuf',
    100: 'cent', 101: 'cent un', 200: 'deux cents', 201: 'deux cent un', 1000: 'mille',
    1001: 'mille un', 2000: 'deux mille', 80000: 'quatre-vingt mille', 200000: 'deux cent mille',
    1000000: 'un million', 2000000: 'deux millions', 80000000: 'quatre-vingts millions',
    200000000: 'deux cents millions', 1250300: 'un million deux cent cinquante mille trois cents',
    1000000000: 'un milliard',
  };
  for (const [n, w] of Object.entries(cases)) assert.equal(integerToWords(Number(n)), w, `n=${n}`);
});

test('devise, pluriel, millions ronds et centimes', () => {
  assert.equal(amountToWords(1, XOF), 'Un franc CFA');
  assert.equal(amountToWords(2000000, XOF), 'Deux millions de francs CFA');
  assert.equal(amountToWords(1500000, XOF), 'Un million cinq cent mille francs CFA');
  assert.equal(amountToWords(152.45, EUR), 'Cent cinquante-deux euros et quarante-cinq centimes');
  assert.equal(amountToWords(1.01, EUR), 'Un euro et un centime');
});

import './helpers.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { renderPdf, closeBrowser, findBrowser } = await import('../server/services/pdf.js');
const { loadSettings } = await import('../server/services/settings.js');
const { cipmenInvoice } = await import('../scripts/sample-data.js');

let browser = true;
try { findBrowser(loadSettings()); } catch { browser = false; }

/** Nombre d'objets /Page déclarés dans le PDF. */
const pageCount = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

test('PDF du modèle : une seule page A4', { skip: !browser && 'Chrome/Edge introuvable' }, async () => {
  const { buffer, pages } = await renderPdf(cipmenInvoice, loadSettings());
  assert.equal(pages, 1);
  assert.equal(pageCount(buffer), 1);
  assert.ok(buffer.subarray(0, 5).toString() === '%PDF-');
});

test('facture de 40 lignes : pagination sur plusieurs pages', { skip: !browser && 'Chrome/Edge introuvable' }, async () => {
  const doc = {
    ...cipmenInvoice,
    lines: Array.from({ length: 40 }, (_, i) => ({ designation: `Ligne ${i + 1}`, quantity: 1, unitPrice: 1000 })),
  };
  const { buffer, pages } = await renderPdf(doc, loadSettings());
  assert.ok(pages >= 3, `pages = ${pages}`);
  assert.equal(pageCount(buffer), pages);
});

test.after(() => closeBrowser());

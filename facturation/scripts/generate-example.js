/**
 * Génère les PDF d'exemple dans docs/ (sans toucher à la base de données) :
 *   - exemple-facture-modele.pdf   reproduction du modèle fourni (FAC-2026-044)
 *   - exemple-proforma.pdf         proforma en euros : remises, TVA, acompte, filigrane, QR
 *   - exemple-facture-longue.pdf   22 lignes : pagination automatique
 *
 *   npm run example
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../server/paths.js';
import { loadSettings } from '../server/services/settings.js';
import { renderPdf, closeBrowser } from '../server/services/pdf.js';
import { cipmenInvoice } from './sample-data.js';

const settings = loadSettings();
const out = path.join(ROOT, 'docs');
fs.mkdirSync(out, { recursive: true });

const examples = {
  'exemple-facture-modele.pdf': cipmenInvoice,
  'exemple-proforma.pdf': {
    type: 'proforma',
    number: 'PRO-2026-001',
    issueDate: '2026-10-15',
    dueDate: '2026-11-14',
    currency: 'EUR',
    exchangeRate: 655.957,
    client: {
      name: 'Fondation Exemple',
      addressLines: ['12 rue de la Paix', '75002 Paris, France'],
      taxIds: [{ label: 'SIRET', value: '123 456 789 00012' }],
    },
    lines: [
      { designation: 'Couverture vidéo du forum', detail: 'Tournage 2 jours, montage, sous-titrage FR/EN', quantity: 2, unitPrice: 850, discount: 10, vatRate: 19 },
      { designation: 'Frais de déplacement', quantity: 1, unitPrice: 240.5, vatRate: 0 },
    ],
    globalDiscount: { type: 'percent', value: 5 },
    deposit: 500,
    conditions: settings.documents.defaultConditions,
    watermark: true,
    showQr: true,
    signature: 'EXEMPLE000',
  },
  'exemple-facture-longue.pdf': {
    type: 'facture',
    number: 'FAC-2026-045',
    issueDate: '2026-10-15',
    dueDate: '2026-11-14',
    currency: 'XOF',
    client: { name: 'Nigerinfos', addressLines: ['Niamey, Niger'] },
    lines: Array.from({ length: 22 }, (_, i) => ({
      designation: `Prestation de communication digitale n° ${i + 1} — gestion des réseaux sociaux et production de contenus`,
      detail: i % 3 === 0 ? 'Livrables, calendrier éditorial et rapport mensuel de performance' : '',
      quantity: (i % 4) + 1,
      unitPrice: 25000 + i * 1500,
      vatRate: 19,
    })),
    conditions: settings.documents.defaultConditions,
    period: 'octobre 2026',
    showQr: true,
    signature: 'EXEMPLE000',
  },
};

try {
  for (const [file, doc] of Object.entries(examples)) {
    // Les totaux des exemples sont recalculés (pas de valeurs figées)
    const { buffer, pages } = await renderPdf({ ...doc, totals: undefined }, settings);
    fs.writeFileSync(path.join(out, file), buffer);
    console.log(`  docs/${file}  (${pages} page${pages > 1 ? 's' : ''})`);
  }
} finally {
  await closeBrowser();
}

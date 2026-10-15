/**
 * Rendu HTML d'une facture / proforma à partir du gabarit.
 *
 * Le même HTML sert :
 *   - à l'aperçu dans l'interface (iframe),
 *   - à la génération PDF (Chromium via puppeteer-core).
 * L'aperçu est donc strictement identique au PDF.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, TEMPLATE_DIR } from '../paths.js';
import { computeTotals } from '../../shared/totals.js';
import { amountToWords } from '../../shared/numberToWords.js';
import { formatDateLong, formatMoney, formatNumber, formatRate } from '../../shared/format.js';
import { buildPayload, qrSvg } from './qr.js';

const CSS = () => fs.readFileSync(path.join(TEMPLATE_DIR, 'invoice.css'), 'utf8');
const PAGINATE = () => fs.readFileSync(path.join(TEMPLATE_DIR, 'paginate.js'), 'utf8');

/**
 * Logo en data URI : « assets/… » (livré avec le gabarit) ou « uploads/… »
 * (téléversé, stocké dans les données). Fonctionne à l'identique dans l'aperçu
 * et dans Chromium, sans dépendre d'une URL.
 */
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
function logoSrc(logo = 'assets/logo.png') {
  const file = logo.startsWith('uploads/') ? path.join(DATA_DIR, logo) : path.join(TEMPLATE_DIR, logo);
  try {
    const mime = MIME[path.extname(file).toLowerCase()] || 'image/png';
    return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
  } catch {
    return logo;
  }
}

/** Échappement HTML. */
export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Texte multi-lignes -> lignes HTML. */
const linesHtml = (lines) => lines.filter((l) => String(l ?? '').trim() !== '').map(esc).join('<br>');

/** Retrouve la description d'une devise. */
export function currencyOf(settings, code) {
  return settings.currencies.find((c) => c.code === code) || settings.currencies[0];
}

/**
 * Paramètres effectifs d'un document : instantané figé à l'émission
 * (traçabilité) ou paramètres courants pour un brouillon.
 */
export function effectiveSettings(doc, settings) {
  const snap = doc.issuerSnapshot;
  if (!snap) return settings;
  return { ...settings, ...snap, currencies: settings.currencies };
}

/**
 * @param {object} doc      document (voir services/invoices.js pour le format)
 * @param {object} settings paramètres (config/settings.json)
 * @param {{baseHref?: string}} options baseHref : URL du dossier template (polices, logo)
 */
export async function renderInvoiceHtml(doc, settings, { baseHref = '/template/' } = {}) {
  const s = effectiveSettings(doc, settings);
  const d = s.documents;
  const t = s.theme;
  const cur = currencyOf(settings, doc.currency);
  const totals = doc.totals && doc.number ? doc.totals : computeTotals(doc, cur.decimals);
  const money = (v) => formatMoney(v, cur);
  const num = (v) => formatNumber(v, cur.decimals);
  const type = doc.type === 'proforma' ? 'proforma' : 'facture';
  const client = doc.client || {};
  const isDraft = !doc.number;
  const numberText = doc.number || 'BROUILLON';

  // ----- Lignes d'articles -----
  const rowsHtml = (doc.lines || [])
    .map((l, i) => {
      const lt = totals.lines[i] || { net: 0, discountRate: 0, discountAmount: 0 };
      const disc = lt.discountRate > 0
        ? `<div class="disc">Remise ${esc(formatRate(lt.discountRate))} : −${esc(num(lt.discountAmount))}</div>`
        : '';
      return `<div class="src-row row grid">
  <div class="c-no">${String(i + 1).padStart(2, '0')}</div>
  <div class="c-des"><div class="des">${esc(l.designation)}</div>${l.detail ? `<div class="det">${esc(l.detail)}</div>` : ''}${disc}</div>
  <div class="c-qty">${esc(formatNumber(l.quantity, Number.isInteger(Number(l.quantity)) ? 0 : 2))}</div>
  <div class="c-pu">${esc(num(l.unitPrice))}</div>
  <div class="c-tot">${esc(num(lt.net))}</div>
</div>`;
    })
    .join('\n');

  // ----- Totaux -----
  const trows = [];
  if (totals.globalDiscount > 0) {
    trows.push(['Sous-total HT', money(totals.subtotal)]);
    const rate = totals.globalDiscountRate ? ` (${formatRate(totals.globalDiscountRate)})` : '';
    trows.push([`Remise${rate}`, `−${money(totals.globalDiscount)}`]);
  }
  trows.push(['Total HT', money(totals.totalHT)]);
  const taxed = totals.vat.filter((v) => v.rate > 0);
  if (taxed.length === 0) {
    trows.push([`TVA (${formatRate(0)})`, money(0), 'muted']);
  } else {
    for (const v of taxed) trows.push([`TVA (${formatRate(v.rate)})`, money(v.amount)]);
  }
  if (totals.deposit > 0) {
    trows.push(['Total TTC', money(totals.totalTTC)]);
    trows.push([doc.depositLabel || 'Acompte versé', `−${money(totals.deposit)}`]);
  }
  const totalsRows = trows
    .map(([k, v, cls], i) =>
      `<div class="trow${i === trows.length - 1 ? ' last' : ''}"><span class="k">${esc(k)}</span><span class="v ${cls || ''}">${esc(v)}</span></div>`)
    .join('');

  const base = currencyOf(settings, settings.baseCurrency);
  const counterValue = cur.code !== base.code && Number(doc.exchangeRate) > 0
    ? `<div class="counter-value">Contre-valeur : ${esc(formatMoney(totals.netToPay * doc.exchangeRate, base))} (1 ${esc(cur.label)} = ${esc(formatNumber(doc.exchangeRate, 3).replace(/,?0+$/, ''))} ${esc(base.label)})</div>`
    : '';

  // ----- Conditions -----
  const condLines = String(doc.conditions ?? d.defaultConditions ?? '').split('\n');
  if (doc.paymentMethod && !condLines.some((l) => l.toLowerCase().includes(doc.paymentMethod.toLowerCase()))) {
    condLines.push(`Mode de règlement : ${doc.paymentMethod}.`);
  }
  if (doc.period) condLines.push(`Période facturée : ${doc.period}.`);
  if (d.legalMentions) condLines.push(...String(d.legalMentions).split('\n'));

  // ----- QR code (documents émis uniquement) -----
  let qrHtml = '';
  if (d.qrCode?.enabled && doc.showQr !== false && !isDraft && doc.signature) {
    const svg = await qrSvg(buildPayload({ ...doc, totals }, cur, s.issuer.shortName || s.issuer.name), t.navy);
    qrHtml = `<div class="qr">${svg}<div class="cap">${esc(d.qrCode.caption || '')}</div></div>`;
  }

  const showWatermark = type === 'proforma' ? doc.watermark ?? d.watermark?.proforma : false;
  const watermarkText = isDraft && type === 'facture' ? '' : d.watermark?.text || 'PROFORMA';
  const issuer = s.issuer;
  const clientIds = (client.taxIds || []).filter((x) => x.value).map((x) => `${x.label} : ${x.value}`);
  const includeTerms = doc.includeTerms && String(d.generalTerms || '').trim();

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<base href="${esc(baseHref)}">
<title>${esc(d.titles[type])} ${esc(numberText)}</title>
<style>
:root {
  --c-navy: ${t.navy}; --c-green: ${t.green}; --c-green-dark: ${t.greenDark};
  --c-text: ${t.text}; --c-muted: ${t.muted}; --c-dark: ${t.dark};
  --c-panel: ${t.panel}; --c-line: ${t.line}; --c-highlight: ${t.highlight};
  --c-header-text: ${t.headerText};
}
${CSS()}
</style>
</head>
<body>
<div id="pages"></div>
<div id="measure"></div>
<template id="src">
<div class="src-first">
  <div class="band"></div><div class="band-strip"></div>
  <img class="logo" src="${esc(logoSrc(issuer.logo))}" alt="">
  <div class="doc-title">${esc(d.titles[type])}</div><div class="doc-title-bar"></div>
  <div class="party issuer">
    <div class="label">${esc(d.issuerLabel)}</div>
    <div class="name">${esc(issuer.name)}</div>
    <div class="lines">${linesHtml([...(issuer.addressLines || []), issuer.email, issuer.phone])}</div>
    <div class="ids">${linesHtml((issuer.legalIds || []).map((x) => `${x.label} : ${x.value}`))}</div>
  </div>
  <div class="party client">
    <div class="label">${esc(d.clientLabel)}</div>
    <div class="name">${esc(client.name)}</div>
    <div class="lines">${linesHtml([...(client.addressLines || []), ...clientIds])}</div>
  </div>
  <div class="meta">
    <div class="label">${esc(d.numberLabels[type])}</div>
    <div class="num">${esc(numberText)}</div>
    <div class="sep"></div>
    <div class="label">DATE D'ÉMISSION</div>
    <div class="date">${esc(formatDateLong(doc.issueDate))}</div>
    <div class="sep"></div>
    <div class="label">${esc(d.dueLabels[type])}</div>
    <div class="date">${esc(formatDateLong(doc.dueDate))}</div>
  </div>
</div>
<div class="src-cont">
  <div class="cont-head"><span class="t">${esc(d.titles[type])} ${esc(numberText)}</span><span class="n">${esc(client.name)}</span></div>
</div>
<div class="src-thead thead grid">
  <div class="c-no">N°</div><div class="c-des">Désignation</div><div class="c-qty">Qté</div>
  <div class="c-pu">P.U. (${esc(cur.label)})</div><div class="c-tot">Total (${esc(cur.label)})</div>
</div>
${rowsHtml}
<div class="src-totals totals">${totalsRows}
  <div class="net"><span class="k">NET À PAYER</span><span class="v">${esc(money(totals.netToPay))}</span></div>${counterValue}
</div>
<div class="src-words words">
  <span class="label">${esc(d.amountInWordsLabel)}</span>
  <span class="text">${esc(amountToWords(totals.netToPay, cur))}</span>
</div>
<div class="src-bottom">
  <div class="bottom">
    <div class="col cond"><div class="label">${esc(d.conditionsLabel)}</div><div class="body">${linesHtml(condLines)}</div></div>
    <div class="col bank"><div class="label">${esc(d.bankLabel)}</div><div class="body"><span class="bank-name">${esc(s.bank.name)}</span><br>${linesHtml(s.bank.lines || [])}</div></div>
    ${qrHtml}
  </div>
</div>
<div class="src-footer">
  <div class="foot-rule"></div><div class="foot-accent"></div>
  <div class="foot"><span class="l">${esc(s.footer.left)}</span><span class="r">${esc(s.footer.right)}</span></div>
</div>
${showWatermark && watermarkText ? `<div class="src-mark watermark">${esc(watermarkText)}</div>` : ''}
${includeTerms ? `<div class="src-terms"><div class="terms"><div class="label">CONDITIONS GÉNÉRALES</div><div class="body">${esc(d.generalTerms)}</div></div></div>` : ''}
</template>
<script>${PAGINATE()}</script>
</body>
</html>`;
}

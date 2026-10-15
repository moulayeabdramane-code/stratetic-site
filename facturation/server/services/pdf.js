/**
 * Génération PDF par Chromium (puppeteer-core).
 *
 * puppeteer-core ne télécharge aucun navigateur : on pilote Chrome ou Edge déjà
 * installés (chemin détecté automatiquement, ou `pdf.browserPath` dans
 * config/settings.json, ou variable d'environnement CHROME_PATH).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { TEMPLATE_DIR } from '../paths.js';
import { renderInvoiceHtml } from './renderer.js';

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/usr/lib/chromium/chromium',
];

export function findBrowser(settings) {
  const list = [settings?.pdf?.browserPath, ...CANDIDATES].filter(Boolean);
  const found = list.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      'Aucun navigateur Chrome/Edge trouvé. Renseignez "pdf.browserPath" dans config/settings.json.',
    );
  }
  return found;
}

let browserPromise = null;

async function getBrowser(settings) {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b && b.connected) return b;
  }
  browserPromise = puppeteer.launch({
    executablePath: findBrowser(settings),
    headless: true,
    // --disable-dev-shm-usage : /dev/shm est très petit dans les conteneurs Docker
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--font-render-hinting=none', '--allow-file-access-from-files'],
  });
  return browserPromise;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const b = await browserPromise.catch(() => null);
  browserPromise = null;
  await b?.close().catch(() => {});
}

/**
 * Produit le PDF d'un document.
 * @returns {Promise<{buffer: Buffer, pages: number}>}
 */
export async function renderPdf(doc, settings) {
  const browser = await getBrowser(settings);
  const page = await browser.newPage();
  try {
    // La page est ouverte sur un fichier du dossier template : ses polices et
    // son logo se chargent en file:// sans dépendre du serveur HTTP.
    const blank = path.join(TEMPLATE_DIR, 'blank.html');
    await page.goto(pathToFileURL(blank).href);
    const baseHref = pathToFileURL(TEMPLATE_DIR + path.sep).href;
    const html = await renderInvoiceHtml(doc, settings, { baseHref });
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForFunction('window.__PAGINATED === true', { timeout: 15000 });
    const pages = await page.evaluate('window.__PAGES');
    const buffer = Buffer.from(
      await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }),
    );
    return { buffer, pages };
  } finally {
    await page.close().catch(() => {});
  }
}

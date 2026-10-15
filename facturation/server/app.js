/**
 * Construction de l'application Express.
 *
 * Chemin de base (BASE_PATH, ex. /facturation) : l'application est servie sous
 * ce préfixe, que le proxy (Traefik/Coolify) le retire avant de transmettre la
 * requête ou non. Les deux cas sont gérés :
 *   - préfixe conservé : /facturation/api/...   -> routeur monté sur BASE_PATH
 *   - préfixe retiré   : /api/...               -> même routeur monté sur /
 * Le navigateur, lui, voit toujours /facturation/… : l'index.html reçoit une
 * balise <base href="/facturation/"> et toutes les adresses de l'interface sont
 * relatives.
 */
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { BASE_PATH, CLIENT_DIST, TEMPLATE_DIR, UPLOADS_DIR } from './paths.js';
import { apiGuard } from './auth.js';
import { api } from './routes/api.js';

/** index.html de l'interface, avec le chemin de base injecté. */
function indexHtml() {
  const file = path.join(CLIENT_DIST, 'index.html');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf8').replace(
    '<head>',
    `<head>\n    <base href="${BASE_PATH}/">\n    <link rel="icon" href="template/assets/favicon.svg" type="image/svg+xml">`,
  );
}

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Derrière le proxy de Coolify (HTTPS) : protocole et IP réels (cookie Secure, anti force brute)
  app.set('trust proxy', true);

  const router = express.Router();

  // En-têtes de sécurité
  router.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'same-origin' });
    next();
  });

  // Sonde de santé pour Coolify
  router.get('/healthz', (req, res) => res.json({ ok: true }));

  router.use(express.json({ limit: '25mb' }));
  // L'API exige une session (sauf connexion) ; l'interface et les ressources statiques sont publiques
  router.use('/api', apiGuard(), api);
  router.use('/api', (req, res) => res.status(404).json({ error: 'Adresse inconnue.' }));
  // Polices, logo et feuille de style du gabarit (aperçu, interface)
  router.use('/template', express.static(TEMPLATE_DIR, { maxAge: '1h' }));
  // Logos téléversés depuis les paramètres (stockés avec les données)
  router.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1h' }));

  const html = indexHtml();
  if (html) {
    const sendIndex = (req, res) => res.set('Cache-Control', 'no-cache').type('html').send(html);
    router.get(['/', '/index.html'], sendIndex);
    router.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    router.get(/^\/(?!api\/|template\/|uploads\/).*/, sendIndex);
  } else {
    router.get('/', (req, res) => res.type('text').send("Interface non compilée : lancez « npm run build » puis « npm start »."));
  }

  if (BASE_PATH) {
    // « /facturation » sans barre finale -> « /facturation/ » (adresses relatives correctes)
    app.get(BASE_PATH, (req, res, next) => (req.originalUrl === BASE_PATH ? res.redirect(301, `${BASE_PATH}/`) : next()));
    app.use(BASE_PATH, router);
  }
  app.use(router);
  return app;
}

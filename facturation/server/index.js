/**
 * Point d'entrée du serveur.
 *
 *   npm start   -> http://localhost:3210 (et http://<ip-du-pc>:3210 depuis une tablette)
 *   En ligne (Coolify, https://stratetic.art/facturation) : voir DEPLOIEMENT.md
 */
import os from 'node:os';
import { BASE_PATH, DATA_DIR } from './paths.js';
import { openDatabase } from './db/database.js';
import { loadSettings } from './services/settings.js';
import { closeBrowser } from './services/pdf.js';
import { ensureInitialAdmin, purgeExpiredSessions } from './services/users.js';
import { authDisabled } from './auth.js';
import { createApp } from './app.js';

try {
  openDatabase();
} catch (err) {
  console.error(`\n  Impossible d'ouvrir la base dans ${DATA_DIR} : ${err.message}`);
  console.error('  En ligne, vérifiez que le volume persistant est monté sur /app/data et accessible en écriture.\n');
  process.exit(1);
}
const settings = loadSettings();

// Premier démarrage : compte administrateur initial (changement de mot de passe exigé)
if (!authDisabled()) {
  const admin = ensureInitialAdmin();
  if (admin) {
    console.log('\n  ============================================================');
    console.log('   COMPTE ADMINISTRATEUR CRÉÉ (premier démarrage)');
    console.log(`   E-mail       : ${admin.email}`);
    console.log(`   Mot de passe : ${admin.password ?? '(valeur de INITIAL_ADMIN_PASSWORD)'}`);
    console.log('   Il devra être changé à la première connexion.');
    console.log('  ============================================================');
  }
  purgeExpiredSessions();
  setInterval(purgeExpiredSessions, 6 * 3600 * 1000).unref();
}

const app = createApp();
const port = Number(process.env.PORT) || settings.server?.port || 3210;
const host = settings.server?.host || '0.0.0.0';
const server = app.listen(port, host, () => {
  console.log(`\n  Facturation STRATETIC prête (connexion ${authDisabled() ? 'DÉSACTIVÉE' : 'par comptes utilisateurs'})`);
  console.log(`    → http://localhost:${port}${BASE_PATH}/`);
  if (process.env.NODE_ENV !== 'production') {
    const lan = Object.values(os.networkInterfaces()).flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => `http://${i.address}:${port}${BASE_PATH}/`);
    for (const u of lan) console.log(`    → ${u}  (tablette sur le même réseau)`);
  }
  console.log('');
});

const shutdown = async () => {
  server.close();
  await closeBrowser();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

import { randomBytes } from "crypto";
import type { Payload } from "payload";

/**
 * Crée le premier administrateur depuis l'environnement si la base n'en a aucun.
 * Ainsi, l'écran public « créer le premier utilisateur » n'est jamais exposé.
 * Sans INITIAL_ADMIN_PASSWORD, un mot de passe provisoire est généré et affiché
 * une seule fois dans les logs (Coolify → Runtime Logs), à changer à la 1re connexion.
 */
export async function ensureAdmin(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({ collection: "users" });
  if (totalDocs > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL;
  if (!email) {
    throw new Error(
      "[admin] Aucun administrateur en base : définissez INITIAL_ADMIN_EMAIL, puis redémarrez.",
    );
  }
  const generated = !process.env.INITIAL_ADMIN_PASSWORD;
  const password = process.env.INITIAL_ADMIN_PASSWORD || randomBytes(12).toString("base64url");

  await payload.create({ collection: "users", data: { email, password } });
  payload.logger.info(`[admin] Compte administrateur créé : ${email}`);
  if (generated) {
    payload.logger.warn(
      `[admin] Mot de passe provisoire (affiché une seule fois, à changer dès la première connexion) : ${password}`,
    );
  }
}

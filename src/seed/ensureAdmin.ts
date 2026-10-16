import type { Payload } from "payload";

/**
 * Crée le premier administrateur depuis l'environnement si la base n'en a aucun.
 * Ainsi, l'écran public « créer le premier utilisateur » n'est jamais exposé.
 */
export async function ensureAdmin(payload: Payload): Promise<void> {
  const { totalDocs } = await payload.count({ collection: "users" });
  if (totalDocs > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "[admin] Aucun administrateur en base : définissez INITIAL_ADMIN_EMAIL et INITIAL_ADMIN_PASSWORD, puis redémarrez.",
    );
  }

  await payload.create({ collection: "users", data: { email, password } });
  payload.logger.info(`[admin] Compte administrateur créé : ${email}`);
}

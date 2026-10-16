// Initialise Payload au démarrage du serveur Node : migrations (prod),
// premier administrateur et import initial, avant toute requête.
// Imports dynamiques DANS le try : un module natif cassé (sharp, libsql) doit
// lui aussi arrêter le conteneur, pas laisser un serveur à moitié démarré.
export async function initPayload(): Promise<void> {
  try {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@payload-config");
    await getPayload({ config });
  } catch (error) {
    console.error("[payload] Échec de l'initialisation :", error);
    // En prod, le conteneur s'arrête : l'échec est visible dans Coolify.
    if (process.env.NODE_ENV === "production") process.exit(1);
    throw error;
  }
}

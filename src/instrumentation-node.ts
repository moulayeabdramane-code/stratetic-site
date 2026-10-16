// Initialise Payload au démarrage du serveur Node : migrations (prod),
// premier administrateur et import initial, avant toute requête.
import { getPayload } from "payload";
import config from "@payload-config";

try {
  await getPayload({ config });
} catch (error) {
  console.error("[payload] Échec de l'initialisation :", error);
  // En prod, le conteneur s'arrête : l'échec est visible dans Coolify.
  if (process.env.NODE_ENV === "production") process.exit(1);
  throw error;
}

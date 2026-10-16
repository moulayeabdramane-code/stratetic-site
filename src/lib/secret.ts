import { randomBytes } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

/**
 * Secret de chiffrement Payload. Ordre de priorité :
 * 1. la variable PAYLOAD_SECRET si elle est définie (dev : fichier .env) ;
 * 2. sinon un secret aléatoire généré au premier démarrage et conservé dans
 *    PAYLOAD_SECRET_FILE (prod : /data/.payload-secret, défini par le Dockerfile,
 *    sur le volume Coolify) pour rester identique d'un redéploiement à l'autre —
 *    sinon toutes les sessions admin seraient invalidées à chaque déploiement.
 * Pendant `next build` (pas de volume), on ne lit ni n'écrit rien.
 *
 * Le chemin vient UNIQUEMENT de l'environnement : un chemin construit avec
 * process.cwd() ferait embarquer tout le projet par le traçage de Next.
 */
export function resolvePayloadSecret(): string {
  if (process.env.PAYLOAD_SECRET) return process.env.PAYLOAD_SECRET;
  if (process.env.NEXT_PHASE === "phase-production-build") return "build-sans-secret";

  const file = process.env.PAYLOAD_SECRET_FILE;
  if (!file) {
    throw new Error("[payload] Définissez PAYLOAD_SECRET ou PAYLOAD_SECRET_FILE.");
  }
  if (existsSync(file)) {
    const saved = readFileSync(file, "utf8").trim();
    if (saved) return saved;
  }
  const secret = randomBytes(32).toString("hex");
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

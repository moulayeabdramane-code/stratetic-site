// Healthcheck Coolify (type « Container command » : node scripts/healthcheck.mjs).
// L'image node:22-slim n'a ni curl ni wget. On utilise http natif sans
// keep-alive et on fixe process.exitCode plutôt que d'appeler process.exit() :
// quitter brutalement pendant la fermeture d'une connexion fetch fait planter
// Node (assertion libuv UV_HANDLE_CLOSING).
import http from "node:http";

const port = Number(process.env.PORT) || 3000;
process.exitCode = 1;

const req = http.get({ host: "127.0.0.1", port, path: "/", agent: false, timeout: 8000 }, (res) => {
  res.resume();
  if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) process.exitCode = 0;
});
req.on("timeout", () => req.destroy());
req.on("error", () => {
  process.exitCode = 1;
});

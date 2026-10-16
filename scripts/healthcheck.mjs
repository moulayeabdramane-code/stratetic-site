// Healthcheck Coolify (type « Container command » : node scripts/healthcheck.mjs).
// L'image node:22-slim n'a ni curl ni wget : on interroge le serveur avec fetch.
const port = process.env.PORT || 3000;
try {
  const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(4000) });
  process.exit(res.ok ? 0 : 1);
} catch {
  process.exit(1);
}

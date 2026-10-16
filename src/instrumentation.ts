export async function register() {
  // Pas de base pendant `next build` (build Docker) : on n'initialise rien.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  // Payload n'existe que côté Node ; l'import conditionnel l'exclut du bundle Edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}

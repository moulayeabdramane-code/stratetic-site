# Dockerfile de production pour Coolify — Next.js 16 en sortie autonome.
# Image Debian slim (glibc) pour éviter les soucis de binaires natifs.

FROM node:20-slim AS base

# --- Dépendances ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (et non npm ci) pour tolérer une dérive de version de npm entre
# la machine qui a généré le lock (npm 11) et celle de l'image (npm 10) :
# npm ci refuse à la moindre différence, npm install réconcilie.
RUN npm install --no-audit --no-fund

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Le serveur autonome + les assets statiques + le dossier public.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

# Image de production (Coolify) — application de facturation STRATETIC
#   - publiée sur https://stratetic.art/facturation (BASE_PATH, modifiable dans Coolify)
#   - Chromium (Debian) pour générer les PDF
#   - données persistantes dans /app/data (à monter en volume)

# ---- Compilation de l'interface ----
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm install (et non npm ci) : tolère une différence de version de npm entre le
# poste qui a généré le lock et l'image (même choix que le site stratetic.art)
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Exécution ----
FROM node:24-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-dejavu-core tzdata ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    TZ=Africa/Niamey \
    PORT=3210 \
    BASE_PATH=/facturation \
    CHROME_PATH=/usr/bin/chromium \
    FACTURATION_DATA_DIR=/app/data \
    FACTURATION_CONFIG=/app/data/settings.json

WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/client/dist ./client/dist
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY config ./config

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
VOLUME ["/app/data"]
EXPOSE 3210

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3210/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]

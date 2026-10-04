# ─────────────────────────────────────────────────────────────────────────────
# RNB AUTO — image de production (serveur Next.js autonome + PostgreSQL externe).
# Construction : docker build -t rnb-auto --build-arg NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr .
# Voir docs/08-installation-et-deploiement.md.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Scripts de base de données (migrations, données de départ, compte administrateur) en un seul fichier chacun.
RUN npx esbuild scripts/migrate.ts scripts/seed.ts scripts/create-admin.ts \
      --bundle --platform=node --target=node22 --format=cjs --outdir=dist-scripts --out-extension:.js=.cjs \
      --external:@electric-sql/pglite --external:drizzle-orm/pglite --external:drizzle-orm/pglite/migrator

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S rnb && adduser -S rnb -G rnb
COPY --from=builder --chown=rnb:rnb /app/.next/standalone ./
COPY --from=builder --chown=rnb:rnb /app/.next/static ./.next/static
COPY --from=builder --chown=rnb:rnb /app/public ./public
COPY --from=builder --chown=rnb:rnb /app/drizzle ./drizzle
COPY --from=builder --chown=rnb:rnb /app/dist-scripts ./dist-scripts
USER rnb
EXPOSE 3000
# Au démarrage : migrations, données de départ manquantes, puis le site.
CMD ["sh", "-c", "node dist-scripts/migrate.cjs && node dist-scripts/seed.cjs && node server.js"]

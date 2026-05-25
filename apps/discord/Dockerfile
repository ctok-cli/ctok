FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
# Copy workspace packages needed at runtime
COPY packages/core ./packages/core
COPY packages/refiner ./packages/refiner
COPY packages/scanner ./packages/scanner
COPY packages/quota ./packages/quota
COPY apps/discord/package.json ./apps/discord/package.json
RUN pnpm install --frozen-lockfile --filter @ctok/discord...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/discord ./apps/discord
RUN pnpm --filter @ctok/discord build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/apps/discord/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/discord/node_modules ./apps/discord/node_modules

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

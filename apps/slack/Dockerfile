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
COPY apps/slack/package.json ./apps/slack/package.json
RUN pnpm install --frozen-lockfile --filter @ctok/slack...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/slack ./apps/slack
RUN pnpm --filter @ctok/slack build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

# Only copy the compiled output and production node_modules
COPY --from=builder /app/apps/slack/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/slack/node_modules ./apps/slack/node_modules

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]

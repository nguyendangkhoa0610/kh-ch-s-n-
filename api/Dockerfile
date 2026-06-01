FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY api/package.json ./api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/ 2>/dev/null || true
RUN pnpm install --frozen-lockfile --prod=false

# ── build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN pnpm -C packages/database db:generate
RUN pnpm -C api build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/api/package.json ./api/package.json
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000
CMD ["node", "api/dist/index.js"]

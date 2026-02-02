# =========================
# Stage 1: Dependencies
# =========================
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# =========================
# Stage 2: Runtime
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S app && adduser -S app -G app && corepack enable

# Copy only production deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source code
COPY src ./src
COPY openapi.yaml ./

# Ensure ownership
RUN chown -R app:app /app

USER app

EXPOSE 3002

CMD ["node", "src/index.js"]

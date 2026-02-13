# apps/colab/Dockerfile
# Multi-stage build for Next.js collaboration app
# NOTE: Build from monorepo root with: docker build -f apps/colab/Dockerfile -t alecia/colab:latest .

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config and all package.json files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/colab/package.json apps/colab/
COPY packages/ui/package.json packages/ui/
COPY packages/headless/package.json packages/headless/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/ai/package.json packages/ai/
COPY packages/integrations/package.json packages/integrations/

# Install all dependencies (including devDependencies for build tools)
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder
WORKDIR /app

# Copy everything from deps stage
COPY --from=deps /app ./

# Copy source code
COPY apps/colab ./apps/colab
COPY packages ./packages
COPY turbo.json package.json pnpm-workspace.yaml ./

ENV NEXT_TELEMETRY_DISABLED=1

# Build using turbo (handles internal package builds automatically)
RUN corepack enable && pnpm turbo build --filter=colab

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/colab/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/colab/.next/static ./apps/colab/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/colab/public ./apps/colab/public
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/colab/server.js"]

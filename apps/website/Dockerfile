# apps/website/Dockerfile
# Multi-stage build for Next.js marketing site
# NOTE: Build from monorepo root with: docker build -f apps/website/Dockerfile -t alecia/website:latest .

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace config and all package.json files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/website/package.json apps/website/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
COPY packages/auth/package.json packages/auth/
COPY packages/ai/package.json packages/ai/
COPY packages/integrations/package.json packages/integrations/
COPY packages/headless/package.json packages/headless/

# Install all dependencies (including devDependencies for build tools)
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

FROM node:20-alpine AS builder
WORKDIR /app

# Copy everything from deps stage
COPY --from=deps /app ./

# Copy source code (this won't overwrite node_modules due to .dockerignore)
COPY apps/website ./apps/website
COPY packages ./packages
COPY turbo.json package.json pnpm-workspace.yaml ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV GENERATE_SOURCEMAP=false

# Build using turbo (handles internal package builds automatically)
RUN corepack enable && pnpm turbo build --filter=@alecia/website

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/.next/static ./apps/website/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/website/public ./apps/website/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/website/server.js"]

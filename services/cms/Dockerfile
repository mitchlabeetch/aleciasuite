# services/cms/Dockerfile
# Alecia CMS (Strapi CE) - Custom branded build

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies
FROM base AS deps
COPY services/cms/package*.json ./
RUN npm install

# Build Strapi admin panel
FROM deps AS builder
COPY services/cms/ ./
ENV NODE_ENV=production
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 strapi

# Copy everything from builder
COPY --from=builder --chown=strapi:nodejs /app ./

# Strapi needs these directories writable at runtime
RUN mkdir -p /app/.tmp /app/public/uploads && \
    chown -R strapi:nodejs /app

USER strapi
EXPOSE 1337

CMD ["npm", "run", "start"]

# Lean Node.js 20 base
FROM node:20-alpine

# System dependencies
RUN apk add --no-cache \
    docker-cli \
    git \
    curl

# App directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY server.js ./
COPY views/ ./views/
COPY public/ ./public/

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 dashboard
RUN chown -R dashboard:nodejs /app

USER dashboard

# Expose port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:3100/health || exit 1

# Start server
CMD ["node", "server.js"]

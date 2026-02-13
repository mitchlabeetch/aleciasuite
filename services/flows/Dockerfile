# services/flows/Dockerfile
# Alecia Flows (Activepieces CE) - Custom branded build with custom pieces
# Build context must be set to repo root (.)

FROM activepieces/activepieces:latest

# Copy custom M&A workflow pieces
COPY services/flows-pieces/pieces /app/packages/pieces/community

# Copy SSO middleware and setup script
COPY services/flows/scripts/better-auth-middleware.js /app/better-auth-middleware.js
COPY services/flows/scripts/setup-sso.sh /docker-entrypoint-init.d/

# Copy branding assets (if available)
COPY services/flows/branding /app/branding

# Set environment
ENV AP_ENVIRONMENT=production
ENV AP_FRONTEND_URL=https://flows.alecia.fr
ENV AP_PIECES_SOURCE=FILE
ENV AP_DEV_PIECES=true
ENV NODE_OPTIONS="--require /app/better-auth-middleware.js"

EXPOSE 8080

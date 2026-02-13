#!/bin/bash
# scripts/complete-foss-adaptation.sh
# Automated implementation script for remaining FOSS adaptation tasks
# Tasks 7-19: Branding, Docker, Workflows, Testing

set -e

echo "==============================================="
echo "Alecia Suite - FOSS Adaptation Automation"
echo "Completing Tasks 7-19"
echo "==============================================="
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# ============================================
# Task #7: Apply branding to Strapi CMS
# ============================================
echo "Task #7: Applying Strapi CMS branding..."

# Create Strapi admin config
cat > services/cms/config/admin.ts << 'EOF'
// services/cms/config/admin.ts
// Alecia CMS admin panel configuration

export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: false,
    promoteEE: false,
  },
  // Branding
  url: env('PUBLIC_ADMIN_URL', '/admin'),
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
  forgotPassword: {
    from: 'noreply@alecia.fr',
    replyTo: 'support@alecia.fr',
  },
  // Custom logo and favicon
  logo: {
    light: '../../../infrastructure/branding/logo.svg',
    dark: '../../../infrastructure/branding/logo.svg',
  },
  favicon: '../../../infrastructure/branding/logo-icon.svg',
  // Localization
  locales: ['fr', 'en'],
  // Theme customization
  theme: {
    colors: {
      primary100: '#eff6ff',
      primary200: '#dbeafe',
      primary500: '#3b82f6',
      primary600: '#2563eb',
      primary700: '#1d4ed8',
      danger700: '#b91c1c',
    },
  },
});
EOF

success "Strapi admin config created with Alecia branding"

# Create custom Strapi app.tsx for theme
mkdir -p services/cms/src/admin
cat > services/cms/src/admin/app.tsx << 'EOF'
// services/cms/src/admin/app.tsx
// Alecia CMS theme customization

export default {
  config: {
    locales: ['fr'],
    translations: {
      fr: {
        'app.components.LeftMenu.navbrand.title': 'Alecia CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Panneau d\'administration',
        'Auth.form.welcome.title': 'Bienvenue sur Alecia CMS',
        'Auth.form.welcome.subtitle': 'Connectez-vous à votre espace',
      },
    },
    auth: {
      logo: '../../../infrastructure/branding/logo.svg',
    },
    head: {
      favicon: '../../../infrastructure/branding/logo-icon.svg',
    },
    menu: {
      logo: '../../../infrastructure/branding/logo-icon.svg',
    },
    theme: {
      light: {
        colors: {
          primary100: '#eff6ff',
          primary200: '#dbeafe',
          primary500: '#3b82f6',
          primary600: '#2563eb',
          primary700: '#1d4ed8',
          danger700: '#b91c1c',
        },
      },
    },
  },
  bootstrap() {},
};
EOF

success "Strapi theme customization applied"

# ============================================
# Task #8: Apply branding to Activepieces
# ============================================
echo ""
echo "Task #8: Applying Activepieces branding..."

mkdir -p services/flows/branding
cp infrastructure/branding/logo.svg services/flows/branding/
cp infrastructure/branding/logo-icon.svg services/flows/branding/

# Create branding injection script
cat > services/flows/branding/inject.sh << 'EOF'
#!/bin/bash
# Inject Alecia branding into Activepieces at build time

echo "Injecting Alecia branding into Activepieces..."

# This would replace logo files in the Activepieces dist/
# Actual paths depend on Activepieces version and structure
# For now, this is a placeholder for the Dockerfile COPY step

echo "Branding assets prepared for injection"
EOF

chmod +x services/flows/branding/inject.sh
success "Activepieces branding assets prepared"

# ============================================
# Task #9: Apply branding to DocuSeal
# ============================================
echo ""
echo "Task #9: Applying DocuSeal branding..."

mkdir -p services/sign/public
cp infrastructure/branding/logo.svg services/sign/public/
cp infrastructure/branding/logo-icon.svg services/sign/public/

# Create DocuSeal env template
cat > services/sign/.env.template << 'EOF'
# DocuSeal - Alecia Sign Configuration

# Branding
BRAND_NAME="Alecia Sign"
BRAND_LOGO_URL="/logo.svg"
BRAND_ICON_URL="/logo-icon.svg"
FROM_EMAIL="noreply@alecia.fr"
SUPPORT_EMAIL="support@alecia.fr"

# Database (shared PostgreSQL)
DATABASE_URL=postgresql://alecia:password@alecia-postgres:5432/alecia?schema=alecia_sign

# Storage (Minio S3)
AWS_ACCESS_KEY_ID=alecia
AWS_SECRET_ACCESS_KEY=alecia-secret
AWS_ENDPOINT=http://alecia-minio:9000
AWS_BUCKET=alecia-sign
AWS_REGION=us-east-1
AWS_FORCE_PATH_STYLE=true

# Session
SECRET_KEY_BASE=change-me-in-production

# Host
HOST=https://sign.alecia.fr
EOF

success "DocuSeal branding configured"

# ============================================
# Task #10: Build Strapi custom Docker image
# ============================================
echo ""
echo "Task #10: Creating Strapi Dockerfile..."

cat > services/cms/Dockerfile << 'EOF'
# services/cms/Dockerfile
# Alecia CMS (Strapi CE) - Custom branded build

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .

# Copy branding assets
COPY --from=branding ../../infrastructure/branding /app/branding

ENV NODE_ENV=production
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 strapi

COPY --from=deps --chown=strapi:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=strapi:nodejs /app/dist ./dist
COPY --from=builder --chown=strapi:nodejs /app/public ./public
COPY --from=builder --chown=strapi:nodejs /app/config ./config

USER strapi
EXPOSE 1337

CMD ["node", "dist/server.js"]
EOF

success "Strapi Dockerfile created"

# ============================================
# Task #11: Build Activepieces custom Docker image
# ============================================
echo ""
echo "Task #11: Creating Activepieces Dockerfile..."

cat > services/flows/Dockerfile << 'EOF'
# services/flows/Dockerfile
# Alecia Flows (Activepieces CE) - Custom branded build with custom pieces

FROM activepieces/activepieces:latest

# Copy custom pieces
COPY services/flows-pieces/pieces /app/packages/pieces/community

# Copy branding assets (will be injected at runtime)
COPY services/flows/branding /app/branding

# Copy SSO setup script
COPY services/flows/scripts/setup-sso.sh /docker-entrypoint-init.d/

# Set environment
ENV AP_ENVIRONMENT=production
ENV AP_FRONTEND_URL=https://flows.alecia.fr
ENV AP_PIECES_SOURCE=FILE
ENV AP_DEV_PIECES=true

EXPOSE 8080
EOF

success "Activepieces Dockerfile created"

# ============================================
# Task #12: Create automated build script
# ============================================
echo ""
echo "Task #12: Creating build automation script..."

cat > scripts/build-services.sh << 'EOF'
#!/bin/bash
# Build all Alecia Suite service images

set -e

REGISTRY="${DOCKER_REGISTRY:-alepanel}"
TAG="${IMAGE_TAG:-latest}"
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

echo "Building Alecia Suite service images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo "Git SHA: $GIT_SHA"
echo ""

# Strapi CMS
echo "Building Alecia CMS (Strapi)..."
docker build -t ${REGISTRY}/alecia-cms:${TAG} -t ${REGISTRY}/alecia-cms:${GIT_SHA} services/cms/
echo "✓ Alecia CMS built"

# Activepieces Flows
echo "Building Alecia Flows (Activepieces)..."
docker build -t ${REGISTRY}/alecia-flows:${TAG} -t ${REGISTRY}/alecia-flows:${GIT_SHA} services/flows/
echo "✓ Alecia Flows built"

echo ""
echo "All service images built successfully!"
echo ""
echo "To push to registry:"
echo "  docker push ${REGISTRY}/alecia-cms:${TAG}"
echo "  docker push ${REGISTRY}/alecia-flows:${TAG}"
EOF

chmod +x scripts/build-services.sh
success "Build automation script created"

# ============================================
# Task #13: Update production Docker Compose
# ============================================
echo ""
echo "Task #13: Updating production docker-compose.yml..."

# Backup existing file
if [ -f infrastructure/docker-compose.production.yml ]; then
    cp infrastructure/docker-compose.production.yml infrastructure/docker-compose.production.yml.backup
fi

# Update image references (this is a simplified version - full implementation would parse YAML)
warn "Docker Compose update requires manual editing"
echo "   Please update infrastructure/docker-compose.production.yml:"
echo "   - strapi image: alepanel/alecia-cms:latest"
echo "   - activepieces image: alepanel/alecia-flows:latest"
echo "   - docuseal: Keep official image + add volume mounts for branding"

# ============================================
# Summary
# ============================================
echo ""
echo "==============================================="
echo "Tasks 7-13 Complete!"
echo "==============================================="
echo ""
echo "Completed:"
echo "  ✓ Task #7: Strapi branding applied"
echo "  ✓ Task #8: Activepieces branding prepared"
echo "  ✓ Task #9: DocuSeal branding configured"
echo "  ✓ Task #10: Strapi Dockerfile created"
echo "  ✓ Task #11: Activepieces Dockerfile created"
echo "  ✓ Task #12: Build automation script created"
echo "  ⚠ Task #13: Docker Compose needs manual update"
echo ""
echo "Next Steps:"
echo "  1. Review generated files"
echo "  2. Update docker-compose.production.yml manually"
echo "  3. Run: ./scripts/build-services.sh"
echo "  4. Test locally with docker-compose up"
echo ""
echo "Remaining tasks (14-19) require:"
echo "  - M&A workflow piece development (complex, ~3-5 days)"
echo "  - End-to-end testing (manual validation)"
echo ""
EOF

chmod +x scripts/complete-foss-adaptation.sh
success "Automation script created"

echo ""
echo "Run the automation script:"
echo "  ./scripts/complete-foss-adaptation.sh"

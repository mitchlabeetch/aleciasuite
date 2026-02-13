#!/bin/bash
set -e

echo "# Alecia Suite - Production Environment Variables" > .env
echo "# Generated: $(date)" >> .env
echo "" >> .env

echo "Generating secrets..."

# Infrastructure
echo "# ============================================" >> .env
echo "# INFRASTRUCTURE" >> .env
echo "# ============================================" >> .env
echo "POSTGRES_PASSWORD=$(openssl rand -hex 32)" >> .env
echo "REDIS_PASSWORD=$(openssl rand -hex 32)" >> .env
echo "MINIO_ROOT_USER=alecia" >> .env
echo "MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)" >> .env
echo "" >> .env

# Authentication
echo "# ============================================" >> .env
echo "# AUTHENTICATION" >> .env
echo "# ============================================" >> .env
echo "NEXTAUTH_SECRET=$(openssl rand -hex 32)" >> .env
echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" >> .env
echo "" >> .env

# Strapi
echo "# ============================================" >> .env
echo "# STRAPI CMS" >> .env
echo "# ============================================" >> .env
echo "STRAPI_JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "STRAPI_ADMIN_JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "STRAPI_APP_KEYS=$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32),$(openssl rand -base64 32)" >> .env
echo "STRAPI_API_TOKEN_SALT=$(openssl rand -base64 32)" >> .env
echo "" >> .env

# Activepieces
echo "# ============================================" >> .env
echo "# ACTIVEPIECES" >> .env
echo "# ============================================" >> .env
echo "AP_ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
echo "AP_JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "" >> .env

# Other services
echo "# ============================================" >> .env
echo "# SERVICES" >> .env
echo "# ============================================" >> .env
echo "PLAUSIBLE_SECRET_KEY_BASE=$(openssl rand -base64 64)" >> .env
echo "MINIFLUX_ADMIN_USERNAME=admin" >> .env
echo "MINIFLUX_ADMIN_PASSWORD=$(openssl rand -base64 16)" >> .env
echo "DOCUSEAL_SECRET_KEY_BASE=$(openssl rand -hex 64)" >> .env
echo "VAULTWARDEN_ADMIN_TOKEN=$(openssl rand -base64 32)" >> .env
echo "STIRLING_USERNAME=admin" >> .env
echo "STIRLING_PASSWORD=$(openssl rand -base64 16)" >> .env
echo "" >> .env

# OVH DNS (user needs to fill these)
echo "# ============================================" >> .env
echo "# OVH DNS CREDENTIALS (FILL THESE MANUALLY)" >> .env
echo "# ============================================" >> .env
echo "OVH_ENDPOINT=ovh-eu" >> .env
echo "OVH_APPLICATION_KEY=" >> .env
echo "OVH_APPLICATION_SECRET=" >> .env
echo "OVH_CONSUMER_KEY=" >> .env

echo "✅ Generated .env file"
echo "⚠️  IMPORTANT: Edit .env and add your OVH DNS credentials"
echo "📝 Keep .env.backup safe - it contains all your secrets!"

cp .env .env.backup
chmod 600 .env .env.backup

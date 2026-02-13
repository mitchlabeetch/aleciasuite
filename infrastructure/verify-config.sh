#!/bin/bash
# infrastructure/verify-config.sh
# Verification script for infrastructure configuration readiness

set -e

echo "=========================================="
echo "Infrastructure Configuration Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((ERRORS++))
        return 1
    fi
}

check_secret() {
    local file=$1
    local pattern=$2
    local name=$3

    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo -e "${RED}✗${NC} Placeholder found in $file: $name"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓${NC} Secret configured: $name"
        return 0
    fi
}

check_secret_set() {
    local file=$1
    local key=$2
    local name=$3

    if grep -q "^${key}=.\+" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Secret set: $name"
        return 0
    else
        echo -e "${RED}✗${NC} Secret not set: $name in $file"
        ((ERRORS++))
        return 1
    fi
}

warn_env_var() {
    local var=$1
    local service=$2
    echo -e "${YELLOW}⚠${NC}  Environment variable required for $service: $var"
    ((WARNINGS++))
}

echo "1. Checking Plausible Configuration..."
echo "---------------------------------------"
check_file "infrastructure/plausible/plausible-conf.env"
check_file "infrastructure/plausible/custom_head.html"
check_secret_set "infrastructure/plausible/plausible-conf.env" "SECRET_KEY_BASE" "Plausible SECRET_KEY_BASE"
warn_env_var "PLAUSIBLE_PG_PASSWORD" "Plausible"
echo ""

echo "2. Checking SearXNG Configuration..."
echo "---------------------------------------"
check_file "infrastructure/searxng/settings.yml"
check_secret "infrastructure/searxng/settings.yml" "<generate with:" "SearXNG secret_key"
echo ""

echo "3. Checking Vaultwarden Configuration..."
echo "---------------------------------------"
check_file "infrastructure/vaultwarden/.env.example"
warn_env_var "VAULTWARDEN_ADMIN_TOKEN" "Vaultwarden"
echo ""

echo "4. Checking Miniflux Configuration..."
echo "---------------------------------------"
check_file "infrastructure/miniflux/opml-feeds.xml"
warn_env_var "MINIFLUX_ADMIN_USER" "Miniflux"
warn_env_var "MINIFLUX_ADMIN_PASSWORD" "Miniflux"

# Count feeds in OPML
if [ -f "infrastructure/miniflux/opml-feeds.xml" ]; then
    FEED_COUNT=$(grep -c 'type="rss"' infrastructure/miniflux/opml-feeds.xml || echo "0")
    echo -e "${GREEN}✓${NC} OPML contains $FEED_COUNT RSS feeds"
fi
echo ""

echo "5. Checking Flowchart Configuration..."
echo "---------------------------------------"
if grep -q "Using external service" "infrastructure/flowchart/docker-compose.yml" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Flowchart.fun configured as external service"
else
    echo -e "${YELLOW}⚠${NC}  Flowchart.fun configuration unclear"
    ((WARNINGS++))
fi
echo ""

echo "6. Checking Caddy Configuration..."
echo "---------------------------------------"
check_file "infrastructure/caddy/Caddyfile"
if grep -q "REQUIRED OVH API CREDENTIALS" "infrastructure/caddy/Caddyfile" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} OVH DNS documentation present"
else
    echo -e "${YELLOW}⚠${NC}  OVH DNS documentation missing"
    ((WARNINGS++))
fi
warn_env_var "OVH_ENDPOINT" "Caddy/TLS"
warn_env_var "OVH_APPLICATION_KEY" "Caddy/TLS"
warn_env_var "OVH_APPLICATION_SECRET" "Caddy/TLS"
warn_env_var "OVH_CONSUMER_KEY" "Caddy/TLS"
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical configurations are present!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set required environment variables (see warnings above)"
    echo "2. Replace dev secrets with production values for deployment"
    echo "3. Configure OVH API credentials"
    echo "4. Test locally: docker-compose up -d"
    exit 0
else
    echo -e "${RED}✗ Configuration errors found. Please fix before deployment.${NC}"
    exit 1
fi

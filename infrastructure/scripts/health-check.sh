#!/bin/bash
# infrastructure/scripts/health-check.sh
# Alecia Suite — Infrastructure Health Check
set -e
echo "=== Alecia Suite — Infrastructure Health Check ==="
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

check() {
    local name=$1 cmd=$2
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
    else
        echo -e "${RED}✗${NC} $name"
    fi
}

check "PostgreSQL" "docker exec alecia-postgres pg_isready -U alecia"
check "Redis" "docker exec alecia-redis redis-cli ping"
check "Minio" "curl -sf https://s3.alecia.fr/minio/health/live"
check "Vaultwarden" "curl -sf https://vault.alecia.fr"
check "Caddy TLS" "curl -sf https://alecia.fr"
check "Plausible" "curl -sf https://analytics.alecia.fr"
check "Miniflux" "curl -sf https://feeds.alecia.fr"
check "SearXNG" "curl -sf https://search.alecia.fr"
check "Stirling-PDF" "curl -sf https://docs.alecia.fr"
check "Gotenberg" "curl -sf https://pdf.alecia.fr/health"
check "Flowchart" "curl -sf https://diagrams.alecia.fr"
check "Activepieces" "curl -sf https://flows.alecia.fr"
check "DocuSeal" "curl -sf https://sign.alecia.fr"
check "Hocuspocus" "curl -sf https://ws.alecia.fr"
check "Strapi CMS" "curl -sf https://cms.alecia.fr"
check "Haystack" "curl -sf https://haystack.alecia.fr"
echo "=== Done ==="

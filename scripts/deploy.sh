#!/bin/bash
# scripts/deploy.sh
# Deploy Alecia Suite to OVH VPS via SSH
#
# This script:
# 1. SSHs into the OVH VPS
# 2. Pulls latest Docker images from registry
# 3. Runs docker compose up with zero-downtime rolling restart
#
# Prerequisites:
# - SSH key configured for passwordless access to VPS
# - Docker and docker-compose installed on VPS
# - docker-compose.production.yml deployed to VPS
#
# Usage:
#   ./scripts/deploy.sh [TAG]
#
# Environment variables:
#   VPS_HOST        - VPS hostname or IP (default: vps.alecia.fr)
#   VPS_USER        - SSH user (default: alecia)
#   VPS_DEPLOY_PATH - Deployment directory on VPS (default: /opt/alecia)
#   DOCKER_REGISTRY - Docker registry URL (default: ghcr.io/alecia)
#   BUILD_TAG       - Image tag to deploy (default: latest)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="${VPS_HOST:-vps.alecia.fr}"
VPS_USER="${VPS_USER:-alecia}"
VPS_DEPLOY_PATH="${VPS_DEPLOY_PATH:-/opt/alecia}"
REGISTRY="${DOCKER_REGISTRY:-ghcr.io/alecia}"
TAG="${BUILD_TAG:-${1:-latest}}"

echo -e "${BLUE}=== Alecia Suite Deployment ===${NC}"
echo -e "${BLUE}VPS Host:      ${NC}${VPS_HOST}"
echo -e "${BLUE}VPS User:      ${NC}${VPS_USER}"
echo -e "${BLUE}Deploy Path:   ${NC}${VPS_DEPLOY_PATH}"
echo -e "${BLUE}Registry:      ${NC}${REGISTRY}"
echo -e "${BLUE}Tag:           ${NC}${TAG}"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 "${VPS_USER}@${VPS_HOST}" "echo 'SSH connection successful'"; then
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo -e "${YELLOW}Please ensure:${NC}"
    echo -e "  1. VPS_HOST is correct: ${VPS_HOST}"
    echo -e "  2. VPS_USER has access: ${VPS_USER}"
    echo -e "  3. SSH key is configured"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

# Deploy via SSH
echo -e "${YELLOW}Deploying to VPS...${NC}"

ssh "${VPS_USER}@${VPS_HOST}" bash <<EOF
set -euo pipefail

echo -e "${BLUE}Navigating to deployment directory...${NC}"
cd ${VPS_DEPLOY_PATH}

echo -e "${BLUE}Pulling Docker images...${NC}"
docker pull ${REGISTRY}/alecia-website:${TAG}
docker pull ${REGISTRY}/alecia-colab:${TAG}
docker pull ${REGISTRY}/alecia-cms:${TAG}
docker pull ${REGISTRY}/alecia-flows:${TAG}
docker pull ${REGISTRY}/alecia-caddy:${TAG}

echo -e "${BLUE}Updating docker-compose configuration...${NC}"
export IMAGE_TAG=${TAG}

echo -e "${BLUE}Deploying services with zero-downtime restart...${NC}"
docker compose -f docker-compose.production.yml up -d --no-deps --build \
    next-marketing \
    next-colab \
    strapi \
    activepieces-app \
    caddy

echo -e "${GREEN}✓ Deployment complete${NC}"

echo -e "${BLUE}Service status:${NC}"
docker compose -f docker-compose.production.yml ps

echo -e "${BLUE}Health checks:${NC}"
docker compose -f docker-compose.production.yml ps --format json | jq -r '.[] | select(.Health != "") | "\(.Name): \(.Health)"'
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=== Deployment Successful ===${NC}"
    echo -e "${GREEN}Alecia Suite ${TAG} is now live!${NC}"
    echo ""
    echo -e "${BLUE}Services:${NC}"
    echo -e "  Website:    https://alecia.fr"
    echo -e "  Colab:      https://colab.alecia.fr"
    echo -e "  CMS:        https://cms.alecia.fr"
    echo -e "  Flows:      https://flows.alecia.fr"
    echo -e "  Analytics:  https://analytics.alecia.fr"
    echo ""
    echo -e "${YELLOW}To view logs:${NC}"
    echo -e "  ssh ${VPS_USER}@${VPS_HOST} 'cd ${VPS_DEPLOY_PATH} && docker compose -f docker-compose.production.yml logs -f [service]'"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

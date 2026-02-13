#!/bin/bash
# scripts/push-all.sh
# Push all Docker images to registry
#
# Usage:
#   ./scripts/push-all.sh [TAG]
#
# Environment variables:
#   DOCKER_REGISTRY - Docker registry URL (default: ghcr.io/alecia)
#   BUILD_TAG       - Image tag (default: latest)

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io/alecia}"
TAG="${BUILD_TAG:-${1:-latest}}"

echo -e "${BLUE}=== Pushing Alecia Suite Images ===${NC}"
echo -e "${BLUE}Registry: ${NC}${REGISTRY}"
echo -e "${BLUE}Tag:      ${NC}${TAG}"
echo ""

# List of images to push
IMAGES=(
    "alecia-website"
    "alecia-colab"
    "alecia-cms"
    "alecia-flows"
    "alecia-caddy"
)

# Push each image
for image in "${IMAGES[@]}"; do
    echo -e "${YELLOW}Pushing ${image}:${TAG}...${NC}"
    docker push "${REGISTRY}/${image}:${TAG}"
    echo -e "${GREEN}✓ Pushed ${REGISTRY}/${image}:${TAG}${NC}"
    echo ""
done

echo -e "${GREEN}=== All images pushed successfully! ===${NC}"

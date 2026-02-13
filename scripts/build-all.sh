#!/bin/bash
# scripts/build-all.sh
# Build all Docker images for Alecia Suite
#
# This script builds custom Docker images for:
# - Next.js apps (website, colab)
# - Strapi CMS
# - Activepieces with custom pieces
# - Caddy reverse proxy with OVH DNS plugin
#
# Usage:
#   ./scripts/build-all.sh [TAG]
#
# Environment variables:
#   DOCKER_REGISTRY - Docker registry URL (default: ghcr.io/alecia)
#   BUILD_TAG       - Image tag (default: latest)
#   DOCKER_PLATFORM - Target platform (default: linux/amd64)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGISTRY="${DOCKER_REGISTRY:-ghcr.io/alecia}"
TAG="${BUILD_TAG:-${1:-latest}}"
PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${BLUE}=== Alecia Suite Docker Build ===${NC}"
echo -e "${BLUE}Registry:  ${NC}${REGISTRY}"
echo -e "${BLUE}Tag:       ${NC}${TAG}"
echo -e "${BLUE}Platform:  ${NC}${PLATFORM}"
echo -e "${BLUE}Root:      ${NC}${PROJECT_ROOT}"
echo ""

# Function to build an image
build_image() {
    local name=$1
    local dockerfile=$2
    local context=$3
    local image="${REGISTRY}/${name}:${TAG}"

    echo -e "${YELLOW}Building ${name}...${NC}"

    # Build with BuildKit for better performance
    DOCKER_BUILDKIT=1 docker build \
        --platform="${PLATFORM}" \
        --file="${PROJECT_ROOT}/${dockerfile}" \
        --tag="${image}" \
        --progress=plain \
        "${PROJECT_ROOT}/${context}" 2>&1 | grep -v "^#"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Built ${image}${NC}"
        echo ""
    else
        echo -e "${RED}✗ Failed to build ${name}${NC}"
        exit 1
    fi
}

# Build all images
# Note: Docker context is the project root to access pnpm workspace

echo -e "${BLUE}Building Next.js applications...${NC}"
build_image "alecia-website" "apps/website/Dockerfile" "."
build_image "alecia-colab" "apps/colab/Dockerfile" "."

echo -e "${BLUE}Building backend services...${NC}"
build_image "alecia-cms" "services/cms/Dockerfile" "services/cms"
build_image "alecia-flows" "services/flows/Dockerfile" "."

echo -e "${BLUE}Building infrastructure services...${NC}"
build_image "alecia-caddy" "infrastructure/caddy/Dockerfile" "."

# Summary
echo -e "${GREEN}=== Build Complete ===${NC}"
echo -e "${GREEN}All images built successfully!${NC}"
echo ""
echo -e "${BLUE}Built images:${NC}"
docker images "${REGISTRY}/*:${TAG}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedSince}}"
echo ""
echo -e "${YELLOW}To push images to registry:${NC}"
echo -e "  docker push ${REGISTRY}/alecia-website:${TAG}"
echo -e "  docker push ${REGISTRY}/alecia-colab:${TAG}"
echo -e "  docker push ${REGISTRY}/alecia-cms:${TAG}"
echo -e "  docker push ${REGISTRY}/alecia-flows:${TAG}"
echo -e "  docker push ${REGISTRY}/alecia-caddy:${TAG}"
echo ""
echo -e "${YELLOW}Or push all at once:${NC}"
echo -e "  ./scripts/push-all.sh ${TAG}"

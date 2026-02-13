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

# Strapi CMS (build context = services/cms/)
echo "Building Alecia CMS (Strapi)..."
docker build -t ${REGISTRY}/alecia-cms:${TAG} -t ${REGISTRY}/alecia-cms:${GIT_SHA} services/cms/
echo "✓ Alecia CMS built"

# Activepieces Flows (build context = services/ to include flows-pieces/)
echo "Building Alecia Flows (Activepieces)..."
docker build -f services/flows/Dockerfile -t ${REGISTRY}/alecia-flows:${TAG} -t ${REGISTRY}/alecia-flows:${GIT_SHA} services/
echo "✓ Alecia Flows built"

echo ""
echo "All service images built successfully!"
echo ""
docker images --filter "reference=${REGISTRY}/*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""
echo "To push to registry:"
echo "  docker push ${REGISTRY}/alecia-cms:${TAG}"
echo "  docker push ${REGISTRY}/alecia-flows:${TAG}"

#!/bin/bash
set -e

echo "🧪 Testing Docker builds for all custom services..."

SERVICES=(
    "apps/website/Dockerfile:alecia/website"
    "apps/colab/Dockerfile:alecia/colab"
    "services/hocuspocus/Dockerfile:alecia/hocuspocus"
    "services/cms/Dockerfile:alecia/cms"
    "services/flows/Dockerfile:alecia/flows"
    "infrastructure/caddy/Dockerfile:alecia/caddy"
)

FAILED=0

for SERVICE in "${SERVICES[@]}"; do
    IFS=':' read -r DOCKERFILE IMAGE <<< "$SERVICE"
    echo ""
    echo "Building $IMAGE from $DOCKERFILE..."
    
    if docker build -f "$DOCKERFILE" -t "$IMAGE:test" . --no-cache; then
        echo "✅ $IMAGE built successfully"
    else
        echo "❌ $IMAGE build failed"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
if [ $FAILED -eq 0 ]; then
    echo "🎉 All builds successful!"
    exit 0
else
    echo "❌ $FAILED build(s) failed"
    exit 1
fi
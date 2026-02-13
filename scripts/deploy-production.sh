#!/bin/bash
set -e

echo "🚀 Deploying Alecia Suite to Production"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Run: ./scripts/generate-secrets.sh"
    exit 1
fi

# Build custom Docker images
echo "📦 Building Docker images..."
docker compose -f docker-compose.production.yml build

# Start infrastructure services first
echo "🔧 Starting infrastructure services..."
docker compose -f docker-compose.production.yml up -d postgres redis minio

# Wait for health checks with polling
echo "⏳ Waiting for services to be healthy..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    UNHEALTHY=$(docker compose -f docker-compose.production.yml ps --format json | grep -E "(postgres|redis|minio)" | grep -v "\"Health\":\"healthy\"" | wc -l)
    if [ "$UNHEALTHY" -eq 0 ]; then
        echo "✅ All infrastructure services are healthy"
        break
    fi
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    echo "Waiting... ($ELAPSED/${MAX_WAIT}s)"
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "⚠️  Warning: Timeout waiting for services. Continuing anyway..."
fi

# Create Minio buckets
echo "📁 Creating S3 buckets..."
# Source the .env file to get credentials
set -a
source .env
set +a

docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@alecia-minio:9000 \
    minio/mc mb alecia/alecia-storage --ignore-existing

docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@alecia-minio:9000 \
    minio/mc mb alecia/strapi-uploads --ignore-existing

docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@alecia-minio:9000 \
    minio/mc mb alecia/alecia-sign --ignore-existing

# Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.production.yml up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status with: docker compose -f docker-compose.production.yml ps"
echo "📝 View logs with: docker compose -f docker-compose.production.yml logs -f"

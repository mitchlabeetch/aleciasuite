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

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Create Minio buckets
echo "📁 Creating S3 buckets..."
docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://$(grep MINIO_ROOT_USER .env | cut -d '=' -f2):$(grep MINIO_ROOT_PASSWORD .env | cut -d '=' -f2)@alecia-minio:9000 \
    minio/mc mb alecia/alecia-storage --ignore-existing

docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://$(grep MINIO_ROOT_USER .env | cut -d '=' -f2):$(grep MINIO_ROOT_PASSWORD .env | cut -d '=' -f2)@alecia-minio:9000 \
    minio/mc mb alecia/strapi-uploads --ignore-existing

docker run --rm --network alecia-network \
    -e MC_HOST_alecia=http://$(grep MINIO_ROOT_USER .env | cut -d '=' -f2):$(grep MINIO_ROOT_PASSWORD .env | cut -d '=' -f2)@alecia-minio:9000 \
    minio/mc mb alecia/alecia-sign --ignore-existing

# Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.production.yml up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status with: docker compose -f docker-compose.production.yml ps"
echo "📝 View logs with: docker compose -f docker-compose.production.yml logs -f"

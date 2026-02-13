# Docker Build and Deployment Guide

This guide covers building, deploying, and managing Docker images for the Alecia Suite.

## Overview

The Alecia Suite consists of 5 custom Docker images:

1. **alecia-website** - Next.js marketing site (alecia.fr)
2. **alecia-colab** - Next.js collaboration app (colab.alecia.fr)
3. **alecia-cms** - Strapi headless CMS (cms.alecia.fr)
4. **alecia-flows** - Activepieces with custom M&A automation pieces (flows.alecia.fr)
5. **alecia-caddy** - Caddy reverse proxy with OVH DNS plugin for wildcard TLS

## Project Structure

```
alepanel/
├── apps/
│   ├── website/Dockerfile          # Next.js standalone build
│   └── colab/Dockerfile            # Next.js standalone build
├── services/
│   ├── cms/Dockerfile              # Strapi CE
│   └── flows/Dockerfile            # Activepieces + custom pieces
├── infrastructure/
│   └── caddy/Dockerfile            # Caddy + OVH DNS plugin
├── scripts/
│   ├── build-all.sh                # Build all images
│   ├── push-all.sh                 # Push all images to registry
│   └── deploy.sh                   # Deploy to VPS via SSH
└── .github/workflows/
    └── build-and-deploy.yml        # CI/CD pipeline
```

## Prerequisites

### Local Development
- Docker 20.10+
- Docker Buildx
- pnpm 10+
- Node.js 20+

### Production Deployment
- OVH VPS with Docker installed
- SSH access to VPS
- GitHub Container Registry access
- OVH API credentials for DNS-01 challenge

## Building Images Locally

### Build all images at once

```bash
./scripts/build-all.sh
```

This builds:
- `ghcr.io/alecia/alecia-website:latest`
- `ghcr.io/alecia/alecia-colab:latest`
- `ghcr.io/alecia/alecia-cms:latest`
- `ghcr.io/alecia/alecia-flows:latest`
- `ghcr.io/alecia/alecia-caddy:latest`

### Build with custom tag

```bash
./scripts/build-all.sh v1.2.3
```

### Build individual images

```bash
# Website
docker build -f apps/website/Dockerfile -t ghcr.io/alecia/alecia-website:latest .

# Colab
docker build -f apps/colab/Dockerfile -t ghcr.io/alecia/alecia-colab:latest .

# CMS
docker build -f services/cms/Dockerfile -t ghcr.io/alecia/alecia-cms:latest services/cms

# Flows
docker build -f services/flows/Dockerfile -t ghcr.io/alecia/alecia-flows:latest .

# Caddy
docker build -f infrastructure/caddy/Dockerfile -t ghcr.io/alecia/alecia-caddy:latest .
```

## Pushing to Registry

### Login to GitHub Container Registry

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u <username> --password-stdin
```

### Push all images

```bash
./scripts/push-all.sh
```

### Push individual images

```bash
docker push ghcr.io/alecia/alecia-website:latest
```

## Manual Deployment to VPS

### Prerequisites

1. Set up SSH key for VPS access
2. Configure environment variables:

```bash
export VPS_HOST="vps.alecia.fr"
export VPS_USER="alecia"
export VPS_DEPLOY_PATH="/opt/alecia"
```

### Deploy

```bash
./scripts/deploy.sh
```

This will:
1. SSH into the VPS
2. Pull latest images from registry
3. Run `docker compose up -d` with zero-downtime restart
4. Display service health status

## Automated CI/CD Pipeline

### Triggers

The GitHub Actions workflow (`.github/workflows/build-and-deploy.yml`) runs on:

- **Push to main**: Builds all images, pushes to registry, and deploys to production
- **Pull request**: Builds images only (no deployment)
- **Manual workflow dispatch**: Optional deployment toggle

### Workflow Jobs

1. **build** - Builds all 5 Docker images in parallel using matrix strategy
2. **deploy** - Deploys to production VPS (main branch only)
3. **cleanup** - Removes old images from registry (keeps last 5, 7 days retention)

### Required GitHub Secrets

Configure these in your GitHub repository settings:

```
VPS_SSH_KEY          # Private SSH key for VPS access
VPS_HOST             # VPS hostname or IP (e.g., vps.alecia.fr)
VPS_USER             # SSH username (e.g., alecia)
VPS_DEPLOY_PATH      # Deployment directory (e.g., /opt/alecia)
```

### Deployment Summary

After each deployment, the workflow creates a summary showing:
- Deployed image tags
- Service URLs
- Commit SHA
- Deployment timestamp

## VPS Setup

### 1. Initial VPS Configuration

```bash
# SSH into VPS
ssh alecia@vps.alecia.fr

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker alecia

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Create deployment directory
sudo mkdir -p /opt/alecia
sudo chown alecia:alecia /opt/alecia
```

### 2. Deploy docker-compose.production.yml

```bash
# On VPS
cd /opt/alecia

# Create docker-compose.production.yml
# See infrastructure/docker-compose.production.yml for reference
```

### 3. Configure environment variables

```bash
# On VPS
cd /opt/alecia

# Create .env file with required secrets
cat > .env << EOF
POSTGRES_PASSWORD=<secure-password>
REDIS_PASSWORD=<secure-password>
AP_ENCRYPTION_KEY=<32-char-key>
AP_JWT_SECRET=<secure-secret>
OVH_ENDPOINT=ovh-eu
OVH_APPLICATION_KEY=<ovh-api-key>
OVH_APPLICATION_SECRET=<ovh-api-secret>
OVH_CONSUMER_KEY=<ovh-consumer-key>
EOF

chmod 600 .env
```

### 4. Start services

```bash
docker compose -f docker-compose.production.yml up -d
```

## Monorepo Docker Build Considerations

### Context is Project Root

For Next.js apps (website, colab), the Docker context MUST be the repository root (`.`) to access pnpm workspace packages:

```dockerfile
# Correct
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/website/package.json apps/website/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
```

### Standalone Output

Both Next.js apps use `output: "standalone"` in `next.config.ts`, which:
- Bundles only production dependencies
- Reduces final image size by ~50%
- Includes a minimal Node.js server

### Multi-stage Builds

All images use multi-stage builds for optimization:
1. **deps** - Install dependencies
2. **builder** - Build the application
3. **runner** - Minimal production runtime

## Troubleshooting

### Build failures

```bash
# Check Docker Buildx
docker buildx version

# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with verbose output
docker build --progress=plain ...
```

### SSH deployment failures

```bash
# Test SSH connection
ssh -v alecia@vps.alecia.fr

# Check SSH key
ssh-add -l

# Test deployment script
VPS_HOST=vps.alecia.fr ./scripts/deploy.sh
```

### Image size optimization

```bash
# Check image sizes
docker images ghcr.io/alecia/*

# Analyze layers
docker history ghcr.io/alecia/alecia-website:latest

# Use dive for interactive analysis
docker run --rm -it -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive:latest ghcr.io/alecia/alecia-website:latest
```

## Security Best Practices

1. **Never commit secrets** to Dockerfiles or scripts
2. **Use multi-stage builds** to minimize attack surface
3. **Run as non-root user** in production images
4. **Scan images** for vulnerabilities regularly
5. **Keep base images updated** (node:20-alpine, caddy:2-alpine)

## Performance Optimization

1. **Layer caching** - Order Dockerfile commands from least to most frequently changed
2. **BuildKit cache** - Use `--cache-from` and `--cache-to` in CI
3. **Parallel builds** - GitHub Actions matrix strategy builds 5 images concurrently
4. **Registry mirrors** - Consider using a pull-through cache

## Monitoring

### View logs on VPS

```bash
ssh alecia@vps.alecia.fr

cd /opt/alecia
docker compose -f docker-compose.production.yml logs -f [service]
```

### Health checks

```bash
# All services
docker compose -f docker-compose.production.yml ps

# Specific service health
docker inspect --format='{{.State.Health.Status}}' alecia-website
```

## Rollback

### To previous version

```bash
ssh alecia@vps.alecia.fr

cd /opt/alecia

# Pull previous tag
docker pull ghcr.io/alecia/alecia-website:<previous-sha>

# Update and restart
docker compose -f docker-compose.production.yml up -d --no-deps next-marketing
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Caddy DNS Plugin](https://caddyserver.com/docs/modules/dns.providers.ovh)
- [Activepieces Self-hosting](https://www.activepieces.com/docs/install/self-host)
- [Strapi Docker Guide](https://docs.strapi.io/dev-docs/installation/docker)

## Support

For issues or questions:
- Check existing Dockerfiles for reference
- Review CI/CD workflow logs in GitHub Actions
- SSH into VPS and check container logs
- Consult deployment documentation in `docs/plans/`

# Alecia Suite - Quick Deployment Guide

## Prerequisites

- Fresh Ubuntu 24.04 VPS (minimum 8 vCPU, 32GB RAM, 500GB SSD)
- Root or sudo access
- Domain DNS configured (A records for alecia.markets and *.alecia.markets)
- OVH DNS API credentials

## Step 1: Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

## Step 2: Clone Repository

```bash
git clone https://github.com/mitchlabeetch/aleciasuite.git
cd aleciasuite
```

## Step 3: Generate Secrets

```bash
chmod +x scripts/*.sh
./scripts/generate-secrets.sh
```

Edit `.env` and add your OVH credentials.

## Step 4: Deploy

```bash
./scripts/deploy-production.sh
```

## Step 5: Verify

```bash
docker compose -f docker-compose.production.yml ps
```

All services should show "Up (healthy)".

## Access Your Services

- https://alecia.markets - Main website
- https://colab.alecia.markets - Collaboration
- https://cms.alecia.markets/admin - Strapi (create admin on first visit)
- https://flows.alecia.markets - Activepieces (create admin)
- https://analytics.alecia.markets - Plausible
- https://sign.alecia.markets - DocuSeal
- https://feeds.alecia.markets - Miniflux (admin / password from .env)
- https://vault.alecia.markets - Vaultwarden
- https://docs.alecia.markets - Stirling-PDF
- https://s3.alecia.markets - Minio console

## Troubleshooting

View logs:
```bash
docker compose -f docker-compose.production.yml logs -f [service-name]
```

Restart a service:
```bash
docker compose -f docker-compose.production.yml restart [service-name]
```

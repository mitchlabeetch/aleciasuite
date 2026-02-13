#!/bin/bash
# Alecia Suite Production Deployment Script
# Target: OVH VPS (Ubuntu 24.04 LTS)
# Deploys via Coolify for simplified management

set -e

VPS_HOST="${VPS_HOST:-51.255.194.94}"
VPS_USER="${VPS_USER:-ubuntu}"
DOMAIN="${DOMAIN:-alecia.fr}"

echo "=========================================="
echo "Alecia Suite Production Deployment"
echo "=========================================="
echo "Target: $VPS_USER@$VPS_HOST"
echo "Domain: $DOMAIN"
echo ""

# Step 1: Install Docker
echo "Step 1/5: Installing Docker..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH1'
  set -e

  # Update system
  sudo apt-get update
  sudo apt-get upgrade -y

  # Install Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER

  # Install Docker Compose
  sudo apt-get install -y docker-compose-plugin

  # Verify
  docker --version
  docker compose version

  echo "✓ Docker installed successfully"
ENDSSH1

# Step 2: Install Coolify
echo ""
echo "Step 2/5: Installing Coolify..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH2'
  set -e

  # Install Coolify
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

  echo "✓ Coolify installed successfully"
  echo "Access Coolify at: http://$VPS_HOST:8000"
ENDSSH2

# Step 3: Configure firewall
echo ""
echo "Step 3/5: Configuring firewall..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH3'
  set -e

  # Install and configure UFW
  sudo apt-get install -y ufw
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw allow 8000/tcp  # Coolify UI
  sudo ufw --force enable

  echo "✓ Firewall configured"
ENDSSH3

# Step 4: Upload docker-compose files
echo ""
echo "Step 4/5: Uploading configuration..."
scp -r docker-compose.production.yml $VPS_USER@$VPS_HOST:~/alecia/
scp -r infrastructure/ $VPS_USER@$VPS_HOST:~/alecia/
scp -r services/ $VPS_USER@$VPS_HOST:~/alecia/

# Step 5: Create DNS records reminder
echo ""
echo "Step 5/5: DNS Configuration Required"
echo "=========================================="
echo "Please create the following DNS A records pointing to $VPS_HOST:"
echo ""
echo "  alecia.fr                  → $VPS_HOST"
echo "  *.alecia.fr                → $VPS_HOST"
echo ""
echo "Or individual subdomains:"
echo "  app.alecia.fr              → $VPS_HOST"
echo "  cms.alecia.fr              → $VPS_HOST"
echo "  flows.alecia.fr            → $VPS_HOST"
echo "  sign.alecia.fr             → $VPS_HOST"
echo "  analytics.alecia.fr        → $VPS_HOST"
echo "  storage.alecia.fr          → $VPS_HOST"
echo "  colab.alecia.fr            → $VPS_HOST"
echo ""
echo "=========================================="
echo ""
echo "Deployment Summary:"
echo "  • Docker installed: ✓"
echo "  • Coolify installed: ✓"
echo "  • Firewall configured: ✓"
echo "  • Files uploaded: ✓"
echo ""
echo "Next steps:"
echo "  1. Configure DNS records (above)"
echo "  2. Access Coolify: http://$VPS_HOST:8000"
echo "  3. Create a new project in Coolify"
echo "  4. Deploy docker-compose.production.yml"
echo "  5. Configure SSL certificates (Coolify handles this)"
echo ""
echo "Manual deployment (without Coolify):"
echo "  ssh $VPS_USER@$VPS_HOST"
echo "  cd ~/alecia"
echo "  docker compose -f docker-compose.production.yml up -d"
echo ""

#!/bin/bash
# Alecia Suite - Full Self-Hosted Deployment
# Uploads codebase and builds custom Docker images on VPS

set -e

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PASS="0akNPw8LUX6RN8pC"
LOCAL_PATH="/Users/utilisateur/Desktop/alepanel"

echo "=========================================="
echo "Alecia Suite - Self-Hosted Deployment"
echo "=========================================="
echo ""
echo "Step 1/3: Uploading codebase to VPS..."
echo "  This will take 5-10 minutes depending on your connection"
echo ""

# Use rsync with password authentication via sshpass
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'infrastructure/repos' \
  --exclude 'apps/*/dist' \
  --exclude 'apps/*/.next' \
  --exclude 'services/*/dist' \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$LOCAL_PATH/" "$VPS_USER@$VPS_HOST:~/alecia/" 2>&1

echo ""
echo "✓ Codebase uploaded"
echo ""
echo "Step 2/3: Building custom Docker images on VPS..."
echo "  This will take 20-30 minutes"
echo ""

# Build images on VPS
cat > /tmp/build_on_vps.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 3600

spawn ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect "$ "

puts "\n=== Building Next.js Website ==="
send "cd ~/alecia/apps/website && docker build -t alecia/website:latest . 2>&1 | tail -20\r"
expect "$ " {
    puts "✓ Website built"
}

puts "\n=== Building Next.js Colab ==="
send "cd ~/alecia/apps/colab && docker build -t alecia/colab:latest . 2>&1 | tail -20\r"
expect "$ " {
    puts "✓ Colab built"
}

puts "\n=== Building Strapi CMS with SSO ==="
send "cd ~/alecia/services/cms && docker build -t alecia/cms:latest . 2>&1 | tail -20\r"
expect "$ " {
    puts "✓ CMS built"
}

puts "\n=== Building Activepieces with Custom Pieces ==="
send "cd ~/alecia && docker build -f services/flows/Dockerfile -t alecia/flows:latest services/ 2>&1 | tail -20\r"
expect "$ " {
    puts "✓ Flows built"
}

puts "\n=== Building Hocuspocus Collaboration Server ==="
send "cd ~/alecia/services/hocuspocus && docker build -t alecia/hocuspocus:latest . 2>&1 | tail -20\r"
expect "$ " {
    puts "✓ Hocuspocus built"
}

puts "\n=== Verifying images ==="
send "docker images | grep alecia\r"
expect "$ "

send "exit\r"
expect eof
EOFEXP

chmod +x /tmp/build_on_vps.exp
/tmp/build_on_vps.exp

echo ""
echo "✓ All custom images built"
echo ""
echo "Step 3/3: Starting deployment..."
echo ""

# Deploy with docker-compose
cat > /tmp/deploy.exp << 'EOFEXP2'
#!/usr/bin/expect -f
set timeout 600

spawn ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect "$ "

send "cd ~/alecia && docker compose -f docker-compose.production.yml up -d\r"
expect "$ " {
    puts "\n✓ Alecia Suite deployed"
}

send "docker ps\r"
expect "$ "

send "exit\r"
expect eof
EOFEXP2

chmod +x /tmp/deploy.exp
/tmp/deploy.exp

echo ""
echo "=========================================="
echo "✓ Deployment Complete!"
echo "=========================================="
echo ""
echo "Services running on $VPS_HOST:"
echo "  • PostgreSQL (internal)"
echo "  • Redis (internal)"
echo "  • Minio S3: http://$VPS_HOST:9001"
echo "  • Website: http://$VPS_HOST (port 3000)"
echo "  • Colab: http://$VPS_HOST (port 3001)"
echo "  • CMS: http://$VPS_HOST:1337"
echo "  • Analytics: http://$VPS_HOST:8000"
echo "  • Sign: http://$VPS_HOST:3002"
echo ""
echo "Next: Configure DNS and SSL via Caddy"
echo ""

#!/bin/bash
# Build all Alecia Suite custom Docker images on VPS
# FIXED: Uses correct path ~/alecia/alepanel

set -e

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PASS="0akNPw8LUX6RN8pC"

echo "=========================================="
echo "Alecia Suite - VPS Image Build (Fixed Paths)"
echo "=========================================="
echo ""

# Create expect script for building images
cat > /tmp/build_images_fixed.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 3600

spawn ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect "$ "

puts "\n=== Step 1/6: Verifying directory structure ==="
send "cd ~/alecia/alepanel && ls -la apps/ services/ | head -30\r"
expect "$ "

puts "\n=== Step 2/6: Building Next.js Website ==="
puts "    Estimated time: 5-8 minutes"
send "cd ~/alecia/alepanel/apps/website && docker build -t alecia/website:latest .\r"
expect {
    "Successfully tagged alecia/website:latest" {
        puts "\n✓ Website image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ Website build failed"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ Website build timed out after 60 minutes"
        exit 1
    }
}

puts "\n=== Step 3/6: Building Next.js Colab ==="
puts "    Estimated time: 5-8 minutes"
send "cd ~/alecia/alepanel/apps/colab && docker build -t alecia/colab:latest .\r"
expect {
    "Successfully tagged alecia/colab:latest" {
        puts "\n✓ Colab image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ Colab build failed"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ Colab build timed out"
        exit 1
    }
}

puts "\n=== Step 4/6: Building Strapi CMS with SSO ==="
puts "    Estimated time: 10-15 minutes (heavy dependencies)"
send "cd ~/alecia/alepanel/services/cms && docker build -t alecia/cms:latest .\r"
expect {
    "Successfully tagged alecia/cms:latest" {
        puts "\n✓ CMS image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ CMS build failed"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ CMS build timed out"
        exit 1
    }
}

puts "\n=== Step 5/6: Building Activepieces Flows with Custom Pieces ==="
puts "    Estimated time: 8-12 minutes"
send "cd ~/alecia/alepanel && docker build -f services/flows/Dockerfile -t alecia/flows:latest services/\r"
expect {
    "Successfully tagged alecia/flows:latest" {
        puts "\n✓ Flows image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ Flows build failed"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ Flows build timed out"
        exit 1
    }
}

puts "\n=== Step 6/6: Building Hocuspocus Collaboration Server ==="
puts "    Estimated time: 3-5 minutes"
send "cd ~/alecia/alepanel/services/hocuspocus && docker build -t alecia/hocuspocus:latest .\r"
expect {
    "Successfully tagged alecia/hocuspocus:latest" {
        puts "\n✓ Hocuspocus image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ Hocuspocus build failed"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ Hocuspocus build timed out"
        exit 1
    }
}

puts "\n=== Verifying all images ==="
send "docker images | grep alecia\r"
expect "$ "

puts "\n=== Checking image sizes ==="
send "docker images --format 'table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}' | grep alecia\r"
expect "$ "

puts "\n=== Disk space after builds ==="
send "df -h /\r"
expect "$ "

send "exit\r"
expect eof
EOFEXP

chmod +x /tmp/build_images_fixed.exp

echo "Starting image builds on VPS..."
echo "This will take approximately 30-45 minutes total"
echo ""
echo "Progress will be saved to /tmp/build-images-vps.log"
echo ""

/tmp/build_images_fixed.exp 2>&1 | tee /tmp/build-images-vps.log

echo ""
echo "=========================================="
echo "✓ All Custom Images Built!"
echo "=========================================="
echo ""
echo "Built images:"
echo "  • alecia/website:latest"
echo "  • alecia/colab:latest"
echo "  • alecia/cms:latest"
echo "  • alecia/flows:latest"
echo "  • alecia/hocuspocus:latest"
echo ""
echo "Next step: Deploy with docker-compose.production.yml"
echo ""

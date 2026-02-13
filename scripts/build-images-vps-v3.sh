#!/bin/bash
# Build all Alecia Suite custom Docker images on VPS (FIXED: build from monorepo root)

set -e

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PASS="0akNPw8LUX6RN8pC"

echo "=========================================="
echo "Alecia Suite - VPS Image Build v3"
echo "=========================================="
echo ""

# First upload updated Dockerfiles
echo "Step 1: Uploading corrected Dockerfiles..."

cat > /tmp/upload_dockerfiles_v2.exp << 'EOFUP'
#!/usr/bin/expect -f
set timeout 60

spawn scp -o StrictHostKeyChecking=no /Users/utilisateur/Desktop/alepanel/apps/website/Dockerfile ubuntu@51.255.194.94:~/alecia/alepanel/apps/website/
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect eof
puts "✓ Website Dockerfile"

spawn scp -o StrictHostKeyChecking=no /Users/utilisateur/Desktop/alepanel/apps/colab/Dockerfile ubuntu@51.255.194.94:~/alecia/alepanel/apps/colab/
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect eof
puts "✓ Colab Dockerfile"
EOFUP

chmod +x /tmp/upload_dockerfiles_v2.exp
/tmp/upload_dockerfiles_v2.exp

echo ""
echo "Step 2: Building images from monorepo root..."
echo ""

# Create expect script for building images
cat > /tmp/build_images_v3.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 3600

spawn ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect "$ "

puts "\n=== Building from monorepo root (~/alecia/alepanel) ==="
send "cd ~/alecia/alepanel\r"
expect "$ "

puts "\n=== Step 1/5: Building Next.js Website ==="
puts "    Build command: docker build -f apps/website/Dockerfile -t alecia/website:latest ."
send "docker build -f apps/website/Dockerfile -t alecia/website:latest .\r"
expect {
    "Successfully tagged alecia/website:latest" {
        puts "\n✓ Website image built successfully"
        expect "$ "
    }
    "ERROR" {
        puts "\n✗ Website build failed"
        send "echo '---BUILD FAILED---'\r"
        expect "$ "
        exit 1
    }
    timeout {
        puts "\n✗ Website build timed out"
        exit 1
    }
}

puts "\n=== Step 2/5: Building Next.js Colab ==="
send "docker build -f apps/colab/Dockerfile -t alecia/colab:latest .\r"
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

puts "\n=== Step 3/5: Building Strapi CMS with SSO ==="
send "docker build -f services/cms/Dockerfile -t alecia/cms:latest services/cms/\r"
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

puts "\n=== Step 4/5: Building Activepieces Flows ==="
send "docker build -f services/flows/Dockerfile -t alecia/flows:latest services/\r"
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

puts "\n=== Step 5/5: Building Hocuspocus Server ==="
send "docker build -f services/hocuspocus/Dockerfile -t alecia/hocuspocus:latest services/hocuspocus/\r"
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
send "docker images --format 'table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}' | grep alecia\r"
expect "$ "

puts "\n=== Disk space after builds ==="
send "df -h /\r"
expect "$ "

send "exit\r"
expect eof
EOFEXP

chmod +x /tmp/build_images_v3.exp

echo "Starting image builds on VPS..."
echo "This will take approximately 30-45 minutes total"
echo ""

/tmp/build_images_v3.exp 2>&1 | tee /tmp/build-vps-v3.log

echo ""
echo "=========================================="
echo "✓ All Custom Images Built!"
echo "=========================================="
echo ""
echo "Log saved: /tmp/build-vps-v3.log"
echo ""

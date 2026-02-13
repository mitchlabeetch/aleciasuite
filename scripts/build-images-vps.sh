#!/bin/bash
# Build all Alecia Suite custom Docker images on VPS
# Run after codebase upload is complete

set -e

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PASS="0akNPw8LUX6RN8pC"

echo "=========================================="
echo "Alecia Suite - VPS Image Build"
echo "=========================================="
echo ""

# Create expect script for building images
cat > /tmp/build_images.exp << 'EOFEXP'
#!/usr/bin/expect -f
set timeout 3600

spawn ssh -o StrictHostKeyChecking=no ubuntu@51.255.194.94
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect "$ "

puts "\n=== Step 1/6: Verifying directory structure ==="
send "cd ~/alecia && ls -la | head -20\r"
expect "$ "

puts "\n=== Step 2/6: Building Next.js Website ==="
puts "    Estimated time: 5-8 minutes"
send "cd ~/alecia/apps/website && docker build -t alecia/website:latest . 2>&1 | tail -30\r"
expect {
    "$ " {
        puts "\n✓ Website image built"
    }
    timeout {
        puts "\n✗ Website build timed out"
        exit 1
    }
}

puts "\n=== Step 3/6: Building Next.js Colab ==="
puts "    Estimated time: 5-8 minutes"
send "cd ~/alecia/apps/colab && docker build -t alecia/colab:latest . 2>&1 | tail -30\r"
expect {
    "$ " {
        puts "\n✓ Colab image built"
    }
    timeout {
        puts "\n✗ Colab build timed out"
        exit 1
    }
}

puts "\n=== Step 4/6: Building Strapi CMS with SSO ==="
puts "    Estimated time: 10-15 minutes (heavy dependencies)"
send "cd ~/alecia/services/cms && docker build -t alecia/cms:latest . 2>&1 | tail -30\r"
expect {
    "$ " {
        puts "\n✓ CMS image built"
    }
    timeout {
        puts "\n✗ CMS build timed out"
        exit 1
    }
}

puts "\n=== Step 5/6: Building Activepieces Flows with Custom Pieces ==="
puts "    Estimated time: 8-12 minutes"
send "cd ~/alecia && docker build -f services/flows/Dockerfile -t alecia/flows:latest services/ 2>&1 | tail -30\r"
expect {
    "$ " {
        puts "\n✓ Flows image built"
    }
    timeout {
        puts "\n✗ Flows build timed out"
        exit 1
    }
}

puts "\n=== Step 6/6: Building Hocuspocus Collaboration Server ==="
puts "    Estimated time: 3-5 minutes"
send "cd ~/alecia/services/hocuspocus && docker build -t alecia/hocuspocus:latest . 2>&1 | tail -30\r"
expect {
    "$ " {
        puts "\n✓ Hocuspocus image built"
    }
    timeout {
        puts "\n✗ Hocuspocus build timed out"
        exit 1
    }
}

puts "\n=== Verifying all images ==="
send "docker images | grep alecia\r"
expect "$ "

puts "\n=== Disk space after builds ==="
send "df -h /\r"
expect "$ "

send "exit\r"
expect eof
EOFEXP

chmod +x /tmp/build_images.exp

echo "Starting image builds on VPS..."
echo "This will take approximately 30-45 minutes total"
echo ""

/tmp/build_images.exp

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

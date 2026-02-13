#!/bin/bash
# Quick update: upload only modified Dockerfiles to VPS

set -e

VPS_HOST="51.255.194.94"
VPS_USER="ubuntu"
VPS_PASS="0akNPw8LUX6RN8pC"
LOCAL_PATH="/Users/utilisateur/Desktop/alepanel"

echo "Uploading modified Dockerfiles to VPS..."

# Use sshpass or expect for password auth
cat > /tmp/upload_dockerfiles.exp << 'EOF'
#!/usr/bin/expect -f
set timeout 60

# Website Dockerfile
spawn scp -o StrictHostKeyChecking=no /Users/utilisateur/Desktop/alepanel/apps/website/Dockerfile ubuntu@51.255.194.94:~/alecia/alepanel/apps/website/
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect eof

puts "✓ Website Dockerfile uploaded"

# Colab Dockerfile
spawn scp -o StrictHostKeyChecking=no /Users/utilisateur/Desktop/alepanel/apps/colab/Dockerfile ubuntu@51.255.194.94:~/alecia/alepanel/apps/colab/
expect "password:"
send "0akNPw8LUX6RN8pC\r"
expect eof

puts "✓ Colab Dockerfile uploaded"

puts "\n✓ All Dockerfiles updated on VPS"
EOF

chmod +x /tmp/upload_dockerfiles.exp
/tmp/upload_dockerfiles.exp

echo ""
echo "✓ Dockerfiles updated successfully"
echo "Now rebuilding images on VPS..."

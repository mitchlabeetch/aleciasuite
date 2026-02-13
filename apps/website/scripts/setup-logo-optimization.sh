#!/bin/bash

# Logo Optimization Setup Script
# This installs the required dependencies and runs the optimization

echo "🎨 Setting up Logo Optimization Pipeline"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "public/assets/operations" ]; then
    echo "❌ Error: Must be run from apps/website directory"
    echo "   Usage: cd apps/website && bash scripts/setup-logo-optimization.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm add -D sharp potrace @types/node

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create output directories
echo "📁 Creating output directories..."
mkdir -p public/assets/logos-optimized
mkdir -p public/assets/logo-reports

echo "✅ Directories created"
echo ""

echo "🚀 Ready to optimize logos!"
echo ""
echo "To run the optimization:"
echo "   node scripts/optimize-logos.js"
echo ""
echo "Or add to package.json scripts:"
echo '   "optimize-logos": "node scripts/optimize-logos.js"'
echo ""
echo "Then run:"
echo "   pnpm optimize-logos"

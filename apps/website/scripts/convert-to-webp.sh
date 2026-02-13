#!/bin/bash
# WebP Image Conversion Script for Alecia Website
# This script converts large JPG/PNG images to WebP format for better performance
# Run this from: /Users/utilisateur/Desktop/alepanel/apps/website/public/assets

set -e

echo "🚀 Starting WebP conversion for performance optimization..."
echo ""

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ Error: cwebp not found!"
    echo "Please install libwebp:"
    echo "  macOS: brew install webp"
    echo "  Ubuntu/Debian: sudo apt-get install webp"
    echo "  Windows: Download from https://developers.google.com/speed/webp/download"
    exit 1
fi

# Function to convert images
convert_images() {
    local dir=$1
    local quality=$2
    local pattern=$3

    if [ ! -d "$dir" ]; then
        echo "⚠️  Directory not found: $dir - skipping"
        return
    fi

    echo "📁 Converting images in: $dir"
    local count=0

    cd "$dir"
    for file in $pattern; do
        if [ -f "$file" ]; then
            local base="${file%.*}"
            local webp="${base}.webp"

            # Skip if WebP already exists
            if [ -f "$webp" ]; then
                echo "   ⏭️  Skipping $file (WebP exists)"
                continue
            fi

            echo "   🔄 Converting: $file → $webp"
            cwebp -q "$quality" "$file" -o "$webp" -quiet

            # Get file sizes
            local orig_size=$(du -h "$file" | cut -f1)
            local webp_size=$(du -h "$webp" | cut -f1)
            echo "   ✅ Done: $orig_size → $webp_size"

            ((count++))
        fi
    done
    cd - > /dev/null

    echo "   📊 Converted $count images in $dir"
    echo ""
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../public/assets"

echo "📍 Working directory: $(pwd)"
echo ""

# High Priority: City images (4.3MB → ~860KB)
echo "🏙️  HIGH PRIORITY: Converting city images..."
convert_images "cities" 85 "*.jpg"

# High Priority: Team photos (1.5MB → ~300KB)
echo "👥 HIGH PRIORITY: Converting team photos..."
convert_images "Equipe_Alecia" 85 "*.jpg"
convert_images "Alecia" 85 "MF.jpg GC_1_-_cropped.jpg LP__2__-_cropped.jpg"

# Medium Priority: Operation logos
echo "📊 MEDIUM PRIORITY: Converting operation logos..."
convert_images "operations" 90 "*.png"
convert_images "Operations_alecia" 90 "*.png"

# Summary
echo "✅ WebP conversion completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the website locally to ensure images load correctly"
echo "2. Update image references to use WebP (Next.js Image handles this automatically)"
echo "3. Commit and deploy changes"
echo "4. Run Lighthouse audit to measure improvements"
echo ""
echo "💡 Tip: You can keep the original JPG/PNG files as fallbacks."
echo "    Next.js Image component will serve WebP to supporting browsers automatically."

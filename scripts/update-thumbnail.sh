#!/bin/bash

# Script to update site thumbnail/favicon from source image
# Usage: ./scripts/update-thumbnail.sh <source-image.png>

set -e

SOURCE_IMAGE="$1"
PUBLIC_DIR="public"

if [ -z "$SOURCE_IMAGE" ]; then
  echo "Usage: $0 <source-image.png>"
  echo "Example: $0 ~/Downloads/my-logo.png"
  exit 1
fi

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image not found: $SOURCE_IMAGE"
  exit 1
fi

echo "🖼️  Updating site thumbnail from: $SOURCE_IMAGE"

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
  echo "⚠️  ImageMagick not found. Installing via Homebrew..."
  if command -v brew &> /dev/null; then
    brew install imagemagick
  else
    echo "❌ Please install ImageMagick first: brew install imagemagick"
    exit 1
  fi
fi

# Create all required sizes
echo "📐 Generating icon sizes..."

# Favicon (32x32)
convert "$SOURCE_IMAGE" -resize 32x32 -background transparent -gravity center -extent 32x32 "$PUBLIC_DIR/favicon-32x32.png" 2>/dev/null || echo "⚠️  Could not create favicon-32x32.png"

# Apple Touch Icon (180x180)
convert "$SOURCE_IMAGE" -resize 180x180 -background white -gravity center -extent 180x180 "$PUBLIC_DIR/apple-touch-icon.png"

# PWA Icons
convert "$SOURCE_IMAGE" -resize 96x96 -background transparent -gravity center -extent 96x96 "$PUBLIC_DIR/pwa-96x96.png"
convert "$SOURCE_IMAGE" -resize 192x192 -background transparent -gravity center -extent 192x192 "$PUBLIC_DIR/pwa-192x192.png"
convert "$SOURCE_IMAGE" -resize 256x256 -background transparent -gravity center -extent 256x256 "$PUBLIC_DIR/pwa-256x256.png"
convert "$SOURCE_IMAGE" -resize 512x512 -background transparent -gravity center -extent 512x512 "$PUBLIC_DIR/pwa-512x512.png"
convert "$SOURCE_IMAGE" -resize 512x512 -background transparent -gravity center -extent 512x512 -padding 20% "$PUBLIC_DIR/pwa-512x512-maskable.png"

# Create SVG favicon (scalable)
echo "Creating SVG favicon..."
cat > "$PUBLIC_DIR/favicon.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="/pwa-512x512.png" width="100" height="100"/>
</svg>
EOF

echo "✅ Thumbnail icons updated successfully!"
echo ""
echo "Generated files:"
echo "  - favicon.svg (scalable)"
echo "  - apple-touch-icon.png (180x180)"
echo "  - pwa-96x96.png"
echo "  - pwa-192x192.png"
echo "  - pwa-256x256.png"
echo "  - pwa-512x512.png"
echo "  - pwa-512x512-maskable.png"
echo ""
echo "Next steps:"
echo "  1. Review the generated icons in $PUBLIC_DIR/"
echo "  2. Run: npm run build:production"
echo "  3. Deploy the updated files"

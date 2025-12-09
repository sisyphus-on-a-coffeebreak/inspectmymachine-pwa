#!/bin/bash

# Script to generate all required logo sizes from a single source image
# Usage: ./scripts/generate-logo-sizes.sh path/to/your-logo.png

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-logo-image>"
  echo "Example: $0 ~/Downloads/my-logo.png"
  exit 1
fi

SOURCE_IMAGE="$1"
PUBLIC_DIR="public"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image not found: $SOURCE_IMAGE"
  exit 1
fi

echo "Generating logo sizes from: $SOURCE_IMAGE"
echo "Output directory: $PUBLIC_DIR"
echo ""

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
  echo "Using ImageMagick..."
  for size in 16 32 96 152 167 180 192 256 512; do
    echo "  Creating logo-${size}x${size}.png..."
    convert "$SOURCE_IMAGE" -resize ${size}x${size} -background transparent -gravity center -extent ${size}x${size} "$PUBLIC_DIR/logo-${size}x${size}.png"
  done
  echo ""
  echo "✅ All logo sizes generated successfully!"
elif command -v sips &> /dev/null; then
  echo "Using macOS sips..."
  for size in 16 32 96 152 167 180 192 256 512; do
    echo "  Creating logo-${size}x${size}.png..."
    sips -z $size $size "$SOURCE_IMAGE" --out "$PUBLIC_DIR/logo-${size}x${size}.png" &> /dev/null
  done
  echo ""
  echo "✅ All logo sizes generated successfully!"
else
  echo "Error: Neither ImageMagick nor sips found."
  echo "Please install ImageMagick: brew install imagemagick"
  echo "Or use an online tool: https://www.iloveimg.com/resize-image"
  exit 1
fi

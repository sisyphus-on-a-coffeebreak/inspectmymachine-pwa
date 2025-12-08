#!/bin/bash
# Image Optimization Script for VOMS PWA
# Compresses PNGs and generates WebP/AVIF versions

set -e

PUBLIC_DIR="public"
SCREENSHOTS=("screenshot-dashboard.png" "screenshot-mobile.png")

echo "🖼️  Starting image optimization..."

# Check if required tools are available
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "⚠️  $1 not found. Install it to use this feature."
        return 1
    fi
    return 0
}

# Compress PNG using pngquant
compress_png() {
    local file="$1"
    if check_tool pngquant; then
        echo "📦 Compressing $file..."
        pngquant --quality=65-80 --ext .png --force "$PUBLIC_DIR/$file"
        local size=$(ls -lh "$PUBLIC_DIR/$file" | awk '{print $5}')
        echo "✅ Compressed $file to $size"
    else
        echo "⏭️  Skipping PNG compression (pngquant not found)"
    fi
}

# Convert to WebP using cwebp
convert_to_webp() {
    local file="$1"
    local basename="${file%.png}"
    if check_tool cwebp; then
        echo "🔄 Converting $file to WebP..."
        cwebp -q 80 "$PUBLIC_DIR/$file" -o "$PUBLIC_DIR/$basename.webp"
        local size=$(ls -lh "$PUBLIC_DIR/$basename.webp" | awk '{print $5}')
        echo "✅ Created $basename.webp ($size)"
    else
        echo "⏭️  Skipping WebP conversion (cwebp not found)"
        echo "💡 Install libwebp: brew install webp (macOS) or apt-get install webp (Linux)"
    fi
}

# Generate AVIF using sharp (Node.js)
generate_avif() {
    local file="$1"
    local basename="${file%.png}"
    if check_tool npx; then
        echo "🎨 Generating AVIF for $file..."
        npx --yes sharp-cli -i "$PUBLIC_DIR/$file" -o "$PUBLIC_DIR/$basename.avif" --avif 2>/dev/null || {
            echo "⏭️  Skipping AVIF (sharp-cli not available)"
            echo "💡 AVIF is optional - WebP is sufficient for most browsers"
        }
    else
        echo "⏭️  Skipping AVIF generation (npx not found)"
    fi
}

# Process each screenshot
for screenshot in "${SCREENSHOTS[@]}"; do
    if [ ! -f "$PUBLIC_DIR/$screenshot" ]; then
        echo "⚠️  File not found: $PUBLIC_DIR/$screenshot"
        continue
    fi
    
    echo ""
    echo "📸 Processing $screenshot..."
    echo "────────────────────────────────────"
    
    # Show original size
    original_size=$(ls -lh "$PUBLIC_DIR/$screenshot" | awk '{print $5}')
    echo "📊 Original size: $original_size"
    
    # Compress PNG
    compress_png "$screenshot"
    
    # Convert to WebP
    convert_to_webp "$screenshot"
    
    # Generate AVIF (optional)
    # generate_avif "$screenshot"
    
    echo "✅ Completed $screenshot"
done

echo ""
echo "✨ Image optimization complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify images look good visually"
echo "   2. Check file sizes meet targets (<25KB PNG, <15KB WebP)"
echo "   3. Manifest in vite.config.ts already includes WebP versions"
echo "   4. Test PWA installation to verify screenshots display correctly"




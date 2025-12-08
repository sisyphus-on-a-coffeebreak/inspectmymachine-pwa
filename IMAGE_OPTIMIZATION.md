# Image Optimization Guide

This document outlines the steps to optimize images for the VOMS PWA.

## Screenshot Optimization

The PWA manifest includes screenshots that should be optimized for better performance.

### Current Files
- `public/screenshot-dashboard.png` (target: <25KB)
- `public/screenshot-mobile.png` (target: <25KB)

### Optimization Steps

#### 1. Compress PNG Files
```bash
# Using pngquant (recommended)
pngquant --quality=65-80 --ext .png --force public/screenshot-dashboard.png
pngquant --quality=65-80 --ext .png --force public/screenshot-mobile.png

# Or using ImageOptim (macOS GUI tool)
# Or using Squoosh.app (web-based)
```

#### 2. Convert to WebP
```bash
# Using cwebp (from libwebp package)
cwebp -q 80 public/screenshot-dashboard.png -o public/screenshot-dashboard.webp
cwebp -q 80 public/screenshot-mobile.png -o public/screenshot-mobile.webp

# Or using Squoosh.app (web-based)
# Or using sharp (Node.js)
```

#### 3. Generate AVIF Versions (Optional, for modern browsers)
```bash
# Using sharp (Node.js)
npx sharp -i public/screenshot-dashboard.png -o public/screenshot-dashboard.avif --avif
npx sharp -i public/screenshot-mobile.png -o public/screenshot-mobile.avif --avif

# Or using Squoosh.app (web-based)
```

### Target File Sizes
- PNG: <25KB each (compressed from ~39KB/45KB)
- WebP: <15KB each (typically 30-50% smaller than PNG)
- AVIF: <10KB each (typically 50-70% smaller than PNG)

### Tools
- **Squoosh.app**: https://squoosh.app/ (web-based, no installation)
- **ImageOptim**: https://imageoptim.com/ (macOS)
- **pngquant**: Command-line PNG compressor
- **sharp**: Node.js image processing library
- **cwebp**: Command-line WebP encoder

### Verification
After optimization, verify:
1. Images still look good visually
2. File sizes meet targets
3. WebP versions are generated
4. Manifest includes both WebP and PNG versions

### Notes
- The manifest in `vite.config.ts` has been updated to include WebP versions with PNG fallbacks
- Browsers will automatically choose the best format they support
- WebP is supported by all modern browsers (95%+ coverage)
- AVIF has excellent compression but lower browser support (~85%)





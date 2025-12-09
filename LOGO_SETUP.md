# Logo Setup Guide

This guide will help you add your logo to the VOMS application.

## Quick Start

1. **Add your logo file** to `src/assets/logo/` with one of these names:
   - `logo.png` (recommended - supports transparency)
   - `logo.svg` (best quality, scalable)
   - `logo.jpg` (if you don't need transparency)

2. **Generate all required sizes**:
   ```bash
   ./scripts/generate-logo-sizes.sh
   ```
   
   Or if your logo is in a different location:
   ```bash
   ./scripts/generate-logo-sizes.sh /path/to/your/logo.png
   ```

3. **Verify the files were created**:
   ```bash
   ls -lh public/logo-*.png
   ```
   
   You should see files like:
   - `logo-16x16.png`
   - `logo-32x32.png`
   - `logo-96x96.png`
   - `logo-152x152.png`
   - `logo-167x167.png`
   - `logo-180x180.png`
   - `logo-192x192.png`
   - `logo-256x256.png`
   - `logo-512x512.png`

4. **Rebuild the application**:
   ```bash
   npm run build:production
   ```

5. **Deploy** - The logo will now appear as:
   - Browser favicon
   - PWA app icon
   - Social media thumbnail (Open Graph/Twitter)
   - Apple touch icon on iOS devices
   - Windows tile icon

## Requirements

Your logo image should be:
- **Format**: PNG (recommended), SVG, or JPG
- **Minimum size**: 512x512 pixels (larger is better)
- **Aspect ratio**: Square (1:1) works best
- **Background**: Transparent PNG is recommended for best results

## Troubleshooting

### "Neither ImageMagick nor sips found"

**macOS**: `sips` should be available by default. If not, install ImageMagick:
```bash
brew install imagemagick
```

**Linux**: Install ImageMagick:
```bash
sudo apt-get install imagemagick  # Debian/Ubuntu
sudo yum install ImageMagick       # CentOS/RHEL
```

**Windows**: Install ImageMagick from https://imagemagick.org/script/download.php

### Logo files not appearing

1. Make sure the logo files are in the `public/` directory
2. Clear your browser cache
3. Rebuild the application: `npm run build:production`
4. Check browser console for 404 errors on logo files

### Using an online tool

If you don't have ImageMagick or sips, you can use an online tool:
1. Go to https://www.iloveimg.com/resize-image
2. Upload your logo
3. Resize to each required size (16, 32, 96, 152, 167, 180, 192, 256, 512)
4. Download and save each size as `logo-{size}x{size}.png` in the `public/` folder

## File Structure

```
voms-pwa/
├── src/
│   └── assets/
│       └── logo/
│           ├── logo.png          # Your source logo (add this)
│           ├── README.md          # This guide
│           └── logo-placeholder.md
├── public/
│   ├── logo-16x16.png            # Generated files
│   ├── logo-32x32.png
│   ├── logo-96x96.png
│   ├── logo-152x152.png
│   ├── logo-167x167.png
│   ├── logo-180x180.png
│   ├── logo-192x192.png
│   ├── logo-256x256.png
│   └── logo-512x512.png
└── scripts/
    ├── generate-logo-sizes.sh    # Generation script
    └── copy-logo-to-public.sh    # Verification script
```

## Notes

- The logo files in `public/` are used directly by the browser
- The source logo in `src/assets/logo/` is only used for generation
- After generating, you can delete the source logo from `src/assets/logo/` if you want (but keeping it is recommended for future updates)

# Logo Setup Instructions

To set the logo as the site thumbnail, you need to create the following image files from your logo:

## Required Logo Sizes:

1. **logo-16x16.png** - 16x16 pixels (favicon)
2. **logo-32x32.png** - 32x32 pixels (favicon)
3. **logo-96x96.png** - 96x96 pixels (PWA shortcuts)
4. **logo-152x152.png** - 152x152 pixels (Apple touch icon)
5. **logo-167x167.png** - 167x167 pixels (Apple touch icon for iPad Pro)
6. **logo-180x180.png** - 180x180 pixels (Apple touch icon)
7. **logo-192x192.png** - 192x192 pixels (PWA icon)
8. **logo-256x256.png** - 256x256 pixels (PWA icon)
9. **logo-512x512.png** - 512x512 pixels (PWA icon, Open Graph, Twitter card)

## Steps:

1. Take your logo image (the cartoon character with hard hat and "MY" text)
2. Resize it to each of the sizes above
3. Save them in the `/public` folder with the exact names listed above
4. Run `npm run build:production` to rebuild with the new icons

## Quick Command (if you have ImageMagick installed):

```bash
# Replace 'your-logo.png' with your actual logo file
for size in 16 32 96 152 167 180 192 256 512; do
  convert your-logo.png -resize ${size}x${size} public/logo-${size}x${size}.png
done
```

Or use an online tool like https://www.iloveimg.com/resize-image to resize your logo to all required sizes.

# Logo Assets

Place your logo image file here and name it `logo.png` (or `logo.svg`, `logo.jpg`, etc.).

## Required Sizes

After adding your logo file, run the generation script to create all required sizes:

```bash
./scripts/generate-logo-sizes.sh src/assets/logo/logo.png
```

This will generate all the required logo sizes in the `public/` folder.

## Supported Formats

- PNG (recommended for transparency)
- SVG (scalable, best quality)
- JPG/JPEG

## Current Logo File

If you have your logo file ready:
1. Copy it to this directory as `logo.png` (or your preferred format)
2. Run the generation script to create all sizes
3. The build process will automatically use the generated logos

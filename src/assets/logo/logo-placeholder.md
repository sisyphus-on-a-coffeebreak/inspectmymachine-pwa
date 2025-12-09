# Logo Placeholder

This file is a placeholder. Please add your logo image file here.

## Quick Setup:

1. **Add your logo file** to this directory with one of these names:
   - `logo.png` (recommended)
   - `logo.svg` (best quality, scalable)
   - `logo.jpg`

2. **Generate all sizes** by running:
   ```bash
   ./scripts/generate-logo-sizes.sh
   ```
   
   Or if your logo is elsewhere:
   ```bash
   ./scripts/generate-logo-sizes.sh /path/to/your/logo.png
   ```

3. **Rebuild the app**:
   ```bash
   npm run build:production
   ```

The generated logo files will be placed in the `public/` folder and automatically used by the app.

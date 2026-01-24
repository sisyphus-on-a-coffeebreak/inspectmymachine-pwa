# Gate Pass Logo Setup Guide

## Overview

The gate pass PDF generation now supports displaying your company logo. The logo is automatically fetched from your report branding settings and included in all generated gate pass PDFs.

## How It Works

1. **Logo Storage**: Your logo is stored in the Report Branding settings (Settings → Report Branding)
2. **Automatic Fetching**: When a gate pass PDF is generated, the system automatically fetches your company logo and name from the branding settings
3. **Display**: The logo appears in the header section of the gate pass, alongside your company name

## Setting Up Your Logo

### Step 1: Upload Your Logo

1. Navigate to **Settings** → **Report Branding**
2. Click on the logo upload area
3. Upload your logo file (PNG, JPG, or SVG, max 1MB)
4. The recommended size is 300x100px for best results

### Step 2: Set Your Company Name

1. In the same Report Branding page, enter your company name
2. Click **Save** to store your settings

### Step 3: Generate Gate Pass

Once your logo is uploaded, all new gate pass PDFs will automatically include:
- Your company logo (if uploaded)
- Your company name
- The logo appears in the header section of the pass

## Technical Details

### Where Logo is Used

The logo is automatically included in PDFs generated from:
- **Gate Pass Details Page**: When downloading a pass PDF
- **Access Dashboard**: When downloading or sharing passes
- **Pass Display Component**: When generating PDFs from the pass display modal

### Implementation

The logo is fetched from the Report Branding API (`/v1/settings/report-branding`) which provides:
- `logoUrl`: The URL to your uploaded logo
- `companyName`: Your company name

If the branding fetch fails (e.g., network error), the system gracefully falls back to default values without breaking PDF generation.

### Logo Display

The logo appears in the gate pass header with:
- Size: 48x48px
- Border radius: 12px
- White border for visibility on dark header background
- Positioned next to the company name

## Troubleshooting

### Logo Not Appearing

1. **Check Logo Upload**: Ensure your logo was successfully uploaded in Report Branding settings
2. **Check File Format**: Logo must be PNG, JPG, or SVG
3. **Check File Size**: Logo must be under 1MB
4. **Check Network**: Ensure you have network connectivity when generating PDFs (logo is fetched from API)

### Logo Appears Blurry

- Use a higher resolution logo (recommended: 300x100px or larger)
- Ensure your logo is in PNG or SVG format for best quality

### Logo Not Loading in PDF

- Check browser console for CORS errors
- Ensure the logo URL is accessible
- Try regenerating the PDF after uploading a new logo

## Code Locations

The logo integration is implemented in:
- `src/lib/pdf-generator-simple.ts`: PDF generation with logo support
- `src/pages/stockyard/access/hooks/useGatePassDetails.ts`: Fetches branding for pass details
- `src/pages/stockyard/access/AccessDashboard.tsx`: Fetches branding for dashboard downloads
- `src/lib/report-branding.ts`: API client for branding settings

## Notes

- The logo is fetched asynchronously when generating PDFs
- If branding fetch fails, PDF generation continues with default values
- Logo URLs are automatically proxied through the backend to avoid CORS issues
- The logo appears only if both `companyName` and `companyLogo` are available


# Logo Display CORS Issue - Backend Fix Required

## 🔴 Problem

The uploaded logo is **not displaying** in the frontend because of a **CORS (Cross-Origin Resource Sharing) issue**.

### Console Error:
```
[ReportPreview] Logo failed to load: https://d1ce9c5fddbdb3315caf14c1de28e261.r2.cloudflarestorage.com/voms-dev-laravel/branding/logo.png
```

The logo file exists on Cloudflare R2 storage, but the browser blocks it due to missing CORS headers.

---

## ✅ Solution: Configure CORS on Cloudflare R2

The backend team needs to add CORS configuration to the R2 bucket to allow the frontend domain to load images.

### Option 1: Configure CORS in Cloudflare R2 Dashboard

1. Go to **Cloudflare Dashboard** → **R2** → Select your bucket (`voms-dev-laravel`)
2. Go to **Settings** → **CORS Policy**
3. Add the following CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://voms.example.com",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

**Important:** Replace `https://yourdomain.com` with your actual production domain.

---

### Option 2: Add CORS Headers in Laravel Backend

If you're serving the images through a Laravel route/controller, add these headers:

```php
// In your controller that serves the logo
return response()->file($logoPath, [
    'Access-Control-Allow-Origin' => env('FRONTEND_URL', '*'),
    'Access-Control-Allow-Methods' => 'GET, HEAD',
    'Access-Control-Allow-Headers' => '*',
    'Cache-Control' => 'public, max-age=3600',
]);
```

Or add to your `config/cors.php`:

```php
'paths' => [
    'api/*',
    'storage/*',  // Add this
    'branding/*', // Add this
],

'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
],
```

---

### Option 3: Proxy Images Through Backend API (Alternative)

If CORS configuration is difficult, create a backend API endpoint that proxies the logo:

**Backend Route:**
```php
// routes/api.php
Route::get('/v1/branding/logo', function () {
    $branding = \App\Models\ReportBranding::first();
    
    if (!$branding || !$branding->logo_path) {
        return response()->json(['error' => 'No logo found'], 404);
    }
    
    $logoPath = storage_path('app/' . $branding->logo_path);
    
    if (!file_exists($logoPath)) {
        return response()->json(['error' => 'Logo file not found'], 404);
    }
    
    return response()->file($logoPath, [
        'Content-Type' => mime_content_type($logoPath),
        'Cache-Control' => 'public, max-age=3600',
    ]);
});
```

**Frontend Change (already done):**
The `proxyLogoUrl()` function in `src/lib/report-branding.ts` can be updated to use this endpoint.

---

## 🧪 Testing the Fix

After applying CORS headers:

1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Hard reload the page (Ctrl+F5 or Cmd+Shift+R)
3. Upload a logo again
4. Check browser console - you should **NOT** see the CORS error
5. The logo should display in:
   - The logo upload box
   - The report preview
   - Exported PDFs

---

## 📋 What We've Done on Frontend

✅ Added `crossOrigin="anonymous"` to `<img>` tags in:
- `src/components/settings/LogoUploader.tsx`
- `src/components/settings/ReportPreview.tsx`

✅ Added proper error handling with informative console warnings

✅ State management is working correctly (logo URL is being retrieved and passed properly)

---

## 🎯 Next Steps

**Backend Team Action Required:**
1. Choose one of the options above (Option 1 recommended)
2. Apply the CORS configuration
3. Test by uploading a logo
4. Verify the logo displays in frontend

**Frontend Team:**
- No additional action needed ✅
- All necessary frontend changes are complete
- The issue is purely backend/infrastructure

---

## 📝 Technical Details

- **Frontend URL:** `http://localhost:5173` (dev), `https://yourdomain.com` (prod)
- **R2 Bucket:** `https://d1ce9c5fddbdb3315caf14c1de28e261.r2.cloudflarestorage.com/voms-dev-laravel/`
- **Logo Path:** `/branding/logo.png`
- **Error Type:** CORS policy blocking cross-origin image load
- **Required Headers:** `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`


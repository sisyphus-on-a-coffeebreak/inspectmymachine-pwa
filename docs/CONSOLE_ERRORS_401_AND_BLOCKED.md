# Console errors: ERR_BLOCKED_BY_CLIENT and 401 on /api/user

## 1. ERR_BLOCKED_BY_CLIENT (Cloudflare beacon)

**What you see:**
- `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT`
- "Tracking Prevention blocked a Script resource from loading https://static.cloudflareinsights.com/beacon.min.js/..."

**Cause:** The script is **Cloudflare Web Analytics / Insights**, not something in this repo. It is often injected when the site is behind Cloudflare (e.g. Web Analytics enabled in the Cloudflare dashboard). Edge (and some other browsers) block it with "Tracking Prevention."

**What to do:**
- **Ignore it** – It does not affect app behaviour. The app does not depend on this script.
- **Stop the script** – In Cloudflare Dashboard → your domain → Web Analytics (or Insights), turn it off if you don’t need it.
- No code changes are required in the PWA.

---

## 2. GET https://api.inspectmymachine.in/api/user 401 (Unauthorized)

**What you see:**
- `GET https://api.inspectmymachine.in/api/user 401 (Unauthorized)` in the console, often when opening an admin or protected route.

**What’s happening:**  
On load, the frontend (AuthProvider) calls `GET /api/user` to see if the user is logged in. The backend (vosm) protects this route with `auth:sanctum`. If there is no valid session, the API correctly returns **401**.

### When you are not logged in

- **401 is expected.** The app handles it (sets user to null, shows login).  
- The browser still logs the failed request; that’s normal and cannot be fully hidden.

### When you are logged in but still get 401

Then the session cookie is not being sent or accepted. Fix the **backend** (vosm) configuration.

#### Backend (vosm) checklist

1. **SESSION_DOMAIN**  
   The cookie set by `api.inspectmymachine.in` must be sent when the frontend at `inspectmymachine.in` calls the API.  
   In vosm’s `.env` (or the env used by `api.inspectmymachine.in`):

   ```env
   SESSION_DOMAIN=.inspectmymachine.in
   ```

   The leading dot makes the cookie valid for `inspectmymachine.in` and `api.inspectmymachine.in`.

2. **Sanctum stateful domains**  
   In vosm, `config/sanctum.php` already includes `inspectmymachine.in` and `.inspectmymachine.in` in the default. If you override via env:

   ```env
   SANCTUM_STATEFUL_DOMAINS=inspectmymachine.in,www.inspectmymachine.in,api.inspectmymachine.in
   ```

3. **CORS**  
   vosm’s `config/cors.php` already has:
   - `supports_credentials` => true  
   - `https://inspectmymachine.in` in `allowed_origins`  

   No change needed unless you use another frontend origin.

4. **HTTPS and secure cookie**  
   For production:

   ```env
   SESSION_SECURE_COOKIE=true
   ```

   If you still don’t get the cookie cross-origin, you can try (only over HTTPS):

   ```env
   SESSION_SAME_SITE=none
   SESSION_SECURE_COOKIE=true
   ```

5. **Restart and cache**  
   After changing `.env`:

   ```bash
   cd /Users/narnolia/code/vosm
   php artisan config:clear
   php artisan cache:clear
   # Restart PHP/nginx/fpm so the new config is loaded
   ```

#### Frontend (voms-pwa)

- Uses `API_BASE_URL` from `src/lib/apiConfig.ts` (e.g. `https://api.inspectmymachine.in/api`).
- Sends cookies via `withCredentials: true` (AuthProvider and apiClient).
- No code change needed for the 401 itself; fixing cookie/session on the backend resolves “logged in but 401”.

---

## Summary

| Error | Cause | Action |
|-------|--------|--------|
| ERR_BLOCKED_BY_CLIENT (Cloudflare beacon) | Browser blocking Cloudflare analytics script | Ignore or disable Web Analytics in Cloudflare |
| 401 on `/api/user` when not logged in | Normal; no session | None; app shows login |
| 401 on `/api/user` when logged in | Cookie not sent/recognised | Set `SESSION_DOMAIN=.inspectmymachine.in` (and optionally Sanctum/CORS/SameSite) in vosm and restart |

Your backend lives in `/Users/narnolia/code/vosm`. Apply the env and config changes there, then reload the site and try logging in again.

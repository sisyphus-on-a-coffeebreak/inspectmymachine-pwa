# Login 500 Error - Debugging Guide

## Error Description
The login endpoint at `https://api.inspectmymachine.in/api/login` is returning a 500 Internal Server Error. This is a server-side issue that requires checking the backend.

## Frontend Status ✅
The frontend is correctly configured:
- **CSRF Token**: Fetching from `https://api.inspectmymachine.in/sanctum/csrf-cookie`
- **Login Endpoint**: Posting to `https://api.inspectmymachine.in/api/login`
- **Request Payload**: `{ employee_id: string, password: string }`
- **Headers**: Correct (X-Requested-With, Accept, Content-Type)
- **Credentials**: withCredentials: true

## Backend Checklist (What to Check)

### 1. **Backend Logs** 🔍
Check Laravel logs at `/storage/logs/laravel.log` for the actual PHP error:
```bash
# On your backend server
tail -f /path/to/laravel/storage/logs/laravel.log
```

Common errors to look for:
- Database connection errors
- Missing table columns
- PHP exceptions
- Missing dependencies

### 2. **Login Route Configuration** 🛣️
Verify the login route exists in your Laravel backend:

**Check: `routes/api.php` or `routes/web.php`**
```php
// Should have something like:
Route::post('/api/login', [AuthController::class, 'login']);

// Or if using Laravel Fortify/Breeze:
// The routes are auto-registered
```

**Verify route exists:**
```bash
php artisan route:list | grep login
```

### 3. **Database & Users Table** 💾
Verify the users table structure:

**Required columns:**
- `id`
- `employee_id` (string, unique)
- `password` (hashed)
- `email`
- `name`
- `role`
- `is_active`

**Check if user exists:**
```sql
SELECT * FROM users WHERE employee_id = 'ADMIN001';
```

**Verify password is hashed:**
- Passwords should start with `$2y$` (bcrypt)
- If password is plain text, it won't work with Laravel's authentication

### 4. **Laravel Sanctum Configuration** 🔐

**Check: `config/sanctum.php`**
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    env('APP_URL') ? ','.parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

**Check: `.env` file on backend**
```env
APP_URL=https://api.inspectmymachine.in
FRONTEND_URL=https://inspectmymachine.in
SESSION_DOMAIN=.inspectmymachine.in
SANCTUM_STATEFUL_DOMAINS=inspectmymachine.in,www.inspectmymachine.in,api.inspectmymachine.in
```

### 5. **Session & Cookie Configuration** 🍪

**Check: `config/session.php`**
```php
'domain' => env('SESSION_DOMAIN', '.inspectmymachine.in'),
'secure' => env('SESSION_SECURE_COOKIE', true), // Must be true for HTTPS
'same_site' => 'lax', // or 'none' for cross-domain
```

**Check: `.env`**
```env
SESSION_DRIVER=cookie
SESSION_DOMAIN=.inspectmymachine.in
SESSION_SECURE_COOKIE=true
```

### 6. **CORS Configuration** 🌐

**Check: `config/cors.php`**
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['https://inspectmymachine.in'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true, // MUST be true for Sanctum
```

### 7. **Authentication Logic** 🔓

If you have a custom `AuthController`, verify the login method:

```php
public function login(Request $request)
{
    // Validate
    $request->validate([
        'employee_id' => 'required|string',
        'password' => 'required|string',
    ]);

    // Find user by employee_id (not email)
    $user = User::where('employee_id', $request->employee_id)->first();

    // Check password
    if (!$user || !Hash::check($request->password, $user->password)) {
        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    // Check if active
    if (!$user->is_active) {
        return response()->json([
            'message' => 'Account is inactive'
        ], 403);
    }

    // Login
    Auth::login($user);

    return response()->json([
        'message' => 'Login successful',
        'user' => $user
    ]);
}
```

### 8. **Test User Credentials** 👤

Verify the test user exists and has correct password:

```sql
-- Check if user exists
SELECT employee_id, email, role, is_active FROM users WHERE employee_id = 'ADMIN001';

-- If password needs to be reset (use Laravel tinker):
php artisan tinker
>>> $user = User::where('employee_id', 'ADMIN001')->first();
>>> $user->password = Hash::make('password');
>>> $user->save();
```

## Quick Test Commands

### Backend Health Check
```bash
# Test if backend is running
curl https://api.inspectmymachine.in/api/health

# Test CSRF endpoint
curl https://api.inspectmymachine.in/sanctum/csrf-cookie -I

# Test login endpoint (will fail but shows if route exists)
curl -X POST https://api.inspectmymachine.in/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"employee_id":"ADMIN001","password":"password"}'
```

### Check Environment
```bash
# On backend server
php artisan config:clear
php artisan cache:clear
php artisan route:cache
php artisan config:cache
```

## Common Solutions

### Solution 1: Missing Login Route
Add to `routes/web.php` or `routes/api.php`:
```php
Route::post('/api/login', [AuthController::class, 'login']);
Route::post('/api/logout', [AuthController::class, 'logout']);
Route::get('/api/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
```

### Solution 2: User Model Not Found
Ensure the User model uses the correct table and has `employee_id` fillable:
```php
protected $fillable = [
    'employee_id',
    'name',
    'email',
    'password',
    'role',
    'is_active',
];

// Add cast for employee_id if needed
protected $casts = [
    'is_active' => 'boolean',
];
```

### Solution 3: Password Hash Issue
Reset password using Laravel's Hash facade:
```bash
php artisan tinker
>>> User::where('employee_id', 'ADMIN001')->update(['password' => Hash::make('password')]);
```

### Solution 4: Session Driver Issue
Try switching to database session driver:
```env
SESSION_DRIVER=database
```
Then run:
```bash
php artisan session:table
php artisan migrate
```

## Testing with Enhanced Logging

The frontend now logs detailed information. Check browser console for:
- `[Auth] Fetching CSRF token from: ...`
- `[Auth] Sending login request to: ...`
- `[Auth] Request payload: ...`
- `[Auth] Login failed with status: ...`
- `[Auth] Error response: ...`

This will help identify exactly where the issue occurs.

## Next Steps

1. Check backend Laravel logs (`storage/logs/laravel.log`)
2. Verify the `/api/login` route exists (`php artisan route:list`)
3. Test user credentials in database
4. Verify Sanctum configuration
5. Check CORS and session settings
6. Try the test commands above

If the issue persists, share the Laravel error log output for further debugging.

# Database Check Summary

## Current Status

✅ **Script Created**: `check-users.js` - Attempts to query the API for users
✅ **SQL Queries**: `query-database.sql` - Ready-to-use SQL queries
✅ **Guide Created**: `CHECK_DATABASE.md` - Comprehensive guide for checking the database

## Findings

1. **API Endpoint Status**: 
   - `/api/v1/users` endpoint returns **404 (Not Found)**
   - This means the backend hasn't implemented the users endpoint yet
   - The frontend user management system is ready, but needs backend support

2. **Authentication Status**:
   - `/api/user` endpoint requires authentication (401)
   - Cannot check current user without valid credentials

## Next Steps to Find User Credentials

### Option 1: Direct Database Access (Recommended)

If you have access to the database server:

```bash
# Connect to MySQL
mysql -u root -p voms

# Then run queries from query-database.sql
```

Or use the SQL queries in `query-database.sql` file.

### Option 2: Laravel Tinker

If you have access to the Laravel backend:

```bash
cd vosm  # or your Laravel backend directory
php artisan tinker

# Then run:
User::all(['id', 'employee_id', 'name', 'email', 'role']);
```

### Option 3: Check Backend Repository

Look for:
- `database/seeders/UserSeeder.php` or `DatabaseSeeder.php`
- `database/migrations/*_create_users_table.php`
- Any `.env` files with database credentials

### Option 4: Contact Backend Developer

Ask the backend developer for:
- Database connection details
- Default user credentials
- Or to run the user seeder

## Expected User Structure

Based on the frontend code, users should have:
- `id` (integer)
- `employee_id` (string, e.g., "ADMIN001")
- `name` (string)
- `email` (string)
- `password` (hashed with bcrypt)
- `role` (enum: super_admin, admin, supervisor, inspector, guard, clerk)
- `is_active` (boolean)
- `created_at` (timestamp)
- `last_login_at` (timestamp, nullable)

## Test Accounts (Expected)

Based on the login page UI:
- **SUPER001** / password: `password`
- **ADMIN001** / password: `password`
- **INSP001** / password: `password`
- **GUARD001** / password: `password`

**Note**: These may not exist in the database yet. You may need to create them.

## Creating Test Users

If you have database access, you can create test users:

```sql
-- Create a super admin user
INSERT INTO users (employee_id, name, email, password, role, is_active, created_at, updated_at)
VALUES (
    'SUPER001',
    'Super Admin',
    'super@example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password
    'super_admin',
    1,
    NOW(),
    NOW()
);

-- Create an admin user
INSERT INTO users (employee_id, name, email, password, role, is_active, created_at, updated_at)
VALUES (
    'ADMIN001',
    'Admin User',
    'admin@example.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- password
    'admin',
    1,
    NOW(),
    NOW()
);
```

**Or use Laravel Tinker** (recommended, as it will hash passwords correctly):

```php
php artisan tinker

$user = new App\Models\User();
$user->employee_id = 'ADMIN001';
$user->name = 'Admin User';
$user->email = 'admin@example.com';
$user->password = Hash::make('password');
$user->role = 'admin';
$user->is_active = true;
$user->save();
```

## Files Created

1. **check-users.js** - Node.js script to query the API
2. **query-database.sql** - SQL queries to check the database
3. **CHECK_DATABASE.md** - Comprehensive guide
4. **DATABASE_CHECK_SUMMARY.md** - This file

## Quick Start

1. **If you have database access:**
   ```bash
   mysql -u root -p voms < query-database.sql
   ```

2. **If you have Laravel access:**
   ```bash
   cd vosm
   php artisan tinker
   User::all();
   ```

3. **If you have neither:**
   - Contact the backend developer
   - Check the backend repository for seeders
   - Ask for database credentials


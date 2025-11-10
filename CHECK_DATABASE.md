# How to Check Backend Database for Users

Since the backend is a separate Laravel application, here are several ways to check the database for user credentials:

## Method 1: Query the Database Directly

If you have access to the database server:

### MySQL/MariaDB
```bash
# Connect to MySQL
mysql -u root -p

# Select the database (usually 'voms' or similar)
USE voms;

# Check users table
SELECT id, employee_id, name, email, role, is_active, created_at FROM users;

# Check if passwords are hashed (they should be)
SELECT id, employee_id, password FROM users LIMIT 5;
```

### PostgreSQL
```bash
# Connect to PostgreSQL
psql -U postgres -d voms

# Check users table
SELECT id, employee_id, name, email, role, is_active, created_at FROM users;
```

## Method 2: Use Laravel Tinker

If you have access to the Laravel backend directory:

```bash
# Navigate to Laravel backend
cd vosm  # or wherever the Laravel app is

# Run Laravel Tinker
php artisan tinker

# Query users
User::all(['id', 'employee_id', 'name', 'email', 'role', 'is_active']);

# Get a specific user
User::where('employee_id', 'ADMIN001')->first();

# Check if users exist
User::count();
```

## Method 3: Check Database Seeders

Look for user seeders in the Laravel backend:

```bash
# Check for seeders
ls -la database/seeders/

# Look for UserSeeder or DatabaseSeeder
cat database/seeders/DatabaseSeeder.php
cat database/seeders/UserSeeder.php  # if it exists
```

## Method 4: Check Migrations

Check the users table migration to understand the structure:

```bash
# Find users migration
find database/migrations -name "*users*" -o -name "*create_users*"

# View migration
cat database/migrations/YYYY_MM_DD_create_users_table.php
```

## Method 5: Query via API (if endpoint exists)

The frontend has a user management API. If the backend implements it:

```bash
# Using curl (requires authentication)
curl -X GET "https://api.inspectmymachine.in/api/v1/users" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

## Method 6: Check Laravel Logs

Check if there are any login attempts or user creation logs:

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log | grep -i "user\|login\|auth"
```

## Method 7: Create a Test User via Tinker

If you can access Tinker, create a test user:

```bash
php artisan tinker

# Create a test user
$user = new App\Models\User();
$user->employee_id = 'TEST001';
$user->name = 'Test User';
$user->email = 'test@example.com';
$user->password = Hash::make('password');
$user->role = 'admin';
$user->is_active = true;
$user->save();
```

## Common Default Credentials

Based on the login page, these are the expected test accounts:
- **SUPER001** / password: `password`
- **ADMIN001** / password: `password`
- **INSP001** / password: `password`
- **GUARD001** / password: `password`

**Note:** Passwords in the database will be hashed using bcrypt, so you won't see the plain text password.

## Reset Password via Tinker

If you need to reset a password:

```bash
php artisan tinker

# Find user
$user = App\Models\User::where('employee_id', 'ADMIN001')->first();

# Reset password
$user->password = Hash::make('newpassword');
$user->save();
```

## Check Authentication Routes

Check if login routes exist:

```bash
# List all routes
php artisan route:list | grep -i "login\|auth\|user"

# Check API routes
cat routes/api.php
```

## Database Connection Details

Check the `.env` file in the Laravel backend for database credentials:

```bash
# In Laravel backend directory
cat .env | grep DB_
```

Typical values:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=voms
DB_USERNAME=root
DB_PASSWORD=
```

## Next Steps

1. **If you have database access:** Use Method 1 to query directly
2. **If you have Laravel access:** Use Method 2 (Tinker) to check users
3. **If backend is deployed:** Check with the backend developer for credentials
4. **If you need to create users:** Use the User Management page at `/app/admin/users` once logged in


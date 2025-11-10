# Backend Access Guide

## Current Situation

The `vosm` directory in this repository is **not a complete Laravel installation**. It only contains:
- Some models (Inspection, Vehicle, etc.)
- Some controllers
- Some migrations
- API routes

According to the README, these files need to be **copied into a full Laravel project**.

## Where is the Backend?

The backend is likely:
1. **Deployed separately** at `https://api.inspectmymachine.in`
2. **In a separate repository** (not in this frontend repo)
3. **On a server** (DigitalOcean, Linode, etc.)

## How to Access the Backend Database

### Option 1: Access the Deployed Backend

If you have SSH access to the server where the backend is deployed:

```bash
# SSH into the server
ssh user@api.inspectmymachine.in

# Navigate to Laravel project
cd /path/to/laravel/project

# Run Tinker
php artisan tinker

# Then run:
User::all(['id', 'employee_id', 'name', 'email', 'role']);
```

### Option 2: Direct Database Access

If you have database credentials:

```bash
# Connect to MySQL
mysql -h <host> -u <username> -p <database_name>

# Then run queries
SELECT id, employee_id, name, email, role, is_active FROM users;
```

### Option 3: Check Backend Repository

The backend is likely in a separate Git repository. Look for:
- A repository named `vosm-backend` or `voms-backend`
- A repository with Laravel files
- Check with your team/backend developer

### Option 4: Use Production API

If the backend has the users endpoint implemented, you can query it:

```bash
# First, you need to authenticate
curl -X POST "https://api.inspectmymachine.in/api/login" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ADMIN001","password":"password"}' \
  --cookie-jar cookies.txt

# Then query users (if endpoint exists)
curl -X GET "https://api.inspectmymachine.in/api/v1/users" \
  --cookie cookies.txt
```

## What We Know

1. **API Base URL**: `https://api.inspectmymachine.in`
2. **Database Name**: Likely `voms` (from README)
3. **Database Type**: MySQL (from README)
4. **Expected Users**: 
   - SUPER001 / password
   - ADMIN001 / password
   - INSP001 / password
   - GUARD001 / password

## Next Steps

1. **Contact Backend Developer** - Ask for:
   - Backend repository location
   - Database credentials
   - Server access
   - Or to run the Tinker command for you

2. **Check Server Access** - If you have server access:
   - SSH into the server
   - Navigate to Laravel project
   - Run `php artisan tinker`

3. **Check Database Directly** - If you have database credentials:
   - Connect to MySQL
   - Run queries from `query-database.sql`

4. **Use User Management Page** - Once you can log in:
   - Go to `/app/admin/users`
   - View all users there

## Quick Commands (if you have backend access)

```bash
# Navigate to Laravel backend
cd /path/to/laravel/backend

# Check users
php artisan tinker --execute="User::all(['id', 'employee_id', 'name', 'email', 'role']);"

# Count users
php artisan tinker --execute="echo User::count();"

# Check specific user
php artisan tinker --execute="print_r(User::where('employee_id', 'ADMIN001')->first()->toArray());"

# List all users with passwords (hashed)
php artisan tinker --execute="User::all(['id', 'employee_id', 'name', 'email', 'role', 'password']);"
```

## Alternative: Create Test Users

If you can access the backend but no users exist, create them:

```bash
php artisan tinker

# Create Super Admin
$user = new App\Models\User();
$user->employee_id = 'SUPER001';
$user->name = 'Super Admin';
$user->email = 'super@example.com';
$user->password = Hash::make('password');
$user->role = 'super_admin';
$user->is_active = true;
$user->save();

# Create Admin
$user = new App\Models\User();
$user->employee_id = 'ADMIN001';
$user->name = 'Admin User';
$user->email = 'admin@example.com';
$user->password = Hash::make('password');
$user->role = 'admin';
$user->is_active = true;
$user->save();
```


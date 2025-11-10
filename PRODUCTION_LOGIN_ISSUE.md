# Production Login Issue

## Problem

The login is failing with "The provided credentials are incorrect or account is inactive" even though:
- ✅ Local database has the users with correct passwords
- ✅ Password hash matches when tested locally
- ✅ Users are active
- ✅ Employee IDs match exactly

## Root Cause

The frontend is connecting to **production API** (`https://api.inspectmymachine.in`), but:
- The **local database** has the correct users
- The **production database** might not have these users, or has different credentials

## Solution

You need to ensure the **production database** has the same users. Options:

### Option 1: Run Seeder on Production

SSH into the production server and run:

```bash
cd /path/to/laravel/project
php artisan db:seed --class=TestUserSeeder
```

Or create the users manually:

```bash
php artisan tinker

# Create users
$users = [
    [
        'employee_id' => 'SUPER001',
        'name' => 'Super Admin',
        'email' => 'super@voms.test',
        'password' => Hash::make('password'),
        'role' => 'super_admin',
        'is_active' => true,
    ],
    [
        'employee_id' => 'ADMIN001',
        'name' => 'Admin User',
        'email' => 'admin@voms.test',
        'password' => Hash::make('password'),
        'role' => 'admin',
        'is_active' => true,
    ],
    [
        'employee_id' => 'INSP001',
        'name' => 'Inspector John',
        'email' => 'inspector@voms.test',
        'password' => Hash::make('password'),
        'role' => 'inspector',
        'is_active' => true,
    ],
    [
        'employee_id' => 'GUARD001',
        'name' => 'Guard Ram',
        'email' => 'guard@voms.test',
        'password' => Hash::make('password'),
        'role' => 'guard',
        'is_active' => true,
    ],
];

foreach ($users as $userData) {
    User::updateOrCreate(
        ['employee_id' => $userData['employee_id']],
        $userData
    );
}
```

### Option 2: Check Production Database

SSH into production and check if users exist:

```bash
php artisan tinker

# Check users
User::whereIn('employee_id', ['SUPER001', 'ADMIN001', 'INSP001', 'GUARD001'])->get(['id', 'employee_id', 'name', 'email', 'role', 'is_active']);

# Check specific user
$user = User::where('employee_id', 'ADMIN001')->first();
if ($user) {
    echo "User found: " . $user->name . PHP_EOL;
    echo "Active: " . ($user->is_active ? 'Yes' : 'No') . PHP_EOL;
    echo "Password check: " . (Hash::check('password', $user->password) ? 'Matches' : 'Does not match') . PHP_EOL;
} else {
    echo "User not found" . PHP_EOL;
}
```

### Option 3: Reset Password on Production

If user exists but password doesn't match:

```bash
php artisan tinker

$user = User::where('employee_id', 'ADMIN001')->first();
if ($user) {
    $user->password = Hash::make('password');
    $user->is_active = true;
    $user->save();
    echo "Password reset for ADMIN001" . PHP_EOL;
}
```

## Verification

After creating users on production, test login:
- Employee ID: `ADMIN001`
- Password: `password`

## Current Status

- ✅ Local database: Users exist and passwords are correct
- ❌ Production database: Users may not exist or passwords don't match
- ✅ Frontend: Correctly configured to use production API
- ✅ Backend code: Login logic is correct

## Next Steps

1. **SSH into production server**
2. **Check if users exist** in production database
3. **Create/reset users** if needed
4. **Test login** again


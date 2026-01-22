# Fix Test Users in Laravel Tinker

Run these commands in `php artisan tinker`:

## 1. Reset password for SUPER001
```php
$user = User::where('employee_id', 'SUPER001')->first();
$user->password = Hash::make('password');
$user->save();
echo "Password reset for SUPER001\n";
```

## 2. Activate LIMITED user
```php
$user = User::where('employee_id', 'LIMITED1766562318270')->first();
$user->is_active = 1;
$user->password = Hash::make('password');
$user->save();
echo "Activated and reset password for LIMITED1766562318270\n";
```

## 3. Verify passwords are set
```php
User::whereIn('employee_id', ['SUPER001', 'TEST001', 'EXEC002', 'LIMITED1766562318270'])
    ->select('employee_id', 'name', 'role', 'is_active')
    ->get()
    ->each(function($u) {
        echo "{$u->employee_id}: {$u->name} ({$u->role}) - Active: " . ($u->is_active ? 'Yes' : 'No') . "\n";
    });
```

## 4. Test login credentials
After running the above, try logging in with:
- **SUPER001** / **password**
- **TEST001** / **password**  
- **EXEC002** / **password**
- **LIMITED1766562318270** / **password** (after activation)


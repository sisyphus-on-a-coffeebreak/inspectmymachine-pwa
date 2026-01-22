-- ============================================
-- CREATE TEST USERS FOR VOMS
-- Run this in your Laravel backend database
-- ============================================

-- First, check if users already exist
SELECT employee_id, name, role, is_active 
FROM users 
WHERE employee_id IN ('SUPER001', 'TEST001', 'EXEC002', 'LIMITED1766562318270');

-- If they don't exist, create them
-- Note: You'll need to hash the password using Laravel's Hash::make('password')
-- Or use: php artisan tinker
-- Then: Hash::make('password') to get the hash

-- Example SQL (replace PASSWORD_HASH with actual bcrypt hash):
-- You can generate the hash using: php artisan tinker
-- Then run: Hash::make('password')

INSERT INTO users (employee_id, name, email, password, role, is_active, created_at, updated_at)
VALUES 
  ('SUPER001', 'Super Admin', 'superadmin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 1, NOW(), NOW()),
  ('TEST001', 'Test User', 'test@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'inspector', 1, NOW(), NOW()),
  ('EXEC002', 'Supervisor', 'supervisor@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'supervisor', 1, NOW(), NOW()),
  ('LIMITED1766562318270', 'Clerk User', 'clerk@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'clerk', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Note: The password hash above is for 'password' but you should generate your own
-- To generate a proper hash, run in Laravel Tinker:
-- php artisan tinker
-- Hash::make('password')


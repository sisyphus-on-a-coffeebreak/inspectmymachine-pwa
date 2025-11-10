-- SQL Queries to Check Users in Backend Database
-- Run these queries in your MySQL/PostgreSQL database

-- 1. Check all users with their basic information
SELECT 
    id,
    employee_id,
    name,
    email,
    role,
    is_active,
    created_at,
    last_login_at
FROM users
ORDER BY created_at DESC;

-- 2. Check specific test accounts
SELECT 
    id,
    employee_id,
    name,
    email,
    role,
    is_active,
    password  -- This will be hashed, not plain text
FROM users
WHERE employee_id IN ('SUPER001', 'ADMIN001', 'INSP001', 'GUARD001');

-- 3. Count total users
SELECT COUNT(*) as total_users FROM users;

-- 4. Check users by role
SELECT 
    role,
    COUNT(*) as count
FROM users
GROUP BY role;

-- 5. Check active vs inactive users
SELECT 
    is_active,
    COUNT(*) as count
FROM users
GROUP BY is_active;

-- 6. Check users created in the last 30 days
SELECT 
    id,
    employee_id,
    name,
    email,
    role,
    created_at
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;

-- 7. Find users with specific employee IDs (if you know the pattern)
SELECT 
    id,
    employee_id,
    name,
    email,
    role
FROM users
WHERE employee_id LIKE 'ADMIN%'
   OR employee_id LIKE 'SUPER%'
   OR employee_id LIKE 'INSP%'
   OR employee_id LIKE 'GUARD%';

-- 8. Check if password column exists and is hashed
SELECT 
    id,
    employee_id,
    LENGTH(password) as password_length,
    LEFT(password, 10) as password_preview  -- First 10 chars to see if it's bcrypt
FROM users
LIMIT 5;

-- Note: Bcrypt hashes typically start with $2y$ or $2a$ and are 60 characters long


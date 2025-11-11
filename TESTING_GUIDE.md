# Testing Guide for Phase 1 Implementation

## Prerequisites

1. **Full Laravel Installation**: The `vosm` directory contains partial files. You need to copy them into a full Laravel project.

2. **Database Setup**: Ensure your database is configured in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=voms
   DB_USERNAME=root
   DB_PASSWORD=
   ```

## Step 1: Copy Files to Full Laravel Project

If you have a full Laravel installation:

```bash
# Copy controllers
cp -r vosm/app/Http/Controllers/* /path/to/laravel/app/Http/Controllers/

# Copy models
cp -r vosm/app/Models/* /path/to/laravel/app/Models/

# Copy services
cp -r vosm/app/Services/* /path/to/laravel/app/Services/

# Copy migrations
cp -r vosm/database/migrations/* /path/to/laravel/database/migrations/

# Update routes (merge with existing routes/api.php)
cat vosm/routes/api.php >> /path/to/laravel/routes/api.php
```

## Step 2: Run Migrations

```bash
cd /path/to/laravel
php artisan migrate
```

**Note**: Make sure the following tables exist before running migrations:
- `users` (should already exist in Laravel)
- `visitor_gate_passes` (create if doesn't exist)
- `vehicle_entry_passes` (create if doesn't exist)
- `vehicle_exit_passes` (create if doesn't exist)
- `expenses` (create if doesn't exist)

## Step 3: Test Endpoints

### 1. Test Inspection Dashboard

```bash
# First, login to get a token
curl -X POST "http://localhost:8000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"employee_id":"ADMIN001","password":"password"}' \
  -c cookies.txt

# Test inspection dashboard
curl -X GET "http://localhost:8000/api/v1/inspection-dashboard" \
  -b cookies.txt \
  -H "Accept: application/json"
```

### 2. Test Gate Pass Creation

```bash
# Create visitor gate pass
curl -X POST "http://localhost:8000/api/visitor-gate-passes" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "visitor_name": "John Doe",
    "visitor_phone": "1234567890",
    "visitor_company": "Test Company",
    "purpose": "inspection",
    "valid_from": "2025-01-28 00:00:00",
    "valid_to": "2025-01-28 23:59:59",
    "notes": "Test visitor pass"
  }'
```

### 3. Test Gate Pass Approval

```bash
# List pending approvals
curl -X GET "http://localhost:8000/api/gate-pass-approval/pending?status=pending" \
  -b cookies.txt \
  -H "Accept: application/json"

# Approve a pass (replace {approvalRequestId} with actual ID)
curl -X POST "http://localhost:8000/api/gate-pass-approval/approve/{approvalRequestId}" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"notes": "Approved for testing"}'
```

### 4. Test Expense Approval

```bash
# Get expense stats
curl -X GET "http://localhost:8000/api/expense-approval/stats" \
  -b cookies.txt \
  -H "Accept: application/json"

# List pending expenses
curl -X GET "http://localhost:8000/api/expense-approval/pending?status=pending" \
  -b cookies.txt \
  -H "Accept: application/json"

# Approve an expense (replace {expenseId} with actual ID)
curl -X POST "http://localhost:8000/api/expense-approval/approve/{expenseId}" \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"notes": "Approved"}'
```

## Step 4: Test from Frontend

1. **Start the backend server**:
   ```bash
   cd /path/to/laravel
   php artisan serve
   ```

2. **Start the frontend**:
   ```bash
   cd /Users/narnolia/code/voms-pwa
   npm run dev
   ```

3. **Test the following pages**:
   - **Inspection Dashboard**: Navigate to `/app/inspections` - should show real stats
   - **Gate Pass Approval**: Navigate to `/app/gate-pass/approval` - should show pending approvals
   - **Expense Approval**: Navigate to `/app/expenses/approval` - should show pending expenses
   - **Create Gate Pass**: Navigate to `/app/gate-pass/create-visitor` - should create pass with QR code

## Expected Results

### Inspection Dashboard
- ✅ Should return real stats (not mock data)
- ✅ Should show recent inspections with inspector details
- ✅ Should calculate pass rate correctly
- ✅ Should show average duration

### Gate Pass Approval
- ✅ Should list pending approval requests
- ✅ Approve button should actually approve the pass
- ✅ Reject button should reject with reason
- ✅ Should show approval history

### Expense Approval
- ✅ Should show statistics (total, pending, approved, rejected)
- ✅ Should list expenses with filters
- ✅ Approve button should approve expense
- ✅ Reject button should reject with reason
- ✅ Bulk approve/reject should work

### QR Codes
- ✅ When creating a gate pass, should return `qr_payload` with verification URL
- ✅ QR code should contain secure token
- ✅ Token should expire after 30 days

## Troubleshooting

### Migration Errors

If you get errors about missing tables:

1. **Create missing tables manually** or create migrations for them:
   ```sql
   CREATE TABLE visitor_gate_passes (
       id CHAR(36) PRIMARY KEY,
       visitor_name VARCHAR(255) NOT NULL,
       visitor_phone VARCHAR(20) NOT NULL,
       -- Add other required fields
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

2. **Or modify migrations** to create tables if they don't exist

### Authentication Errors

- Make sure you're logged in and have a valid session
- Check that Sanctum is properly configured
- Verify CSRF token is being sent

### Route Not Found (404)

- Check that routes are registered: `php artisan route:list`
- Verify middleware is correct
- Check route prefix matches frontend API calls

### Database Errors

- Verify database connection in `.env`
- Check that all foreign key tables exist
- Ensure UUIDs are being used correctly

## Next Steps After Testing

1. Remove mock data from frontend files:
   - `src/pages/inspections/InspectionDashboard.tsx`
   - `src/pages/gatepass/PassApproval.tsx`
   - `src/pages/expenses/ExpenseApproval.tsx`

2. Add role-based authorization middleware to controllers

3. Add unit tests for controllers

4. Add integration tests for API endpoints

5. Set up proper error handling and logging


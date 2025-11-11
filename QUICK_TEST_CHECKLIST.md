# Quick Test Checklist

## ✅ Code Validation Complete

- ✅ All PHP files have valid syntax
- ✅ All migrations created
- ✅ All controllers created
- ✅ All models created
- ✅ All services created
- ✅ Routes configured

## 🧪 Testing Steps

### 1. Setup (If you have full Laravel installation)

```bash
# Navigate to your Laravel project
cd /path/to/your/laravel/project

# Copy files from vosm directory
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Http/Controllers/* app/Http/Controllers/
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Models/* app/Models/
cp -r /Users/narnolia/code/voms-pwa/vosm/app/Services app/
cp -r /Users/narnolia/code/voms-pwa/vosm/database/migrations/* database/migrations/

# Run migrations
php artisan migrate

# Start server
php artisan serve
```

### 2. Test Inspection Dashboard

**Frontend**: Navigate to `/app/inspections`
- Should show real stats (not mock data)
- Should display recent inspections

**API Test**:
```bash
curl -X GET "http://localhost:8000/api/v1/inspection-dashboard" \
  -H "Cookie: laravel_session=..." \
  -H "Accept: application/json"
```

### 3. Test Gate Pass Creation

**Frontend**: Navigate to `/app/gate-pass/create-visitor`
- Fill form and submit
- Should create pass with QR code
- Response should include `qr_payload`

**API Test**:
```bash
curl -X POST "http://localhost:8000/api/visitor-gate-passes" \
  -H "Content-Type: application/json" \
  -H "Cookie: laravel_session=..." \
  -d '{
    "visitor_name": "Test Visitor",
    "visitor_phone": "1234567890",
    "purpose": "inspection",
    "valid_from": "2025-01-28 00:00:00",
    "valid_to": "2025-01-28 23:59:59"
  }'
```

### 4. Test Gate Pass Approval

**Frontend**: Navigate to `/app/gate-pass/approval`
- Should list pending approvals
- Click "Approve" - should actually approve
- Click "Reject" - should reject with reason

**API Test**:
```bash
# List pending
curl -X GET "http://localhost:8000/api/gate-pass-approval/pending?status=pending" \
  -H "Cookie: laravel_session=..."

# Approve (replace {id} with actual ID)
curl -X POST "http://localhost:8000/api/gate-pass-approval/approve/{id}" \
  -H "Content-Type: application/json" \
  -H "Cookie: laravel_session=..." \
  -d '{"notes": "Approved"}'
```

### 5. Test Expense Approval

**Frontend**: Navigate to `/app/expenses/approval`
- Should show statistics
- Should list expenses
- Approve/Reject buttons should work

**API Test**:
```bash
# Get stats
curl -X GET "http://localhost:8000/api/expense-approval/stats" \
  -H "Cookie: laravel_session=..."

# List pending
curl -X GET "http://localhost:8000/api/expense-approval/pending?status=pending" \
  -H "Cookie: laravel_session=..."

# Approve (replace {id} with actual ID)
curl -X POST "http://localhost:8000/api/expense-approval/approve/{id}" \
  -H "Content-Type: application/json" \
  -H "Cookie: laravel_session=..." \
  -d '{"notes": "Approved"}'
```

## 📋 Files Created

### Migrations (5 files)
- `2025_01_27_000001_create_approval_requests_table.php`
- `2025_01_27_000002_create_approval_levels_table.php`
- `2025_01_27_000003_add_approval_fields_to_gate_passes.php`
- `2025_01_27_000004_add_approval_fields_to_expenses.php`
- `2025_01_27_000005_add_qr_code_fields_to_gate_passes.php`

### Models (2 files)
- `app/Models/ApprovalRequest.php`
- `app/Models/ApprovalLevel.php`

### Services (1 file)
- `app/Services/QRCodeService.php`

### Controllers (5 files)
- `app/Http/Controllers/Api/GatePassApprovalController.php`
- `app/Http/Controllers/Api/ExpenseApprovalController.php`
- `app/Http/Controllers/Api/VisitorGatePassController.php`
- `app/Http/Controllers/Api/VehicleEntryPassController.php`
- `app/Http/Controllers/Api/VehicleExitPassController.php`

### Updated Files
- `routes/api.php` - Added all new routes
- `app/Http/Controllers/InspectionDashboardController.php` - Fixed status enum

## 🎯 Expected Results

1. **Inspection Dashboard**: Real data instead of mock data
2. **Gate Pass Approval**: Buttons actually work (approve/reject)
3. **Expense Approval**: Buttons actually work (approve/reject/bulk)
4. **QR Codes**: Secure tokens instead of 6-digit codes
5. **Gate Pass Creation**: Returns QR payload with verification URL

## ⚠️ Important Notes

1. **Database Tables Required**: 
   - `visitor_gate_passes`
   - `vehicle_entry_passes`
   - `vehicle_exit_passes`
   - `expenses`
   - `users` (should already exist)

2. **If tables don't exist**: You'll need to create them first or modify migrations

3. **Authentication**: All endpoints require `auth:sanctum` middleware

4. **Role Authorization**: Add role checks if needed (admin, supervisor, etc.)

## 🐛 Common Issues

1. **Migration fails**: Check if base tables exist
2. **404 errors**: Verify routes are registered (`php artisan route:list`)
3. **Authentication errors**: Check Sanctum configuration
4. **Database errors**: Verify `.env` database settings


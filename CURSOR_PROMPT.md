# Cursor AI Prompt - VOMS PWA Backend Implementation

Copy and paste this into Cursor to get started:

---

## Context

I'm working on a **Vehicle Operations Management System (VOMS)** Progressive Web App. The frontend is built with React 19 + TypeScript and is **50-60% complete**. The backend is Laravel with Sanctum authentication.

**Current Status:**
- ✅ Authentication, user management, and gate pass creation work perfectly
- ✅ Inspection capture and expense submission are functional
- ❌ **Approval workflows are completely non-functional** (buttons exist but don't work)
- ❌ Dashboards show mock data instead of real data
- ❌ QR codes use dummy 6-digit codes instead of secure validation tokens

**My Goal:**
Implement the missing backend APIs so that approval workflows function correctly.

---

## Documentation Available

I have complete implementation documentation:

1. **README_IMPLEMENTATION.md** - Overview and decision guide
2. **QUICK_START_GUIDE.md** - Quick reference with code snippets
3. **IMPLEMENTATION_PLAN.md** - Complete technical specifications with full Laravel code examples
4. **API_ENDPOINTS_CHECKLIST.md** - All 65 endpoints listed (27 working, 38 to implement)

**Please read these files first** to understand the full scope.

---

## Phase 1: Critical Implementation (Priority)

I need to implement **Phase 1** from IMPLEMENTATION_PLAN.md. This includes:

### Task 1: Inspection Dashboard API (1 day)

**Endpoint:** `GET /api/v1/inspection-dashboard`

**What to create:**
1. Controller: `app/Http/Controllers/Api/InspectionDashboardController.php`
2. Route: Add to `routes/api.php`

**Requirements:**
- Return dashboard stats: `total_today`, `total_week`, `total_month`, `pending`, `completed`, `approved`, `rejected`, `pass_rate`, `avg_duration`, `critical_issues`
- Return recent 10 inspections with inspector details
- Calculate pass rate percentage
- Calculate average inspection duration in minutes
- Query the `inspections` table

**Response format:**
```json
{
  "stats": {
    "total_today": 5,
    "total_week": 23,
    "pass_rate": 85.5,
    "avg_duration": 45,
    "critical_issues": 2
  },
  "recent_inspections": [...]
}
```

**Frontend integration:**
- File: `src/pages/inspections/InspectionDashboard.tsx` line 52
- Remove mock data at lines 59-138 after endpoint works

---

### Task 2: Gate Pass Approval API (4 days)

**Database migrations needed:**
```sql
-- Create approval_requests table
CREATE TABLE approval_requests (
    id CHAR(36) PRIMARY KEY,
    pass_id CHAR(36) NOT NULL,
    pass_type ENUM('visitor', 'vehicle') NOT NULL,
    requester_id CHAR(36) NOT NULL,
    approval_level INT DEFAULT 1,
    current_approver_role VARCHAR(50),
    status ENUM('pending', 'approved', 'rejected', 'escalated') DEFAULT 'pending',
    approval_notes TEXT NULL,
    rejection_reason TEXT NULL,
    escalation_reason TEXT NULL,
    approved_by CHAR(36) NULL,
    approved_at TIMESTAMP NULL,
    rejected_by CHAR(36) NULL,
    rejected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (rejected_by) REFERENCES users(id)
);

-- Create approval_levels table
CREATE TABLE approval_levels (
    id CHAR(36) PRIMARY KEY,
    approval_request_id CHAR(36) NOT NULL,
    level INT NOT NULL,
    approver_role VARCHAR(50) NOT NULL,
    approver_id CHAR(36) NULL,
    required BOOLEAN DEFAULT true,
    status ENUM('pending', 'approved', 'rejected', 'skipped') DEFAULT 'pending',
    notes TEXT NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Add approval fields to gate passes
ALTER TABLE visitor_gate_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL;

ALTER TABLE vehicle_entry_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL;

ALTER TABLE vehicle_exit_passes
ADD COLUMN requires_approval BOOLEAN DEFAULT false,
ADD COLUMN approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
ADD COLUMN approval_request_id CHAR(36) NULL;
```

**Models to create:**
1. `app/Models/ApprovalRequest.php` (with relationships to User, ApprovalLevel)
2. `app/Models/ApprovalLevel.php`

**Controller to create:**
`app/Http/Controllers/Api/GatePassApprovalController.php`

**6 Endpoints needed:**
1. `GET /api/gate-pass-approval/pending` - List pending approvals (with status filter)
2. `GET /api/gate-pass-approval/pass-details/{passId}` - Get pass details
3. `GET /api/gate-pass-approval/history/{approvalRequestId}` - Get approval history
4. `POST /api/gate-pass-approval/approve/{approvalRequestId}` - Approve pass (body: `{notes: string}`)
5. `POST /api/gate-pass-approval/reject/{approvalRequestId}` - Reject pass (body: `{reason: string}`)
6. `POST /api/gate-pass-approval/escalate/{approvalRequestId}` - Escalate to next level

**Authorization:**
- All endpoints require `auth:sanctum` middleware
- Require role: `admin`, `super_admin`, or `supervisor`

**Frontend integration:**
- File: `src/pages/gatepass/PassApproval.tsx`
- Remove mock data at lines 73-103, 116-128, 138-154

**Important:** Use database transactions for approve/reject/escalate operations.

---

### Task 3: Expense Approval API (3.5 days)

**Database migration:**
```sql
ALTER TABLE expenses
ADD COLUMN approved_by CHAR(36) NULL,
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN rejected_by CHAR(36) NULL,
ADD COLUMN rejected_at TIMESTAMP NULL,
ADD COLUMN rejection_reason TEXT NULL,
ADD FOREIGN KEY (approved_by) REFERENCES users(id),
ADD FOREIGN KEY (rejected_by) REFERENCES users(id),
ADD INDEX idx_status (status),
ADD INDEX idx_approved_at (approved_at);
```

**Controller to create:**
`app/Http/Controllers/Api/ExpenseApprovalController.php`

**6 Endpoints needed:**
1. `GET /api/expense-approval/pending` - List expenses (with status filter: all|pending|approved|rejected)
2. `GET /api/expense-approval/stats` - Get approval statistics
3. `POST /api/expense-approval/approve/{expenseId}` - Approve expense (body: `{notes?: string}`)
4. `POST /api/expense-approval/reject/{expenseId}` - Reject expense (body: `{reason: string}`)
5. `POST /api/expense-approval/bulk-approve` - Bulk approve (body: `{expense_ids: string[], notes?: string}`)
6. `POST /api/expense-approval/bulk-reject` - Bulk reject (body: `{expense_ids: string[], reason: string}`)

**Stats endpoint should return:**
```json
{
  "total_expenses": 45,
  "pending": 12,
  "approved": 28,
  "rejected": 5,
  "approved_amount": 125000,
  "pending_amount": 35000,
  "average_amount": 3500
}
```

**Authorization:**
- Require `auth:sanctum` middleware
- Require role: `admin`, `super_admin`, or `supervisor`

**Frontend integration:**
- File: `src/pages/expenses/ExpenseApproval.tsx`
- Remove mock data at lines 62-91, 102-110

---

### Task 4: QR Code Secure Payload (0.5 days)

**Problem:**
- Current QR codes contain 6-digit access codes
- Frontend PDF generator rejects these (see `src/lib/pdf-generator-simple.ts:358`)
- Guards can't actually validate passes

**Solution:**
Create a service to generate secure verification URLs.

**Database migration:**
```sql
ALTER TABLE visitor_gate_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;

ALTER TABLE vehicle_entry_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;

ALTER TABLE vehicle_exit_passes
ADD COLUMN qr_payload TEXT NULL,
ADD COLUMN qr_token VARCHAR(100) UNIQUE NULL,
ADD COLUMN qr_expires_at TIMESTAMP NULL;
```

**Service to create:**
`app/Services/QRCodeService.php`

**Methods needed:**
1. `generatePayload(string $passId, string $passType): array`
   - Generate random 32-char token
   - Set expiry to 30 days from now
   - Return `['qr_payload' => 'https://yourapp.com/api/gate-pass-validation/verify?token=...', 'qr_token' => '...', 'qr_expires_at' => ...]`

2. `verifyToken(string $token): ?array`
   - Find pass by token
   - Check expiry
   - Return pass details or null

**Update existing controllers:**
- `VisitorGatePassController` store() method
- `VehicleEntryPassController` store() method
- `VehicleExitPassController` store() method

After creating a pass, call `QRCodeService::generatePayload()` and save the result.

**Response format (when creating pass):**
```json
{
  "success": true,
  "pass": {
    "id": "uuid",
    "pass_number": "VP123456",
    "qr_payload": "https://yourapp.com/api/gate-pass-validation/verify?token=abc123...",
    "access_code": "123456"
  }
}
```

---

## Instructions for Cursor

Please help me implement Phase 1 in this order:

1. **First:** Create the database migrations for all tasks
2. **Second:** Create the models (ApprovalRequest, ApprovalLevel)
3. **Third:** Create the controllers with all endpoints
4. **Fourth:** Create the QRCodeService
5. **Fifth:** Update the routes in `routes/api.php`
6. **Finally:** Update existing gate pass controllers to use QRCodeService

**Code Style Requirements:**
- Use Laravel best practices
- Use database transactions for multi-step operations
- Add proper validation to all requests
- Return consistent JSON responses: `{success: true, message: '...', data: {...}}`
- Log important actions (approvals, rejections)
- Use UUIDs for primary keys (already set up)
- Follow existing code style in the project

**Testing:**
After implementing, I'll test with these accounts:
- SUPER001 / password (super_admin)
- ADMIN001 / password (admin)
- INSP001 / password (inspector)
- GUARD001 / password (guard)

**Reference:**
- See IMPLEMENTATION_PLAN.md for complete code examples
- See API_ENDPOINTS_CHECKLIST.md for all endpoint details
- Frontend files already have the correct API call structure

---

## Expected Output

After you complete this, I should be able to:
1. ✅ Load inspection dashboard and see real stats (not mock data)
2. ✅ Navigate to Pass Approval page and see pending approvals
3. ✅ Click "Approve" button and have it actually approve the pass
4. ✅ Click "Reject" button and have it reject with a reason
5. ✅ Create a gate pass and get a QR code with verification URL
6. ✅ Approve/reject expenses from Expense Approval page

---

## Questions to Answer Before Starting

1. What's the base URL of the Laravel backend? (e.g., http://localhost:8000)
2. Are there existing migrations I should be aware of?
3. What's the current database schema for `inspections`, `expenses`, and gate pass tables?

---

## Let's Start!

Please begin with:
1. Analyzing the existing codebase structure
2. Creating the migration files
3. Generating the models and controllers
4. Implementing the endpoints one by one

Start with Task 1 (Inspection Dashboard) as it's the simplest and will give us quick validation that everything works.

Let me know if you need clarification on anything!

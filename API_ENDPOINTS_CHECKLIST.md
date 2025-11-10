# 🔌 VOMS PWA - API Endpoints Checklist

**Quick reference for all endpoints that need to be implemented**

---

## ✅ Already Working (No action needed)

### Authentication
- ✅ `POST /sanctum/csrf-cookie` - CSRF token
- ✅ `POST /api/login` - User login
- ✅ `POST /api/logout` - User logout
- ✅ `GET /api/user` - Current user profile

### Gate Pass
- ✅ `GET /api/visitor-gate-passes` - List visitor passes
- ✅ `POST /api/visitor-gate-passes` - Create visitor pass
- ✅ `GET /api/vehicle-entry-passes` - List vehicle entries
- ✅ `POST /api/vehicle-entry-passes` - Create vehicle entry
- ✅ `GET /api/vehicle-exit-passes` - List vehicle exits
- ✅ `POST /api/vehicle-exit-passes` - Create vehicle exit
- ✅ `GET /api/yards` - List yards
- ✅ `POST /api/yards` - Create custom yard
- ✅ `GET /api/gate-pass-validation/history/{id}` - Validation history

### Expenses
- ✅ `GET /api/v1/expenses?mine=true` - User's expenses
- ✅ `POST /api/v1/expenses` - Create expense
- ✅ `GET /api/v1/expense-templates` - List templates
- ✅ `GET /api/v1/projects` - List projects
- ✅ `GET /api/v1/assets` - List assets
- ✅ `GET /api/v1/float/me` - User's advance balance

### Inspections
- ✅ `GET /api/v1/inspection-templates/{id}` - Get template
- ✅ `POST /api/v1/inspections` - Create inspection
- ✅ `POST /api/v1/inspection-answers` - Submit answers
- ✅ `GET /api/v1/inspection-answers/{id}` - Get answers

### User Management
- ✅ `GET /api/v1/users` - List users
- ✅ `POST /api/v1/users` - Create user
- ✅ `PUT /api/v1/users/{id}` - Update user
- ✅ `DELETE /api/v1/users/{id}` - Delete user
- ✅ `POST /api/v1/users/{id}/reset-password` - Reset password

---

## ❌ Phase 1: CRITICAL - Must Implement First (9 days)

### 1. Inspection Dashboard (1 endpoint)
- [ ] `GET /api/v1/inspection-dashboard` - Dashboard stats & recent inspections
  - **Priority:** 🔴 P0
  - **Used by:** InspectionDashboard.tsx:52
  - **Returns:** `{ stats: {...}, recent_inspections: [...] }`
  - **Controller:** `InspectionDashboardController.php`
  - **Time:** 1 day

### 2. Gate Pass Approval (6 endpoints)
- [ ] `GET /api/gate-pass-approval/pending` - List approval requests
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:67
  - **Returns:** Array of approval requests
  - **Time:** 1 day

- [ ] `GET /api/gate-pass-approval/pass-details/{passId}` - Get pass details
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:111
  - **Returns:** Pass details object
  - **Time:** 0.5 days

- [ ] `GET /api/gate-pass-approval/history/{requestId}` - Approval history
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:133
  - **Returns:** Array of approval levels
  - **Time:** 0.5 days

- [ ] `POST /api/gate-pass-approval/approve/{requestId}` - Approve pass
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:172
  - **Body:** `{ notes: string }`
  - **Time:** 1 day

- [ ] `POST /api/gate-pass-approval/reject/{requestId}` - Reject pass
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:196
  - **Body:** `{ reason: string }`
  - **Time:** 0.5 days

- [ ] `POST /api/gate-pass-approval/escalate/{requestId}` - Escalate pass
  - **Priority:** 🔴 P0
  - **Used by:** PassApproval.tsx:216
  - **Body:** `{ reason: string }`
  - **Time:** 0.5 days

**Database Tables Needed:**
- [ ] Create `approval_requests` table
- [ ] Create `approval_levels` table
- [ ] Add approval fields to gate pass tables

**Controller:** `GatePassApprovalController.php`
**Total Time:** 4 days

### 3. Expense Approval (6 endpoints)
- [ ] `GET /api/expense-approval/pending` - List pending expenses
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:55
  - **Query:** `?status=pending|approved|rejected|all`
  - **Returns:** Array of expenses with employee info
  - **Time:** 1 day

- [ ] `GET /api/expense-approval/stats` - Approval statistics
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:97
  - **Returns:** `{ total_expenses, pending, approved, rejected, amounts }`
  - **Time:** 0.5 days

- [ ] `POST /api/expense-approval/approve/{expenseId}` - Approve expense
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:127
  - **Body:** `{ notes?: string }`
  - **Time:** 0.5 days

- [ ] `POST /api/expense-approval/reject/{expenseId}` - Reject expense
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:142
  - **Body:** `{ reason: string }`
  - **Time:** 0.5 days

- [ ] `POST /api/expense-approval/bulk-approve` - Bulk approve
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:166
  - **Body:** `{ expense_ids: string[], notes?: string }`
  - **Time:** 0.5 days

- [ ] `POST /api/expense-approval/bulk-reject` - Bulk reject
  - **Priority:** 🔴 P0
  - **Used by:** ExpenseApproval.tsx:194
  - **Body:** `{ expense_ids: string[], reason: string }`
  - **Time:** 0.5 days

**Database Changes:**
- [ ] Add approval fields to `expenses` table

**Controller:** `ExpenseApprovalController.php`
**Total Time:** 3.5 days

### 4. QR Code Fix (1 service)
- [ ] Create `QRCodeService.php` - Generate secure QR payloads
  - **Priority:** 🔴 P0
  - **Method:** `generatePayload(passId, passType)`
  - **Returns:** `{ qr_payload, qr_token, qr_expires_at }`
  - **Used by:** Gate pass creation endpoints
  - **Time:** 0.5 days

**Database Changes:**
- [ ] Add `qr_payload`, `qr_token`, `qr_expires_at` to gate pass tables

**Total Time:** 0.5 days

**Phase 1 Total: 9 days**

---

## ❌ Phase 2: HIGH - Analytics & Dashboards (7 days)

### 4. Asset Management (1 endpoint)
- [ ] `GET /api/assets/management` - Asset expenses dashboard
  - **Priority:** 🟠 P1
  - **Used by:** AssetManagementDashboard.tsx:76
  - **Returns:** `{ assets: [...], summary: {...} }`
  - **Controller:** `AssetManagementController.php`
  - **Time:** 2 days

### 5. Project Management (1 endpoint)
- [ ] `GET /api/projects/management` - Project budgets dashboard
  - **Priority:** 🟠 P1
  - **Used by:** ProjectManagementDashboard.tsx:80
  - **Returns:** `{ projects: [...], summary: {...} }`
  - **Controller:** `ProjectManagementController.php`
  - **Time:** 2 days

### 6. Cashflow Analysis (2 endpoints)
- [ ] `GET /api/expenses/cashflow-analysis` - Cashflow data
  - **Priority:** 🟠 P1
  - **Used by:** CashflowAnalysisDashboard.tsx:87
  - **Query:** `?period=week|month|quarter|year`
  - **Returns:** `{ cashflow_data, trends, categories }`
  - **Time:** 1.5 days

- [ ] `GET /api/expenses/investment-analysis` - Investment data
  - **Priority:** 🟠 P1
  - **Used by:** CashflowAnalysisDashboard.tsx:94
  - **Returns:** Investment analysis data
  - **Time:** 0.5 days

### 7. Expense Reports (1 endpoint)
- [ ] `GET /api/expense-reports/summary` - Comprehensive reports
  - **Priority:** 🟠 P1
  - **Used by:** ExpenseReports.tsx:103
  - **Query:** `?start_date=...&end_date=...&category=...`
  - **Returns:** `{ summary, by_category, by_employee, by_project, timeline }`
  - **Time:** 2 days

**Phase 2 Total: 7 days**

---

## ❌ Phase 3: MEDIUM - Pass Management (8 days)

### 8. Gate Pass Templates (4 endpoints)
- [ ] `GET /api/gate-pass-templates` - List templates
  - **Priority:** 🟡 P2
  - **Used by:** PassTemplates.tsx:52
  - **Time:** 0.5 days

- [ ] `POST /api/gate-pass-templates` - Create template
  - **Priority:** 🟡 P2
  - **Used by:** PassTemplates.tsx
  - **Time:** 0.5 days

- [ ] `PUT /api/gate-pass-templates/{id}` - Update template
  - **Priority:** 🟡 P2
  - **Used by:** PassTemplates.tsx
  - **Time:** 0.5 days

- [ ] `DELETE /api/gate-pass-templates/{id}` - Delete template
  - **Priority:** 🟡 P2
  - **Used by:** PassTemplates.tsx
  - **Time:** 0.5 days

**Database:**
- [ ] Create `gate_pass_templates` table

**Total Time:** 2 days

### 9. Gate Pass Reports (1 endpoint)
- [ ] `GET /api/gate-pass-reports/stats` - Pass statistics
  - **Priority:** 🟡 P2
  - **Used by:** GatePassReports.tsx:91
  - **Returns:** `{ summary, trends, by_purpose }`
  - **Time:** 2 days

### 10. Gate Pass Calendar (1 endpoint)
- [ ] `GET /api/gate-pass-calendar` - Calendar events
  - **Priority:** 🟡 P2
  - **Used by:** GatePassCalendar.tsx:61
  - **Query:** `?start_date=...&end_date=...`
  - **Returns:** `{ events: [...] }`
  - **Time:** 1 day

### 11. Visitor Management (2 endpoints)
- [ ] `GET /api/visitor-management/visitors` - List visitors
  - **Priority:** 🟡 P2
  - **Used by:** VisitorManagement.tsx:59
  - **Returns:** `{ visitors: [...], stats: {...} }`
  - **Time:** 1 day

- [ ] `PUT /api/visitor-management/visitors/{id}/status` - Update status
  - **Priority:** 🟡 P2
  - **Used by:** VisitorManagement.tsx:140
  - **Body:** `{ status: 'blacklisted', reason: string }`
  - **Time:** 1 day

- [ ] `GET /api/visitor-management/stats` - Visitor statistics
  - **Priority:** 🟡 P2
  - **Used by:** VisitorManagement.tsx
  - **Time:** 0.5 days

**Database:**
- [ ] Add visitor status fields to gate pass tables

**Total Time:** 1.5 days

### 12. Pass Validation (1 endpoint)
- [ ] `POST /api/gate-pass-validation/verify` - Verify QR token
  - **Priority:** 🟡 P2
  - **Used by:** PassValidation.tsx
  - **Body:** `{ token: string, gate_id: string, action: 'entry'|'exit' }`
  - **Returns:** `{ valid: boolean, pass: {...}, validation: {...} }`
  - **Time:** 1 day

**Phase 3 Total: 8 days**

---

## ❌ Phase 4: NICE-TO-HAVE - Polish & Features (11 days)

### 13. Bulk Operations (3 endpoints)
- [ ] `POST /api/gate-pass-bulk/import` - Import from CSV
  - **Priority:** 🔵 P3
  - **Used by:** BulkOperations.tsx:66
  - **Time:** 2 days

- [ ] `POST /api/gate-pass-bulk/export` - Export to CSV
  - **Priority:** 🔵 P3
  - **Used by:** BulkOperations.tsx
  - **Time:** 1 day

- [ ] `POST /api/gate-pass-bulk/create` - Create multiple passes
  - **Priority:** 🔵 P3
  - **Used by:** BulkOperations.tsx
  - **Time:** 1 day

**Total Time:** 4 days

### 14. Export Functionality (3 endpoints)
- [ ] `POST /api/expenses/export` - Export expenses to Excel
  - **Priority:** 🔵 P3
  - **Time:** 1 day

- [ ] `POST /api/gate-pass/export` - Export passes to Excel
  - **Priority:** 🔵 P3
  - **Time:** 1 day

- [ ] `POST /api/inspections/export` - Export inspections to Excel
  - **Priority:** 🔵 P3
  - **Time:** 1 day

**Total Time:** 3 days

### 15. Notifications (Backend Setup)
- [ ] Email notification system
  - **Priority:** 🔵 P3
  - **Time:** 2 days

- [ ] SMS notification system (optional)
  - **Priority:** 🔵 P3
  - **Time:** 1 day

**Total Time:** 3 days

### 16. Real-time Updates (WebSocket)
- [ ] WebSocket server setup
  - **Priority:** 🔵 P3
  - **Time:** 2 days

- [ ] Real-time approval notifications
  - **Priority:** 🔵 P3
  - **Time:** 1 day

**Total Time:** 3 days

**Phase 4 Total: 11 days**

---

## 📊 Summary Statistics

### By Priority
| Priority | Count | Total Days |
|----------|-------|------------|
| 🔴 P0 (Critical) | 15 endpoints | 9 days |
| 🟠 P1 (High) | 5 endpoints | 7 days |
| 🟡 P2 (Medium) | 9 endpoints | 8 days |
| 🔵 P3 (Nice-to-have) | 9 endpoints | 11 days |
| **Total** | **38 endpoints** | **35 days** |

### By Module
| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 4 | ✅ Complete |
| User Management | 5 | ✅ Complete |
| Gate Pass Creation | 7 | ✅ Complete |
| Gate Pass Approval | 6 | ❌ Missing |
| Gate Pass Templates | 4 | ❌ Missing |
| Gate Pass Reports | 1 | ❌ Missing |
| Gate Pass Validation | 1 | ❌ Missing |
| Inspections Creation | 4 | ✅ Complete |
| Inspection Dashboard | 1 | ❌ Missing |
| Expenses Creation | 6 | ✅ Complete |
| Expense Approval | 6 | ❌ Missing |
| Expense Analytics | 4 | ❌ Missing |
| Asset Management | 1 | ❌ Missing |
| Project Management | 1 | ❌ Missing |
| Visitor Management | 3 | ❌ Missing |
| Bulk Operations | 3 | ❌ Missing |
| Exports | 3 | ❌ Missing |

---

## 🎯 Quick Progress Tracker

**Copy this section and check off as you complete:**

### Week 1-2: Critical Endpoints
- [ ] Day 1-2: Inspection Dashboard
- [ ] Day 3-5: Gate Pass Approval (6 endpoints)
- [ ] Day 6-8: Expense Approval (6 endpoints)
- [ ] Day 9: QR Code Fix

### Week 2-3: Analytics
- [ ] Day 10-11: Asset Management
- [ ] Day 12-13: Project Management
- [ ] Day 14-15: Cashflow Analysis
- [ ] Day 16-17: Expense Reports

### Week 3-4: Pass Management
- [ ] Day 18-19: Templates & Reports
- [ ] Day 20: Calendar
- [ ] Day 21-22: Visitor Management
- [ ] Day 23: Pass Validation

### Week 4+: Polish
- [ ] Day 24-27: Bulk Operations
- [ ] Day 28-30: Exports
- [ ] Day 31-33: Notifications
- [ ] Day 34-35: Real-time

---

## 📝 Notes

- All endpoints require `auth:sanctum` middleware
- Admin/approval endpoints also need role middleware
- Remember to add CORS configuration
- Add rate limiting to prevent abuse
- Log all approval/rejection actions
- Send notifications for important events
- Use database transactions for multi-step operations

---

**Last Updated:** 2025-11-10
**Total Endpoints:** 38 to implement (27 working already)
**Estimated Completion:** 35 days (7 weeks)

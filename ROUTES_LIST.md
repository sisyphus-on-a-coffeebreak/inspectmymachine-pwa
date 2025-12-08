# Complete Routes List
## VOMS PWA - All Application Routes

**Total Routes:** 77 routes (including redirects and catch-all)

---

## Public Routes

| Path | Component | Description | Auth Required |
|------|-----------|-------------|---------------|
| `/` | Redirect | Redirects to `/dashboard` | No |
| `/login` | `Login` | Login page | No |
| `/offline` | `OfflinePage` | Offline indicator page | No |

---

## Main Dashboard

| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/dashboard` | `Dashboard` | Main dashboard with widgets | All authenticated users |

---

## 🚪 Gate Pass Module (15 routes)

| Path | Component | Description | Roles | Notes |
|------|-----------|-------------|-------|-------|
| `/app/gate-pass/:id` | `GatePassDetails` | Gate pass detail view | All | Deep linking route |
| `/app/gate-pass` | `GatePassDashboard` | Gate pass dashboard | All | Main entry point |
| `/app/gate-pass/create` | `CreateGatePass` | Create gate pass form | All | Unified form |
| `/app/gate-pass/create-visitor` | Redirect | Redirects to create with `?type=visitor` | All | Legacy route |
| `/app/gate-pass/create-vehicle` | Redirect | Redirects to create with `?type=outbound` | All | Legacy route |
| `/app/gate-pass/guard-register` | `GuardRegister` | Guard entry/exit register | All | Guard logging |
| `/app/gate-pass/reports` | `GatePassReports` | Gate pass reports | super_admin, admin | Analytics |
| `/app/gate-pass/templates` | `PassTemplates` | Pass templates management | super_admin, admin | Template CRUD |
| `/app/gate-pass/visitors` | `VisitorManagement` | Visitor management | All | Visitor list |
| `/app/gate-pass/calendar` | `GatePassCalendar` | Calendar view | All | Calendar interface |
| `/app/gate-pass/scan` | `QuickValidation` | QR scanner for validation | super_admin, admin, supervisor, guard | Guard validation |
| `/app/gate-pass/validation` | Redirect | Redirects to `/app/gate-pass/scan` | All | Legacy route |
| `/app/gate-pass/quick-validation` | Redirect | Redirects to `/app/gate-pass/scan` | All | Legacy route |
| `/app/gate-pass/approval` | Redirect | Redirects to `/app/approvals?tab=gate_pass` | All | Unified approvals |
| `/app/gate-pass/bulk` | `BulkOperations` | Bulk operations | super_admin, admin | Bulk actions |

---

## 🎯 Inspections Module (9 routes)

| Path | Component | Description | Roles | Notes |
|------|-----------|-------------|-------|-------|
| `/app/inspections` | `InspectionDashboard` | Inspections dashboard | All | Main entry point |
| `/app/inspections/studio` | `InspectionStudio` | Template management studio | super_admin, admin | Template builder |
| `/app/inspections/sync` | `InspectionSyncCenter` | Offline sync center | All | Sync queue management |
| `/app/inspections/new` | `TemplateSelectionPage` | Template selection | All | Start new inspection |
| `/app/inspections/:id` | `InspectionDetails` | Inspection detail view | All | Deep linking route |
| `/app/inspections/completed` | `InspectionsCompleted` | Completed inspections list | All | Completed list |
| `/app/inspections/reports` | `InspectionReports` | Inspection reports | All | Reports & analytics |
| `/app/inspections/:templateId/capture` | `InspectionCapture` | Capture form (no vehicle) | All | Multi-section form |
| `/app/inspections/:templateId/:vehicleId/capture` | `InspectionCapture` | Capture form (with vehicle) | All | Pre-filled vehicle |

**Legacy Routes:**
| Path | Redirects To | Notes |
|------|--------------|-------|
| `/inspections/:id` | `/app/inspections/:id` | Legacy route redirect |

---

## 💰 Expenses Module (16 routes)

| Path | Component | Description | Roles | Notes |
|------|-----------|-------------|-------|-------|
| `/app/expenses/:id` | `ExpenseDetails` | Expense detail view | All | Deep linking route |
| `/app/expenses` | `EmployeeExpenseDashboard` | Employee expense dashboard | All | Main entry point |
| `/app/expenses/create` | `CreateExpense` | Create expense form | All | Expense form |
| `/app/expenses/history` | `ExpenseHistory` | Expense history | All | Historical list |
| `/app/expenses/ledger` | `EmployeeLedger` | Employee ledger | All | Personal ledger |
| `/app/expenses/reconciliation` | `LedgerReconciliation` | Ledger reconciliation | All | Reconciliation view |
| `/app/expenses/advances/:advanceId/ledger` | `AdvanceLedgerView` | Advance ledger view | All | Advance details |
| `/app/expenses/analytics` | `ExpenseAnalytics` | Unified analytics page | super_admin, admin | Tabbed analytics |
| `/app/expenses/reports` | `ExpenseReports` | Expense reports | super_admin, admin | Reports |

**Redirect Routes (to Analytics):**
| Path | Redirects To | Tab |
|------|--------------|-----|
| `/app/expenses/categories` | `/app/expenses/analytics?tab=by-category` | by-category |
| `/app/expenses/assets` | `/app/expenses/analytics?tab=assets` | assets |
| `/app/expenses/projects` | `/app/expenses/analytics?tab=by-project` | by-project |
| `/app/expenses/cashflow` | `/app/expenses/analytics?tab=cashflow` | cashflow |
| `/app/expenses/accounts` | `/app/expenses/analytics?tab=by-account` | by-account |
| `/app/expenses/approval` | `/app/approvals?tab=expense` | expense (approvals) |

**Other Routes:**
| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/app/expenses/receipts` | `ReceiptsGallery` | Receipts gallery | All |

---

## ✅ Unified Approvals (1 route)

| Path | Component | Description | Roles | Notes |
|------|-----------|-------------|-------|-------|
| `/app/approvals` | `UnifiedApprovals` | Unified approvals hub | super_admin, admin, supervisor | Tabs: gate_pass, expense, transfer |

---

## 🚨 Alerts & Notifications (3 routes)

| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/app/alerts` | `AlertDashboard` | System alerts dashboard | super_admin, admin, supervisor |
| `/app/notifications` | `NotificationsPage` | Notifications list | All |
| `/app/notifications/preferences` | `NotificationPreferences` | Notification preferences | All |

---

## ⚙️ Settings (1 route)

| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/app/settings/report-branding` | `ReportBranding` | Report branding settings | super_admin, admin |

---

## 🎯 Stockyard Module (20 routes)

### Main Routes

| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/app/stockyard` | `StockyardDashboard` | Stockyard dashboard | All |
| `/app/stockyard/create` | `CreateComponentMovement` | Create component movement | All |
| `/app/stockyard/scan` | `StockyardScan` | Scan vehicle/component | All |
| `/app/stockyard/analytics` | `StockyardAnalytics` | Stockyard analytics | All |
| `/app/stockyard/alerts` | `StockyardAlertsDashboard` | Stockyard alerts | All |
| `/app/stockyard/:id` | `StockyardRequestDetails` | Request details | All | Deep linking route |

### Component Routes

| Path | Component | Description | Roles | Notes |
|------|-----------|-------------|-------|-------|
| `/app/stockyard/components` | `ComponentLedger` | Component ledger | All | Main component list |
| `/app/stockyard/components/:id` | `ComponentDetails` | Component details | All | Deep linking route |

**Redirect Routes:**
| Path | Redirects To | Notes |
|------|--------------|-------|
| `/app/stockyard/components/create` | `/app/stockyard/components?action=create` | Query param redirect |
| `/app/stockyard/components/transfers/approvals` | `/app/approvals?tab=transfer` | Unified approvals |
| `/app/stockyard/components/cost-analysis` | `/app/stockyard/analytics?tab=cost` | Analytics tab |
| `/app/stockyard/components/health` | `/app/stockyard/analytics?tab=health` | Analytics tab |
| `/app/stockyard/components/:type/:id/edit` | `/app/stockyard/components/:id?action=edit` | Query param redirect |
| `/app/stockyard/components/:type/:id` | `/app/stockyard/components/:id` | Simplified route |

### Request Sub-Routes (Redirects)

| Path | Redirects To | Notes |
|------|--------------|-------|
| `/app/stockyard/yards/:yardId/map` | `/app/stockyard/:id?tab=map` | Tab-based view |
| `/app/stockyard/requests/:requestId/checklist` | `/app/stockyard/:requestId?tab=checklists` | Tab-based view |
| `/app/stockyard/buyer-readiness` | `/app/stockyard?tab=readiness` | Tab-based view |
| `/app/stockyard/vehicles/:vehicleId/timeline` | `/app/stockyard/:id?tab=timeline` | Tab-based view |
| `/app/stockyard/requests/:requestId/documents` | `/app/stockyard/:requestId?tab=documents` | Tab-based view |
| `/app/stockyard/requests/:requestId/transporter-bids` | `/app/stockyard/:requestId?tab=bids` | Tab-based view |
| `/app/stockyard/vehicles/:vehicleId/profitability` | `/app/stockyard/analytics?tab=profitability` | Analytics tab |

---

## 👥 User Management Module (5 routes)

| Path | Component | Description | Roles |
|------|-----------|-------------|-------|
| `/app/admin/users` | `UserManagement` | User list | super_admin, admin |
| `/app/admin/users/:id` | `UserDetails` | User details | super_admin, admin |
| `/app/admin/users/activity` | `UserActivityDashboard` | User activity dashboard | super_admin, admin |
| `/app/admin/users/capability-matrix` | `CapabilityMatrix` | Capability matrix | super_admin, admin |
| `/app/admin/users/bulk-operations` | `BulkUserOperations` | Bulk user operations | super_admin, admin |

---

## Error Routes

| Path | Component | Description |
|------|-----------|-------------|
| `*` (catch-all) | `NotFound` | 404 Not Found page |

---

## Route Statistics

### By Module

| Module | Direct Routes | Redirect Routes | Total |
|--------|---------------|-----------------|-------|
| Public | 3 | 0 | 3 |
| Dashboard | 1 | 0 | 1 |
| Gate Pass | 11 | 4 | 15 |
| Inspections | 8 | 1 | 9 |
| Expenses | 9 | 7 | 16 |
| Approvals | 1 | 0 | 1 |
| Alerts/Notifications | 3 | 0 | 3 |
| Settings | 1 | 0 | 1 |
| Stockyard | 6 | 14 | 20 |
| User Management | 5 | 0 | 5 |
| Error | 1 | 0 | 1 |
| **Total** | **49** | **26** | **75** |

### By Route Type

| Type | Count | Percentage |
|------|-------|------------|
| Direct Routes | 49 | 65.3% |
| Redirect Routes | 26 | 34.7% |
| **Total** | **75** | **100%** |

### By Authentication

| Auth Level | Count |
|------------|-------|
| Public (No Auth) | 3 |
| Authenticated | 72 |
| **Total** | **75** |

### By Role Restriction

| Role Restriction | Count |
|------------------|-------|
| All authenticated users | ~50 |
| super_admin, admin | ~15 |
| super_admin, admin, supervisor | ~5 |
| super_admin, admin, supervisor, guard | ~2 |
| **Total** | **~72** |

---

## Route Patterns

### Deep Linking Routes

Routes that support direct access via ID:
- `/app/gate-pass/:id` - Gate pass details
- `/app/inspections/:id` - Inspection details
- `/app/expenses/:id` - Expense details
- `/app/stockyard/:id` - Stockyard request details
- `/app/stockyard/components/:id` - Component details
- `/app/admin/users/:id` - User details
- `/app/expenses/advances/:advanceId/ledger` - Advance ledger

### Query Parameter Routes

Routes that use query parameters for state:
- `/app/gate-pass/create?type=visitor`
- `/app/gate-pass/create?type=outbound`
- `/app/expenses/analytics?tab=by-category`
- `/app/expenses/analytics?tab=assets`
- `/app/expenses/analytics?tab=by-project`
- `/app/expenses/analytics?tab=cashflow`
- `/app/expenses/analytics?tab=by-account`
- `/app/expenses/analytics?tab=reconciliation`
- `/app/approvals?tab=gate_pass`
- `/app/approvals?tab=expense`
- `/app/approvals?tab=transfer`
- `/app/stockyard/components?action=create`
- `/app/stockyard/components/:id?action=edit`
- `/app/stockyard/:id?tab=map`
- `/app/stockyard/:id?tab=checklists`
- `/app/stockyard/:id?tab=timeline`
- `/app/stockyard/:id?tab=documents`
- `/app/stockyard/:id?tab=bids`
- `/app/stockyard/analytics?tab=cost`
- `/app/stockyard/analytics?tab=health`
- `/app/stockyard/analytics?tab=profitability`
- `/app/stockyard?tab=readiness`

### Tab-Based Routes

Routes that use tabs for sub-navigation:
- Expense Analytics (6 tabs)
- Unified Approvals (3 tabs)
- Stockyard Analytics (multiple tabs)
- Stockyard Request Details (multiple tabs)

---

## Navigation Hierarchy

```
/ (root)
├── /dashboard (Main Dashboard)
├── /login (Public)
├── /offline (Public)
│
├── /app/gate-pass (Gate Pass Module)
│   ├── /app/gate-pass (Dashboard)
│   ├── /app/gate-pass/:id (Details)
│   ├── /app/gate-pass/create (Create)
│   ├── /app/gate-pass/scan (Validation)
│   ├── /app/gate-pass/guard-register (Guard Log)
│   ├── /app/gate-pass/reports (Reports)
│   ├── /app/gate-pass/templates (Templates)
│   ├── /app/gate-pass/visitors (Visitors)
│   ├── /app/gate-pass/calendar (Calendar)
│   └── /app/gate-pass/bulk (Bulk Operations)
│
├── /app/inspections (Inspections Module)
│   ├── /app/inspections (Dashboard)
│   ├── /app/inspections/:id (Details)
│   ├── /app/inspections/new (Template Selection)
│   ├── /app/inspections/:templateId/capture (Capture)
│   ├── /app/inspections/studio (Template Studio)
│   ├── /app/inspections/sync (Sync Center)
│   ├── /app/inspections/completed (Completed)
│   └── /app/inspections/reports (Reports)
│
├── /app/expenses (Expenses Module)
│   ├── /app/expenses (Dashboard)
│   ├── /app/expenses/:id (Details)
│   ├── /app/expenses/create (Create)
│   ├── /app/expenses/history (History)
│   ├── /app/expenses/ledger (Ledger)
│   ├── /app/expenses/reconciliation (Reconciliation)
│   ├── /app/expenses/analytics (Analytics - Tabbed)
│   ├── /app/expenses/reports (Reports)
│   └── /app/expenses/receipts (Receipts Gallery)
│
├── /app/approvals (Unified Approvals)
│   └── /app/approvals (Tabbed: gate_pass, expense, transfer)
│
├── /app/alerts (Alerts)
│   └── /app/alerts (Alert Dashboard)
│
├── /app/notifications (Notifications)
│   ├── /app/notifications (Notifications List)
│   └── /app/notifications/preferences (Preferences)
│
├── /app/settings (Settings)
│   └── /app/settings/report-branding (Report Branding)
│
├── /app/stockyard (Stockyard Module)
│   ├── /app/stockyard (Dashboard)
│   ├── /app/stockyard/:id (Request Details - Tabbed)
│   ├── /app/stockyard/create (Create Movement)
│   ├── /app/stockyard/scan (Scan)
│   ├── /app/stockyard/components (Component Ledger)
│   ├── /app/stockyard/components/:id (Component Details)
│   ├── /app/stockyard/analytics (Analytics - Tabbed)
│   └── /app/stockyard/alerts (Alerts)
│
└── /app/admin/users (User Management)
    ├── /app/admin/users (User List)
    ├── /app/admin/users/:id (User Details)
    ├── /app/admin/users/activity (Activity Dashboard)
    ├── /app/admin/users/capability-matrix (Capability Matrix)
    └── /app/admin/users/bulk-operations (Bulk Operations)
```

---

## Route Protection

### Role-Based Protection

Routes are protected using the `RequireRole` component:

```tsx
<RequireRole roles={['super_admin', 'admin']}>
  <Component />
</RequireRole>
```

### Common Role Combinations

- **All authenticated users**: Most routes (no `RequireRole` wrapper)
- **super_admin, admin**: Administrative routes (reports, templates, user management)
- **super_admin, admin, supervisor**: Approval routes, alerts
- **super_admin, admin, supervisor, guard**: Gate pass validation

---

## Notes

1. **Redirect Routes**: Many routes redirect to unified pages with query parameters (e.g., `/app/expenses/categories` → `/app/expenses/analytics?tab=by-category`)

2. **Deep Linking**: Most detail views support direct access via ID parameter

3. **Tab-Based Navigation**: Several routes use query parameters for tab navigation (analytics, approvals, stockyard details)

4. **Legacy Routes**: Some legacy routes redirect to new routes for backward compatibility

5. **Route Ordering**: Detail routes (`:id`) must come before other routes with similar patterns to avoid conflicts

---

**Last Updated:** January 2025  
**Total Routes:** 75 (49 direct + 26 redirects)

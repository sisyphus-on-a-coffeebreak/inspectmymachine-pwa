# Handover Document: Remaining Tasks

**Date:** January 2025  
**Status:** Phase 1 & 2 Complete - UX Foundation and Technical Debt Resolved  
**Next Phase:** Advanced Features and Workflow Automation

---

## 📋 Overview

This document outlines all remaining tasks from the comprehensive codebase analysis. Most completed tasks focused on UX improvements, navigation, and technical debt. The remaining tasks primarily involve:

1. **Workflow Automation** - Auto-create workflows, linking between modules
2. **Component Ledger System** - Database schema and CRUD operations for stockyard components
3. **Advanced Admin Features** - User activity tracking, capability matrix visualization
4. **Alert & Notification System** - Anomaly detection, notifications, compliance tracking

---

## 🎯 Task Categories

### 1. Workflow Automation (High Business Value)

These tasks automate common workflows and link related data across modules.

#### Task: `workflow-5` - Auto-create Inspections from Gate Passes
**Priority:** High  
**Effort:** Medium  
**Dependencies:** None

**Description:**  
When a vehicle enters via gate pass, automatically create an inspection record if one doesn't exist for today.

**Implementation:**
- Backend: Add event listener/hook in `GatePassController` or create a service
- When vehicle entry pass is created/approved, check for existing inspection today
- If none exists, create a draft inspection linked to the vehicle
- Frontend: Show notification "Inspection auto-created for vehicle entry"

**Files to Modify:**
- `vosm/app/Http/Controllers/Api/VehicleEntryPassController.php`
- `vosm/app/Services/GatePassService.php` (if exists)
- `src/pages/gatepass/GatePassDashboard.tsx` (show notification)

**API Endpoints:**
- `POST /vehicle-entry-passes` - Add inspection creation logic
- `POST /v1/inspections` - Used to create inspection

**Database:**
- No schema changes needed (uses existing `inspections` table)

---

#### Task: `workflow-6` - Auto-link Expenses to Related Items
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** None

**Description:**  
Automatically link expenses to related gate passes, inspections, or stockyard requests based on:
- Same vehicle
- Same date
- Matching descriptions/keywords

**Implementation:**
- Backend: Create `ExpenseLinkingService`
- When expense is created, search for related items:
  - Gate passes for same vehicle on same date
  - Inspections for same vehicle
  - Stockyard requests for same vehicle
- Store links in `expense_links` table (many-to-many relationship)

**Files to Create:**
- `vosm/app/Services/ExpenseLinkingService.php`
- `vosm/database/migrations/XXXX_create_expense_links_table.php`

**Files to Modify:**
- `vosm/app/Http/Controllers/ExpenseController.php` (call linking service after create)
- `src/pages/expenses/ExpenseDetails.tsx` (display linked items)

**Database Schema:**
```php
Schema::create('expense_links', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('expense_id');
    $table->string('linked_type'); // 'gate_pass', 'inspection', 'stockyard_request'
    $table->uuid('linked_id');
    $table->string('link_reason'); // 'same_vehicle', 'same_date', 'keyword_match'
    $table->timestamps();
    
    $table->foreign('expense_id')->references('id')->on('expenses');
    $table->index(['linked_type', 'linked_id']);
});
```

---

#### Task: `workflow-7` - Auto-flag Overdue Items
**Priority:** Medium  
**Effort:** Low  
**Dependencies:** None

**Description:**  
Automatically flag items that are overdue:
- Inspections started > 30 days ago without completion
- Gate passes with visitors inside > 8 hours
- Expenses pending approval > 7 days
- Stockyard requests pending > 3 days

**Implementation:**
- Backend: Create scheduled job (Laravel Task Scheduler)
- Run daily: `php artisan schedule:run`
- Check each module for overdue items
- Update `is_overdue` flag or create `overdue_flags` table

**Files to Create:**
- `vosm/app/Console/Commands/FlagOverdueItems.php`
- `vosm/app/Console/Kernel.php` (register command)

**Files to Modify:**
- Add `is_overdue` boolean column to relevant tables OR
- Create `overdue_flags` table for centralized tracking

**Database Schema (Option 1 - Add columns):**
```php
// Add to existing migrations or create new ones
$table->boolean('is_overdue')->default(false);
$table->timestamp('overdue_since')->nullable();
```

**Database Schema (Option 2 - Centralized):**
```php
Schema::create('overdue_flags', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('item_type'); // 'inspection', 'gate_pass', 'expense', 'stockyard_request'
    $table->uuid('item_id');
    $table->string('reason'); // 'overdue_inspection', 'long_stay_visitor', etc.
    $table->timestamp('flagged_at');
    $table->timestamp('resolved_at')->nullable();
    $table->timestamps();
    
    $table->index(['item_type', 'item_id']);
});
```

---

#### Task: `workflow-8` - Auto-escalate Approvals (Pending > 7 Days)
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `workflow-7` (can reuse overdue detection logic)

**Description:**  
Automatically escalate expense approvals that have been pending for more than 7 days to supervisors/admins.

**Implementation:**
- Backend: Scheduled job to check pending expenses
- If pending > 7 days:
  - Create escalation notification
  - Update expense status to 'escalated' or add escalation flag
  - Send email/notification to supervisor
- Frontend: Show escalation badge on expense cards

**Files to Create:**
- `vosm/app/Console/Commands/EscalatePendingApprovals.php`
- `vosm/app/Notifications/ExpenseEscalationNotification.php`

**Files to Modify:**
- `vosm/app/Http/Controllers/ExpenseController.php` (add escalation status)
- `src/pages/expenses/ExpenseApproval.tsx` (show escalated items)
- `src/pages/expenses/ExpenseDetails.tsx` (show escalation info)

**Database:**
- Add `escalated_at` timestamp to `expenses` table
- OR add `escalation_level` enum field

---

#### Task: `gate-6` - Link Gate Pass to Expense
**Priority:** Low  
**Effort:** Low  
**Dependencies:** `workflow-6` (can be part of auto-linking)

**Description:**  
When a gate pass is created for vehicle entry/exit, allow linking to related expenses (fuel, tolls, etc.)

**Implementation:**
- Add `linked_expense_ids` JSON column to gate pass tables
- OR create `gate_pass_expense_links` junction table
- UI: Add "Link Expense" button on gate pass details page

**Files to Modify:**
- `vosm/database/migrations/XXXX_add_expense_links_to_gate_passes.php`
- `src/pages/gatepass/GatePassDetails.tsx` (add expense linking UI)

---

#### Task: `insp-7` - Auto-create Gate Pass When Inspection Completed
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** None

**Description:**  
When an inspection is completed and approved, automatically create a gate pass for vehicle exit if needed.

**Implementation:**
- Backend: Hook into inspection approval/completion
- Check if vehicle needs gate pass (based on inspection result)
- Create vehicle exit pass automatically
- Frontend: Show notification "Gate pass created from inspection"

**Files to Modify:**
- `vosm/app/Http/Controllers/InspectionController.php` (approve method)
- `src/pages/inspections/InspectionDetails.tsx` (show linked gate pass)

---

### 2. Component Ledger System (Stockyard Module)

These tasks require database schema changes and new models.

#### Task: `stock-3` - Design Component Ledger Database Schema
**Priority:** High  
**Effort:** High  
**Dependencies:** None

**Description:**  
Design and implement database schema for tracking vehicle components (batteries, tyres, spares).

**Database Schema:**
```php
// Batteries table
Schema::create('batteries', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('serial_number')->unique();
    $table->string('brand');
    $table->string('model');
    $table->string('capacity'); // e.g., "100Ah"
    $table->string('voltage'); // e.g., "12V"
    $table->date('purchase_date');
    $table->date('warranty_expires_at');
    $table->decimal('purchase_cost', 10, 2);
    $table->uuid('current_vehicle_id')->nullable();
    $table->string('status'); // 'active', 'maintenance', 'retired'
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('current_vehicle_id')->references('id')->on('vehicles');
    $table->index('serial_number');
});

// Tyres table
Schema::create('tyres', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('serial_number')->unique();
    $table->string('brand');
    $table->string('model');
    $table->string('size'); // e.g., "205/65R15"
    $table->integer('tread_depth_mm')->nullable();
    $table->date('purchase_date');
    $table->date('warranty_expires_at');
    $table->decimal('purchase_cost', 10, 2);
    $table->uuid('current_vehicle_id')->nullable();
    $table->string('position')->nullable(); // 'front_left', 'front_right', etc.
    $table->string('status'); // 'active', 'needs_replacement', 'retired'
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('current_vehicle_id')->references('id')->on('vehicles');
    $table->index('serial_number');
});

// Spare parts table
Schema::create('spare_parts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('part_number')->unique();
    $table->string('name');
    $table->string('category'); // 'engine', 'electrical', 'body', etc.
    $table->string('brand')->nullable();
    $table->string('model')->nullable();
    $table->date('purchase_date');
    $table->date('warranty_expires_at')->nullable();
    $table->decimal('purchase_cost', 10, 2);
    $table->uuid('current_vehicle_id')->nullable();
    $table->string('status'); // 'in_stock', 'installed', 'retired'
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('current_vehicle_id')->references('id')->on('vehicles');
    $table->index('part_number');
});

// Component custody history (tracks movements)
Schema::create('component_custody_history', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('component_type'); // 'battery', 'tyre', 'spare_part'
    $table->uuid('component_id');
    $table->uuid('from_vehicle_id')->nullable();
    $table->uuid('to_vehicle_id')->nullable();
    $table->uuid('transferred_by');
    $table->uuid('approved_by')->nullable();
    $table->string('transfer_type'); // 'install', 'remove', 'transfer'
    $table->text('reason')->nullable();
    $table->timestamp('transferred_at');
    $table->timestamps();
    
    $table->foreign('transferred_by')->references('id')->on('users');
    $table->foreign('approved_by')->references('id')->on('users')->nullable();
    $table->index(['component_type', 'component_id']);
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_batteries_table.php`
- `vosm/database/migrations/XXXX_create_tyres_table.php`
- `vosm/database/migrations/XXXX_create_spare_parts_table.php`
- `vosm/database/migrations/XXXX_create_component_custody_history_table.php`

---

#### Task: `stock-4` - Create Component Models
**Priority:** High  
**Effort:** Medium  
**Dependencies:** `stock-3` (database schema)

**Description:**  
Create Eloquent models for Battery, Tyre, and SparePart with relationships.

**Files to Create:**
- `vosm/app/Models/Battery.php`
- `vosm/app/Models/Tyre.php`
- `vosm/app/Models/SparePart.php`
- `vosm/app/Models/ComponentCustodyHistory.php`

**Model Relationships:**
```php
// Battery.php
class Battery extends Model {
    public function currentVehicle() {
        return $this->belongsTo(Vehicle::class, 'current_vehicle_id');
    }
    
    public function custodyHistory() {
        return $this->hasMany(ComponentCustodyHistory::class, 'component_id')
            ->where('component_type', 'battery');
    }
}

// Similar for Tyre and SparePart
```

---

#### Task: `stock-5` - Create ComponentLedger Page
**Priority:** High  
**Effort:** High  
**Dependencies:** `stock-4` (models)

**Description:**  
Create frontend page for viewing and managing components (batteries, tyres, spares).

**Files to Create:**
- `src/pages/stockyard/ComponentLedger.tsx`
- `src/pages/stockyard/ComponentDetails.tsx` (for individual component)

**Features:**
- List all components with filters (type, status, vehicle)
- Search by serial number, brand, model
- View component details (warranty, purchase date, current vehicle)
- View custody history

**API Endpoints to Create:**
- `GET /api/v1/components` - List components with filters
- `GET /api/v1/components/{id}` - Get component details
- `POST /api/v1/components` - Create component
- `PATCH /api/v1/components/{id}` - Update component
- `DELETE /api/v1/components/{id}` - Delete component

**Backend Files:**
- `vosm/app/Http/Controllers/ComponentController.php`

---

#### Task: `stock-6` - Implement Component CRUD Operations
**Priority:** High  
**Effort:** High  
**Dependencies:** `stock-5` (ComponentLedger page)

**Description:**  
Implement full CRUD operations for components with proper validation and error handling.

**Implementation:**
- Create form for adding new components
- Edit existing components
- Delete components (soft delete recommended)
- Validation: serial numbers must be unique, required fields

**Files to Create:**
- `src/pages/stockyard/CreateComponent.tsx`
- `src/pages/stockyard/EditComponent.tsx`

**Files to Modify:**
- `vosm/app/Http/Controllers/ComponentController.php` (full CRUD methods)

---

#### Task: `stock-7` - Add Custody History Tracking
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-4` (models)

**Description:**  
Track component movements between vehicles with audit trail.

**Implementation:**
- When component is installed/removed/transferred, create custody history record
- Show custody history timeline on component details page
- Filter components by current vehicle

**Files to Create:**
- `src/pages/stockyard/ComponentCustodyHistory.tsx`
- `src/components/ui/ComponentCustodyTimeline.tsx` (similar to ExpenseTimeline)

**Files to Modify:**
- `vosm/app/Http/Controllers/ComponentController.php` (add transfer methods)
- `src/pages/stockyard/ComponentDetails.tsx` (show custody history)

---

#### Task: `stock-8` - Create Component Transfer Workflow UI
**Priority:** Medium  
**Effort:** High  
**Dependencies:** `stock-6` (CRUD operations)

**Description:**  
Create UI for transferring components from Vehicle A to Vehicle B.

**Files to Create:**
- `src/pages/stockyard/ComponentTransfer.tsx`

**Features:**
- Select component to transfer
- Select source vehicle (current vehicle)
- Select destination vehicle
- Enter transfer reason
- Show approval status if required

**API Endpoints:**
- `POST /api/v1/components/{id}/transfer` - Initiate transfer
- `POST /api/v1/components/{id}/transfer/{transferId}/approve` - Approve transfer
- `POST /api/v1/components/{id}/transfer/{transferId}/reject` - Reject transfer

---

#### Task: `stock-9` - Implement Transfer Approval System
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-8` (transfer workflow)

**Description:**  
High-value component transfers require supervisor approval.

**Implementation:**
- Define threshold (e.g., components > ₹10,000 require approval)
- Create transfer request with 'pending' status
- Supervisor can approve/reject
- Update component custody on approval

**Files to Create:**
- `vosm/database/migrations/XXXX_create_component_transfers_table.php`
- `vosm/app/Models/ComponentTransfer.php`
- `src/pages/stockyard/ComponentTransferApproval.tsx`

**Database Schema:**
```php
Schema::create('component_transfers', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('component_type');
    $table->uuid('component_id');
    $table->uuid('from_vehicle_id');
    $table->uuid('to_vehicle_id');
    $table->uuid('requested_by');
    $table->uuid('approved_by')->nullable();
    $table->string('status'); // 'pending', 'approved', 'rejected'
    $table->text('reason');
    $table->text('rejection_reason')->nullable();
    $table->timestamp('requested_at');
    $table->timestamp('approved_at')->nullable();
    $table->timestamps();
    
    $table->foreign('requested_by')->references('id')->on('users');
    $table->foreign('approved_by')->references('id')->on('users')->nullable();
});
```

---

#### Task: `stock-10` - Add Transfer History Tracking
**Priority:** Low  
**Effort:** Low  
**Dependencies:** `stock-9` (transfer approval)

**Description:**  
Display complete audit trail of all component transfers.

**Implementation:**
- Use existing `component_custody_history` table
- Create timeline view showing all transfers
- Filter by component, vehicle, date range

**Files to Create:**
- `src/pages/stockyard/TransferHistory.tsx`

---

#### Task: `stock-11` - Create Maintenance Tracking System
**Priority:** Medium  
**Effort:** High  
**Dependencies:** `stock-4` (component models)

**Description:**  
Track maintenance for components:
- Battery: Charging cycles, voltage checks
- Tyres: Rotation, tread depth measurements
- Spare parts: Usage tracking

**Database Schema:**
```php
Schema::create('component_maintenance', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('component_type');
    $table->uuid('component_id');
    $table->string('maintenance_type'); // 'charging', 'rotation', 'inspection', etc.
    $table->text('description');
    $table->decimal('cost', 10, 2)->nullable();
    $table->uuid('performed_by');
    $table->date('performed_at');
    $table->date('next_maintenance_due')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('performed_by')->references('id')->on('users');
    $table->index(['component_type', 'component_id']);
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_component_maintenance_table.php`
- `vosm/app/Models/ComponentMaintenance.php`
- `src/pages/stockyard/ComponentMaintenance.tsx`
- `src/pages/stockyard/ScheduleMaintenance.tsx`

---

#### Task: `stock-12` - Implement Maintenance Reminders
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-11` (maintenance tracking)

**Description:**  
Send reminders for upcoming maintenance (battery charging, tyre rotation, etc.).

**Implementation:**
- Scheduled job to check `next_maintenance_due` dates
- Create notifications for components due within 7 days
- Show reminders in dashboard/component ledger

**Files to Create:**
- `vosm/app/Console/Commands/CheckMaintenanceReminders.php`
- `vosm/app/Notifications/MaintenanceReminderNotification.php`

---

#### Task: `stock-13` - Link Maintenance to Inspections
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-11` (maintenance tracking)

**Description:**  
When inspection records tyre tread depth or battery voltage, link to component records.

**Implementation:**
- Add component_id fields to inspection answers (for component-specific questions)
- When inspection completed, update component maintenance records
- Show inspection findings on component details page

**Files to Modify:**
- `vosm/database/migrations/XXXX_add_component_id_to_inspection_answers.php`
- `vosm/app/Http/Controllers/InspectionController.php` (link components on submit)
- `src/pages/stockyard/ComponentDetails.tsx` (show related inspections)

---

#### Task: `stock-14` - Add Maintenance Cost Tracking
**Priority:** Low  
**Effort:** Low  
**Dependencies:** `stock-11` (maintenance tracking)

**Description:**  
Track costs associated with component maintenance.

**Implementation:**
- Already included in `component_maintenance` table (cost field)
- Add cost analysis dashboard
- Show total maintenance cost per component, per vehicle

**Files to Create:**
- `src/pages/stockyard/ComponentCostAnalysis.tsx`

---

#### Task: `stock-15` - Create Component Health Dashboard
**Priority:** Medium  
**Effort:** High  
**Dependencies:** `stock-11`, `stock-14` (maintenance and cost tracking)

**Description:**  
Dashboard showing:
- Components with warranty expiring in 30 days
- Overdue maintenance
- Cost analysis per component/vehicle
- Maintenance schedule calendar

**Files to Create:**
- `src/pages/stockyard/ComponentHealthDashboard.tsx`

**Features:**
- Warranty expiration alerts
- Maintenance schedule view
- Cost breakdown charts
- Component health scores

---

#### Task: `stock-16` - Add Component Anomaly Alerts
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-15` (health dashboard)

**Description:**  
Alert on:
- Warranty expiring in 30 days
- Overdue maintenance
- Component mismatch (wrong component on vehicle)
- High usage (component used beyond expected lifespan)

**Implementation:**
- Similar to existing anomaly alerts in other modules
- Use `AnomalyAlert` component
- Show on component details and dashboard

**Files to Modify:**
- `src/pages/stockyard/ComponentDetails.tsx` (add anomaly detection)
- `src/pages/stockyard/ComponentHealthDashboard.tsx` (show alerts)

---

#### Task: `stock-17` - Link Inspections to Component Ledger
**Priority:** Medium  
**Effort:** Medium  
**Dependencies:** `stock-13` (maintenance linking)

**Description:**  
When inspection records component findings (tyre tread, battery voltage), create/update component records.

**Implementation:**
- Parse inspection answers for component-specific data
- Create component maintenance records
- Link inspection to component

**Files to Modify:**
- `vosm/app/Http/Controllers/InspectionController.php` (submit method)
- `src/pages/inspections/InspectionDetails.tsx` (show linked components)

---

#### Task: `stock-18` - Link Gate Passes to Component Transfers
**Priority:** Low  
**Effort:** Low  
**Dependencies:** `stock-8` (transfer workflow)

**Description:**  
When vehicle exits with components, update component custody automatically.

**Implementation:**
- On vehicle exit pass creation, check for component transfers
- Update component `current_vehicle_id`
- Create custody history record

**Files to Modify:**
- `vosm/app/Http/Controllers/Api/VehicleExitPassController.php`
- `src/pages/gatepass/GatePassDetails.tsx` (show component transfers)

---

#### Task: `stock-19` - Link Expenses to Component Purchases
**Priority:** Low  
**Effort:** Low  
**Dependencies:** `stock-6` (component CRUD)

**Description:**  
When expense is created for component purchase (tyre, battery), auto-create component record.

**Implementation:**
- Detect component purchase expenses (category: 'PARTS_REPAIR', keywords: 'tyre', 'battery')
- Extract component details from expense description
- Create component record with purchase details

**Files to Modify:**
- `vosm/app/Http/Controllers/ExpenseController.php` (store method)
- `src/pages/expenses/ExpenseDetails.tsx` (show created component)

---

### 3. Admin Features

#### Task: `admin-3` - Create User Activity Dashboard
**Priority:** Medium  
**Effort:** High  
**Dependencies:** None (but requires audit logging)

**Description:**  
Dashboard showing:
- Last login times for all users
- Recent actions (create pass, approve expense, etc.)
- Permission changes audit log

**Database Schema:**
```php
Schema::create('user_activity_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id');
    $table->string('action'); // 'login', 'create_gate_pass', 'approve_expense', etc.
    $table->string('resource_type')->nullable(); // 'gate_pass', 'expense', etc.
    $table->uuid('resource_id')->nullable();
    $table->json('metadata')->nullable(); // Additional context
    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();
    $table->timestamp('performed_at');
    $table->timestamps();
    
    $table->foreign('user_id')->references('id')->on('users');
    $table->index(['user_id', 'performed_at']);
    $table->index('action');
});

Schema::create('permission_changes', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id');
    $table->uuid('changed_by');
    $table->string('change_type'); // 'capability_added', 'capability_removed', 'role_changed'
    $table->string('capability')->nullable();
    $table->string('old_value')->nullable();
    $table->string('new_value')->nullable();
    $table->text('reason')->nullable();
    $table->timestamp('changed_at');
    $table->timestamps();
    
    $table->foreign('user_id')->references('id')->on('users');
    $table->foreign('changed_by')->references('id')->on('users');
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_user_activity_logs_table.php`
- `vosm/database/migrations/XXXX_create_permission_changes_table.php`
- `vosm/app/Models/UserActivityLog.php`
- `vosm/app/Models/PermissionChange.php`
- `vosm/app/Services/ActivityLogService.php`
- `src/pages/admin/UserActivityDashboard.tsx`

**Implementation:**
- Create middleware or service to log all user actions
- Log login/logout events
- Log permission changes
- Create dashboard to display logs

---

#### Task: `admin-4` - Add Capability Matrix Visualization
**Priority:** Medium  
**Effort:** High  
**Dependencies:** None

**Description:**  
Interactive grid showing all users and their capabilities (read, write, approve, etc.) for each module.

**Files to Create:**
- `src/pages/admin/CapabilityMatrix.tsx`

**Features:**
- Grid: Users (rows) × Capabilities (columns)
- Color-coded cells (green = has capability, red = missing)
- Click to add/remove capabilities
- Filter by role
- Export to CSV

**API Endpoints:**
- `GET /api/v1/users/capabilities` - Get all users with capabilities
- `PATCH /api/v1/users/{id}/capabilities` - Update user capabilities

**Files to Modify:**
- `vosm/app/Http/Controllers/UserController.php` (add capability endpoints)

---

#### Task: `admin-5` - Implement Bulk Operations
**Priority:** Low  
**Effort:** Medium  
**Dependencies:** `admin-4` (capability matrix)

**Description:**  
Bulk operations for user management:
- Bulk assign capabilities to multiple users
- Bulk activate/deactivate users
- Bulk role assignment

**Files to Create:**
- `src/pages/admin/BulkUserOperations.tsx`

**API Endpoints:**
- `POST /api/v1/users/bulk-assign-capabilities`
- `POST /api/v1/users/bulk-activate`
- `POST /api/v1/users/bulk-deactivate`
- `POST /api/v1/users/bulk-assign-role`

**Files to Modify:**
- `vosm/app/Http/Controllers/UserController.php` (add bulk methods)

---

### 4. Alert & Notification System

#### Task: `workflow-1` - Implement Alert System for Anomaly Detection
**Priority:** High  
**Effort:** High  
**Dependencies:** None

**Description:**  
Centralized alert system that aggregates anomalies from all modules.

**Database Schema:**
```php
Schema::create('alerts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('type'); // 'anomaly', 'reminder', 'escalation'
    $table->string('severity'); // 'info', 'warning', 'error', 'critical'
    $table->string('module'); // 'gate_pass', 'expense', 'inspection', 'stockyard'
    $table->string('title');
    $table->text('description');
    $table->string('item_type')->nullable(); // 'gate_pass', 'expense', etc.
    $table->uuid('item_id')->nullable();
    $table->uuid('assigned_to')->nullable(); // User who should handle this
    $table->string('status'); // 'new', 'acknowledged', 'resolved', 'dismissed'
    $table->timestamp('resolved_at')->nullable();
    $table->uuid('resolved_by')->nullable();
    $table->timestamps();
    
    $table->foreign('assigned_to')->references('id')->on('users')->nullable();
    $table->foreign('resolved_by')->references('id')->on('users')->nullable();
    $table->index(['status', 'severity']);
    $table->index(['module', 'item_type', 'item_id']);
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_alerts_table.php`
- `vosm/app/Models/Alert.php`
- `vosm/app/Services/AlertService.php`
- `src/pages/alerts/AlertDashboard.tsx`
- `src/components/ui/AlertBadge.tsx` (show alert count in nav)

**Implementation:**
- Create service to generate alerts from anomaly detection
- Store alerts in database
- Create dashboard to view/manage alerts
- Add alert badge to navigation

---

#### Task: `workflow-2` - Add Anomaly Detection Rules
**Priority:** High  
**Effort:** Medium  
**Dependencies:** `workflow-1` (alert system)

**Description:**  
Define and implement rules for anomaly detection:
- Overdue items (inspections > 30 days, approvals > 7 days)
- Missing receipts (expenses > ₹500 without receipt)
- Critical issues (inspections with critical findings)

**Files to Create:**
- `vosm/app/Services/AnomalyDetectionService.php`

**Implementation:**
- Create service with configurable rules
- Run scheduled job to check for anomalies
- Create alerts when anomalies detected

**Files to Modify:**
- `vosm/app/Console/Kernel.php` (register scheduled job)

---

#### Task: `workflow-3` - Create Alert Dashboard
**Priority:** High  
**Effort:** Medium  
**Dependencies:** `workflow-1` (alert system)

**Description:**  
Dashboard for supervisors/admins to view and manage all alerts.

**Files to Create:**
- `src/pages/alerts/AlertDashboard.tsx`

**Features:**
- Filter by severity, module, status
- Acknowledge/resolve alerts
- Bulk actions (acknowledge all, dismiss all)
- Alert statistics

**API Endpoints:**
- `GET /api/v1/alerts` - List alerts with filters
- `PATCH /api/v1/alerts/{id}/acknowledge` - Acknowledge alert
- `PATCH /api/v1/alerts/{id}/resolve` - Resolve alert
- `PATCH /api/v1/alerts/{id}/dismiss` - Dismiss alert

**Backend Files:**
- `vosm/app/Http/Controllers/AlertController.php`

---

#### Task: `workflow-4` - Add Notification System
**Priority:** Medium  
**Effort:** High  
**Dependencies:** `workflow-1` (alert system)

**Description:**  
In-app notifications and email alerts for important events.

**Database Schema:**
```php
Schema::create('notifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id');
    $table->string('type'); // 'alert', 'approval_request', 'reminder', etc.
    $table->string('title');
    $table->text('message');
    $table->string('action_url')->nullable(); // Link to related item
    $table->boolean('read')->default(false);
    $table->boolean('email_sent')->default(false);
    $table->timestamp('read_at')->nullable();
    $table->timestamps();
    
    $table->foreign('user_id')->references('id')->on('users');
    $table->index(['user_id', 'read']);
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_notifications_table.php`
- `vosm/app/Models/Notification.php`
- `vosm/app/Notifications/AlertNotification.php` (Laravel notification)
- `src/components/ui/NotificationBell.tsx` (show unread count)
- `src/pages/notifications/NotificationsPage.tsx`

**Implementation:**
- Create notification service
- Send in-app notifications
- Send email notifications (using Laravel Mail)
- Show notification bell in navigation

---

### 5. Compliance & Policy

#### Task: `workflow-9` - Add Compliance Checklist System
**Priority:** Low  
**Effort:** High  
**Dependencies:** None

**Description:**  
Add compliance checklists to all modules (gate pass, expense, inspection) to ensure regulatory compliance.

**Database Schema:**
```php
Schema::create('compliance_checklists', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('module'); // 'gate_pass', 'expense', 'inspection'
    $table->string('checklist_type'); // 'pre_approval', 'post_completion', etc.
    $table->string('item');
    $table->text('description');
    $table->boolean('is_required')->default(true);
    $table->integer('order_index');
    $table->timestamps();
});

Schema::create('compliance_checklist_responses', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('checklist_id');
    $table->string('item_type'); // 'gate_pass', 'expense', etc.
    $table->uuid('item_id');
    $table->boolean('checked');
    $table->uuid('checked_by');
    $table->timestamp('checked_at');
    $table->text('notes')->nullable();
    $table->timestamps();
    
    $table->foreign('checklist_id')->references('id')->on('compliance_checklists');
    $table->foreign('checked_by')->references('id')->on('users');
    $table->index(['item_type', 'item_id']);
});
```

**Files to Create:**
- `vosm/database/migrations/XXXX_create_compliance_checklists_table.php`
- `vosm/database/migrations/XXXX_create_compliance_checklist_responses_table.php`
- `vosm/app/Models/ComplianceChecklist.php`
- `src/components/ui/ComplianceChecklist.tsx`

---

#### Task: `workflow-10` - Add Regulatory Compliance Tracking
**Priority:** Low  
**Effort:** High  
**Dependencies:** `workflow-9` (compliance checklists)

**Description:**  
Track regulatory compliance requirements and generate compliance reports.

**Files to Create:**
- `src/pages/compliance/ComplianceDashboard.tsx`
- `src/pages/compliance/ComplianceReports.tsx`

---

#### Task: `workflow-11` - Link All Modules to Company Policy Documents
**Priority:** Low  
**Effort:** Low  
**Dependencies:** None (PolicyLinks component already exists)

**Description:**  
Ensure all modules have policy links (already implemented via PolicyLinks component, just need to verify all pages have them).

**Files to Verify:**
- All detail pages should have `<PolicyLinks />` component
- Verify policy URLs are correct

---

### 6. Inspection Module Enhancements

#### Task: `insp-4` - Improve Template Version Conflict UX
**Priority:** Medium  
**Effort:** High  
**Dependencies:** None

**Description:**  
When inspection template is updated during an ongoing inspection, show:
- Visual diff of template changes
- Highlight conflicting answers
- One-click resolution (Keep My Answers vs Use New Template)

**Files to Modify:**
- `src/components/inspection/DynamicFormRenderer.tsx`
- `src/pages/inspections/InspectionDetails.tsx`

**Implementation:**
- Detect template version conflicts (template.updated_at > inspection.started_at)
- Show diff component comparing old vs new template
- Allow user to choose resolution strategy
- Update inspection with chosen answers

**Files to Create:**
- `src/components/inspection/TemplateDiffViewer.tsx`
- `src/components/inspection/ConflictResolutionModal.tsx`

---

### 7. Technical Debt

#### Task: `tech-6` - Add Offline Retry Queues
**Priority:** Low  
**Effort:** High  
**Dependencies:** None

**Description:**  
Implement offline support with retry queues for failed requests.

**Implementation:**
- Use IndexedDB or localStorage to queue failed requests
- Retry when connection restored
- Show queue status in UI

**Files to Create:**
- `src/lib/offlineQueue.ts`
- `src/components/ui/OfflineIndicator.tsx`

**Libraries to Consider:**
- `idb` (IndexedDB wrapper)
- `workbox` (service worker for offline support)

---

## 📊 Priority Matrix

### High Priority (Business Critical)
1. `workflow-1` - Alert System (foundation for other alerts)
2. `workflow-2` - Anomaly Detection Rules
3. `workflow-3` - Alert Dashboard
4. `stock-3` - Component Ledger Schema (blocks all component features)
5. `stock-4` - Component Models
6. `stock-5` - ComponentLedger Page

### Medium Priority (High Value)
1. `workflow-5` - Auto-create Inspections
2. `workflow-6` - Auto-link Expenses
3. `workflow-7` - Auto-flag Overdue
4. `workflow-8` - Auto-escalate Approvals
5. `stock-6` - Component CRUD
6. `stock-11` - Maintenance Tracking
7. `admin-3` - User Activity Dashboard
8. `insp-4` - Template Conflict UX

### Low Priority (Nice to Have)
1. `workflow-9` - Compliance Checklists
2. `workflow-10` - Regulatory Compliance
3. `workflow-11` - Policy Links (mostly done)
4. `tech-6` - Offline Retry Queues
5. `stock-14` - Cost Tracking (uses existing cost field)
6. `admin-5` - Bulk Operations

---

## 🔗 Dependencies Graph

```
workflow-1 (Alert System)
  └─> workflow-2 (Anomaly Rules)
  └─> workflow-3 (Alert Dashboard)
  └─> workflow-4 (Notifications)

stock-3 (Schema)
  └─> stock-4 (Models)
  └─> stock-5 (ComponentLedger Page)
  └─> stock-6 (CRUD)
  └─> stock-7 (Custody History)
  └─> stock-8 (Transfer UI)
  └─> stock-9 (Transfer Approval)
  └─> stock-10 (Transfer History)
  └─> stock-11 (Maintenance)
  └─> stock-12 (Reminders)
  └─> stock-13 (Link to Inspections)
  └─> stock-14 (Cost Tracking)
  └─> stock-15 (Health Dashboard)
  └─> stock-16 (Anomaly Alerts)
  └─> stock-17 (Link Inspections)
  └─> stock-18 (Link Gate Passes)
  └─> stock-19 (Link Expenses)

workflow-7 (Auto-flag Overdue)
  └─> workflow-8 (Auto-escalate)

admin-4 (Capability Matrix)
  └─> admin-5 (Bulk Operations)
```

---

## 🛠️ Implementation Guidelines

### Database Migrations
- Always use UUIDs for primary keys (consistent with existing schema)
- Add indexes for foreign keys and frequently queried fields
- Use soft deletes where appropriate (`deleted_at` timestamp)
- Add `created_at` and `updated_at` timestamps to all tables

### Backend Controllers
- Follow existing controller patterns in `vosm/app/Http/Controllers/`
- Use Laravel validation for all inputs
- Return consistent JSON responses: `{ success: true, data: {...} }`
- Handle errors gracefully with try-catch blocks
- Log important actions for audit trail

### Frontend Components
- Use existing UI components from `src/components/ui/`
- Follow existing patterns for data fetching (React Query)
- Use `apiClient` for all API calls (not direct axios)
- Add proper error handling with `NetworkError` component
- Use skeleton loaders for loading states
- Add breadcrumbs to all new pages

### Testing Checklist
- [ ] Test all CRUD operations
- [ ] Test error handling (network errors, validation errors)
- [ ] Test loading states
- [ ] Test empty states
- [ ] Test pagination (if applicable)
- [ ] Test filters and search
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (keyboard navigation, screen readers)

---

## 📝 Code References

### Existing Patterns to Follow

**React Query Usage:**
- See `src/lib/queries.ts` for query hooks
- See `src/pages/gatepass/GatePassDashboard.tsx` for usage example

**Error Handling:**
- See `src/lib/errorHandling.ts` for error utilities
- See `src/components/ui/NetworkError.tsx` for error display

**Form Validation:**
- See `src/lib/validation.ts` for validation utilities
- See `src/components/ui/FormField.tsx` for form components

**API Client:**
- See `src/lib/apiClient.ts` for API client usage
- Always use `apiClient` instead of direct axios calls

**Styling:**
- See `src/lib/theme.ts` for theme constants
- Use theme colors, spacing, typography consistently

---

## 🚀 Getting Started

### Recommended Order

1. **Start with Alert System** (`workflow-1`, `workflow-2`, `workflow-3`)
   - Foundation for other features
   - Can be implemented independently
   - High business value

2. **Then Component Ledger** (`stock-3` through `stock-6`)
   - Complete database schema first
   - Then models
   - Then UI

3. **Then Workflow Automation** (`workflow-5` through `workflow-8`)
   - Builds on existing modules
   - Adds significant value

4. **Finally Advanced Features** (Admin, Compliance, etc.)
   - Lower priority
   - Can be done incrementally

---

## 📚 Additional Resources

- **Laravel Documentation:** https://laravel.com/docs
- **React Query Documentation:** https://tanstack.com/query/latest
- **Existing Codebase Patterns:** See completed tasks for reference implementations

---

## ✅ Completed Tasks Summary

The following major improvements have been completed:
- ✅ Navigation & UX Foundation (breadcrumbs, deep linking, recently viewed)
- ✅ Related Items panels on all detail pages
- ✅ Anomaly alerts on detail pages
- ✅ Expense timeline and duplicate detection
- ✅ Improved loading states with skeleton loaders
- ✅ Enhanced empty states with retry actions
- ✅ React Query migration for data fetching
- ✅ Standardized error handling
- ✅ Technical debt cleanup (console logs, axios migration)

---

**Good luck with the remaining tasks!** 🚀


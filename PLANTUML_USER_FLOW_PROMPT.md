# PlantUML User Flow Diagrams - Complete Application Flow

This document contains comprehensive PlantUML prompts to generate flowcharts depicting the entire user flow of the VOMS PWA application, including all actions, logic, and capabilities at every step.

## Application Overview

**VOMS PWA** is a Progressive Web Application for Vehicle Operations Management System with the following modules:
- **Gate Pass Management** - Visitor and vehicle pass creation, validation, and approval
- **Inspections** - Vehicle inspection capture, templates, and reporting
- **Expenses** - Employee expense submission, approval, and ledger management
- **Stockyard** - Component (battery, tyre, spare parts) tracking and movement management
- **Unified Approvals** - Centralized approval hub for all modules
- **User Management** - Role-based access control and user administration
- **Alerts & Notifications** - System alerts and user notifications

**User Roles:**
- `super_admin` - Full system access
- `admin` - Administrative access
- `supervisor` - Can approve passes and expenses
- `inspector` - Can perform vehicle inspections
- `guard` - Can validate gate passes
- `clerk` - Basic operations

---

## 1. Authentication & Authorization Flow

```plantuml
@startuml Authentication_Flow
title Authentication and Authorization Flow

start

:User accesses application;
if (User is authenticated?) then (yes)
  :Check user role and capabilities;
  if (User has required permissions?) then (yes)
    :Allow access to requested route;
    stop
  else (no)
    :Redirect to Dashboard;
    note right: User lacks required permissions
    stop
  endif
else (no)
  :Redirect to /login;
  :Display login form;
  :User enters employee_id and password;
  
  :Validate form inputs;
  if (Form valid?) then (no)
    :Show validation errors;
    :Return to login form;
  else (yes)
    :POST /api/login;
    :Initialize CSRF token;
    if (Login successful?) then (no)
      if (Status 422?) then (yes)
        :Show validation errors;
      else if (Status 500?) then (yes)
        :Show server error message;
      else
        :Show generic error;
      endif
      :Return to login form;
    else (yes)
      :GET /api/user;
      :Store user data in context;
      :Set authentication state;
      if (Redirect location exists?) then (yes)
        :Redirect to saved location;
      else (no)
        :Redirect to /dashboard;
      endif
      stop
    endif
  endif
endif

@enduml
```

---

## 2. Main Dashboard Flow

```plantuml
@startuml Dashboard_Flow
title Main Dashboard User Flow

start

:User lands on /dashboard;
:Check authentication;
if (Authenticated?) then (no)
  :Redirect to /login;
  stop
endif

:Load dashboard stats;
:Fetch real-time data;
note right: Uses WebSocket for real-time updates

:Display welcome section;
note right: Shows user name, date, greeting

:Display module cards grid;
note right: Gate Pass, Inspections, Expenses, Stockyard

if (User clicks module card?) then (yes)
  :Navigate to module dashboard;
  stop
endif

:Display Kanban board;
note right: Shows pending/active/completed items
note right: Role-based columns

if (User interacts with Kanban?) then (yes)
  :Handle drag & drop;
  :Update item status;
  :Save changes;
endif

:Display recent activity feed;
:Display quick actions panel;
note right: Role-based quick actions

if (User clicks notification?) then (yes)
  :Navigate to /app/notifications;
  stop
endif

if (User clicks settings?) then (yes)
  :Navigate to settings;
  stop
endif

stop

@enduml
```

---

## 3. Gate Pass Module - Complete Flow

### 3.1 Gate Pass Dashboard Flow

```plantuml
@startuml GatePass_Dashboard_Flow
title Gate Pass Dashboard Flow

start

:User navigates to /app/gate-pass;
:Check user role;
:Load gate pass statistics;
note right: Active passes, pending approvals, etc.

if (User role?) then (guard)
  :Display Guard Dashboard;
  note right: Quick scan button, inside now list
  note right: Expected arrivals, recent scans
else if (supervisor) then
  :Display Supervisor Dashboard;
  note right: Pending approvals badge
  note right: Approval queue
else if (clerk/admin/super_admin) then
  :Display Staff Dashboard;
  note right: Full feature access
  note right: Create pass, reports, templates
endif

:Display action cards;
note right: Create Visitor Pass, Create Vehicle Pass
note right: Quick Validation, Reports, Templates

if (User clicks "Create Visitor Pass"?) then (yes)
  :Navigate to /app/gate-pass/create?type=visitor;
  stop
endif

if (User clicks "Create Vehicle Pass"?) then (yes)
  :Navigate to /app/gate-pass/create?type=outbound;
  stop
endif

if (User clicks "Quick Validation"?) then (yes)
  :Navigate to /app/gate-pass/scan;
  stop
endif

:Display pass list;
:Apply filters (status, type, date range);
:Display pagination;

if (User clicks on pass?) then (yes)
  :Navigate to /app/gate-pass/:id;
  stop
endif

stop

@enduml
```

### 3.2 Gate Pass Creation Flow

```plantuml
@startuml GatePass_Creation_Flow
title Gate Pass Creation Flow

start

:User navigates to /app/gate-pass/create;
:Check URL params (?type=visitor|outbound|inbound);

:Display intent selection;
note right: Visitor Pass or Vehicle Pass

:User selects pass type;
if (Pass type?) then (visitor)
  :Show visitor form fields;
  note right: Visitor name, phone, company
  note right: Referred by, additional visitors
  note right: Vehicles to view (multi-select)
else if (vehicle_outbound) then
  :Show outbound vehicle form;
  note right: Vehicle selector (search/create)
  note right: Driver details, license
  note right: Expected return date/time
  note right: Destination
else if (vehicle_inbound) then
  :Show inbound vehicle form;
  note right: Vehicle selector
  note right: Entry details
endif

:User fills form;
:Auto-save draft to localStorage;
note right: Prevents data loss

:Validate form on blur;
if (Field invalid?) then (yes)
  :Show inline error;
  :Mark field as touched;
endif

:User selects validity dates;
note right: Default: today to end of day
note right: Can customize via ValidityCustomizer

if (Visitor pass?) then (yes)
  :User selects vehicles to view;
  note right: Multi-select vehicle selector
  note right: Can search or create new vehicle
endif

if (Vehicle pass?) then (yes)
  :User selects/creates vehicle;
  note right: UnifiedVehicleSelector component
  note right: Search by registration, VIN, etc.
  note right: Can create new vehicle inline
endif

:User clicks Submit;
:Run full form validation;

if (Validation fails?) then (yes)
  :Show error toast;
  :Highlight invalid fields;
  :Scroll to first error;
  stop
endif

:Build API payload;
if (Visitor pass?) then (yes)
  :POST /api/v1/gate-passes;
  note right: pass_type: visitor
  note right: vehicles_to_view: [UUIDs]
else if (Vehicle pass?) then (yes)
  :POST /api/v1/gate-passes;
  note right: pass_type: vehicle_outbound/inbound
  note right: vehicle_id: UUID
endif

if (API call successful?) then (no)
  :Show error toast;
  :Display error message;
  stop
else (yes)
  :Show success toast;
  :Generate QR code;
  :Navigate to /app/gate-pass/:id;
  note right: View created pass details
  stop
endif

@enduml
```

### 3.3 Gate Pass Validation Flow (Guard)

```plantuml
@startuml GatePass_Validation_Flow
title Gate Pass Validation Flow (Guard)

start

:Guard navigates to /app/gate-pass/scan;
:Display QR scanner interface;
note right: Camera-based QR scanner
note right: Manual entry option

if (User action?) then (scan QR) then
  :Scan QR code;
  :Extract access_code from QR;
else if (manual entry) then
  :User enters access code manually;
endif

:Validate access code format;
if (Invalid format?) then (yes)
  :Show error: "Invalid QR code format";
  stop
endif

:GET /api/v1/gate-passes/validate/:access_code;
if (Pass not found?) then (yes)
  :Show error: "Pass not found";
  :Display validation result card (red);
  stop
endif

:Check pass validity;
if (Pass expired?) then (yes)
  :Show error: "Pass has expired";
  :Display validation result card (red);
  stop
endif

if (Pass already used?) then (yes)
  :Show warning: "Pass already validated";
  :Display previous validation details;
  stop
endif

:Check pass status;
if (Status != 'approved'?) then (yes)
  :Show error: "Pass not approved";
  :Display validation result card (red);
  stop
endif

:Display pass details;
note right: Visitor/Vehicle info, validity dates
note right: Purpose, notes

if (Entry validation?) then (yes)
  :POST /api/v1/gate-passes/:id/validate;
  note right: action: ENTRY
  note right: Records entry_time
else if (Exit validation?) then (yes)
  :POST /api/v1/gate-passes/:id/validate;
  note right: action: EXIT
  note right: Records exit_time
  if (Vehicle pass?) then (yes)
    :Prompt for odometer reading;
    :Prompt for exit photos;
  endif
endif

if (Validation successful?) then (yes)
  :Show success toast;
  :Display validation result card (green);
  :Record in scan history;
  note right: Stored in localStorage
  :Clear scanner;
  :Ready for next scan;
else (no)
  :Show error toast;
  :Display error message;
endif

stop

@enduml
```

### 3.4 Gate Pass Approval Flow

```plantuml
@startuml GatePass_Approval_Flow
title Gate Pass Approval Flow

start

:Supervisor/Admin navigates to /app/approvals?tab=gate_pass;
note right: Or via Unified Approvals hub

:Load pending gate pass approvals;
:GET /api/v1/gate-passes?status=pending&needs_approval=true;

:Display approval queue;
note right: List of pending passes
note right: Filter by type, date, yard

if (User clicks on pass?) then (yes)
  :Navigate to /app/gate-pass/:id;
  :Display pass details;
  note right: Full pass information
  note right: Visitor/Vehicle details
  note right: Validity dates, purpose
  
  if (User action?) then (approve) then
    :POST /api/v1/gate-passes/:id/approve;
    if (Success?) then (yes)
      :Update pass status to 'approved';
      :Generate QR code;
      :Send notification to creator;
      :Show success toast;
      :Remove from approval queue;
    else (no)
      :Show error toast;
    endif
  else if (reject) then
    :Show rejection modal;
    :User enters rejection reason;
    :POST /api/v1/gate-passes/:id/reject;
    note right: Body: { rejection_reason: string }
    if (Success?) then (yes)
      :Update pass status to 'rejected';
      :Send notification to creator;
      :Show success toast;
      :Remove from approval queue;
    else (no)
      :Show error toast;
    endif
  endif
endif

if (Bulk approval?) then (yes)
  :User selects multiple passes;
  :User clicks "Approve Selected";
  :POST /api/v1/gate-passes/bulk-approve;
  note right: Body: { pass_ids: [string] }
  :Process each approval;
  :Show batch result toast;
endif

stop

@enduml
```

---

## 4. Inspections Module - Complete Flow

### 4.1 Inspection Template Selection Flow

```plantuml
@startuml Inspection_Template_Selection_Flow
title Inspection Template Selection Flow

start

:User navigates to /app/inspections/new;
:Check for vehicleId in URL params;

:Load available inspection templates;
:GET /api/v1/inspection-templates;

:Load recent templates from localStorage;
note right: Template usage history

:Display template selection interface;
note right: Search bar
note right: Category filters
note right: Recent templates section

:User searches/filters templates;
if (Template found?) then (yes)
  :Display matching templates;
  note right: Template name, description
  note right: Category, last used date
else (no)
  :Show "No templates found";
endif

:User clicks on template;
:Record template selection in history;
note right: Save to localStorage

if (vehicleId provided?) then (yes)
  :Navigate to /app/inspections/:templateId/:vehicleId/capture;
else (no)
  :Navigate to /app/inspections/:templateId/capture;
endif

stop

@enduml
```

### 4.2 Inspection Capture Flow

```plantuml
@startuml Inspection_Capture_Flow
title Inspection Capture Flow

start

:User navigates to /app/inspections/:templateId/capture;
:Load inspection template;
note right: Try network first, fallback to cache

if (Template not found?) then (yes)
  :Show error: "Template not found";
  :Navigate back to template selection;
  stop
endif

:Load draft from localStorage;
if (Draft exists?) then (yes)
  :Prompt user: "Resume draft?";
  if (User chooses resume?) then (yes)
    :Load draft answers;
    :Set initialAnswers state;
  else (no)
    :Clear draft;
    :Start fresh;
  endif
endif

:Display inspection form;
note right: Sections and questions
note right: Based on template structure

:User fills inspection form;
:Auto-save draft every 30 seconds;
note right: Save to localStorage
note right: Show "Draft saved" banner

if (User clicks "Save Draft"?) then (yes)
  :Save current answers to localStorage;
  :Show "Draft saved" confirmation;
endif

:User completes all required fields;
:User clicks "Submit Inspection";

:Serialize answers;
note right: Convert to API format

:Check connectivity;
if (Online?) then (yes)
  :POST /api/v1/inspections;
  note right: template_id, vehicle_id (optional)
  note right: answers: serialized
  :Show progress indicator;
  
  if (Submission successful?) then (yes)
    :Clear draft from localStorage;
    :Add to template history;
    :Show success banner;
    :Navigate to /app/inspections/:id;
    note right: View inspection details
    stop
  else (no)
    :Show error toast;
    :Keep draft saved;
  endif
else (no)
  :Queue inspection for sync;
  note right: Save to IndexedDB queue
  :Show "Queued offline" banner;
  :Clear draft from localStorage;
  note right: Will sync when online
  stop
endif

stop

@enduml
```

### 4.3 Inspection Sync Flow

```plantuml
@startuml Inspection_Sync_Flow
title Inspection Sync Flow (Offline Queue)

start

:User navigates to /app/inspections/sync;
:Load queued inspections;
note right: From IndexedDB queue

:Display sync center;
note right: List of queued inspections
note right: Status: pending, syncing, failed

if (User clicks "Sync All"?) then (yes)
  :Check connectivity;
  if (Online?) then (no)
    :Show error: "No internet connection";
    stop
  endif
  
  :Process queue;
  :For each queued inspection;
  :Update status to "syncing";
  :POST /api/v1/inspections;
  note right: Use queued inspection data
  
  if (Success?) then (yes)
    :Remove from queue;
    :Update status to "synced";
  else (no)
    :Update status to "failed";
    :Store error message;
  endif
  
  :Show sync progress;
  :Display results summary;
endif

if (User clicks "Retry Failed"?) then (yes)
  :Filter failed inspections;
  :Retry each failed inspection;
  :Follow same sync process;
endif

if (User clicks "Clear Queue"?) then (yes)
  :Confirm deletion;
  if (Confirmed?) then (yes)
    :Clear all queued inspections;
    :Show success toast;
  endif
endif

stop

@enduml
```

### 4.4 Inspection Details & Report Flow

```plantuml
@startuml Inspection_Details_Flow
title Inspection Details & Report Flow

start

:User navigates to /app/inspections/:id;
:Load inspection details;
:GET /api/v1/inspections/:id;

:Display inspection information;
note right: Template name, vehicle (if any)
note right: Created date, status
note right: Inspector name

:Display inspection answers;
note right: Organized by sections
note right: Questions and responses
note right: Photos, signatures, etc.

if (User clicks "Generate Report"?) then (yes)
  :Load report template;
  :Generate PDF report;
  note right: Include branding if configured
  :Download PDF;
endif

if (User clicks "Edit"?) then (yes)
  if (Status == 'draft'?) then (yes)
    :Navigate to capture page;
    :Load draft data;
  else (no)
    :Show error: "Cannot edit completed inspection";
  endif
endif

if (User clicks "Delete"?) then (yes)
  :Confirm deletion;
  if (Confirmed?) then (yes)
    :DELETE /api/v1/inspections/:id;
    if (Success?) then (yes)
      :Show success toast;
      :Navigate to /app/inspections;
    else (no)
      :Show error toast;
    endif
  endif
endif

stop

@enduml
```

---

## 5. Expenses Module - Complete Flow

### 5.1 Expense Creation Flow

```plantuml
@startuml Expense_Creation_Flow
title Expense Creation Flow

start

:User navigates to /app/expenses/create;
:Load expense form;
:Load expense references;
note right: Categories, projects, assets, employees

:User fills expense form;
note right: Amount, description, date, time
note right: Category, payment method
note right: Project (optional), Asset (optional)

:Validate amount;
if (Amount <= 0?) then (yes)
  :Show error: "Amount must be greater than 0";
endif

:Validate date;
if (Date in future?) then (yes)
  :Show warning: "Future date detected";
endif

:Check for duplicate expenses;
note right: Same amount, date, description
if (Duplicates found?) then (yes)
  :Show duplicate warning modal;
  :Display matching expenses;
  if (User confirms "Submit anyway"?) then (yes)
    :Continue submission;
  else (no)
    :Return to form;
    stop
  endif
endif

:User uploads receipt;
note right: Photo capture or file upload
note right: Stored in S3/storage

:Validate required fields;
if (Fleet-related category?) then (yes)
  if (Asset not selected?) then (yes)
    :Show error: "Vehicle linkage required";
    :Highlight asset field;
    stop
  endif
endif

:User clicks "Submit Expense";
:Check employee balance;
note right: Can go negative (advances allowed)

:POST /api/v1/expenses;
note right: Include receipt_key

if (Success?) then (yes)
  :Show success toast;
  :Navigate to /app/expenses/:id;
  note right: View expense details
else (no)
  :Show error toast;
  :Display error message;
endif

stop

@enduml
```

### 5.2 Expense Approval Flow

```plantuml
@startuml Expense_Approval_Flow
title Expense Approval Flow

start

:Supervisor/Admin navigates to /app/approvals?tab=expense;
note right: Or via Unified Approvals hub

:Load pending expense approvals;
:GET /api/v1/expenses?status=pending&needs_approval=true;

:Display approval queue;
note right: List of pending expenses
note right: Filter by employee, category, date
note right: Sort by amount, date, urgency

if (User clicks on expense?) then (yes)
  :Navigate to /app/expenses/:id;
  :Display expense details;
  note right: Amount, description, date
  note right: Category, payment method
  note right: Receipt preview
  note right: Employee name, project, asset
  
  if (User action?) then (approve) then
    :POST /api/v1/expenses/:id/approve;
    if (Success?) then (yes)
      :Update expense status to 'approved';
      :Update employee ledger;
      :Send notification to employee;
      :Show success toast;
      :Remove from approval queue;
    else (no)
      :Show error toast;
    endif
  else if (reject) then
    :Show rejection modal;
    :User enters rejection reason;
    :POST /api/v1/expenses/:id/reject;
    note right: Body: { rejection_reason: string }
    if (Success?) then (yes)
      :Update expense status to 'rejected';
      :Send notification to employee;
      :Show success toast;
      :Remove from approval queue;
    else (no)
      :Show error toast;
    endif
  else if (reassign) then
    :Show reassignment modal;
    :User selects new employee/project/asset;
    :PATCH /api/v1/expenses/:id;
    note right: Update employee_id, project_id, asset_id
    if (Success?) then (yes)
      :Update expense assignment;
      :Show success toast;
    else (no)
      :Show error toast;
    endif
  endif
endif

if (Bulk approval?) then (yes)
  :User selects multiple expenses;
  :User clicks "Approve Selected";
  :POST /api/v1/expenses/bulk-approve;
  note right: Body: { expense_ids: [string] }
  :Process each approval;
  :Show batch result toast;
endif

stop

@enduml
```

### 5.3 Employee Ledger Flow

```plantuml
@startuml Employee_Ledger_Flow
title Employee Ledger Flow

start

:User navigates to /app/expenses/ledger;
:Load employee ledger data;
:GET /api/v1/expenses/ledger;

:Display ledger summary;
note right: Current balance
note right: Total expenses, advances
note right: Pending approvals

:Display transaction history;
note right: Chronological list
note right: Expenses, advances, reimbursements
note right: Filter by date range, category

if (User clicks on transaction?) then (yes)
  :Navigate to /app/expenses/:id;
  note right: View transaction details
  stop
endif

if (User clicks "Request Advance"?) then (yes)
  :Show advance request modal;
  :User enters amount and reason;
  :POST /api/v1/expenses/advances;
  if (Success?) then (yes)
    :Show success toast;
    :Refresh ledger;
  else (no)
    :Show error toast;
  endif
endif

if (User clicks "Reconcile"?) then (yes)
  :Navigate to /app/expenses/reconciliation;
  note right: Ledger reconciliation view
  stop
endif

stop

@enduml
```

---

## 6. Stockyard Module - Complete Flow

### 6.1 Component Movement Flow

```plantuml
@startuml Component_Movement_Flow
title Component Movement Flow

start

:User navigates to /app/stockyard/create;
:Load yards and employees;
:GET /api/v1/yards;
:GET /api/v1/employees;

:Display movement form (Step 1);
:User selects movement type;
note right: ENTRY or EXIT

:Display component selection (Step 2);
:User searches for component;
note right: Search by brand, model, serial, part number
note right: Or browse all components

if (Component found?) then (yes)
  :User selects component;
  :Display component details;
  note right: Type, status, location
else (no)
  :Show "Component not found";
  :Option to create new component;
endif

:Display movement details (Step 3);
:User selects yard;
:User enters reason;
:User selects taken_by (employee);
:User enters notes;

:User clicks "Submit";
:Validate form;
if (Validation fails?) then (yes)
  :Show error toast;
  stop
endif

:Update component status;
if (Movement type == ENTRY?) then (yes)
  :PATCH /api/v1/components/:type/:id;
  note right: status: 'in_stock'
else if (EXIT?) then (yes)
  :PATCH /api/v1/components/:type/:id;
  note right: status: 'retired'
endif

if (Success?) then (yes)
  :Show success toast;
  :Navigate to /app/stockyard/components/:type/:id;
  note right: View component details
else (no)
  :Show error toast;
endif

stop

@enduml
```

### 6.2 Component Transfer Flow

```plantuml
@startuml Component_Transfer_Flow
title Component Transfer Flow

start

:User navigates to /app/stockyard/components/:id;
:Display component details;
:User clicks "Transfer Component";

:Display transfer form;
:User selects target yard;
:User enters transfer reason;
:User selects requested_by (employee);

:User clicks "Request Transfer";
:POST /api/v1/components/transfers;
note right: component_id, from_yard_id, to_yard_id
note right: reason, requested_by

if (Success?) then (yes)
  :Create transfer request;
  :Status: 'pending';
  :Notify yard managers;
  :Show success toast;
else (no)
  :Show error toast;
endif

:Admin/Supervisor reviews transfer;
:Navigate to /app/approvals?tab=transfer;

if (User action?) then (approve) then
  :POST /api/v1/components/transfers/:id/approve;
  :Update component yard_id;
  :Update transfer status to 'approved';
  :Notify requester;
  :Show success toast;
else if (reject) then
  :Show rejection modal;
  :User enters rejection reason;
  :POST /api/v1/components/transfers/:id/reject;
  :Update transfer status to 'rejected';
  :Notify requester;
  :Show success toast;
endif

stop

@enduml
```

### 6.3 Stockyard Request Scan Flow

```plantuml
@startuml Stockyard_Scan_Flow
title Stockyard Request Scan Flow

start

:User navigates to /app/stockyard/scan;
:Display scan interface;
note right: QR scanner or manual entry

if (User action?) then (scan QR) then
  :Scan QR code;
  :Extract request ID;
else if (manual entry) then
  :User enters request ID;
endif

:User selects scan action;
note right: IN or OUT

:User enters optional details;
note right: Gatekeeper name
note right: Odometer (for OUT)
note right: Engine hours (for OUT)

:User clicks "Submit";
:Validate request ID;
:GET /api/v1/stockyard-requests/:id;

if (Request not found?) then (yes)
  :Show error: "Request not found";
  stop
endif

if (Request status != 'Approved'?) then (yes)
  :Show error: "Request must be approved";
  stop
endif

:POST /api/v1/stockyard-requests/:id/scan;
note right: action: IN or OUT
note right: gatekeeper_name, odometer_km, engine_hours

if (Success?) then (yes)
  :Update request scan status;
  :Record scan timestamp;
  :Show success toast;
  
  if (Action == IN?) then (yes)
    :Prompt: "Record components?";
    if (User confirms?) then (yes)
      :Navigate to /app/stockyard/:id?recordComponents=true;
    else (no)
      :Navigate to /app/stockyard/:id;
    endif
  else (no)
    :Navigate to /app/stockyard/:id;
  endif
else (no)
  :Show error toast;
endif

stop

@enduml
```

---

## 7. Unified Approvals Hub Flow

```plantuml
@startuml Unified_Approvals_Flow
title Unified Approvals Hub Flow

start

:Supervisor/Admin navigates to /app/approvals;
:Check user role;
note right: Requires: super_admin, admin, supervisor

:Load pending approvals from all modules;
:GET /api/v1/gate-passes?status=pending&needs_approval=true;
:GET /api/v1/expenses?status=pending&needs_approval=true;
:GET /api/v1/components/transfers/pending;

:Display unified approvals dashboard;
note right: Tabs: Gate Pass, Expense, Transfer
note right: Summary cards: Total pending, urgent

:User selects tab;
if (Tab?) then (gate_pass) then
  :Display gate pass approvals;
  :Show pass details;
  note right: Visitor/Vehicle info, validity
else if (expense) then
  :Display expense approvals;
  :Show expense details;
  note right: Amount, category, receipt
else if (transfer) then
  :Display component transfer approvals;
  :Show transfer details;
  note right: Component, from/to yards
endif

:User filters/sorts approvals;
note right: By date, amount, urgency, employee

if (User clicks on approval item?) then (yes)
  :Navigate to detail page;
  note right: /app/gate-pass/:id
  note right: /app/expenses/:id
  note right: /app/stockyard/components/transfers/:id
  stop
endif

if (User clicks "Approve"?) then (yes)
  :Call module-specific approve API;
  if (Success?) then (yes)
    :Update approval status;
    :Send notification;
    :Remove from pending list;
    :Show success toast;
  else (no)
    :Show error toast;
  endif
endif

if (User clicks "Reject"?) then (yes)
  :Show rejection modal;
  :User enters rejection reason;
  :Call module-specific reject API;
  if (Success?) then (yes)
    :Update approval status;
    :Send notification;
    :Remove from pending list;
    :Show success toast;
  else (no)
    :Show error toast;
  endif
endif

if (Bulk operations?) then (yes)
  :User selects multiple items;
  :User clicks "Approve Selected" or "Reject Selected";
  :Process batch operations;
  :Show batch result summary;
endif

stop

@enduml
```

---

## 8. User Management Flow

```plantuml
@startuml User_Management_Flow
title User Management Flow

start

:Super Admin/Admin navigates to /app/admin/users;
:Check user role;
note right: Requires: super_admin, admin

:Load users list;
:GET /api/v1/users;

:Display users table;
note right: Name, email, role, status
note right: Last login, actions

:User filters/sorts;
note right: By role, status, yard

if (User clicks "Create User"?) then (yes)
  :Show create user modal;
  :User enters details;
  note right: Name, email, employee_id
  note right: Role, yard, password
  :POST /api/v1/users;
  if (Success?) then (yes)
    :Show success toast;
    :Refresh users list;
  else (no)
    :Show error toast;
  endif
endif

if (User clicks on user row?) then (yes)
  :Navigate to /app/admin/users/:id;
  :Display user details;
  note right: Profile, permissions, activity
  note right: Capability matrix
  
  if (User clicks "Edit"?) then (yes)
    :Show edit user modal;
    :User updates details;
    :PATCH /api/v1/users/:id;
    if (Success?) then (yes)
      :Show success toast;
      :Refresh user details;
    else (no)
      :Show error toast;
    endif
  endif
  
  if (User clicks "Reset Password"?) then (yes)
    :Show reset password modal;
    :User enters new password;
    :POST /api/v1/users/:id/reset-password;
    if (Success?) then (yes)
      :Show success toast;
    else (no)
      :Show error toast;
    endif
  endif
  
  if (User clicks "Deactivate"?) then (yes)
    :Confirm deactivation;
    if (Confirmed?) then (yes)
      :PATCH /api/v1/users/:id;
      note right: is_active: false
      :Show success toast;
      :Refresh user details;
    endif
  endif
endif

if (User clicks "Bulk Operations"?) then (yes)
  :Navigate to /app/admin/users/bulk-operations;
  :Display bulk operations interface;
  note right: Select users, choose action
  note right: Assign role, activate/deactivate
  note right: Export, import
endif

if (User clicks "Capability Matrix"?) then (yes)
  :Navigate to /app/admin/users/capability-matrix;
  :Display capability matrix;
  note right: Roles vs Modules vs Actions
  note right: Visual permission grid
endif

stop

@enduml
```

---

## 9. Notifications & Alerts Flow

```plantuml
@startuml Notifications_Flow
title Notifications & Alerts Flow

start

:User navigates to /app/notifications;
:Load user notifications;
:GET /api/v1/notifications;

:Display notifications list;
note right: Unread count badge
note right: Grouped by date
note right: Filter: all, unread, read

:User clicks on notification;
:Mark as read;
:PATCH /api/v1/notifications/:id;
note right: is_read: true

if (Notification type?) then (approval_request) then
  :Navigate to approval page;
  note right: Based on module
else if (approval_status) then
  :Navigate to related item;
  note right: Gate pass, expense, etc.
else if (alert) then
  :Navigate to /app/alerts;
endif

if (User clicks "Mark All as Read"?) then (yes)
  :POST /api/v1/notifications/mark-all-read;
  :Update all notifications;
  :Refresh list;
endif

if (User clicks "Preferences"?) then (yes)
  :Navigate to /app/notifications/preferences;
  :Display notification settings;
  note right: Email notifications
  note right: Push notifications
  note right: Notification types
  :User updates preferences;
  :PATCH /api/v1/notifications/preferences;
  :Show success toast;
endif

:User navigates to /app/alerts;
:Load system alerts;
:GET /api/v1/alerts;

:Display alerts dashboard;
note right: Critical, warning, info
note right: Filter by severity, module

if (User clicks on alert?) then (yes)
  :Display alert details;
  :Show related items;
  :User can acknowledge alert;
  :POST /api/v1/alerts/:id/acknowledge;
endif

stop

@enduml
```

---

## 10. Settings & Configuration Flow

```plantuml
@startuml Settings_Flow
title Settings & Configuration Flow

start

:Super Admin/Admin navigates to settings;
:Check user role;
note right: Requires: super_admin, admin

if (User navigates to report branding?) then (yes)
  :Navigate to /app/settings/report-branding;
  :Display branding configuration;
  note right: Logo upload
  note right: Company name, address
  note right: Color scheme
  note right: Footer text
  
  :User updates branding;
  :POST /api/v1/settings/report-branding;
  if (Success?) then (yes)
    :Show success toast;
    :Preview updated branding;
  else (no)
    :Show error toast;
  endif
endif

if (User navigates to notification preferences?) then (yes)
  :Navigate to /app/notifications/preferences;
  :Display notification settings;
  :User updates preferences;
  :PATCH /api/v1/notifications/preferences;
  :Show success toast;
endif

stop

@enduml
```

---

## 11. Offline & Sync Flow

```plantuml
@startuml Offline_Sync_Flow
title Offline & Sync Flow

start

:User uses application;
:Monitor connectivity;
note right: Online/offline detection

if (Connection lost?) then (yes)
  :Show offline indicator;
  :Enable offline mode;
  note right: Store actions in queue
  note right: Use cached data
  
  :User performs actions;
  if (Action type?) then (create inspection) then
    :Queue inspection for sync;
    :Store in IndexedDB;
  else if (create expense) then
    :Queue expense for sync;
    :Store in IndexedDB;
  else if (create gate pass) then
    :Show error: "Requires online connection";
    note right: Gate passes need immediate validation
  endif
endif

if (Connection restored?) then (yes)
  :Hide offline indicator;
  :Show "Syncing..." message;
  :Process sync queue;
  
  :For each queued item;
  :Retry API call;
  if (Success?) then (yes)
    :Remove from queue;
    :Update UI;
  else (no)
    :Mark as failed;
    :Store error;
  endif
  
  :Show sync summary;
  note right: X items synced, Y failed
endif

if (User navigates to sync center?) then (yes)
  :Navigate to /app/inspections/sync;
  :Display sync queue;
  :User can manually retry failed items;
  :User can clear queue;
endif

stop

@enduml
```

---

## 12. Role-Based Navigation Flow

```plantuml
@startuml Role_Based_Navigation_Flow
title Role-Based Navigation Flow

start

:User logs in;
:Load user role and capabilities;
:Determine navigation menu;

if (User role?) then (guard) then
  :Show guard navigation;
  note right: Gate Pass (validation only)
  note right: Inspections (read only)
  note right: Dashboard
else if (clerk) then
  :Show clerk navigation;
  note right: Gate Pass (create, read)
  note right: Expenses (create, read)
  note right: Inspections (read only)
  note right: Dashboard
else if (inspector) then
  :Show inspector navigation;
  note right: Inspections (create, read, update)
  note right: Expenses (create, read)
  note right: Gate Pass (read only)
  note right: Dashboard
else if (supervisor) then
  :Show supervisor navigation;
  note right: Approvals (all modules)
  note right: Gate Pass (approve, validate)
  note right: Expenses (approve)
  note right: Inspections (approve, review)
  note right: Reports (read)
  note right: Dashboard
else if (admin) then
  :Show admin navigation;
  note right: All modules (full access)
  note right: User Management (read, update)
  note right: Reports (read, export)
  note right: Settings
  note right: Dashboard
else if (super_admin) then
  :Show super admin navigation;
  note right: All modules (full access)
  note right: User Management (full access)
  note right: Reports (read, export)
  note right: Settings (full access)
  note right: Dashboard
endif

:Display navigation menu;
:User clicks menu item;
:Check route permissions;
if (User has permission?) then (yes)
  :Navigate to route;
else (no)
  :Show error: "Access denied";
  :Redirect to dashboard;
endif

stop

@enduml
```

---

## Usage Instructions

1. **Copy each PlantUML diagram code block** into a PlantUML editor or renderer
2. **Recommended tools:**
   - [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
   - [VS Code PlantUML Extension](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
   - [IntelliJ IDEA PlantUML Plugin](https://plugins.jetbrains.com/plugin/7017-plantuml-integration)

3. **Generate diagrams** for each flow to visualize the complete application flow

4. **Customize as needed:**
   - Add more detail to specific steps
   - Combine related flows
   - Add error handling details
   - Include API endpoint details

---

## Summary of All Flows

1. **Authentication & Authorization** - Login, role checking, permission validation
2. **Main Dashboard** - Module navigation, Kanban board, quick actions
3. **Gate Pass Module** - Creation, validation (guard), approval, templates
4. **Inspections Module** - Template selection, capture, offline sync, reports
5. **Expenses Module** - Creation, approval, ledger management, reconciliation
6. **Stockyard Module** - Component movement, transfers, scanning, analytics
7. **Unified Approvals** - Centralized approval hub for all modules
8. **User Management** - User CRUD, capability matrix, bulk operations
9. **Notifications & Alerts** - Notification management, alert dashboard
10. **Settings** - Report branding, notification preferences
11. **Offline & Sync** - Offline queue management, sync operations
12. **Role-Based Navigation** - Dynamic menu based on user role

Each flowchart includes:
- ✅ Exact user actions at every step
- ✅ Logic and decision points
- ✅ API endpoints and data flow
- ✅ Error handling
- ✅ Role-based access control
- ✅ Navigation paths
- ✅ State management details






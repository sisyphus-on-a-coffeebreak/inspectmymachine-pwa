# Product Requirements Document (PRD)
## VOMS - Vehicle Operations Management System
### Reverse-Engineered from Codebase Analysis

---

## 1. Executive Summary

### 1.1 Product Overview
**VOMS (Vehicle Operations Management System)** is a comprehensive Progressive Web Application (PWA) designed for end-to-end vehicle operations management, including inspections, access control (gate passes), stockyard/inventory management, expense tracking, and workforce management.

**Live URL:** https://inspectmymachine.in

### 1.2 Product Vision
To provide a mobile-first, offline-capable enterprise platform that enables organizations to efficiently manage vehicle inspections, stockyard operations, access control, and financial tracking with real-time collaboration and comprehensive audit trails.

### 1.3 Target Market
- Vehicle auction houses
- Fleet management companies
- Logistics and transportation companies
- Vehicle dealerships
- Stockyards and warehouses
- Service centers and workshops

### 1.4 Key Value Propositions
1. **Offline-First Architecture** - Works without internet, syncs when connected
2. **Mobile-Optimized** - Native app-like experience on any device
3. **Real-Time Collaboration** - WebSocket-powered live updates
4. **Comprehensive Audit Trail** - Full activity logging and compliance
5. **Role-Based Access Control** - Granular 5-layer permission system
6. **Multi-Language Support** - English, Hindi, Odia with transliterations

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend Framework** | React | 19.1.1 |
| **Build Tool** | Vite | 7.1.0 |
| **Language** | TypeScript | 5.9.2 |
| **Styling** | Tailwind CSS | 4.1.11 |
| **State Management** | React Query (TanStack) | 5.90.8 |
| **Routing** | React Router | 7.8.0 |
| **HTTP Client** | Axios | 1.12.2 |
| **Real-Time** | Pusher.js (Laravel Reverb) | 8.4.0 |
| **Charts** | Recharts | 2.15.0 |
| **Icons** | Lucide React | 0.556.0 |
| **PDF Generation** | jsPDF + html2canvas | 2.5.1 / 1.4.1 |
| **QR Code** | qrcode + jsqr | 1.5.4 / 1.4.0 |
| **OCR** | Tesseract.js | 6.0.1 |
| **Spreadsheet** | XLSX (SheetJS) | 0.18.5 |
| **Offline Storage** | IndexedDB (idb-keyval) | 6.2.2 |
| **Drag & Drop** | @dnd-kit | 6.3.1 |
| **i18n** | i18next | 25.3.2 |
| **PWA** | vite-plugin-pwa (Workbox) | 1.0.2 |

### 2.2 Backend Integration
- **API Framework:** Laravel 11 (PHP 8.3)
- **Database:** MySQL 8.0+
- **Authentication:** Laravel Sanctum (CSRF + Session)
- **File Storage:** Cloudflare R2
- **Real-Time:** Laravel Reverb (WebSocket)
- **API Version:** v1 and v2 endpoints

### 2.3 Architecture Patterns
- **Service Layer Pattern** - Business logic in service classes
- **Repository Pattern** - Data access abstraction
- **Context API** - Global state management
- **React Query** - Server state caching and synchronization
- **Offline Queue** - IndexedDB-based request queueing
- **Code Splitting** - Lazy loading with Suspense boundaries

---

## 3. User Roles & Permissions

### 3.1 System Roles

| Role | Description | Primary Functions |
|------|-------------|-------------------|
| **Super Admin** | Full system access | All capabilities, system configuration, user management |
| **Admin** | Administrative access | User management, approvals, all module access |
| **Yard In-charge** | Yard management | Stockyard operations, approvals, access control |
| **Supervisor** | Oversight role | Approvals, validations, reports |
| **Executive** | Operational role | Create/validate passes, submit for approval |
| **Inspector** | Inspection specialist | Vehicle inspections, reports |
| **Guard** | Security role | Gate pass validation, entry/exit |
| **Clerk** | Data entry role | Create passes, log expenses |

### 3.2 Permission System (5 Layers of Granularity)

#### Layer 1: Module-Level Capabilities
```
Modules: inspection, expense, user_management, reports, stockyard, gate_pass
Actions: create, read, update, delete, approve, validate, review, reassign, export
```

#### Layer 2: Record-Level Scope
- `all` - Access all records
- `own_only` - Only user's own records
- `yard_only` - Only records in user's yard
- `department_only` - Only department records
- `assigned_only` - Only assigned records
- `function` - Function-based (stockyard sub-modules)
- `custom` - Custom filter expression

#### Layer 3: Field-Level Permissions
- Whitelist/blacklist specific fields
- Separate read vs. update permissions
- Data masking: full, partial, hash, redact

#### Layer 4: Conditional Rules
- Operators: ==, !=, >, <, >=, <=, in, not_in, contains, starts_with
- AND/OR logic combinations
- Record data evaluation

#### Layer 5: Contextual Restrictions
- Time-based permissions (valid_from/until, days_of_week, time_of_day)
- MFA requirements
- Approval workflows
- IP whitelist (CIDR support)
- Device type restrictions
- Location requirements
- Dual control (two-person approval)

### 3.3 Stockyard Function Scoping
```
Functions: access_control, inventory, movements
Each function has independent capability assignments
```

---

## 4. Core Modules

### 4.1 Vehicle Inspection Module

#### 4.1.1 Features
| Feature | Description |
|---------|-------------|
| **Dynamic Form Templates** | 130+ question configurable templates |
| **Template Editor** | Create/edit inspection templates with drag-drop |
| **Section Navigator** | Navigate between form sections |
| **Multi-Type Questions** | Text, number, boolean, single/multi-choice, photo, signature, audio, location |
| **Conditional Logic** | Show/hide questions based on answers |
| **Critical Questions** | Mark questions as mandatory/critical |
| **Auto-Save** | Automatic draft saving (debounced) |
| **Offline Capture** | Complete inspections without internet |
| **Sync Center** | Manage draft inspections and sync queue |
| **PDF Report Generation** | Branded inspection reports |
| **Image Management** | Photo capture, compression, download |
| **Conflict Resolution** | Handle concurrent edit conflicts |
| **Template Versioning** | Compare template versions |

#### 4.1.2 Inspection Workflow
```
1. Select Template → 2. Fill Form → 3. Auto-Save Draft → 4. Review → 5. Submit → 6. Generate Report
```

#### 4.1.3 Question Types
- Text (with validation patterns)
- Number (with min/max)
- Boolean (yes/no)
- Single Choice (radio)
- Multiple Choice (checkbox)
- Photo (camera capture)
- Signature (touch pad)
- Audio (voice recording)
- Geolocation (GPS capture)
- Date/Time
- Tyre Fields (specialized)

#### 4.1.4 Validation Rules
- Required/optional
- Min/max values
- Length constraints
- Regex patterns
- File size limits
- Custom validators

---

### 4.2 Access Control Module (Gate Pass System)

#### 4.2.1 Pass Types
| Type | Use Case |
|------|----------|
| **Visitor** | Person visiting to view vehicles |
| **Vehicle Inbound** | Vehicle entering yard |
| **Vehicle Outbound** | Vehicle leaving yard |

#### 4.2.2 Pass Status Flow
```
draft → pending → [approved] → active → inside → completed/expired
                 ↘ rejected
                 ↘ cancelled
```

#### 4.2.3 Purpose Categories
- Inspection
- Service
- Delivery
- Meeting
- RTO Work
- Sold
- Test Drive
- Auction
- Other (custom)

#### 4.2.4 Features
| Feature | Description |
|---------|-------------|
| **QR Code Generation** | Unique QR for each pass |
| **QR Scanner** | Camera-based QR validation |
| **Visitor Management** | Name, phone, company, vehicles to view |
| **Vehicle Tracking** | Driver details, license, odometer |
| **Validity Customization** | Set expiry date/time |
| **Photo Attachments** | Capture photos for passes |
| **Entry/Exit Recording** | Log entry with location, photos, condition |
| **Pass Templates** | Pre-designed pass formats |
| **Bulk Pass Creation** | Batch pass generation |
| **Guard Register** | Shift-based guard logs |
| **Expected Arrivals** | Track expected visitors |
| **Inside Now List** | Real-time occupants |
| **Anomaly Alerts** | Suspicious pattern detection |
| **Access Calendar** | Calendar view of passes |
| **Access Reports** | Analytics and history |

#### 4.2.5 Validation Data Captured
- Entry time
- Exit time
- Photos (entry/exit)
- Odometer reading
- GPS location
- Condition notes
- Component snapshot

---

### 4.3 Stockyard Management Module

#### 4.3.1 Features
| Feature | Description |
|---------|-------------|
| **Component Ledger** | Track all components with history |
| **Component Lifecycle** | Install, remove, transfer, maintenance |
| **Movement Transfers** | Transfer components between yards/vehicles |
| **Yard Mapping** | Visual yard layout with zones/slots |
| **Slot Management** | Track bay/slot occupancy |
| **Checklist System** | Inbound/outbound condition checklists |
| **Compliance Documents** | RC book, insurance, permits tracking |
| **Buyer Readiness Board** | Track vehicle readiness stages |
| **Transporter Bids** | Manage transport quotes |
| **Cost Analysis** | Component and vehicle cost breakdown |
| **Health Dashboard** | Component condition monitoring |
| **Profitability Dashboard** | P&L analytics per vehicle |
| **Alert System** | Configurable stockyard alerts |
| **Vehicle Timeline** | Complete vehicle history |

#### 4.3.2 Component Custody Events
- Install (add component to vehicle)
- Remove (take component off vehicle)
- Transfer (move between yards)
- Inspection (condition check)
- Maintenance (repair/service)
- Expense (cost allocation)

#### 4.3.3 Buyer Readiness Stages
```
awaiting_inspection → ready_for_listing → listed → sold
```

#### 4.3.4 Compliance Tracking
- RC Book status
- Insurance validity
- Fitness certificate
- Pollution certificate
- Road tax
- Custom permits

---

### 4.4 Expense Management Module

#### 4.4.1 Features
| Feature | Description |
|---------|-------------|
| **Employee Dashboard** | Personal expense overview |
| **Expense Creation** | Log expenses with receipts |
| **Receipt Gallery** | Photo capture and OCR |
| **Multi-Asset Allocation** | Distribute expense across assets |
| **Advance Management** | Request and track advances |
| **Ledger View** | Personal transaction history |
| **Reconciliation** | Match expenses with advances |
| **Approval Workflow** | Multi-level expense approval |
| **Category Analytics** | Spending by category |
| **Project Management** | Project-wise expense tracking |
| **Asset Management** | Asset cost tracking |
| **Cash Flow Analysis** | Cash flow visualization |
| **Expense Reports** | Generate expense reports |

#### 4.4.2 Expense Workflow
```
Create → Submit → [Approval] → Approved/Rejected → Reconciliation
```

#### 4.4.3 Analytics Tabs
- Overview (summary metrics)
- Category Analytics (trends)
- Project Analytics
- Assets
- Account Analytics
- Cash Flow
- Reconciliation

---

### 4.5 User Management Module

#### 4.5.1 Features
| Feature | Description |
|---------|-------------|
| **User CRUD** | Create, read, update, delete users |
| **Role Assignment** | Assign system or custom roles |
| **Capability Matrix** | Visual permission grid |
| **Enhanced Capabilities** | Granular permission editor |
| **Permission Templates** | Quick-apply permission sets |
| **Bulk Operations** | Activate, deactivate, delete multiple |
| **Activity Dashboard** | User activity tracking |
| **Password Reset** | Admin password reset |
| **Data Masking Rules** | Configure field masking |
| **Permission Change Logs** | Audit permission changes |
| **Security Dashboard** | Security monitoring |
| **Session Management** | Active session control |

#### 4.5.2 User Properties
- Employee ID
- Name
- Email
- Role (display)
- Yard assignment
- Active status
- Skip approval flags
- Capabilities
- Enhanced capabilities

---

### 4.6 Approval Module

#### 4.6.1 Unified Approval Dashboard
Aggregates approvals from:
- Gate Pass approvals
- Expense approvals
- Stockyard transfer approvals

#### 4.6.2 Features
| Feature | Description |
|---------|-------------|
| **Unified View** | All approvals in one place |
| **Filtering** | By type, requester, date |
| **Sorting** | Oldest/newest first |
| **Bulk Actions** | Approve/reject multiple |
| **Detail Modal** | Full approval details |
| **Action Logging** | Audit trail |

---

### 4.7 Reports & Analytics Module

#### 4.7.1 Available Reports
| Report | Description |
|--------|-------------|
| **Inspection Reports** | Completed inspection analytics |
| **Access Reports** | Gate pass history and trends |
| **Expense Reports** | Spending analytics |
| **Audit Reports** | Activity audit trails |
| **Compliance Dashboard** | Compliance status overview |
| **Vehicle Cost Dashboard** | Cost per vehicle analysis |
| **User Activity Dashboard** | User engagement metrics |
| **Security Dashboard** | Security event monitoring |

#### 4.7.2 Export Capabilities
- CSV export
- Excel (XLSX) export
- PDF generation
- Scheduled exports
- Custom export templates

---

### 4.8 Notification System

#### 4.8.1 Features
| Feature | Description |
|---------|-------------|
| **Notification Center** | Centralized notification view |
| **Push Notifications** | Web Push API integration |
| **Notification Preferences** | User-configurable settings |
| **Alert Dashboard** | System-wide alerts |
| **Anomaly Alerts** | Automated anomaly detection |
| **Unread Count** | Badge indicator |

#### 4.8.2 Notification Triggers
- Approval requests
- Status changes
- Expiring passes/documents
- Overdue tasks
- System alerts
- Balance warnings

---

## 5. Dashboard System

### 5.1 Dashboard Widgets (14 Types)

| Widget | Description | Target Roles |
|--------|-------------|--------------|
| **Stats Widget** | Quick metrics display | All |
| **Quick Actions** | Role-based action buttons | All |
| **Chart Widget** | Data visualizations | All |
| **Kanban Widget** | Task board columns | Supervisors, Admins |
| **Inspection Sync** | Sync queue monitor | Inspectors |
| **Scan Button** | QR scanner quick access | Guards |
| **Pending Approvals** | Items awaiting approval | Supervisors, Admins |
| **Needs Attention** | High-priority items | All |
| **Expected Arrivals** | Expected gate passes | Guards |
| **Inside Now** | Current occupants | Guards |
| **My Inspections** | Personal inspection queue | Inspectors |
| **Sync Status** | Sync indicator | Inspectors |
| **Today's Activity** | Daily summary | All |
| **Recent Items** | Recently viewed | All |

### 5.2 Dashboard Customization
- Drag-and-drop widget arrangement
- Widget visibility toggle
- Size options (small, medium, large, full)
- Edit mode for configuration
- Role-based default layouts

### 5.3 Real-Time Updates
- WebSocket connection (Laravel Reverb)
- Automatic polling fallback
- Cache indicator with refresh
- Real-time status indicator

---

## 6. Progressive Web App (PWA) Features

### 6.1 Installation
| Platform | Method |
|----------|--------|
| Chrome/Edge | Native install prompt |
| Firefox | Menu → Install |
| Safari | Share → Add to Home Screen |
| Samsung | Menu → Add to Home Screen |
| iOS | Share → Add to Home Screen |

### 6.2 App Shortcuts (Quick Actions)
- New Gate Pass
- New Inspection
- Log Expense

### 6.3 Offline Capabilities
| Feature | Implementation |
|---------|----------------|
| **Offline Detection** | `navigator.onLine` + events |
| **Offline Queue** | IndexedDB-backed request queue |
| **Auto-Retry** | 24-hour retention, 5 retry attempts |
| **Draft Saving** | LocalStorage auto-save |
| **Offline Fallback Page** | Styled offline.html |
| **Background Sync** | Photo upload queue |

### 6.4 Service Worker Strategies
| Route | Strategy |
|-------|----------|
| Navigation | NetworkFirst + Offline Fallback |
| API Calls | NetworkOnly |
| File Uploads | NetworkOnly + Background Sync |
| Static Assets | StaleWhileRevalidate |
| Fonts | CacheFirst (forever) |
| Images | StaleWhileRevalidate (7-day) |

### 6.5 Push Notifications
- VAPID authentication
- Customizable vibration patterns
- Action buttons
- Click handling
- Badge support

---

## 7. UI/UX Features

### 7.1 Navigation
| Component | Description |
|-----------|-------------|
| **Bottom Navigation** | Mobile bottom nav bar |
| **Command Palette** | Ctrl+K global search |
| **Breadcrumbs** | Navigation trail |
| **Page Transitions** | Animated transitions |
| **Skip to Content** | Accessibility link |

### 7.2 Forms & Input
| Feature | Description |
|---------|-------------|
| **Smart Form** | Auto-focus, field presets |
| **Input Masking** | Phone, ID, custom patterns |
| **Input History** | Autocomplete from history |
| **Voice Input** | Speech-to-text |
| **Auto-Save** | Debounced draft saving |

### 7.3 Mobile Optimizations
| Feature | Description |
|---------|-------------|
| **Pull to Refresh** | Native pull gesture |
| **Swipe Gestures** | 4-direction swipe detection |
| **Haptic Feedback** | Vibration patterns |
| **Bottom Sheet** | Slide-up modal |
| **Keyboard Detection** | Auto-scroll on keyboard |
| **Infinite Scroll** | Intersection observer pagination |

### 7.4 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Gate Pass |
| Ctrl+Shift+V | New Visitor Pass |
| Ctrl+Shift+C | New Vehicle Pass |
| Ctrl+Shift+E | New Expense |
| Ctrl+K | Command Palette |
| ? | Keyboard Help |

### 7.5 Accessibility
- ARIA labels
- Skip links
- Focus trapping in modals
- Screen reader support
- High contrast support (dark mode)

### 7.6 Theme Support
- Light mode
- Dark mode
- System preference detection
- Theme toggle component

---

## 8. Internationalization (i18n)

### 8.1 Supported Languages
| Code | Language | Script |
|------|----------|--------|
| en | English | Latin |
| hi | Hindi | Devanagari |
| hi-Latn | Hindi | Latin (transliteration) |
| or | Odia | Odia script |
| or-Latn | Odia | Latin (transliteration) |

### 8.2 Language Detection
1. URL query parameter (`?lng=en`)
2. LocalStorage (`voms_lng`)
3. Browser navigator language

---

## 9. Integration Points

### 9.1 API Endpoints (Key Routes)

#### Authentication
```
POST /login - User authentication
POST /logout - Session termination
GET /user - Current user info
GET /sanctum/csrf-cookie - CSRF token
```

#### Users (v1)
```
GET/POST /v1/users - List/Create users
GET/PUT/DELETE /v1/users/{id} - User CRUD
GET /v1/users/{id}/permissions - User permissions
POST /v1/users/{id}/reset-password - Password reset
```

#### Gate Passes (v2)
```
GET/POST /v2/gate-passes - List/Create passes
GET/PUT /v2/gate-passes/{id} - Pass CRUD
POST /v2/gate-passes/{id}/cancel - Cancel pass
POST /v2/gate-passes/validate - Validate QR
GET /v2/gate-passes-stats - Statistics
GET /v2/gate-passes-guard-logs - Guard logs
```

#### Inspections
```
GET/POST /v1/inspections - List/Create
GET /v1/inspections/{id} - Details
GET/POST /v1/inspection-templates - Templates
```

#### Expenses
```
GET/POST /v1/expenses - List/Create
GET /v1/expenses/{id} - Details
POST /v1/expenses/{id}/approve - Approve
```

#### Stockyard
```
GET/POST /v1/stockyard/requests - Requests
GET /v1/stockyard/components - Components
POST /v1/components/transfers - Transfers
```

### 9.2 Real-Time Channels (WebSocket)
```
dashboard.stats - Dashboard statistics updates
gate-pass.{id} - Pass status changes
inspection.{id} - Inspection updates
stockyard.{yard_id} - Yard notifications
```

### 9.3 External Services
| Service | Purpose |
|---------|---------|
| Cloudflare R2 | File storage |
| Laravel Reverb | WebSocket server |
| Web Push | Push notifications |

---

## 10. Security Features

### 10.1 Authentication
- CSRF token protection
- Session-based authentication
- Automatic token refresh
- 401/419 error handling

### 10.2 Authorization
- 5-layer granular permissions
- Role-based access control
- Capability-based checks
- Superadmin bypass protection
- Last superadmin protection

### 10.3 Data Protection
- Field-level masking
- Sensitive data redaction
- Audit logging
- Permission change tracking

### 10.4 Security Monitoring
- Activity logs
- Security dashboard
- Anomaly detection
- Session management
- IP restrictions

---

## 11. Performance Features

### 11.1 Code Splitting
- Lazy loading all page components
- Suspense boundaries
- Skeleton loaders
- Dynamic imports

### 11.2 Caching Strategy
| Data Type | Stale Time | Cache Time |
|-----------|-----------|------------|
| Dashboard Stats | 2 minutes | 5 minutes |
| List Data | 3 minutes | 10 minutes |
| Detail Data | 10 minutes | 15 minutes |
| User Data | 30 seconds | 5 minutes |

### 11.3 Optimizations
- Optimistic updates
- Request deduplication
- Background data refresh
- Virtualized lists
- Image optimization
- Prefetching on hover

---

## 12. Workflow Automation

### 12.1 Event Types
| Category | Events |
|----------|--------|
| Vehicle | entered, exited |
| Expense | created, approved, rejected |
| Inspection | completed, draft_saved |
| Component | installed, removed |
| Gate Pass | created, validated, expired |
| Stockyard | request_approved, request_rejected |
| Advance | issued, recorded |
| Balance | negative |
| Maintenance | task_created |
| Task | assigned, completed, overdue |

### 12.2 Task System
| Task Type | Description |
|-----------|-------------|
| clerking_sheet | Clerking documentation |
| component_accounting | Component tracking |
| maintenance_job_card | Maintenance work |
| reconciliation | Financial reconciliation |
| inspection_review | Inspection QA |
| advance_approval | Advance requests |
| status_change_approval | Status changes |
| custom | Custom tasks |

### 12.3 Task Properties
- Priority: low, medium, high, critical
- Status: pending, in_progress, completed, cancelled, overdue
- Assignee tracking
- Due dates
- Comments
- Related entities

---

## 13. Branding & Customization

### 13.1 Report Branding
- Logo upload
- Color picker
- Report preview
- Brand persistence

### 13.2 Settings
| Setting | Description |
|---------|-------------|
| Theme | Light/Dark mode |
| Language | Interface language |
| Notifications | Notification preferences |
| Sessions | Active session management |

---

## 14. Codebase Metrics

| Metric | Value |
|--------|-------|
| TypeScript Files | 481+ |
| Lines of Code | ~28,000+ |
| React Components | 200+ |
| Custom Hooks | 40+ |
| Service Classes | 7+ |
| Page Components | 50+ |
| Provider Components | 6 |

---

## 15. Deployment & Operations

### 15.1 Build Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # Type checking
npm run lint         # Linting
npm run deploy:prepare  # Build + typecheck
npm run deploy:check    # Lint + typecheck
```

### 15.2 Environment Variables
```
VITE_API_BASE - API base URL
VITE_API_ORIGIN - API origin for CSRF
VITE_REVERB_HOST - WebSocket host
VITE_REVERB_PORT - WebSocket port
VITE_REVERB_SCHEME - ws/wss
VITE_REVERB_APP_KEY - Pusher app key
VITE_ENABLE_WEBSOCKET - Enable WebSocket
VITE_VAPID_PUBLIC_KEY - Push notification key
```

### 15.3 Cache Configuration
```
/assets/* - 365 days (immutable)
/*.js - 365 days (immutable)
/*.css - 365 days (immutable)
/sw.js - no-cache (always fresh)
```

---

## 16. Future Considerations

### 16.1 Technical Debt
- Migration from role-based to capability-based permissions (in progress)
- i18n translation coverage expansion needed
- Additional test coverage

### 16.2 Potential Enhancements
- Native mobile apps (React Native wrapper)
- AI-powered inspection assistance
- Predictive analytics
- Integration with external ERP systems
- Multi-tenant architecture
- Blockchain audit trail

---

## Appendix A: File Structure

```
inspectmymachine-pwa/
├── src/
│   ├── components/      # React components (14 subdirectories)
│   ├── pages/           # Page components (11 subdirectories)
│   ├── providers/       # Context providers
│   ├── hooks/           # Custom hooks (40+)
│   ├── lib/             # Utilities & services
│   │   ├── services/    # Business logic services
│   │   ├── permissions/ # RBAC system
│   │   └── workflow/    # Workflow automation
│   ├── types/           # TypeScript definitions
│   ├── contexts/        # Context definitions
│   ├── i18n/            # Internationalization
│   ├── workers/         # Web Workers
│   └── sw.ts            # Service Worker
├── public/              # Static assets
├── docs/                # Documentation
└── scripts/             # Build scripts
```

---

## Appendix B: Component Inventory

### Layout Components
- AuthenticatedLayout, AppLayout, ProtectedRoute, ErrorBoundary

### Dashboard Components
- DashboardWidgetsContainer, Widget, 14 widget types

### Inspection Components
- InspectionCaptureForm, DynamicFormRenderer, TemplateEditor, CameraCapture, SignaturePad, AudioRecorder

### Access Control Components
- PassCard, QRScanner, VehicleSelector, BulkPassCreationGrid, GuardDashboardContent

### Stockyard Components
- VehicleStockyardSummary, ComponentTransferModal, YardMap

### Expense Components
- MultiAssetAllocation, ReceiptsGallery, LedgerTimeline

### User Management Components
- UserForm, UserList, EnhancedCapabilityEditor, CapabilityMatrix

### UI Components (60+)
- DataTable, Modal, Button, FormField, Card, Badge, Tooltip, and many more

---

*Document generated through reverse engineering of the VOMS codebase.*
*Last updated: 2026-01-29*

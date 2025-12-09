# Gate Pass Module - Complete File Structure & Component Mapping

## 📋 Overview

This document provides a comprehensive mapping of the Gate Pass module structure, including all files, components, routes, and their relationships.

**Last Updated:** Based on current codebase exploration  
**API Version:** v2 (`/api/v2/gate-passes`)  
**Frontend Stack:** React + TypeScript + Vite + React Query  
**Backend Stack:** Laravel + Eloquent ORM

---

## 📁 File Structure

### Frontend Files

#### **Page Components** (`src/pages/gatepass/`)
```
src/pages/gatepass/
├── GatePassDashboard.tsx              # Main dashboard (list view with filters)
├── GatePassDashboard.refactored.tsx   # Refactored version (alternative implementation)
├── GatePassDetails.tsx                 # Individual pass details page
├── CreateGatePass.tsx                 # Unified create form (visitor + vehicle)
├── QuickValidation.tsx                # QR scanner & validation for guards
├── GuardRegister.tsx                  # Guard log register
├── PassApproval.tsx                   # Approval workflow interface
├── GatePassReports.tsx                # Reports & analytics
├── GatePassCalendar.tsx               # Calendar view
├── VisitorManagement.tsx              # Visitor directory
├── PassTemplates.tsx                  # Pass templates management
├── BulkOperations.tsx                 # Bulk actions (admin only)
├── gatePassTypes.ts                   # TypeScript type definitions
└── components/
    ├── VehicleSelector.tsx            # Vehicle selection component
    ├── VehicleSearchAndCreate.tsx     # Vehicle search/create component
    └── PhotoUpload.tsx                # Photo upload component
```

#### **Shared Components** (`src/components/gatepass/`)
```
src/components/gatepass/
├── PassCard.tsx                       # Reusable pass card component
├── GuardDetailsModal.tsx              # Guard information modal
└── QRPayloadBanner.tsx                # QR payload display banner
```

#### **Hooks** (`src/hooks/`)
```
src/hooks/
└── useGatePasses.ts                   # React Query hooks for gate passes
    ├── useGatePasses()                # List query hook
    ├── useGatePass()                  # Single pass query hook
    ├── useGatePassStats()             # Statistics query hook
    ├── useCreateGatePass()            # Create mutation hook
    ├── useUpdateGatePass()            # Update mutation hook
    ├── useCancelGatePass()            # Cancel mutation hook
    ├── useValidatePass()              # Validation mutation hook
    ├── useRecordEntry()               # Entry recording hook
    ├── useRecordExit()                # Exit recording hook
    └── useGuardLogs()                 # Guard logs query hook
```

#### **Services** (`src/lib/services/`)
```
src/lib/services/
└── GatePassService.ts                 # API service layer
    ├── list()                         # List passes with filters
    ├── getStats()                     # Get statistics
    ├── get()                          # Get single pass
    ├── create()                       # Create new pass
    ├── update()                       # Update pass
    ├── cancel()                       # Cancel/delete pass
    ├── validateAndProcess()           # Validate QR code
    ├── recordEntry()                  # Record entry
    ├── recordExit()                   # Record exit
    └── getGuardLogs()                 # Get guard validation logs
```

### Backend Files

#### **Controllers** (`vosm/app/Http/Controllers/Api/`)
```
vosm/app/Http/Controllers/Api/
└── GatePassController.php             # Main API controller
    ├── index()                        # List passes (GET /gate-passes)
    ├── stats()                        # Get statistics (GET /gate-passes-stats)
    ├── show()                         # Get single pass (GET /gate-passes/{id})
    ├── store()                        # Create pass (POST /gate-passes)
    ├── update()                       # Update pass (PATCH /gate-passes/{id})
    ├── destroy()                      # Delete pass (DELETE /gate-passes/{id})
    ├── validateAndProcess()           # Validate QR (POST /gate-passes/validate)
    ├── recordEntry()                  # Record entry (POST /gate-passes/{id}/entry)
    ├── recordExit()                   # Record exit (POST /gate-passes/{id}/exit)
    ├── guardLogs()                    # Get guard logs (GET /gate-passes-guard-logs)
    └── getStats()                     # Internal stats calculation
```

#### **Models** (`vosm/app/Models/`)
```
vosm/app/Models/
├── GatePass.php                       # Main gate pass model
│   ├── Relationships: creator, vehicle, yard, validations
│   ├── Scopes: active, pending, expired, etc.
│   └── Methods: generatePassNumber(), generateAccessCode(), etc.
└── GatePassValidation.php             # Validation log model
    ├── Relationships: gatePass, validator
    └── Fields: gate_pass_id, action, validated_by, notes, ip_address
```

#### **Requests** (`vosm/app/Http/Requests/`)
```
vosm/app/Http/Requests/
└── StoreGatePassRequest.php           # Validation rules for creating passes
```

#### **Routes** (`vosm/routes/api/`)
```
vosm/routes/api/
└── v2.php                             # API v2 route definitions
    └── /gate-passes/*                 # All gate pass routes (protected by auth:sanctum)
```

#### **Migrations** (`vosm/database/migrations/`)
```
vosm/database/migrations/
└── 2024_12_05_000001_create_gate_passes_table.php
    └── Creates unified gate_passes table
```

---

## 🗺️ Routing Structure

### Route Definitions (`src/App.tsx`)

| Route | Component | Auth | Roles | Description |
|-------|-----------|------|-------|-------------|
| `/app/gate-pass` | `GatePassDashboard` | ✅ | `super_admin`, `admin`, `guard`, `clerk` | Main dashboard |
| `/app/gate-pass/:id` | `GatePassDetails` | ✅ | All authenticated | Pass details page |
| `/app/gate-pass/create` | `CreateGatePass` | ✅ | All authenticated | Unified create form |
| `/app/gate-pass/create-visitor` | → Redirects to `/create` | ✅ | All authenticated | Legacy route (redirects) |
| `/app/gate-pass/create-vehicle` | → Redirects to `/create` | ✅ | All authenticated | Legacy route (redirects) |
| `/app/gate-pass/guard-register` | `GuardRegister` | ✅ | `super_admin`, `admin`, `guard` | Guard log register |
| `/app/gate-pass/reports` | `GatePassReports` | ✅ | `super_admin`, `admin` | Reports & analytics |
| `/app/gate-pass/templates` | `PassTemplates` | ✅ | `super_admin`, `admin` | Pass templates |
| `/app/gate-pass/visitors` | `VisitorManagement` | ✅ | All authenticated | Visitor directory |
| `/app/gate-pass/calendar` | `GatePassCalendar` | ✅ | All authenticated | Calendar view |
| `/app/gate-pass/scan` | `QuickValidation` | ✅ | `super_admin`, `admin`, `supervisor`, `guard` | QR validation |
| `/app/gate-pass/validation` | → Redirects to `/scan` | ✅ | - | Legacy route (redirects) |
| `/app/gate-pass/quick-validation` | → Redirects to `/scan` | ✅ | - | Legacy route (redirects) |
| `/app/gate-pass/approval` | `PassApproval` | ✅ | `super_admin`, `admin`, `supervisor` | Approval queue |
| `/app/gate-pass/bulk` | `BulkOperations` | ✅ | `super_admin`, `admin` | Bulk operations |

### Navigation Structure (`src/components/layout/AppLayout.tsx`)

The navigation menu includes a "Gate Passes" section with sub-items:
- Dashboard
- Create Visitor Pass
- Create Vehicle Pass
- Guard Register
- Approvals
- Validation
- Calendar
- Reports

---

## 🔗 Component Relationships

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Query Layer                        │
│  useGatePasses() hooks → gatePassService → API Client       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Page Components                          │
│  GatePassDashboard → PassCard → GatePassDetails             │
│  CreateGatePass → VehicleSelector → GatePassService         │
│  QuickValidation → QRScanner → useValidatePass()            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Shared UI Components                      │
│  PageHeader, Button, Badge, Modal, Pagination, etc.        │
└─────────────────────────────────────────────────────────────┘
```

### Component Dependency Tree

#### **GatePassDashboard**
- Uses: `useGatePasses()`, `useGatePassStats()`
- Renders: `PassCard`, `StatCard`, `PageHeader`, `Pagination`, `FilterBadges`
- Navigates to: `GatePassDetails`, `CreateGatePass`

#### **GatePassDetails**
- Uses: `useGatePass()`, `useRecordEntry()`, `useRecordExit()`, `useCancelGatePass()`
- Renders: `PageHeader`, `Badge`, `ShareButton`, `QRCode` (via pdf-generator)
- Actions: Entry/Exit recording, Cancellation, PDF generation

#### **CreateGatePass**
- Uses: `useCreateGatePass()`
- Renders: `VehicleSelector`, `VehicleSearchAndCreate`, `Input`, `Button`
- Flow: Intent Selection → Form → Submission

#### **QuickValidation**
- Uses: `useValidatePass()`
- Renders: `QRScanner`, `Badge`, `Button`
- Flow: Scan QR → Validate → Record Entry/Exit

#### **PassCard** (Shared Component)
- Props: `pass: GatePass`, `onClick?`, `compact?`
- Uses: Type helpers from `gatePassTypes.ts`
- Navigates to: `GatePassDetails`

---

## 🎨 Shared UI Components Used

The Gate Pass module extensively uses shared UI components from `src/components/ui/`:

### Layout & Navigation
- `PageHeader` - Page headers with breadcrumbs
- `Breadcrumb` - Breadcrumb navigation
- `BottomNav` - Bottom navigation (mobile)

### Data Display
- `PassCard` - Gate pass card (module-specific)
- `PassDisplay` - Alternative pass display component
- `StatCard` - Statistics cards
- `Badge` - Status badges
- `EmptyState` - Empty state messages
- `SkeletonLoader` / `SkeletonCard` - Loading states

### Forms & Inputs
- `Button` - Buttons
- `Input` - Text inputs
- `Modal` - Modal dialogs
- `ConfirmDialog` - Confirmation dialogs
- `FormField` - Form field wrapper

### Data Management
- `Pagination` - Pagination controls
- `FilterBadges` - Filter chips
- `FilterBar` - Filter bar component
- `DataTable` - Data tables (reports)

### Feedback & Actions
- `NetworkError` - Error display
- `LoadingState` - Loading indicators
- `ShareButton` - Share functionality
- `Toast` (via `ToastProvider`) - Toast notifications

### Specialized
- `QRScanner` - QR code scanner
- `PullToRefreshWrapper` - Pull-to-refresh
- `PolicyLinks` - Policy links section
- `AnomalyAlert` - Anomaly alerts
- `ResponsiveGrid` - Responsive grid layouts

---

## 📊 Type Definitions

### Core Types (`gatePassTypes.ts`)

```typescript
// Pass Types
type GatePassType = 'visitor' | 'vehicle_inbound' | 'vehicle_outbound';
type GatePassStatus = 'draft' | 'pending' | 'active' | 'inside' | 'completed' | 'expired' | 'rejected' | 'cancelled';
type GatePassPurpose = 'inspection' | 'service' | 'delivery' | 'meeting' | 'rto_work' | 'sold' | 'test_drive' | 'auction' | 'other';
type ValidationAction = 'entry' | 'exit' | 'validation_only';

// Main Interfaces
interface GatePass { ... }              // Main pass interface
interface GatePassValidation { ... }    // Validation log
interface QRPayload { ... }             // QR code payload
interface GatePassStats { ... }         // Statistics
interface GatePassFilters { ... }       // Filter parameters
interface CreateGatePassData { ... }    // Create request data
interface ValidatePassRequest { ... }   // Validation request
interface ValidatePassResponse { ... }  // Validation response

// Helper Functions
isVisitorPass(), isVehiclePass(), isOutboundVehicle()
canEnter(), canExit(), isExpired()
getPassDisplayName(), getStatusColor(), getStatusLabel()
getPassTypeLabel(), getPassTypeIcon()
```

---

## 🔌 API Endpoints

### Base URL: `/api/v2/gate-passes`

| Method | Endpoint | Controller Method | Description |
|--------|----------|-------------------|-------------|
| GET | `/gate-passes` | `index()` | List passes with filters |
| GET | `/gate-passes-stats` | `stats()` | Get statistics |
| GET | `/gate-passes/{id}` | `show()` | Get single pass |
| POST | `/gate-passes` | `store()` | Create new pass |
| PATCH | `/gate-passes/{id}` | `update()` | Update pass |
| DELETE | `/gate-passes/{id}` | `destroy()` | Delete pass |
| POST | `/gate-passes/validate` | `validateAndProcess()` | Validate QR code |
| POST | `/gate-passes/{id}/entry` | `recordEntry()` | Record entry |
| POST | `/gate-passes/{id}/exit` | `recordExit()` | Record exit |
| GET | `/gate-passes-guard-logs` | `guardLogs()` | Get guard validation logs |

**Authentication:** All endpoints require `auth:sanctum` middleware

---

## 🗄️ Database Schema

### `gate_passes` Table
- Primary Key: `id` (UUID)
- Key Fields:
  - `pass_number` (unique, auto-generated)
  - `pass_type` (visitor, vehicle_inbound, vehicle_outbound)
  - `status` (draft, pending, active, inside, completed, expired, rejected, cancelled)
  - `purpose`, `purpose_details`
  - `valid_from`, `valid_to`, `entry_time`, `exit_time`
  - `access_code` (unique, auto-generated)
  - `qr_payload` (JSON)
  - Visitor fields: `visitor_name`, `visitor_phone`, `visitor_company`, `referred_by`, `vehicles_to_view` (JSON array)
  - Vehicle fields: `vehicle_id`, `driver_name`, `driver_contact`, `destination`, `exit_photos`, `return_photos`
  - Metadata: `created_by`, `yard_id`, `notes`
- Timestamps: `created_at`, `updated_at`, `deleted_at` (soft deletes)

### `gate_pass_validations` Table
- Primary Key: `id`
- Foreign Keys: `gate_pass_id`, `validated_by` (user)
- Fields: `action` (entry/exit/validation_only), `notes`, `ip_address`
- Timestamps: `created_at`, `updated_at`

---

## 🔄 State Management

### React Query Cache Keys

```typescript
gatePassKeys = {
  all: ['gate-passes'],
  lists: () => ['gate-passes', 'list'],
  list: (filters?) => ['gate-passes', 'list', filters],
  details: () => ['gate-passes', 'detail'],
  detail: (id) => ['gate-passes', 'detail', id],
  stats: (yardId?) => ['gate-passes', 'stats', yardId],
  guardLogs: (params?) => ['gate-passes', 'guard-logs', params],
}
```

### Cache Invalidation Strategy
- **Create/Update/Delete:** Invalidates `lists()` and `stats()`
- **Validation (with action):** Invalidates `lists()`, `stats()`, and updates `detail(id)`
- **Entry/Exit:** Invalidates `lists()`, `stats()`, and updates `detail(id)`

---

## 📝 Notes & Observations

### Current Architecture
1. **Unified API:** Single `/api/v2/gate-passes` endpoint handles all pass types
2. **Type Safety:** Comprehensive TypeScript types in `gatePassTypes.ts`
3. **Service Layer:** Clean separation with `GatePassService`
4. **React Query:** Centralized state management with proper cache invalidation
5. **Component Reusability:** Shared `PassCard` component used across pages

### Potential Refactoring Areas
1. **Two Dashboard Files:** `GatePassDashboard.tsx` and `GatePassDashboard.refactored.tsx` exist - need to consolidate
2. **Legacy Routes:** Several redirect routes (`/create-visitor`, `/validation`, etc.) - consider cleanup
3. **Component Organization:** Some components in `pages/gatepass/components/` could be moved to `components/gatepass/`
4. **Type Definitions:** All types in one file - consider splitting for better organization

### Dependencies
- **React Router:** For navigation
- **React Query (TanStack Query):** For server state
- **Lucide React:** For icons
- **Custom Theme:** `@/lib/theme` for styling
- **Toast Provider:** For notifications
- **Auth Context:** For user authentication

---

## 🎯 Next Steps for Refactoring

1. **Consolidate Dashboard:** Merge or remove `GatePassDashboard.refactored.tsx`
2. **Component Organization:** Review component placement (pages vs components)
3. **Route Cleanup:** Remove or document legacy redirect routes
4. **Type Organization:** Consider splitting `gatePassTypes.ts` into multiple files
5. **Shared Components:** Audit which components are truly shared vs module-specific
6. **Documentation:** Add JSDoc comments to all public functions and components

---

**End of Mapping Document**




# Codebase Mapping: Inspections & Stockyard Modules

## 📋 Overview

This document provides a comprehensive mapping of the Inspections and Stockyard modules in the VOMS codebase, including file structure, routing, shared components, API endpoints, and offline/sync mechanisms.

**Frontend Location:** `/Users/narnolia/code/voms-pwa`  
**Backend Location:** `/Users/narnolia/code/vosm` (referenced in git status)

---

## 📁 File Structure

### Inspections Module Files

#### Pages (`src/pages/inspections/`)
- `InspectionDashboard.tsx` - Main dashboard with stats and list
- `InspectionCapture.tsx` - Form for capturing inspection data
- `InspectionDetails.tsx` - Individual inspection details page
- `InspectionReports.tsx` - Reports and analytics
- `InspectionStudio.tsx` - Template builder/editor (admin)
- `InspectionSyncCenter.tsx` - Offline sync management

#### Components (`src/components/inspection/`)
- `AudioRecorder.tsx` - Audio recording for questions
- `CameraCapture.tsx` - Camera/photo capture
- `ConflictResolutionModal.tsx` - Template conflict resolution
- `DraggableReportBuilder.tsx` - Drag-and-drop report customization
- `DynamicFormRenderer.tsx` - Renders inspection forms dynamically
- `DynamicTyreFields.tsx` - Dynamic tyre-related fields
- `GeolocationCapture.tsx` - GPS location capture
- `ImageDownloadManager.tsx` - Manages image downloads
- `InspectionCaptureForm.tsx` - Main capture form wrapper
- `InspectionCaptureStatusBar.tsx` - Status bar during capture
- `InspectionReport.tsx` - Report rendering component
- `QuestionBuilder.tsx` - Question builder for templates
- `RtoDetailsManager.tsx` - RTO details management
- `SignaturePad.tsx` - Signature capture
- `TemplateDiffViewer.tsx` - Shows template differences
- `TemplateEditor.tsx` - Template editing interface
- `TemplateList.tsx` - Template listing component
- `TemplatePicker.tsx` - Template selection component

#### Library Files (`src/lib/`)
- `inspection-answers.ts` - Answer serialization/deserialization
- `inspection-queue.ts` - Offline queue management
- `inspection-serialization-types.ts` - Type definitions for serialization
- `inspection-submit.ts` - Submission logic with offline support
- `inspection-templates.ts` - Template fetching and caching
- `templateHistory.ts` - Template version history

#### Types (`src/types/`)
- `inspection.ts` - Inspection type definitions

---

### Stockyard Module Files

#### Pages (`src/pages/stockyard/`)
- `StockyardDashboard.tsx` - Main dashboard
- `StockyardRequestDetails.tsx` - Request details page
- `StockyardScan.tsx` - QR scanning for entry/exit
- `CreateStockyardRequest.tsx` - Create new request
- `CreateComponentMovement.tsx` - Record component movement
- `ComponentLedger.tsx` - Component inventory ledger
- `CreateComponent.tsx` - Create new component
- `ComponentDetails.tsx` - Component details page
- `EditComponent.tsx` - Edit component
- `ComponentTransferApproval.tsx` - Approve/reject transfers
- `ComponentCostAnalysis.tsx` - Cost analysis dashboard
- `ComponentHealthDashboard.tsx` - Component health tracking
- `YardMap.tsx` - Yard map with slot visualization
- `ChecklistView.tsx` - Inbound/outbound checklist
- `BuyerReadinessBoard.tsx` - Kanban board for buyer readiness
- `VehicleTimeline.tsx` - Vehicle timeline events
- `ComplianceDocuments.tsx` - Document management
- `TransporterBids.tsx` - Transporter bidding interface
- `ProfitabilityDashboard.tsx` - Profitability analysis
- `StockyardAlertsDashboard.tsx` - Alerts dashboard

#### Components (`src/components/stockyard/`)
- `ComponentMaintenanceModal.tsx` - Maintenance record modal
- `ComponentTransferModal.tsx` - Transfer component modal
- `DaysSinceEntryWidget.tsx` - Days since entry widget
- `StockyardQuickActions.tsx` - Quick action buttons
- `VehicleStockyardSummary.tsx` - Vehicle summary card

#### Library Files (`src/lib/`)
- `stockyard.ts` - Stockyard API client (622+ lines)
  - Request management
  - Component management
  - Yard slot management
  - Checklist operations
  - Document management
  - Analytics and reporting

---

## 🛣️ Routing Structure

### Inspections Routes (`src/App.tsx`)

```typescript
// Main routes
/app/inspections                    → InspectionDashboard
/app/inspections/studio             → InspectionStudio (admin only)
/app/inspections/sync               → InspectionSyncCenter
/app/inspections/completed          → InspectionsCompleted
/app/inspections/reports            → InspectionReports

// Capture routes
/app/inspections/new                → InspectionCapture (no template)
/app/inspections/:templateId/capture → InspectionCapture (with template)
/app/inspections/:templateId/:vehicleId/capture → InspectionCapture (with both)

// Details route (must come before capture routes with :id)
/app/inspections/:id                → InspectionDetails
```

### Stockyard Routes (`src/App.tsx`)

```typescript
// Main routes
/app/stockyard                       → StockyardDashboard
/app/stockyard/scan                  → StockyardScan
/app/stockyard/create                → CreateComponentMovement
/app/stockyard/:id                   → StockyardRequestDetails

// Component routes
/app/stockyard/components            → ComponentLedger
/app/stockyard/components/create     → CreateComponent
/app/stockyard/components/:type/:id → ComponentDetails
/app/stockyard/components/:type/:id/edit → EditComponent
/app/stockyard/components/transfers/approvals → ComponentTransferApproval
/app/stockyard/components/cost-analysis → ComponentCostAnalysis
/app/stockyard/components/health     → ComponentHealthDashboard

// Feature routes
/app/stockyard/yards/:yardId/map     → YardMap
/app/stockyard/requests/:requestId/checklist → ChecklistView
/app/stockyard/buyer-readiness      → BuyerReadinessBoard
/app/stockyard/vehicles/:vehicleId/timeline → VehicleTimeline
/app/stockyard/requests/:requestId/documents → ComplianceDocuments
/app/stockyard/requests/:requestId/transporter-bids → TransporterBids
/app/stockyard/vehicles/:vehicleId/profitability → ProfitabilityDashboard
/app/stockyard/alerts                → StockyardAlertsDashboard
```

---

## 🔗 Shared Components

### UI Components (`src/components/ui/`)

Both modules extensively use these shared components:

#### Layout & Navigation
- `PageHeader.tsx` - Page headers with breadcrumbs
- `Breadcrumb.tsx` - Breadcrumb navigation
- `BottomNav.tsx` - Bottom navigation (mobile)
- `Modal.tsx` - Modal dialogs
- `ConfirmDialog.tsx` - Confirmation dialogs

#### Data Display
- `StatCard.tsx` - Statistics cards
- `Badge.tsx` - Status badges
- `EmptyState.tsx` - Empty state messages
- `SkeletonLoader.tsx` - Loading states
- `StatusCard.tsx` - Status display cards
- `StatusIndicator.tsx` - Status indicators

#### Forms & Inputs
- `button.tsx` - Buttons
- `input.tsx` - Text inputs
- `FormField.tsx` - Form field wrapper
- `QRScanner.tsx` - QR code scanner
- `ImageViewer.tsx` - Image viewing
- `SortablePhotoGrid.tsx` - Photo grid with sorting

#### Data Management
- `Pagination.tsx` - Pagination controls
- `FilterBadge.tsx` - Filter chips
- `FilterBar.tsx` - Filter bar component
- `DataTable.tsx` - Data tables
- `ResponsiveGrid.tsx` - Responsive grid layout

#### Utilities
- `LoadingError.tsx` - Loading/error states
- `OfflineIndicator.tsx` - Offline status indicator
- `Tooltip.tsx` - Tooltips
- `CollapsibleSection.tsx` - Collapsible sections
- `RelatedItems.tsx` - Related items display

---

## 🌐 API Endpoints

### Inspections Endpoints

Based on `ENDPOINT_CONNECTION_STATUS.md` and codebase:

```
GET    /v1/inspection-dashboard              → Dashboard statistics
GET    /v1/inspection-templates              → List templates
GET    /v1/inspection-templates/{id}          → Get template details
POST   /v1/inspection-templates               → Create template
PUT    /v1/inspection-templates/{id}          → Update template
DELETE /v1/inspection-templates/{id}          → Delete template
GET    /v1/inspections                       → List inspections
POST   /v1/inspections                       → Create/submit inspection (multipart/form-data)
GET    /v1/inspections/{id}                  → Get inspection details
PATCH  /v1/inspections/{id}                  → Update inspection
PATCH  /v1/inspections/{inspectionId}/answers/{answerId}/reorder-photos → Reorder photos
GET    /v1/inspections/{id}/report            → Generate PDF report
GET    /v1/inspections/{inspectionId}/rto-details → Get RTO details
POST   /v1/inspections/{inspectionId}/rto-details → Save RTO details
```

### Stockyard Endpoints

Based on `ENDPOINT_CONNECTION_STATUS.md` and `src/lib/stockyard.ts`:

```
GET    /v1/stockyard-requests                 → List requests
POST   /v1/stockyard-requests                 → Create request
GET    /v1/stockyard-requests/{id}             → Get request details
GET    /v1/stockyard-requests/stats           → Request statistics
PATCH  /v1/stockyard-requests/{id}/approve     → Approve request
PATCH  /v1/stockyard-requests/{id}/reject     → Reject request
PATCH  /v1/stockyard-requests/{id}/cancel      → Cancel request
POST   /v1/stockyard-requests/{id}/scan         → Record scan (entry/exit)

GET    /v1/yards                              → List yards
GET    /v1/yards/{id}/map                     → Yard map with slots
GET    /v1/yards/{id}/slot-suggestions        → Get slot suggestions

GET    /v1/components                         → List components
POST   /v1/components                         → Create component
GET    /v1/components/{type}/{id}             → Get component details
PATCH  /v1/components/{type}/{id}             → Update component
DELETE /v1/components/{type}/{id}             → Delete component
GET    /v1/components/cost-analysis          → Cost analysis
GET    /v1/components/health-dashboard        → Health dashboard
GET    /v1/components/custody-events          → Custody events
POST   /v1/components/{type}/{id}/transfer   → Transfer component
POST   /v1/components/{type}/{id}/maintenance → Create maintenance
GET    /v1/components/transfers/pending       → Pending transfers
POST   /v1/components/transfers/{id}/approve  → Approve transfer
POST   /v1/components/transfers/{id}/reject   → Reject transfer

GET    /v1/stockyard-requests/{id}/checklist   → Get checklist
POST   /v1/stockyard/checklists               → Create checklist
PATCH  /v1/stockyard/checklists/{id}/items/{itemId} → Update checklist item
POST   /v1/stockyard/checklists/{id}/complete → Complete checklist

GET    /v1/stockyard-requests/{id}/documents   → Get documents
POST   /v1/stockyard-requests/{id}/documents   → Upload document

GET    /v1/stockyard-requests/{id}/transporter-bids → Get transporter bids
POST   /v1/stockyard/transporter-bids          → Create transporter bid
POST   /v1/stockyard/transporter-bids/{id}/accept → Accept bid

GET    /v1/stockyard/vehicles/{vehicleId}/timeline → Vehicle timeline
GET    /v1/stockyard/alerts                   → Stockyard alerts
GET    /v1/stockyard/vehicles/{vehicleId}/profitability → Profitability forecast
```

### Vehicle Management (Shared)
```
GET    /v1/vehicles                           → List vehicles
GET    /v1/vehicles/search                    → Search vehicles
```

---

## 💾 Offline/Sync Mechanisms

### Inspections Offline Support

#### Storage (`src/lib/inspection-queue.ts`)
- **IndexedDB** via `idb-keyval` library
- **Queue Prefix:** `inspection-queue:`
- **Draft Prefix:** `inspection-draft:`
- **BroadcastChannel** for cross-tab communication

#### Queue Management
```typescript
// Queue operations
queueInspectionSubmission()      → Add to queue
listQueuedInspections()           → List all queued
removeQueuedInspection()         → Remove from queue
updateQueuedInspection()          → Update queue item
subscribeQueuedInspectionCount() → Subscribe to count changes

// Draft operations
saveInspectionDraft()            → Save draft to IndexedDB
loadInspectionDraft()             → Load draft from IndexedDB
clearInspectionDraft()           → Clear draft
```

#### Sync Logic (`src/lib/inspection-submit.ts`)
- `submitInspection()` - Main submission with offline detection
- `syncQueuedInspections()` - Sync all queued inspections
- Auto-queues on network errors
- Retries with exponential backoff
- Progress tracking via callbacks

#### Template Caching (`src/lib/inspection-templates.ts`)
- Templates cached in IndexedDB
- Version checking for conflicts
- Offline mode detection
- Cache-first with network fallback

#### Auto-Sync Triggers
- Network reconnection (`window.addEventListener('online')`)
- Manual sync from `InspectionSyncCenter`
- Background sync on app focus

### Stockyard Offline Support

#### Current State
- Uses general `offlineQueue` from `src/lib/offlineQueue.ts`
- No module-specific offline queue (unlike inspections)
- API calls queued automatically on network errors

#### Offline Queue (`src/lib/offlineQueue.ts`)
- Generic queue for all API requests
- IndexedDB storage
- Automatic retry on reconnection
- Request deduplication

---

## 🔄 State Management

### React Query (TanStack Query)

#### Query Keys (`src/lib/queries.ts`)

**Inspections:**
```typescript
inspections: {
  all: ['inspections']
  lists: () => ['inspections', 'list']
  list: (filters) => ['inspections', 'list', filters]
  details: () => ['inspections', 'detail']
  detail: (id) => ['inspections', 'detail', id]
  templates: {
    all: () => ['inspections', 'templates']
    list: () => ['inspections', 'templates', 'list']
    detail: (id) => ['inspections', 'templates', id]
  }
  dashboard: () => ['inspections', 'dashboard']
}
```

**Stockyard:**
```typescript
stockyard: {
  all: ['stockyard']
  requests: {
    all: () => ['stockyard', 'requests']
    lists: () => ['stockyard', 'requests', 'list']
    list: (filters) => ['stockyard', 'requests', 'list', filters]
    details: () => ['stockyard', 'requests', 'detail']
    detail: (id) => ['stockyard', 'requests', 'detail', id]
    stats: () => ['stockyard', 'requests', 'stats']
  }
  components: {
    all: () => ['stockyard', 'components']
    lists: () => ['stockyard', 'components', 'list']
    list: (filters) => ['stockyard', 'components', 'list', filters]
    details: () => ['stockyard', 'components', 'detail']
    detail: (type, id) => ['stockyard', 'components', 'detail', type, id]
    costAnalysis: (filters) => ['stockyard', 'components', 'cost-analysis', filters]
    healthDashboard: () => ['stockyard', 'components', 'health-dashboard']
    custodyEvents: (filters) => ['stockyard', 'components', 'custody-events', filters]
    analytics: (type, id) => ['stockyard', 'components', 'analytics', type, id]
  }
  // ... more query keys
}
```

#### Query Hooks

**Inspections:**
- `useInspections(filters, options)` - List inspections
- `useInspection(id, options)` - Get inspection details
- `useInspectionTemplates(options)` - List templates
- `useInspectionTemplate(id, options)` - Get template
- `useInspectionDashboard(options)` - Dashboard stats

**Stockyard:**
- `useStockyardRequests(filters, options)` - List requests
- `useStockyardRequest(id, options)` - Get request details
- `useStockyardStats(options)` - Request statistics
- `useComponents(filters, options)` - List components
- `useComponent(type, id, options)` - Get component details
- `useYardMap(yardId, options)` - Get yard map
- `useChecklist(requestId, type, options)` - Get checklist
- `useStockyardDocuments(requestId, options)` - Get documents
- `useTransporterBids(requestId, options)` - Get bids
- `useVehicleTimeline(vehicleId, options)` - Get timeline
- `useStockyardAlerts(filters, options)` - Get alerts
- `useProfitabilityForecast(vehicleId, options)` - Get profitability
- `useDaysSinceEntry(vehicleId, options)` - Get days since entry

---

## 📊 Data Models

### Inspections

```typescript
// From src/types/inspection.ts and codebase
interface InspectionTemplate {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  version: number;
  sections: InspectionSection[];
  created_at: string;
  updated_at: string;
}

interface InspectionSection {
  id: string;
  name: string;
  order: number;
  questions: InspectionQuestion[];
}

interface InspectionQuestion {
  id: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'photo' | 'signature' | 'audio' | 'geolocation';
  label: string;
  required: boolean;
  options?: string[];
  // ... more fields
}

interface Inspection {
  id: string;
  template_id: string;
  vehicle_id?: string;
  status: 'draft' | 'completed' | 'submitted';
  answers: Record<string, any>;
  // ... more fields
}
```

### Stockyard

```typescript
// From src/lib/stockyard.ts
interface StockyardRequest {
  id: string;
  vehicle_id: string;
  yard_id: string;
  type: 'ENTRY' | 'EXIT';
  status: 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
  scan_in_at?: string;
  scan_out_at?: string;
  // ... more fields
  vehicle?: Vehicle;
  yard?: Yard;
}

interface Component {
  id: string;
  type: 'battery' | 'tyre' | 'spare_tyre' | 'tool_kit' | 'fire_extinguisher' | 'jack' | 'rod' | 'other';
  brand?: string;
  model?: string;
  serial_number?: string;
  condition: 'good' | 'fair' | 'poor' | 'damaged';
  status: 'in_stock' | 'out_with_vehicle' | 'transferred' | 'disposed';
  // ... more fields
}

interface YardSlot {
  id: string;
  yard_id: string;
  slot_number: string;
  zone?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked';
  vehicle_id?: string;
  // ... more fields
}
```

---

## 🔍 Key Implementation Details

### Inspections

1. **Template Selection**
   - Currently handled by `TemplatePicker` component
   - Conditional rendering in `InspectionCapture`
   - No dedicated template selection page

2. **Capture Flow**
   - `InspectionCapture` → `TemplatePicker` (if no template) → `DynamicFormRenderer`
   - Draft saving to IndexedDB
   - Auto-save on changes (debounced)
   - Offline queue on submission failure

3. **Sync Center**
   - Dedicated page: `InspectionSyncCenter.tsx`
   - Shows queued inspections
   - Manual sync trigger
   - Conflict resolution UI

### Stockyard

1. **Request Flow**
   - Create → Approve → Scan In → (Component Recording) → Scan Out
   - Component recording not yet integrated into entry flow
   - Checklists separate from component recording

2. **Component Management**
   - Separate ledger system
   - Movement tracking (entry/exit)
   - Transfer approval workflow
   - Health and cost analytics

3. **Dashboard**
   - Stats cards
   - Request list with filters
   - Quick actions
   - No progressive disclosure yet

---

## 🚨 Known Gaps / Missing Features

### Inspections
- ❌ No dedicated template selection page (conditional picker)
- ❌ No progress indicators in capture form
- ❌ No section navigation in capture form
- ❌ Details page has 7+ action buttons (needs declutter)
- ❌ No report branding system
- ❌ Sync center not visible on dashboard

### Stockyard
- ❌ Request details has 8+ action buttons (needs tabs)
- ❌ Component recording not integrated into entry flow
- ❌ No returning vehicle detection/pre-fill
- ❌ Dashboard shows everything at once (needs progressive disclosure)
- ❌ Movement recording requires typing (needs browse/recent)

---

## 📝 Notes for Implementation

1. **No Mock Data**: User explicitly requested no mock data anywhere
2. **Backend Location**: Backend is in separate repo (`vosm`), but API endpoints are well-documented
3. **Offline First**: Inspections has robust offline support; stockyard uses generic queue
4. **Shared Components**: Extensive use of `src/components/ui/` components
5. **Type Safety**: Strong TypeScript usage throughout
6. **React Query**: All data fetching uses React Query with centralized query keys

---

## ✅ Ready for Implementation

This mapping provides all necessary context to begin implementing the phases outlined in the user's requirements. Each phase can reference this document for:
- File locations
- Existing patterns
- API endpoints
- Component reuse
- State management approach

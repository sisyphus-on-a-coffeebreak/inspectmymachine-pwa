# Stockyard Module - Integration Guide

## 🎯 Overview

This guide explains how all the Stockyard module components integrate together and how to use them in other parts of the application.

---

## 📦 Component Library

### Reusable Components

#### 1. `DaysSinceEntryWidget`
**Location:** `src/components/stockyard/DaysSinceEntryWidget.tsx`

**Usage:**
```tsx
import { DaysSinceEntryWidget } from '@/components/stockyard/DaysSinceEntryWidget';

<DaysSinceEntryWidget
  daysSinceEntry={45}
  vehicleRegistration="MH12AB1234"
  showAlert={true}
  alertThreshold={30}
/>
```

**Props:**
- `daysSinceEntry: number` - Days since vehicle entered yard
- `vehicleRegistration?: string` - Vehicle registration number
- `showAlert?: boolean` - Show alert indicators
- `alertThreshold?: number` - Alert threshold in days (default: 30)

#### 2. `StockyardQuickActions`
**Location:** `src/components/stockyard/StockyardQuickActions.tsx`

**Usage:**
```tsx
import { StockyardQuickActions } from '@/components/stockyard/StockyardQuickActions';

<StockyardQuickActions showAll={true} compact={false} />
```

**Props:**
- `showAll?: boolean` - Show all actions or just primary
- `compact?: boolean` - Compact layout

#### 3. `VehicleStockyardSummary`
**Location:** `src/components/stockyard/VehicleStockyardSummary.tsx`

**Usage:**
```tsx
import { VehicleStockyardSummary } from '@/components/stockyard/VehicleStockyardSummary';

<VehicleStockyardSummary
  vehicleId="vehicle-uuid"
  vehicleRegistration="MH12AB1234"
  stockyardRequestId="request-uuid"
  compact={false}
/>
```

**Props:**
- `vehicleId: string` - Vehicle ID
- `vehicleRegistration?: string` - Vehicle registration
- `stockyardRequestId?: string` - Current stockyard request ID
- `compact?: boolean` - Compact display mode

---

## 🛠️ Utility Functions

### Location: `src/lib/stockyard-utils.ts`

#### Date & Time Utilities
- `calculateDaysSinceEntry(request)` - Calculate days since entry
- `formatDaysSinceEntry(days)` - Format days for display
- `isVehicleInYard(request)` - Check if vehicle is in yard

#### Slot Management
- `getSlotUtilization(slot)` - Get utilization percentage
- `isSlotAvailable(slot)` - Check if slot can be assigned
- `formatSlotStatus(status)` - Format status for display
- `getSlotStatusColor(status)` - Get color for status

#### Checklist Utilities
- `getChecklistCompletion(checklist)` - Get completion percentage
- `canCompleteChecklist(checklist)` - Check if checklist can be completed

#### Compliance Utilities
- `getComplianceStatus(documents)` - Get compliance status
- `isDocumentTypeRequired(type)` - Check if document type is required
- `getDocumentTypeLabel(type)` - Get human-readable label

#### Buyer Readiness
- `getNextBuyerReadinessStage(stage)` - Get next stage
- `getPreviousBuyerReadinessStage(stage)` - Get previous stage

#### Alert Utilities
- `getAlertPriority(alert)` - Calculate alert priority score
- `sortAlertsByPriority(alerts)` - Sort alerts by priority

---

## 🔌 React Query Hooks

### Query Hooks (Data Fetching)

```tsx
// Yard Management
useYardMap(yardId)
useSlotSuggestions(yardId, vehicleId, requestId?)

// Checklists
useChecklist(requestId, type?)

// Component Custody
useComponentCustodyEvents(filters?)
useComponentAnalytics(componentType, componentId)

// Compliance
useStockyardDocuments(requestId)
useComplianceTasks(filters?)

// Transporter
useTransporterBids(requestId)

// Buyer Readiness
useBuyerReadinessRecords(filters?)

// Analytics
useVehicleTimeline(vehicleId, filters?)
useStockyardAlerts(filters?)
useProfitabilityForecast(vehicleId)
useDaysSinceEntry(vehicleId?)
```

### Mutation Hooks (Data Updates)

```tsx
// Slot Management
useAssignVehicleToSlot()
useReassignVehicleSlot()

// Checklists
useCreateChecklist()
useUpdateChecklistItem()
useCompleteChecklist()

// Documents
useUploadStockyardDocument()
useApproveDocument()

// Transporter
useCreateTransporterBid()
useAcceptTransporterBid()

// Buyer Readiness
useUpdateBuyerReadinessStage()

// Alerts
useAcknowledgeStockyardAlert()
```

---

## 🔗 Integration Points

### Adding Stockyard Info to Vehicle Detail Pages

```tsx
import { VehicleStockyardSummary } from '@/components/stockyard/VehicleStockyardSummary';

// In your vehicle detail page
<VehicleStockyardSummary
  vehicleId={vehicle.id}
  vehicleRegistration={vehicle.registration_number}
  compact={false}
/>
```

### Adding Stockyard Quick Actions

```tsx
import { StockyardQuickActions } from '@/components/stockyard/StockyardQuickActions';

// In any dashboard or page
<StockyardQuickActions showAll={true} />
```

### Linking from Other Modules

#### From Inspection Details
```tsx
// Link to stockyard request if vehicle is in yard
{vehicleInYard && (
  <Button onClick={() => navigate(`/app/stockyard?vehicle=${vehicleId}`)}>
    View in Stockyard
  </Button>
)}
```

#### From Expense Details
```tsx
// Link to vehicle timeline
<Button onClick={() => navigate(`/app/stockyard/vehicles/${vehicleId}/timeline`)}>
  View Vehicle Timeline
</Button>
```

#### From Gate Pass Details
```tsx
// Link to stockyard if vehicle entered
{gatePass.type === 'entry' && (
  <Button onClick={() => navigate(`/app/stockyard?vehicle=${vehicleId}`)}>
    View Stockyard Status
  </Button>
)}
```

---

## 📊 Data Flow Examples

### Complete Vehicle Entry Workflow

1. **Create Request** → `useCreateStockyardRequest()`
2. **Approve Request** → `useApproveStockyardRequest()`
3. **Get Slot Suggestions** → `useSlotSuggestions()`
4. **Assign to Slot** → `useAssignVehicleToSlot()`
5. **Scan In** → `scanStockyardRequest()`
6. **Auto-generate Checklist** → Backend creates checklist
7. **View Checklist** → `useChecklist(requestId, 'inbound')`
8. **Complete Checklist** → `useCompleteChecklist()`
9. **Track Days** → `useDaysSinceEntry(vehicleId)`

### Component Transfer Workflow

1. **Initiate Transfer** → `ComponentTransferModal`
2. **Check Approval Required** → Backend checks component value
3. **If Approved** → Transfer completes immediately
4. **If Needs Approval** → `ComponentTransferApproval` page
5. **Approve Transfer** → Backend creates custody event
6. **View History** → `useComponentCustodyEvents()`

### Exit Workflow

1. **Create Exit Request** → `useCreateStockyardRequest()`
2. **Get Transporter Bids** → `useTransporterBids()`
3. **Create/Accept Bid** → `useCreateTransporterBid()` / `useAcceptTransporterBid()`
4. **Complete Outbound Checklist** → `useCompleteChecklist()`
5. **Check Compliance** → `useComplianceTasks()`
6. **Scan Out** → `scanStockyardRequest()`
7. **Release Slot** → Backend automatically releases

---

## 🎨 Styling & Theming

All components use the centralized theme system:

```tsx
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
```

**Key Theme Variables:**
- `colors.primary` - Primary actions
- `colors.success[500]` - Success states
- `colors.warning[500]` - Warning states
- `colors.error[500]` - Error states
- `colors.neutral[500]` - Neutral text
- `spacing.xs, sm, md, lg, xl, xxl` - Consistent spacing
- `typography.header, body, caption` - Typography styles
- `cardStyles.card` - Card styling
- `borderRadius.sm, md, lg` - Border radius

---

## 🔄 State Management

### React Query Cache Keys

All stockyard queries use structured cache keys:

```tsx
// Yard map
['stockyard', 'yards', 'map', yardId]

// Checklists
['stockyard', 'checklists', 'detail', requestId, type]

// Documents
['stockyard', 'documents', 'list', requestId]

// Alerts
['stockyard', 'analytics', 'alerts', filters]
```

### Cache Invalidation

Mutations automatically invalidate related queries:

```tsx
// Example: Creating a checklist invalidates:
- Checklist detail query
- Stockyard requests list
- Related vehicle queries
```

---

## 🧪 Testing Integration

### Mock Data

Use the utility functions to create test data:

```tsx
import { calculateDaysSinceEntry, isVehicleInYard } from '@/lib/stockyard-utils';

const mockRequest = {
  id: 'test-id',
  scan_in_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'Approved',
  // ...
};

const daysInYard = calculateDaysSinceEntry(mockRequest);
const inYard = isVehicleInYard(mockRequest);
```

### Component Testing

```tsx
import { render, screen } from '@testing-library/react';
import { DaysSinceEntryWidget } from '@/components/stockyard/DaysSinceEntryWidget';

test('displays days since entry', () => {
  render(<DaysSinceEntryWidget daysSinceEntry={45} />);
  expect(screen.getByText('45 days')).toBeInTheDocument();
});
```

---

## 📱 Mobile & Offline Support

### Offline Capabilities

The existing PWA infrastructure provides:
- Service worker caching
- Background sync for mutations
- Offline queue for API calls
- Network detection

### Mobile Optimization

All components are responsive:
- Touch-friendly buttons
- Mobile-optimized layouts
- Swipe gestures (where applicable)
- Camera integration for photos

---

## 🚀 Performance Optimization

### React Query Features Used

1. **Automatic Caching** - Queries are cached automatically
2. **Background Refetching** - Data refreshes in background
3. **Stale-While-Revalidate** - Shows cached data while fetching
4. **Query Invalidation** - Automatic cache updates on mutations
5. **Optimistic Updates** - UI updates before server response

### Code Splitting

All stockyard pages use dynamic imports where appropriate:

```tsx
const { getYardMap } = await import('./stockyard');
```

---

## 🔐 Permissions & Roles

### Role-Based Access

- **super_admin, admin** - Full access to all features
- **supervisor** - Can approve transfers, documents
- **inspector** - Can complete checklists
- **guard** - Can scan vehicles (no document upload)
- **clerk** - Can create requests

### Permission Checks

```tsx
// Example: Document upload (back-office only)
{userRole !== 'guard' && (
  <Button onClick={handleUpload}>Upload Document</Button>
)}
```

---

## 📝 Best Practices

### 1. Always Use Hooks
```tsx
// ✅ Good
const { data, isLoading } = useChecklist(requestId);

// ❌ Bad
const [checklist, setChecklist] = useState(null);
useEffect(() => { fetchChecklist(); }, []);
```

### 2. Use Utility Functions
```tsx
// ✅ Good
import { getChecklistCompletion } from '@/lib/stockyard-utils';
const completion = getChecklistCompletion(checklist);

// ❌ Bad
const completion = (completed / total) * 100;
```

### 3. Handle Loading States
```tsx
// ✅ Good
{isLoading ? <SkeletonLoader /> : <Content />}

// ❌ Bad
{data && <Content />}
```

### 4. Use TypeScript Types
```tsx
// ✅ Good
import type { StockyardRequest } from '@/lib/stockyard';
const request: StockyardRequest = ...;

// ❌ Bad
const request: any = ...;
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Query not refetching**
   - Check cache key structure
   - Verify mutation invalidates correct keys
   - Check `enabled` prop on query

2. **Type errors**
   - Ensure types are imported from `@/lib/stockyard`
   - Check interface definitions match backend

3. **Navigation issues**
   - Verify route exists in `App.tsx`
   - Check route parameters match

---

## 📚 Additional Resources

- `STOCKYARD_IMPLEMENTATION_SUMMARY.md` - Detailed implementation guide
- `STOCKYARD_FINAL_SUMMARY.md` - Feature summary
- `IMPLEMENTATION_COMPLETE.md` - Completion status
- `src/lib/stockyard.ts` - API client reference
- `src/lib/queries.ts` - React Query hooks reference

---

**Last Updated:** January 2025  
**Status:** ✅ Complete and Ready for Integration



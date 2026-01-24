# Phase 0: Discovery & Alignment Document

**Date:** 2025-01-XX  
**Purpose:** System audit and design alignment for ideal design implementation

---

## 1. Route Audit

### 1.1 Route Structure Overview

**Total Routes:** ~90+ routes  
**Total Redirects:** 31 redirects identified

### 1.2 Redirect Patterns

All redirects use `<Navigate to="..." replace />` pattern. Categories:

#### Gate Pass Redirects (8 redirects)
- `/app/gate-pass/approvals` → `/app/approvals?tab=gate_pass`
- `/app/gate-pass/create-visitor` → `/app/gate-pass/create?type=visitor`
- `/app/gate-pass/create-vehicle` → `/app/gate-pass/create?type=outbound`
- `/app/gate-pass/validation` → `/app/gate-pass/scan`
- `/app/gate-pass/quick-validation` → `/app/gate-pass/scan`
- `/app/gate-pass/approval` → `/app/approvals?tab=gate_pass`

#### Expense Redirects (7 redirects)
- `/app/expenses/categories` → `/app/expenses/analytics?tab=by-category`
- `/app/expenses/assets` → `/app/expenses/analytics?tab=assets`
- `/app/expenses/projects` → `/app/expenses/analytics?tab=by-project`
- `/app/expenses/cashflow` → `/app/expenses/analytics?tab=cashflow`
- `/app/expenses/approval` → `/app/approvals?tab=expense`
- `/app/expenses/accounts` → `/app/expenses/analytics?tab=by-account`
- `/app/expenses/reconciliation` → `/app/expenses/analytics?tab=reconciliation` (duplicate route)

#### Stockyard Redirects (11 redirects)
- `/app/stockyard/components/create` → `/app/stockyard/components?action=create`
- `/app/stockyard/components/transfers/approvals` → `/app/approvals?tab=transfer`
- `/app/stockyard/components/cost-analysis` → `/app/stockyard/analytics?tab=cost`
- `/app/stockyard/components/health` → `/app/stockyard/analytics?tab=health`
- `/app/stockyard/components/:type/:id/edit` → `/app/stockyard/components/:id?action=edit`
- `/app/stockyard/components/:type/:id` → `/app/stockyard/components/:id`
- `/app/stockyard/yards/:yardId/map` → `/app/stockyard/:id?tab=map`
- `/app/stockyard/requests/:requestId/checklist` → `/app/stockyard/:requestId?tab=checklists`
- `/app/stockyard/buyer-readiness` → `/app/stockyard?tab=readiness`
- `/app/stockyard/vehicles/:vehicleId/timeline` → `/app/stockyard/:id?tab=timeline`
- `/app/stockyard/requests/:requestId/documents` → `/app/stockyard/:requestId?tab=documents`
- `/app/stockyard/requests/:requestId/transporter-bids` → `/app/stockyard/:requestId?tab=bids`
- `/app/stockyard/vehicles/:vehicleId/profitability` → `/app/stockyard/analytics?tab=profitability`

#### Inspection Redirects (1 redirect)
- `/inspections/:id` → `/app/inspections/:id` (legacy route)

#### Root Redirect (1 redirect)
- `/` → `/dashboard`

### 1.3 Route Standardization Issues

**Inconsistencies:**
- Mix of `/new` vs `/create` patterns
- Mix of `/:id` detail routes vs query params
- Some routes use query params (`?tab=...`), others use path params
- Duplicate route definitions (e.g., `/app/expenses/reconciliation` defined twice)

**Recommendations:**
- Standardize on `/create` for creation routes
- Use query params for tabs/filters, path params for resource IDs
- Remove duplicate route definitions
- Consolidate redirects into canonical routes

---

## 2. Navigation System Audit

### 2.1 Dual Navigation Systems

**Problem:** Two separate navigation configurations exist:

1. **Desktop Sidebar** (`src/components/layout/AppLayout.tsx`)
   - Uses `navItems` array (lines 48-151)
   - Role-based + capability-based access control
   - Hierarchical structure with `children` property
   - Supports collapsible sidebar
   - Mobile: Drawer overlay

2. **Mobile Bottom Nav** (`src/lib/navigationConfig.ts`)
   - Uses `navigationByRole` object
   - Role-based configuration only
   - Flat structure (max 4 items)
   - FAB (Floating Action Button) support
   - "More" drawer items

### 2.2 Navigation Item Definitions

#### Desktop Sidebar (`AppLayout.tsx`)
```typescript
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  roles: string[]; // Backward compatibility
  requiredCapability?: { module: CapabilityModule; action: string };
  children?: NavItem[];
}
```

**Modules:**
- Dashboard
- Gate Passes (with 8 children)
- Inspections (with 4 children)
- Expenses (with 5 children)
- Stockyard (with 5 children)
- Alerts
- User Management (with 5 children)
- Settings (with 1 child)

#### Mobile Bottom Nav (`navigationConfig.ts`)
```typescript
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  route: string | null; // null = opens sheet
  badge?: () => number | null;
}

interface NavConfig {
  items: NavItem[]; // Max 4
  fab?: {
    icon: React.ComponentType;
    label: string;
    actions: FabAction[];
  };
}
```

**Role Configurations:**
- `guard`: 4 items (Scan, Expected, Inside, History), no FAB
- `inspector`: 4 items (Home, New, Mine, Profile), no FAB
- `clerk`: 4 items (Home, Passes, Expenses, More), FAB with 2 actions
- `supervisor`: 4 items (Home, Approvals, Reports, More), FAB with 3 actions
- `yard_incharge`: 4 items (Home, Approvals, Passes, More), FAB with 1 action
- `executive`: 4 items (Home, Passes, Expenses, More), FAB with 2 actions
- `admin`: 4 items (Home, Approvals, Analytics, More), FAB with 4 actions
- `super_admin`: Same as admin

### 2.3 Access Control

**Desktop Sidebar:**
- Primary: `requiredCapability` check (for custom roles)
- Fallback: `roles` array check (for hardcoded roles)
- Function: `canAccessNavItem(item: NavItem): boolean`

**Mobile Bottom Nav:**
- Role-based only (no capability checks)
- Static configuration per role

### 2.4 Issues Identified

1. **Inconsistency:** Desktop uses capability checks, mobile uses role checks only
2. **Duplication:** Navigation items defined in two places
3. **Maintenance:** Changes require updates in both files
4. **Visibility:** Different items visible on desktop vs mobile for same role
5. **FAB:** Only mobile has FAB, desktop doesn't

---

## 3. Dashboard & Widget System

### 3.1 Dashboard Component (`src/pages/Dashboard.tsx`)

**Features:**
- Module cards with stats
- Widget system with drag-and-drop layout
- Real-time updates via `useRealtimeDashboard` hook
- Role-based module visibility
- Widget registry system

### 3.2 Widget System

**Files:**
- `src/lib/widgetRegistry.ts` - Widget layout management
- `src/components/dashboard/DashboardWidgetsContainer.tsx` - Widget container
- `src/components/dashboard/widgets/` - Individual widget components

**Widget Registry Functions:**
- `getDefaultLayout()` - Default widget positions
- `loadWidgetLayout()` - Load saved layout from localStorage
- `saveWidgetLayout()` - Save layout to localStorage

### 3.3 Real-time Integration

**Hook:** `src/hooks/useRealtimeDashboard.ts`
- Subscribes to real-time updates
- Updates dashboard stats automatically
- Handles connection state

### 3.4 Module Definitions

**Modules Displayed:**
1. Gate Passes - Active passes count
2. Inspections - Completed today count
3. Expenses - Pending approval count
4. Stockyard - Active requests count

**Module Access:**
- Role-based visibility
- Stats fetched from `/api/v1/dashboard/stats`

---

## 4. Yard Selection Patterns

### 4.1 Yard Selection Implementation

**Yard Selection Found In:**
1. `YardMap.tsx` - Route param: `/app/stockyard/yards/:yardId/map`
2. `CreateComponentMovement.tsx` - Dropdown selection in form
3. `CreateStockyardRequest.tsx` - Dropdown selection in form

### 4.2 Yard Data Fetching

**Pattern:**
```typescript
const [yards, setYards] = useState<Yard[]>([]);
useEffect(() => {
  apiClient.get('/v1/yards')
    .then(res => {
      const yardsData = Array.isArray(res.data) 
        ? res.data 
        : res.data.data || [];
      const activeYards = yardsData.filter(yard => yard.is_active !== false);
      setYards(activeYards);
    });
}, []);
```

### 4.3 Yard Selection UI Patterns

1. **Route-based:** Yard ID in URL (`/yards/:yardId/map`)
2. **Form dropdown:** Select from list of active yards
3. **Auto-select:** First active yard if none selected

### 4.4 Yard Context

**No Global Yard Context Found:**
- Each component fetches yards independently
- No shared yard selection state
- No yard context provider

**Recommendation:**
- Create `YardContext` for shared yard selection
- Persist selected yard in localStorage/URL
- Provide yard selector component

---

## 5. Capability & Permission System

### 5.1 Permission Evaluator

**File:** `src/lib/permissions/evaluator.ts`
**Function:** `hasCapability(user, module, action): boolean`

**Usage in AppLayout:**
```typescript
if (item.requiredCapability) {
  const hasCap = hasCapability(
    user,
    item.requiredCapability.module,
    item.requiredCapability.action
  );
  if (hasCap) return true;
}
```

### 5.2 Capability Modules

**Modules (from `CapabilityModule` type):**
- `gate_pass`
- `inspection`
- `expense`
- `stockyard`
- `user_management`
- `reports`

**Actions:**
- `read`, `create`, `update`, `delete`
- `approve`, `validate`, `review`, `reassign`, `export`

### 5.3 Role Capabilities

**File:** `src/lib/permissions/roleCapabilities.ts`
- Defines default capabilities per role
- Used for capability evaluation

---

## 6. Design Alignment Decisions

### 6.1 Route Consolidation Strategy

**Decision:** Replace redirects with query parameters where appropriate

**Pattern:**
- Creation routes: `/app/{module}/create?type={type}`
- Detail routes: `/app/{module}/:id`
- Tab/filter routes: `/app/{module}?tab={tab}` or `/app/{module}?filter={filter}`

**Exceptions:**
- Keep deep-link routes for external sharing (e.g., `/app/gate-pass/:id`)
- Keep legacy redirects temporarily for backward compatibility

### 6.2 Unified Navigation Strategy

**Decision:** Create single source of truth for navigation

**Approach:**
1. Create `src/lib/unifiedNavigation.ts` with single config
2. Support both role and capability-based access
3. Support hierarchical structure (for desktop)
4. Support flat structure with FAB (for mobile)
5. Generate both sidebar and bottom nav from same config

**Structure:**
```typescript
interface UnifiedNavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  roles?: string[]; // For backward compatibility
  requiredCapability?: { module: CapabilityModule; action: string };
  children?: UnifiedNavItem[];
  mobile?: {
    priority: number; // For bottom nav ordering
    showInFab?: boolean; // Show in FAB instead of bottom nav
  };
}
```

### 6.3 Dashboard Extension Strategy

**Decision:** Extend existing dashboard instead of rebuilding

**Approach:**
1. Add role-specific widget layouts
2. Add role-specific "primary action" strips
3. Rename `/dashboard` → `/app/home` (keep `/dashboard` as alias)
4. Reuse existing widget registry system
5. Preserve real-time behavior

### 6.4 Yard Selection Strategy

**Decision:** Create yard context and integrate with routing

**Approach:**
1. Create `YardContext` provider
2. Persist selected yard in URL query param: `?yard={yardId}`
3. Create reusable `YardSelector` component
4. Update all yard-dependent components to use context
5. Support multi-yard users with yard switcher

---

## 7. Implementation Priorities

### Phase 1: Route Consolidation (Week 2-3)
1. ✅ Remove redirect routes, replace with query params
2. ✅ Standardize route patterns (`/create`, `/:id`, `?tab=...`)
3. ✅ Audit and update all navigation links
4. ✅ Remove duplicate route definitions

### Phase 2: Unified Navigation (Week 4-5)
1. ✅ Create unified navigation config
2. ✅ Update AppLayout to use unified config
3. ✅ Update BottomNav to use unified config
4. ✅ Ensure capability checks work on both desktop and mobile

### Phase 3: Role-Optimized Home (Week 6-7)
1. ✅ Extend dashboard with role-specific layouts
2. ✅ Add primary action strips
3. ✅ Rename `/dashboard` → `/app/home` (with alias)

### Phase 4: Unified Work Section (Week 8-9)
1. ✅ Create `/app/work` aggregation pages
2. ✅ Build WorkItem aggregation service
3. ✅ Add Pending/Today/Mine tabs

---

## 8. Files to Modify/Create

### Phase 1 Files
- `src/App.tsx` - Remove redirects, standardize routes
- All navigation links in components - Update to new routes

### Phase 2 Files
- `src/lib/unifiedNavigation.ts` - **NEW** - Single navigation config
- `src/components/layout/AppLayout.tsx` - Use unified config
- `src/components/ui/BottomNav.tsx` - Use unified config
- `src/lib/navigationConfig.ts` - **DEPRECATE** (keep for migration)

### Phase 3 Files
- `src/pages/Dashboard.tsx` - Extend with role-specific features
- `src/lib/widgetRegistry.ts` - Add role-specific layouts
- `src/App.tsx` - Add `/app/home` route (alias `/dashboard`)

### Phase 4 Files
- `src/pages/work/WorkPage.tsx` - **NEW** - Unified work section
- `src/lib/workAggregation.ts` - **NEW** - Work item aggregation service

---

## 9. Success Metrics

### Phase 1
- ✅ Zero redirect routes (except legacy compatibility)
- ✅ All routes follow standardized patterns
- ✅ No duplicate route definitions

### Phase 2
- ✅ Single navigation config file
- ✅ Consistent visibility across desktop and mobile
- ✅ Capability checks work on both platforms

### Phase 3
- ✅ Role-specific home layouts functional
- ✅ Dashboard accessible at `/app/home` and `/dashboard`
- ✅ Real-time updates preserved

### Phase 4
- ✅ `/app/work` aggregates all work items
- ✅ Pending/Today/Mine tabs functional
- ✅ Work items link to source modules

---

## 10. Dependencies & Risks

### Dependencies
- **Phase 2 depends on Phase 1:** Navigation links need stable routes
- **Phase 3 depends on Phase 2:** Home page needs unified nav
- **Phase 4 depends on Phase 3:** Work section needs home page

### Risks
- **Breaking Changes:** Route changes may break bookmarks/links
  - **Mitigation:** Keep legacy redirects temporarily
- **Navigation Inconsistency:** Users may see different nav on desktop vs mobile
  - **Mitigation:** Test both platforms thoroughly
- **Performance:** Unified config may be slower
  - **Mitigation:** Memoize navigation filtering

---

## 11. Next Steps

1. ✅ **Review this document** with team
2. ✅ **Freeze route strategy** - Finalize route patterns
3. ✅ **Freeze navigation schema** - Finalize unified nav structure
4. ✅ **Start Phase 1** - Route consolidation

---

**Document Status:** ✅ Complete  
**Ready for Implementation:** ✅ Yes




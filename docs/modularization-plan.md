# App Modularization Plan

## Current State

The application is a single monolithic PWA (`voms-pwa`) with **481 source files, ~28K lines of code**, and **10 feature modules** all bundled together. It already has good internal separation — lazy-loaded routes, feature-scoped pages/components/hooks — but everything ships as one app, one build, one deployment.

---

## Target State

Split into **independent, deployable micro-frontends** that share a common infrastructure layer:

```
┌──────────────────────────────────────────────────────┐
│                   App Shell / Portal                  │
│  (auth, navigation, shared UI, module federation)    │
└──────────┬───────────┬───────────┬───────────────────┘
           │           │           │
    ┌──────┴──┐  ┌─────┴───┐  ┌───┴─────────┐
    │Inspections│ │Expenses │ │Yard Mgmt    │  ...more
    │   App    │ │   App   │ │   App       │
    └─────────┘  └─────────┘  └─────────────┘
```

### Proposed Individual Apps

| # | App Name | Current Scope | Route Prefix |
|---|----------|--------------|--------------|
| 1 | **Shell / Portal** | Auth, dashboard, nav, settings, notifications | `/app/home`, `/login`, `/app/settings/*`, `/app/notifications/*` |
| 2 | **Inspections** | Vehicle inspections, templates, sync, reports, PDF generation | `/app/inspections/*` |
| 3 | **Expenses** | Expense tracking, ledger, reconciliation, analytics, receipts | `/app/expenses/*` |
| 4 | **Yard Management** | Stockyard inventory, components, movements, analytics, yard map | `/app/stockyard/*` (excluding `access/*`) |
| 5 | **Access Control** | Gate passes, guard register, visitor mgmt, QR validation | `/app/stockyard/access/*` |
| 6 | **Admin / User Management** | Users, roles, capabilities, audit, security, compliance | `/app/admin/*` |
| 7 | **Approvals Hub** | Unified approvals across all modules | `/app/approvals/*`, `/app/alerts/*` |

---

## Phase 0: Preparation (Do First)

### 0.1 Create a Monorepo Structure

Convert the repo to a monorepo using **Turborepo** or **Nx** with pnpm workspaces:

```
inspectmymachine/
├── package.json              (workspace root)
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   ├── shared-ui/            (Phase 1)
│   ├── shared-lib/           (Phase 1)
│   ├── shared-auth/          (Phase 1)
│   └── shared-types/         (Phase 1)
├── apps/
│   ├── shell/                (Phase 2)
│   ├── inspections/          (Phase 3)
│   ├── expenses/             (Phase 3)
│   ├── yard-management/      (Phase 3)
│   ├── access-control/       (Phase 3)
│   ├── admin/                (Phase 3)
│   └── approvals/            (Phase 3)
└── tooling/
    ├── eslint-config/
    ├── tsconfig/
    └── tailwind-config/
```

### 0.2 Audit and Map All Cross-Module Dependencies

Before extracting anything, map every import that crosses module boundaries. The key entanglements found today:

| Shared Resource | Used By | Files |
|----------------|---------|-------|
| `lib/apiClient.ts` | ALL modules | Single axios instance, CSRF, interceptors |
| `lib/queries.ts` | ALL modules | 56KB of React Query hooks for every endpoint |
| `lib/users.ts` | ALL modules | `hasCapability()`, user utilities |
| `providers/AuthProvider.tsx` | ALL modules | Auth state, user object |
| `providers/QueryProvider.tsx` | ALL modules | React Query client config |
| `providers/ThemeProvider.tsx` | ALL modules | Dark/light mode |
| `providers/ToastProvider.tsx` | ALL modules | Toast notifications |
| `providers/ExpenseReferencesProvider.tsx` | Expenses only | Category/account cache |
| `components/ui/*` | ALL modules | 90+ shared UI components |
| `components/RequireAuth.tsx` | ALL modules | Capability guards |
| `components/AuthenticatedLayout.tsx` | ALL modules | Layout wrapper |
| `components/layout/AppLayout.tsx` | ALL modules | App shell layout |
| `components/ui/BottomNav.tsx` | ALL modules | Mobile navigation |
| `hooks/useReverbWebSocket.ts` | Gate pass, dashboard | Real-time updates |
| `hooks/useUnifiedApprovals.ts` | Approvals, expenses, gate pass | Cross-module approval logic |
| `lib/permissions/*` | ALL modules | Permission evaluation system |
| `i18n/*` | ALL modules | Internationalization |

### 0.3 Add Comprehensive Tests

Before refactoring, ensure test coverage on critical paths:
- Authentication flow
- Permission evaluation
- API client interceptors
- Each module's CRUD operations
- Cross-module approval workflows
- Offline queue behavior

---

## Phase 1: Extract Shared Packages

Extract shared infrastructure into internal packages that all apps will depend on.

### 1.1 `@imm/shared-types`

```
packages/shared-types/
├── package.json
├── tsconfig.json
└── src/
    ├── user.ts             ← from types/ and lib/users.ts type defs
    ├── inspection.ts       ← from types/inspection.ts
    ├── expense.ts          ← extract from expense components
    ├── stockyard.ts        ← extract from stockyard utilities
    ├── gate-pass.ts        ← extract from gate pass hooks
    ├── permissions.ts      ← from lib/permissions/types.ts
    ├── api.ts              ← shared API response types
    ├── widgets.ts          ← from types/widgets.ts
    └── index.ts            ← barrel export
```

### 1.2 `@imm/shared-ui`

```
packages/shared-ui/
├── package.json
├── tsconfig.json
├── tailwind.config.ts      ← shared design tokens
└── src/
    ├── components/         ← ALL of current components/ui/* (90+ files)
    │   ├── DataTable.tsx
    │   ├── BottomSheet.tsx
    │   ├── SkeletonLoader.tsx
    │   ├── charts/
    │   └── ...
    ├── ErrorBoundary.tsx
    ├── index.ts
    └── styles/
        └── index.css       ← shared Tailwind base styles
```

### 1.3 `@imm/shared-lib`

```
packages/shared-lib/
├── package.json
└── src/
    ├── apiClient.ts        ← from lib/apiClient.ts
    ├── apiConfig.ts        ← from lib/apiConfig.ts
    ├── errorHandling.ts    ← from lib/errorHandling.ts
    ├── logger.ts           ← from lib/logger.ts
    ├── offlineQueue.ts     ← from lib/offlineQueue.ts
    ├── mediaUploadManager.ts
    ├── imageCompression.ts
    ├── upload.ts
    ├── idb-safe.ts
    ├── webVitals.ts
    ├── permissions/        ← entire lib/permissions/ directory
    │   ├── evaluator.ts
    │   ├── conditionEvaluator.ts
    │   ├── fieldMasking.ts
    │   ├── scopeEvaluator.ts
    │   └── api.ts
    ├── workflow/           ← lib/workflow/
    └── index.ts
```

### 1.4 `@imm/shared-auth`

```
packages/shared-auth/
├── package.json
└── src/
    ├── AuthProvider.tsx     ← from providers/AuthProvider.tsx
    ├── AuthContext.ts       ← from providers/AuthContext.ts
    ├── RequireAuth.tsx      ← from components/RequireAuth.tsx
    ├── useAuth.ts           ← from hooks/useAuth.ts
    ├── users.ts             ← from lib/users.ts (hasCapability, etc.)
    └── index.ts
```

### 1.5 `@imm/shared-hooks`

```
packages/shared-hooks/
├── package.json
└── src/
    ├── useDebounce.ts
    ├── useOnline.ts
    ├── useIsMobile.ts
    ├── usePullToRefresh.ts
    ├── useSwipeGesture.ts
    ├── useKeyboardShortcuts.ts
    ├── useAutoSave.ts
    ├── useOptimisticUpdate.ts
    ├── useInfiniteScroll.ts
    ├── usePushNotifications.ts
    ├── useReverbWebSocket.ts
    ├── usePWAInstall.ts
    └── index.ts
```

---

## Phase 2: Build the App Shell

The shell is the "host" application that handles auth, navigation, and loads individual apps.

### 2.1 Architecture Choice: Module Federation vs. Route-Based Splitting

**Recommended: Module Federation (Vite `@module-federation/vite`)**

```
apps/shell/
├── package.json
├── vite.config.ts          ← Module Federation host config
├── src/
│   ├── main.tsx            ← Bootstrap, providers
│   ├── App.tsx             ← Top-level routing, lazy remote loading
│   ├── components/
│   │   ├── AppLayout.tsx   ← Shared layout (sidebar, bottom nav)
│   │   ├── BottomNav.tsx   ← Module-aware navigation
│   │   └── CommandPalette.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx   ← Main dashboard (aggregates widgets)
│   │   ├── Login.tsx
│   │   ├── Offline.tsx
│   │   └── NotFound.tsx
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ToastProvider.tsx
│   └── remote-loader.ts   ← Dynamic import for remote apps
```

### 2.2 Module Federation Configuration

```typescript
// apps/shell/vite.config.ts
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        inspections: 'inspections@/inspections/remoteEntry.js',
        expenses: 'expenses@/expenses/remoteEntry.js',
        yardManagement: 'yard_management@/yard/remoteEntry.js',
        accessControl: 'access_control@/access/remoteEntry.js',
        admin: 'admin@/admin/remoteEntry.js',
        approvals: 'approvals@/approvals/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.1.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.1.0' },
        'react-router-dom': { singleton: true },
        '@tanstack/react-query': { singleton: true },
        '@imm/shared-auth': { singleton: true },
        '@imm/shared-ui': { singleton: true },
        '@imm/shared-lib': { singleton: true },
      },
    }),
  ],
});
```

### 2.3 Shell Router

```typescript
// apps/shell/src/App.tsx
const InspectionsApp = lazy(() => import('inspections/App'));
const ExpensesApp = lazy(() => import('expenses/App'));
const YardApp = lazy(() => import('yardManagement/App'));
const AccessApp = lazy(() => import('accessControl/App'));
const AdminApp = lazy(() => import('admin/App'));
const ApprovalsApp = lazy(() => import('approvals/App'));

<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/app/home" element={<Dashboard />} />
  <Route path="/app/inspections/*" element={<InspectionsApp />} />
  <Route path="/app/expenses/*" element={<ExpensesApp />} />
  <Route path="/app/stockyard/access/*" element={<AccessApp />} />
  <Route path="/app/stockyard/*" element={<YardApp />} />
  <Route path="/app/admin/*" element={<AdminApp />} />
  <Route path="/app/approvals/*" element={<ApprovalsApp />} />
</Routes>
```

---

## Phase 3: Extract Feature Apps

Each app becomes its own Vite project exposing a Module Federation remote.

### 3.1 Inspections App

```
apps/inspections/
├── package.json
│   dependencies:
│     @imm/shared-ui, @imm/shared-lib, @imm/shared-auth,
│     @imm/shared-types, @imm/shared-hooks
│     jspdf, html2canvas, tesseract.js    ← module-specific deps
├── vite.config.ts                         ← MF remote config
└── src/
    ├── bootstrap.tsx                      ← Remote entry point
    ├── App.tsx                            ← Internal routes
    ├── pages/
    │   ├── InspectionDashboard.tsx
    │   ├── InspectionCapture.tsx
    │   ├── InspectionDetails.tsx
    │   ├── InspectionStudio.tsx
    │   ├── InspectionSyncCenter.tsx
    │   ├── InspectionReports.tsx
    │   ├── TemplateSelectionPage.tsx
    │   └── InspectionsCompleted.tsx
    ├── components/                        ← from components/inspection/
    ├── hooks/
    │   └── useInspectionFilters.ts
    ├── lib/
    │   ├── inspection-queue.ts
    │   ├── inspection-submit.ts
    │   ├── inspection-templates.ts
    │   ├── inspection-pdf-generator.ts
    │   ├── inspection-categories.ts
    │   └── ocr.ts
    └── queries/                           ← extracted from lib/queries.ts
        └── inspectionQueries.ts
```

### 3.2 Expenses App

```
apps/expenses/
├── package.json
│   dependencies:
│     @imm/shared-ui, @imm/shared-lib, @imm/shared-auth,
│     @imm/shared-types, @imm/shared-hooks
│     xlsx, recharts                       ← module-specific deps
└── src/
    ├── bootstrap.tsx
    ├── App.tsx
    ├── pages/
    │   ├── EmployeeExpenseDashboard.tsx
    │   ├── CreateExpense.tsx
    │   ├── ExpenseDetails.tsx
    │   ├── ExpenseHistory.tsx
    │   ├── EmployeeLedger.tsx
    │   ├── LedgerReconciliation.tsx
    │   ├── AdvanceLedgerView.tsx
    │   ├── RecordAdvance.tsx
    │   ├── ExpenseReports.tsx
    │   ├── ExpenseAnalytics.tsx
    │   ├── ReceiptsGallery.tsx
    │   ├── AccountsDashboard.tsx
    │   ├── CategoryWiseDashboard.tsx
    │   ├── AssetManagementDashboard.tsx
    │   ├── ProjectManagementDashboard.tsx
    │   └── CashflowAnalysisDashboard.tsx
    ├── components/                        ← from components/expenses/
    ├── hooks/
    │   └── useExpenseFilters.ts
    ├── providers/
    │   └── ExpenseReferencesProvider.tsx   ← module-specific provider
    └── queries/
        └── expenseQueries.ts
```

### 3.3 Yard Management App

```
apps/yard-management/
├── package.json
│   dependencies:
│     @imm/shared-ui, @imm/shared-lib, @imm/shared-auth,
│     @imm/shared-types, @imm/shared-hooks
│     recharts                             ← for analytics
└── src/
    ├── bootstrap.tsx
    ├── App.tsx
    ├── pages/
    │   ├── StockyardDashboard.tsx
    │   ├── ComponentLedger.tsx
    │   ├── ComponentDetails.tsx
    │   ├── CreateComponent.tsx
    │   ├── EditComponent.tsx
    │   ├── CreateComponentMovement.tsx
    │   ├── StockyardRequestDetails.tsx
    │   ├── StockyardScan.tsx
    │   ├── StockyardAnalytics.tsx
    │   ├── YardMap.tsx
    │   ├── ChecklistView.tsx
    │   ├── BuyerReadinessBoard.tsx
    │   ├── VehicleTimeline.tsx
    │   ├── ComplianceDocuments.tsx
    │   ├── TransporterBids.tsx
    │   ├── ProfitabilityDashboard.tsx
    │   └── StockyardAlertsDashboard.tsx
    ├── components/                        ← from components/stockyard/
    ├── lib/
    │   └── stockyard.ts
    └── queries/
        └── stockyardQueries.ts
```

### 3.4 Access Control App

```
apps/access-control/
├── package.json
│   dependencies:
│     @imm/shared-ui, @imm/shared-lib, @imm/shared-auth,
│     @imm/shared-types, @imm/shared-hooks
│     qrcode, jsqr                         ← QR-specific deps
└── src/
    ├── bootstrap.tsx
    ├── App.tsx
    ├── pages/
    │   ├── AccessDashboard.tsx
    │   ├── CreateAccessPass.tsx
    │   ├── AccessPassDetails.tsx
    │   ├── GuardRegister.tsx
    │   ├── AccessReports.tsx
    │   ├── PassTemplates.tsx
    │   ├── VisitorManagement.tsx
    │   ├── AccessCalendar.tsx
    │   ├── QuickValidation.tsx
    │   └── BulkAccessOperations.tsx
    ├── hooks/
    │   ├── useGatePasses.ts
    │   ├── useCreateGatePassForm.ts
    │   └── useGatePassFilters.ts
    ├── services/
    │   └── AccessService.ts
    └── queries/
        └── accessQueries.ts
```

### 3.5 Admin App

```
apps/admin/
├── package.json
│   dependencies:
│     @imm/shared-ui, @imm/shared-lib, @imm/shared-auth,
│     @imm/shared-types, @imm/shared-hooks
└── src/
    ├── bootstrap.tsx
    ├── App.tsx
    ├── pages/
    │   ├── UserManagement.tsx
    │   ├── CreateUser.tsx
    │   ├── EditUser.tsx
    │   ├── UserDetails.tsx
    │   ├── UserActivityDashboard.tsx
    │   ├── CapabilityMatrix.tsx
    │   ├── BulkUserOperations.tsx
    │   ├── RoleManagement.tsx
    │   ├── PermissionTemplates.tsx
    │   ├── PermissionTesting.tsx
    │   ├── DataMaskingRules.tsx
    │   ├── SecurityDashboard.tsx
    │   ├── ActivityLogs.tsx
    │   ├── PermissionChangeLogs.tsx
    │   ├── AuditReports.tsx
    │   ├── ComplianceDashboard.tsx
    │   └── VehicleCostDashboard.tsx
    ├── components/                        ← from components/admin/, components/users/
    ├── hooks/
    │   └── useUsers.ts
    ├── services/
    │   └── UserService.ts
    └── queries/
        └── userQueries.ts
```

### 3.6 Approvals App

```
apps/approvals/
├── package.json
└── src/
    ├── bootstrap.tsx
    ├── App.tsx
    ├── pages/
    │   ├── UnifiedApprovals.tsx
    │   └── AlertDashboard.tsx
    ├── hooks/
    │   └── useUnifiedApprovals.ts
    └── queries/
        └── approvalQueries.ts
```

---

## Phase 4: Split the Monolith Query Layer

The biggest coupling point is `lib/queries.ts` (56KB) — a single file with React Query hooks for every API endpoint.

### Action Items

1. **Split `queries.ts` into domain-specific query modules:**

```
Before (monolith):
  lib/queries.ts (56KB, all query hooks)

After (per-app):
  apps/inspections/src/queries/inspectionQueries.ts
  apps/expenses/src/queries/expenseQueries.ts
  apps/yard-management/src/queries/stockyardQueries.ts
  apps/access-control/src/queries/accessQueries.ts
  apps/admin/src/queries/userQueries.ts
  apps/approvals/src/queries/approvalQueries.ts
  apps/shell/src/queries/dashboardQueries.ts
```

2. **Extract shared query utilities** to `@imm/shared-lib`:
   - `queryKeys` factory pattern
   - Common mutation patterns (optimistic updates)
   - Error handling wrappers

3. **Shared React Query client** stays in the shell and is passed down via Module Federation shared scope.

---

## Phase 5: Handle Cross-Cutting Concerns

### 5.1 Unified Approvals (Spans Multiple Modules)

The approvals hub aggregates gate pass approvals + expense approvals. Solutions:

**Option A: Event Bus (Recommended)**
- Each app publishes approval events via a shared event bus (`@imm/shared-lib/eventBus`)
- Approvals app subscribes and aggregates
- No direct imports between feature apps

**Option B: API-Driven**
- Backend provides a unified `/v1/approvals` endpoint
- Approvals app only talks to the API, not other frontend modules
- Cleanest separation, requires backend work

### 5.2 Dashboard Widgets

The main dashboard currently imports widgets from multiple modules. Solutions:

- Define a `WidgetRegistry` in `@imm/shared-types`
- Each app registers its widgets via Module Federation `exposes`
- Shell dynamically loads widgets from each registered remote

```typescript
// apps/inspections/vite.config.ts
federation({
  name: 'inspections',
  exposes: {
    './App': './src/bootstrap.tsx',
    './widgets/InspectionSummary': './src/widgets/InspectionSummary.tsx',
    './widgets/RecentInspections': './src/widgets/RecentInspections.tsx',
  },
});
```

### 5.3 WebSocket / Real-Time Updates

- Keep `useReverbWebSocket` in `@imm/shared-hooks`
- Each app subscribes to its own channels
- Shell manages the single WebSocket connection, forwards events

### 5.4 Offline Support

- Service Worker stays in the shell (single SW registration)
- Each app registers its own cache strategies via a shared config
- `offlineQueue` and `inspection-queue` move to respective apps
- IndexedDB namespaced per app: `imm-inspections-*`, `imm-expenses-*`

### 5.5 Navigation (BottomNav)

The mobile bottom nav (`BottomNav.tsx`, 13KB) is capability-driven and shows different items per user role. This stays in the shell but needs to be module-aware:

```typescript
// Each app registers its nav items
const navRegistry = {
  inspections: { label: 'Inspections', icon: ClipboardCheck, path: '/app/inspections' },
  expenses: { label: 'Expenses', icon: IndianRupee, path: '/app/expenses' },
  stockyard: { label: 'Yard', icon: Warehouse, path: '/app/stockyard' },
  // ...
};
```

---

## Phase 6: Infrastructure & Deployment

### 6.1 Build Pipeline

```yaml
# CI/CD per app
build:
  - shared-types    → npm package (versioned)
  - shared-ui       → npm package (versioned)
  - shared-lib      → npm package (versioned)
  - shared-auth     → npm package (versioned)
  - shared-hooks    → npm package (versioned)
  - shell           → deploy to /
  - inspections     → deploy to /inspections/
  - expenses        → deploy to /expenses/
  - yard-management → deploy to /yard/
  - access-control  → deploy to /access/
  - admin           → deploy to /admin/
  - approvals       → deploy to /approvals/
```

### 6.2 Nginx Configuration

```nginx
# Each app served from its own path prefix
location / {
    # Shell app
    root /var/www/shell;
    try_files $uri /index.html;
}

location /inspections/ {
    alias /var/www/inspections/;
    try_files $uri /inspections/index.html;
}

location /expenses/ {
    alias /var/www/expenses/;
    try_files $uri /expenses/index.html;
}

# ... repeat for each app
```

### 6.3 Independent Deployments

Each app can be built and deployed independently:
- Shared packages are versioned (semver)
- Feature apps pin shared package versions
- Shell discovers remotes dynamically (remote entry URLs in config)
- No full rebuild needed when one app changes

---

## Phase 7: Migration Strategy (Strangler Fig)

Do NOT do a big-bang rewrite. Migrate one module at a time while the monolith continues to work.

### Recommended Migration Order

```
Step 1: Set up monorepo + extract shared packages
        (no user-visible changes, monolith still works)

Step 2: Extract Admin app (lowest cross-module coupling)
        - Self-contained user/role management
        - Only depends on shared auth + UI
        - Good pilot to validate the architecture

Step 3: Extract Inspections app (most independent feature)
        - Has its own offline queue, PDF gen, OCR
        - Module-specific deps (jspdf, tesseract.js, html2canvas)
        - Only cross-cutting concern: dashboard widgets

Step 4: Extract Expenses app
        - Has its own provider (ExpenseReferencesProvider)
        - Module-specific deps (xlsx for export)
        - Cross-cutting: approval workflows

Step 5: Extract Access Control app
        - Module-specific deps (qrcode, jsqr)
        - Cross-cutting: approval workflows, stockyard link

Step 6: Extract Yard Management app
        - Largest module (16+ pages)
        - After access control is out, cleaner boundary

Step 7: Extract Approvals Hub (last - depends on other apps being out)
        - By now, uses event bus / API-only pattern
        - No direct imports from other feature modules

Step 8: Shell cleanup
        - Remove all migrated code from the monolith
        - Shell is now thin: auth + dashboard + navigation
```

### Parallel Development During Migration

At each step, the monolith route still works. The shell loads either:
- The **remote app** (if extracted), or
- The **local monolith page** (if not yet extracted)

```typescript
// Gradual migration in shell router
const InspectionsApp = isModuleFederated('inspections')
  ? lazy(() => import('inspections/App'))       // Remote
  : lazy(() => import('./legacy/inspections')); // Local fallback
```

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shared state divergence between apps | High | Singleton React Query client via MF shared scope; auth state from shell |
| CSS conflicts between apps | Medium | Tailwind with app-specific prefixes; CSS modules for component isolation |
| Version skew on shared packages | Medium | Pin exact versions in apps; automated compatibility tests in CI |
| Increased initial load (multiple remoteEntry.js) | Low | Preload hints for likely-needed remotes; aggressive caching |
| Offline support complexity | Medium | Single service worker in shell; apps register cache routes |
| Developer experience regression | Medium | `turbo dev` runs all apps locally; HMR works across module federation |
| Bundle size increase from duplication | Low | Module Federation `shared` config ensures singletons for React, Router, Query |

---

## Estimated Scope per Phase

| Phase | Description | Complexity |
|-------|-------------|-----------|
| Phase 0 | Monorepo setup, dependency audit, tests | Medium |
| Phase 1 | Extract 5 shared packages | High |
| Phase 2 | Build app shell with Module Federation | High |
| Phase 3 | Extract 6 feature apps | High (per app: Medium) |
| Phase 4 | Split queries.ts into per-app modules | Medium |
| Phase 5 | Cross-cutting concerns (events, widgets, SW) | High |
| Phase 6 | CI/CD, Nginx, independent deploys | Medium |
| Phase 7 | Strangler fig migration (iterative) | Ongoing |

---

## Alternative: Simpler Approach (if Module Federation is too complex)

If Module Federation feels like overkill for the team size, a **route-based monorepo with shared packages** achieves 80% of the benefits:

1. Same monorepo structure (`packages/` + `apps/`)
2. Each app is a standalone Vite project with its own `index.html`
3. No Module Federation — just separate builds, separate deployments
4. Users navigate between apps via full page navigation (or iframe, though not recommended)
5. Shared auth via **cookie-based session** (already using Laravel Sanctum cookies)
6. Shared packages via workspace dependencies

**Pros**: Simpler build, easier debugging, no MF complexity
**Cons**: Full page reload between apps, no shared runtime state, duplicated React bundles

This approach works well if modules are truly independent and users don't frequently switch between them in a single session.

---

## Quick Wins (Can Do Now, Before Full Migration)

1. **Split `lib/queries.ts`** into per-domain files (`inspectionQueries.ts`, `expenseQueries.ts`, etc.) — reduces coupling even in the monolith
2. **Split `lib/apiClient.ts`** — extract domain-specific API functions into service files
3. **Create barrel exports** per feature module (`pages/inspections/index.ts`) to formalize module boundaries
4. **Move feature-specific hooks** into their feature directories (e.g., `useGatePasses` → `pages/stockyard/access/hooks/`)
5. **Add path aliases** per module in tsconfig: `@inspections/*`, `@expenses/*`, etc. to enforce boundary awareness
6. **Set up ESLint boundaries plugin** (`eslint-plugin-boundaries`) to prevent cross-module imports

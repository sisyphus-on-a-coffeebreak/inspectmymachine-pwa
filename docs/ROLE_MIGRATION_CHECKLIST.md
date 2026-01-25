# Role Migration Checklist

Quick reference checklist for tracking migration progress.

## Phase 1: Foundation ✅/❌

### ⚠️ CRITICAL - Do First!
- [ ] **Task 1.0**: Implement Superadmin Protection (MUST DO BEFORE ANYTHING ELSE)
  - [ ] Backend: Add validation to prevent deleting last superadmin
  - [ ] Backend: Add validation to prevent deactivating last superadmin
  - [ ] Backend: Add validation to prevent removing superadmin capabilities
  - [ ] Backend: Add API error messages for superadmin protection
  - [ ] Frontend: Add `isLastSuperAdmin()` helper function
  - [ ] Frontend: Update UserManagement to check before delete/deactivate
  - [ ] Frontend: Add UI warnings for last superadmin
  - [ ] Frontend: Disable delete/deactivate buttons for last superadmin
  - [ ] Testing: Cannot delete last superadmin
  - [ ] Testing: Cannot deactivate last superadmin
  - [ ] Testing: Can delete/deactivate when multiple superadmins exist

- [ ] **Task 1.1**: Update Permission Evaluator (Keep superadmin bypass, make it capability-aware)
  - [ ] Keep superadmin bypass but make it capability-aware
  - [ ] Add `isSuperAdmin(user)` helper function
  - [ ] Document superadmin handling in code
  - [ ] Ensure superadmin works in both role-based and capability-based systems

- [ ] **Task 1.2**: Update roleCapabilities.ts with migration comments
- [ ] **Task 1.3**: Document role as display name in users.ts

## Phase 2: Route Protection ✅/❌

### App.tsx (6 instances)
- [ ] Line 144: `/app/stockyard/access/reports` → RequireCapability
- [ ] Line 148: `/app/stockyard/access/templates` → RequireCapability
- [ ] Line 160: `/app/stockyard/access/scan` → RequireCapability
- [ ] Line 164: `/app/stockyard/access/bulk` → RequireCapability
- [ ] Line 233: `/app/inspections/studio` → RequireCapability
- [ ] Other routes with RequireRole

### Other Files
- [ ] VehicleCostDashboard.tsx
- [ ] Any other route files

### RequireAuth.tsx
- [ ] Add @deprecated to RequireRole
- [ ] Update Role type to string
- [ ] Add migration documentation

## Phase 3: Navigation ✅/❌

### unifiedNavigation.ts (50+ instances)
- [ ] Dashboard nav item (line 71)
- [ ] Work nav item (line 79)
- [ ] Stockyard nav item (line 87)
- [ ] Access Control sub-items (lines 95-161)
- [ ] Inventory sub-items (lines 170-197)
- [ ] Movements sub-items (lines 204-220)
- [ ] Inspections nav items (lines 233-266)
- [ ] Expenses nav items (lines 277-317)
- [ ] Admin nav items (lines 328-404)
- [ ] All other nav items

### Navigation Filter Logic
- [ ] Update canUserAccessNavItem() to prioritize capabilities
- [ ] Add deprecation warning for roles fallback

## Phase 4: Component Logic ✅/❌

### Dashboard.tsx (5 instances)
- [ ] Line 889: Gate pass widget visibility
- [ ] Line 959: Inspection widget visibility
- [ ] Line 1029: Admin widget #1
- [ ] Line 1099: Admin widget #2
- [ ] Line 1169: Admin widget #3

### QuickActionsPanel.tsx (6 instances)
- [ ] Line 199: Admin/Super Admin check
- [ ] Line 255: Supervisor check
- [ ] Line 297: Guard check
- [ ] Line 329: Inspector check
- [ ] Line 359: Clerk check
- [ ] Line 401: Stockyard access check

### UserManagement.tsx (3 instances)
- [ ] Line 577: Super admin UI
- [ ] Line 1071: Super admin message
- [ ] Line 1309: Super admin message

### Other Components
- [ ] InspectionDashboard.tsx (2 instances)
- [ ] ExpenseApproval.tsx (1 instance)
- [ ] VehicleCostDashboard.tsx (1 instance)
- [ ] AccessDashboard.tsx (1 instance)
- [ ] CreateExpense.tsx (1 instance)
- [ ] InspectionDetails.tsx (2 instances)
- [ ] widgetRegistry.ts (multiple)
- [ ] smartDefaults.ts (1 instance)
- [ ] useUserRole.ts (documentation only)

## Phase 5: Type System ✅/❌

- [ ] RequireAuth.tsx - Remove Role union type
- [ ] useUserRole.ts - Update GatePassRole type
- [ ] CapabilityMatrix.tsx - Dynamic role dropdown
- [ ] Any other type definitions

## Phase 6: Testing ✅/❌

- [ ] Test all routes with system roles
- [ ] Test all routes with custom roles
- [ ] Test navigation filtering
- [ ] Test component visibility
- [ ] Test permission gates
- [ ] **Test superadmin protection** (critical!)
  - [ ] Cannot delete last superadmin
  - [ ] Cannot deactivate last superadmin
  - [ ] Superadmin has all permissions
  - [ ] Superadmin bypass works correctly
- [ ] Regression testing
- [ ] Integration testing

## Phase 7: Cleanup ✅/❌

- [ ] Update DEVELOPER_GUIDE.md
- [ ] Update API_REFERENCE.md
- [ ] Update permissions/README.md
- [ ] Remove RequireRole component (or keep deprecated)
- [ ] Remove roles arrays from navigation
- [ ] Remove hard-coded role checks
- [ ] Remove role type definitions
- [ ] Remove role fallback logic

---

## Quick Stats

- **Total Route Protections**: 6+ instances
- **Total Navigation Items**: 50+ instances
- **Total Component Checks**: 30+ instances
- **Total Type Definitions**: 3+ files

---

## Progress Tracking

**Started**: _______________
**Phase 1 Complete**: _______________
**Phase 2 Complete**: _______________
**Phase 3 Complete**: _______________
**Phase 4 Complete**: _______________
**Phase 5 Complete**: _______________
**Phase 6 Complete**: _______________
**Phase 7 Complete**: _______________
**Migration Complete**: _______________


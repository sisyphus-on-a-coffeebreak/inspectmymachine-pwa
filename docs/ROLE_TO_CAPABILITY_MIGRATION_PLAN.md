# Complete Migration Plan: Hard-coded Roles → Capability-Based System

## Overview
This document outlines the complete migration from hard-coded role checks to a capability-based permission system. The goal is to make the system fully dynamic and support custom roles without code changes.

## 🚨 CRITICAL REQUIREMENT: Superadmin Protection

**BEFORE STARTING ANY MIGRATION WORK**, you MUST implement superadmin protection (Task 1.0 in Phase 1). This ensures:

- ✅ At least one superadmin/master user always exists
- ✅ System cannot be locked out
- ✅ Emergency access procedures are documented
- ✅ Backend prevents deletion/deactivation of last superadmin
- ✅ Frontend shows warnings and blocks dangerous actions

**See "Critical Requirement: Superadmin/Master User Protection" section below for full details.**

## Current State Analysis

### ✅ Already Capability-Based
- `hasCapability()` function exists and works
- `hasStockyardCapability()` for function-specific checks
- `PermissionGate` component for UI gates
- `RequireCapability` component for route protection
- Navigation supports `requiredCapability` (but still has `roles` fallback)
- Permission evaluator with granular support

### ❌ Still Using Hard-coded Roles
1. **Route Protection** - `RequireRole` with hard-coded arrays (6 instances)
2. **Navigation** - `roles` arrays in nav items (50+ instances)
3. **Component Logic** - Direct role comparisons (30+ instances)
4. **Type Definitions** - Hard-coded Role union types
5. **Permission Evaluator** - Super admin bypass check
6. **Role Capabilities** - Hard-coded role definitions

---

## Critical Requirement: Superadmin/Master User Protection

### ⚠️ MUST HAVE: At Least One Superadmin Always Exists

**Requirement**: The system MUST always have at least one active superadmin/master user with full access to everything. This prevents system lockout scenarios.

### Implementation Strategy

#### Backend Requirements (Laravel/PHP)

1. **Database Constraint/Validation**
   - Add validation in User model/controller to prevent:
     - Deleting the last superadmin user
     - Deactivating the last superadmin user
     - Removing superadmin capabilities from the last superadmin
   
2. **Superadmin Identification**
   - Option A: Use `role === 'super_admin'` as identifier (during migration)
   - Option B: Use special capability flag `is_master: true` in user capabilities
   - Option C: Use database flag `is_super_admin: boolean` column
   - **Recommended**: Use combination of role + capability check

3. **Backend Validation Logic**
   ```php
   // In UserController or User model
   protected function validateSuperAdminProtection($user, $action) {
       if ($user->isSuperAdmin()) {
           $superAdminCount = User::where('role', 'super_admin')
               ->where('is_active', true)
               ->count();
           
           if ($superAdminCount <= 1) {
               throw new \Exception(
                   'Cannot ' . $action . ' the last active superadmin user. ' .
                   'At least one superadmin must always exist in the system.'
               );
           }
       }
   }
   ```

4. **API Endpoints to Protect**
   - `DELETE /v1/users/{id}` - Prevent deletion
   - `PATCH /v1/users/{id}` - Prevent deactivation
   - `PATCH /v1/users/{id}/capabilities` - Prevent capability removal

#### Frontend Requirements (React/TypeScript)

1. **User Management Component**
   - **File**: `src/pages/admin/UserManagement.tsx`
   - Add check before delete/deactivate operations
   - Show warning if attempting to modify last superadmin
   - Disable delete/deactivate buttons for last superadmin

2. **Superadmin Capability Handling**
   - Superadmin should have ALL capabilities automatically
   - Backend should return all capabilities for superadmin users
   - Frontend should treat superadmin as having all permissions

3. **UI Protection Logic**
   ```typescript
   // In UserManagement.tsx
   const isLastSuperAdmin = (user: User) => {
     if (user.role !== 'super_admin' || !user.is_active) return false;
     
     const superAdminCount = users.filter(
       u => u.role === 'super_admin' && u.is_active
     ).length;
     
     return superAdminCount === 1;
   };
   
   // Disable delete/deactivate for last superadmin
   {!isLastSuperAdmin(user) && (
     <Button onClick={() => handleDelete(user.id)}>Delete</Button>
   )}
   ```

#### Capability System Integration

1. **Superadmin Capability Definition**
   - Superadmin users should have a special capability: `all: ['*']` or
   - All module capabilities: `gate_pass: ['*']`, `inspection: ['*']`, etc.
   - Backend should automatically grant all capabilities to superadmin

2. **Permission Evaluator Logic**
   - Check for superadmin status first
   - If superadmin, return `{ allowed: true }` for all checks
   - This ensures superadmin bypass works even in capability-based system

3. **Migration Path**
   - During migration: Keep `role === 'super_admin'` check as fallback
   - After migration: Use capability-based check with superadmin flag
   - Both should work: `isSuperAdmin(user) || hasAllCapabilities(user)`

---

## Migration Phases

### Phase 1: Foundation & Infrastructure (Priority: HIGH)
**Goal**: Ensure all infrastructure supports capabilities, remove role dependencies from core systems

#### Task 1.0: Implement Superadmin Protection (CRITICAL - Do First!)
**Priority**: CRITICAL - Must be done before any other migration work

**Backend Tasks**:
- [ ] Add validation to prevent deleting last superadmin
- [ ] Add validation to prevent deactivating last superadmin
- [ ] Add validation to prevent removing superadmin capabilities
- [ ] Add database constraint or trigger (optional but recommended)
- [ ] Add API error messages for superadmin protection violations
- [ ] Create migration to add `is_super_admin` flag if needed

**Frontend Tasks**:
- [ ] Add `isLastSuperAdmin()` helper function
- [ ] Update UserManagement to check before delete/deactivate
- [ ] Add UI warnings when attempting to modify last superadmin
- [ ] Disable delete/deactivate buttons for last superadmin
- [ ] Add confirmation dialog explaining why action is blocked

**Files to Update**:
- Backend: UserController, User model, User deletion/update endpoints
- Frontend: `src/pages/admin/UserManagement.tsx`
- Frontend: `src/lib/users.ts` - Add helper functions

**Testing**:
- [ ] Test: Cannot delete last superadmin
- [ ] Test: Cannot deactivate last superadmin
- [ ] Test: Cannot remove superadmin capabilities from last superadmin
- [ ] Test: Can delete/deactivate when multiple superadmins exist
- [ ] Test: Error messages are clear and helpful

---

#### Task 1.1: Update Permission Evaluator
**File**: `src/lib/permissions/evaluator.ts`
- [ ] Keep superadmin bypass but make it capability-aware
- [ ] Ensure superadmin gets all capabilities from backend/API
- [ ] Add helper function `isSuperAdmin(user)` that checks both role and capabilities
- [ ] Document superadmin handling in code

**Current Code**:
```typescript
if (user.role === 'super_admin') {
  return { allowed: true };
}
```

**Target**: 
```typescript
// Check if user is superadmin (role-based or capability-based)
function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  
  // Option 1: Role-based (during migration)
  if (user.role === 'super_admin') return true;
  
  // Option 2: Capability-based (after migration)
  // Check if user has all capabilities or special master flag
  if (user.capabilities?.is_master) return true;
  
  // Option 3: Check if user has all possible capabilities
  // This would require checking against a master capability list
  
  return false;
}

// In checkPermission:
if (isSuperAdmin(user)) {
  return { allowed: true, reason: 'superadmin_bypass' };
}
```

**Important**: Keep superadmin bypass even after migration - it's a safety mechanism!

---

#### Task 1.2: Update Role Capabilities System
**File**: `src/lib/permissions/roleCapabilities.ts`
- [ ] Keep hard-coded definitions as **defaults only** for system roles
- [ ] Ensure API-fetched capabilities always override hard-coded ones
- [ ] Add logging when falling back to hard-coded capabilities
- [ ] Document that hard-coded roles are migration artifacts

**Action**: Add comment block explaining these are defaults, not the source of truth

---

#### Task 1.3: Update User Type System
**File**: `src/lib/users.ts`
- [ ] Update `User` type to make `role` optional or generic string
- [ ] Ensure `role` is treated as display name only
- [ ] Document that capabilities are the source of truth

**Current**: `role: string` - Good, but add documentation

---

### Phase 2: Route Protection Migration (Priority: HIGH)
**Goal**: Replace all `RequireRole` with `RequireCapability`

#### Task 2.1: Audit All Route Protections
**Files to check**:
- `src/App.tsx` (6 instances found)
- `src/pages/admin/VehicleCostDashboard.tsx`
- Any other route files

**Action Items**:
- [ ] List all `RequireRole` usages
- [ ] Map each role array to equivalent capabilities
- [ ] Create migration checklist

#### Task 2.2: Replace RequireRole in App.tsx
**File**: `src/App.tsx`

**Mappings**:
```typescript
// OLD: roles={["super_admin","admin"]}
// NEW: module="reports" action="read" OR module="user_management" action="read"

// OLD: roles={["super_admin","admin","supervisor","guard"]}
// NEW: module="gate_pass" action="validate" OR module="stockyard" action="validate" function="access_control"

// OLD: roles={["super_admin","admin"]} for inspection studio
// NEW: module="inspection" action="create" (or appropriate capability)
```

**Specific Replacements**:
1. **Line 144**: `/app/stockyard/access/reports`
   - Replace: `roles={["super_admin","admin"]}`
   - With: `<RequireCapability module="reports" action="read">`

2. **Line 148**: `/app/stockyard/access/templates`
   - Replace: `roles={["super_admin","admin"]}`
   - With: `<RequireCapability module="gate_pass" action="update">` (template management)

3. **Line 160**: `/app/stockyard/access/scan`
   - Replace: `roles={["super_admin","admin","supervisor","guard"]}`
   - With: `<RequireCapability module="gate_pass" action="validate">`

4. **Line 164**: `/app/stockyard/access/bulk`
   - Replace: `roles={["super_admin","admin"]}`
   - With: `<RequireCapability module="gate_pass" action="delete">`

5. **Line 233**: `/app/inspections/studio`
   - Replace: `roles={["super_admin","admin"]}`
   - With: `<RequireCapability module="inspection" action="create">` (or appropriate)

- [ ] Replace all 6 instances in `App.tsx`
- [ ] Test each route with different user roles
- [ ] Verify custom roles work correctly

---

#### Task 2.3: Deprecate RequireRole Component
**File**: `src/components/RequireAuth.tsx`
- [ ] Add `@deprecated` JSDoc to `RequireRole`
- [ ] Add console warning when used (development only)
- [ ] Update TypeScript to allow any string for role (not union type)
- [ ] Keep component for backward compatibility during migration
- [ ] Document migration path in component

**New Type**:
```typescript
// Remove hard-coded union, allow any string
// type Role = string; // Role is just a display name
```

---

### Phase 3: Navigation System Migration (Priority: HIGH)
**Goal**: Remove `roles` arrays from navigation, use only `requiredCapability`

#### Task 3.1: Audit Navigation Items
**File**: `src/lib/unifiedNavigation.ts`
- [ ] List all nav items with `roles` arrays (50+ instances)
- [ ] Map each role array to appropriate `requiredCapability`
- [ ] Identify items missing `requiredCapability`

#### Task 3.2: Add requiredCapability to All Nav Items
**File**: `src/lib/unifiedNavigation.ts`

**Mapping Strategy**:
```typescript
// Pattern: roles: ["super_admin", "admin", "supervisor"]
// → requiredCapability: { module: 'gate_pass', action: 'read' }

// Pattern: roles: ["super_admin", "admin"]
// → requiredCapability: { module: 'reports', action: 'read' } OR
//    requiredCapability: { module: 'user_management', action: 'read' }

// Pattern: roles: ["super_admin", "admin", "guard"]
// → requiredCapability: { module: 'gate_pass', action: 'validate' }
```

**Specific Items to Update**:
1. **Dashboard** (line 71): `roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"]`
   - Add: `requiredCapability: { module: 'gate_pass', action: 'read' }` (or most basic read)

2. **Work** (line 79): Similar pattern
   - Add: `requiredCapability: { module: 'gate_pass', action: 'read' }`

3. **Stockyard Access** (line 95): `roles: ["super_admin", "admin", "guard", "clerk", ...]`
   - Already has: `requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' }`
   - ✅ Keep, remove `roles` array

4. **Guard Register** (line 127): `roles: ["super_admin", "admin", "guard"]`
   - Add: `requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' }`

5. **Reports** (line 151): `roles: ["super_admin", "admin"]`
   - Add: `requiredCapability: { module: 'reports', action: 'read' }`

6. **Approvals** (line 159): `roles: ["super_admin", "admin", "supervisor", "yard_incharge"]`
   - Add: `requiredCapability: { module: 'gate_pass', action: 'approve' }` OR
   - Add: `requiredCapability: { module: 'stockyard', action: 'approve', function: 'access_control' }`

- [ ] Add `requiredCapability` to all 50+ nav items
- [ ] Remove `roles` arrays after adding capabilities
- [ ] Test navigation filtering with custom roles

#### Task 3.3: Update Navigation Filter Logic
**File**: `src/lib/unifiedNavigation.ts`
- [ ] Update `canUserAccessNavItem()` to prioritize `requiredCapability`
- [ ] Make `roles` check a fallback only (for migration period)
- [ ] Add deprecation warning when `roles` is used
- [ ] After migration complete, remove `roles` check entirely

**Target Logic**:
```typescript
function canUserAccessNavItem(...) {
  // 1. Check requiredCapability first (preferred)
  if (item.requiredCapability) {
    return hasCapability(user, ...);
  }
  
  // 2. Fallback to roles (deprecated, remove after migration)
  if (item.roles && item.roles.length > 0) {
    console.warn('Navigation item uses deprecated "roles" array:', item.id);
    return item.roles.includes(user.role);
  }
  
  // 3. No restrictions = allow
  return true;
}
```

---

### Phase 4: Component Logic Migration (Priority: MEDIUM)
**Goal**: Replace direct role comparisons with capability checks

#### Task 4.1: Dashboard Component
**File**: `src/pages/Dashboard.tsx`
- [ ] Replace `user?.role === 'super_admin'` checks with `hasCapability(user, 'reports', 'read')`
- [ ] Replace `user?.role === 'admin'` checks with appropriate capabilities
- [ ] Replace `user?.role === 'guard'` with `hasCapability(user, 'gate_pass', 'validate')`
- [ ] Replace `user?.role === 'inspector'` with `hasCapability(user, 'inspection', 'create')`

**Specific Replacements** (5 instances):
1. **Line 889**: Gate pass widget visibility
   - OLD: `(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'guard' || user?.role === 'clerk')`
   - NEW: `hasCapability(user, 'gate_pass', 'read')`

2. **Line 959**: Inspection widget visibility
   - OLD: `(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'inspector')`
   - NEW: `hasCapability(user, 'inspection', 'read')`

3. **Line 1029, 1099, 1169**: Admin-only widgets
   - OLD: `(user?.role === 'super_admin' || user?.role === 'admin')`
   - NEW: `hasCapability(user, 'reports', 'read')` OR appropriate capability

- [ ] Replace all 5 instances
- [ ] Test widget visibility with different users

---

#### Task 4.2: QuickActionsPanel Component
**File**: `src/components/ui/QuickActionsPanel.tsx`
- [ ] Replace role-based conditionals with capability checks
- [ ] Use `hasCapability()` instead of `role === 'admin'`

**Specific Replacements**:
1. **Line 199**: Admin/Super Admin check
   - OLD: `if (role === 'super_admin' || role === 'admin')`
   - NEW: `if (hasCapability(user, 'user_management', 'read'))` OR check multiple capabilities

2. **Line 255**: Supervisor check
   - OLD: `if (role === 'supervisor')`
   - NEW: `if (hasCapability(user, 'gate_pass', 'approve'))`

3. **Line 297**: Guard check
   - OLD: `if (role === 'guard')`
   - NEW: `if (hasCapability(user, 'gate_pass', 'validate'))`

4. **Line 329**: Inspector check
   - OLD: `if (role === 'inspector')`
   - NEW: `if (hasCapability(user, 'inspection', 'create'))`

5. **Line 359**: Clerk check
   - OLD: `if (role === 'clerk')`
   - NEW: `if (hasCapability(user, 'gate_pass', 'create'))`

6. **Line 401**: Stockyard access check
   - OLD: `if (role === 'super_admin' || role === 'admin' || role === 'supervisor' || role === 'clerk')`
   - NEW: `if (hasCapability(user, 'stockyard', 'read'))`

- [ ] Replace all 6 role checks
- [ ] Test quick actions with different users

---

#### Task 4.3: UserManagement Component
**File**: `src/pages/admin/UserManagement.tsx`
- [ ] Replace `currentUser?.role === 'super_admin'` checks
- [ ] Use `hasCapability(currentUser, 'user_management', 'create')` or similar

**Specific Replacements**:
1. **Line 577**: Super admin only UI
   - OLD: `{currentUser?.role === 'super_admin' && (`
   - NEW: `{hasCapability(currentUser, 'user_management', 'delete') && (`

2. **Line 1071, 1309**: Super admin messages
   - OLD: `{currentUser?.role === 'super_admin' && '...'}`
   - NEW: `{hasCapability(currentUser, 'user_management', 'update') && '...'}`

- [ ] Replace all 3 instances
- [ ] Test user management with different admin levels

---

#### Task 4.4: Other Component Files
**Files to update**:
- `src/pages/inspections/InspectionDashboard.tsx` (2 instances)
- `src/pages/expenses/ExpenseApproval.tsx` (1 instance)
- `src/pages/admin/VehicleCostDashboard.tsx` (1 instance)
- `src/pages/stockyard/access/AccessDashboard.tsx` (1 instance)
- `src/pages/expenses/CreateExpense.tsx` (1 instance)
- `src/pages/inspections/InspectionDetails.tsx` (2 instances)
- `src/lib/widgetRegistry.ts` (multiple instances)
- `src/lib/smartDefaults.ts` (1 instance)

**Action**:
- [ ] Create checklist for each file
- [ ] Replace role checks with capability checks
- [ ] Test each component

---

#### Task 4.5: useUserRole Hook
**File**: `src/pages/stockyard/access/hooks/useUserRole.ts`
- [ ] Keep convenience flags (`isGuard`, `isAdmin`, etc.) for backward compatibility
- [ ] Document that these are derived from capabilities, not roles
- [ ] Consider deprecating these flags in favor of direct capability checks
- [ ] Update comments to clarify role is display name only

**Note**: This hook already uses `hasCapability()` for permissions, which is good. The convenience flags are OK to keep for now.

---

### Phase 5: Type System Cleanup (Priority: LOW)
**Goal**: Remove hard-coded role types, make system fully dynamic

#### Task 5.1: Update Type Definitions
**Files**:
- `src/components/RequireAuth.tsx` - Remove `Role` union type
- `src/pages/stockyard/access/hooks/useUserRole.ts` - Update `GatePassRole` type
- Any other files with hard-coded role types

**Action**:
- [ ] Change `type Role = "super_admin" | "admin" | ...` to `type Role = string`
- [ ] Update all type references
- [ ] Ensure TypeScript still type-checks correctly

---

#### Task 5.2: Update CapabilityMatrix Component
**File**: `src/pages/admin/CapabilityMatrix.tsx`
- [ ] Remove hard-coded role dropdown options (lines 261-264)
- [ ] Fetch roles dynamically from API
- [ ] Support custom roles in dropdown

**Current**:
```typescript
<option value="admin">Admin</option>
<option value="supervisor">Supervisor</option>
```

**Target**: Fetch from `/v1/roles` API endpoint

---

### Phase 6: Testing & Validation (Priority: HIGH)
**Goal**: Ensure migration doesn't break existing functionality

#### Task 6.1: Create Test Suite
- [ ] Test all routes with different user roles
- [ ] Test navigation filtering with custom roles
- [ ] Test component visibility with capability-based checks
- [ ] Test permission gates with various capabilities
- [ ] Test super admin still has all access (via capabilities)

#### Task 6.2: Integration Testing
- [ ] Test with system roles (admin, supervisor, guard, etc.)
- [ ] Test with custom roles from API
- [ ] Test role creation and capability assignment
- [ ] Test role updates and capability changes

#### Task 6.3: Regression Testing
- [ ] Verify all existing user flows still work
- [ ] Check that no permissions were accidentally removed
- [ ] Verify backward compatibility during migration

---

### Phase 7: Documentation & Cleanup (Priority: MEDIUM)
**Goal**: Document changes, remove deprecated code

#### Task 7.1: Update Documentation
**Files to update**:
- `docs/DEVELOPER_GUIDE.md` - Update permission examples
- `docs/API_REFERENCE.md` - Document capability-based system
- `src/lib/permissions/README.md` - Update with migration info

**Content**:
- [ ] Document capability-based system
- [ ] Show examples of capability checks
- [ ] Explain migration from roles to capabilities
- [ ] Document how to create custom roles

---

#### Task 7.2: Remove Deprecated Code
**After all migrations complete**:
- [ ] Remove `RequireRole` component (or keep as deprecated wrapper)
- [ ] Remove `roles` arrays from navigation items
- [ ] Remove hard-coded role checks from components
- [ ] Clean up unused role type definitions
- [ ] Remove role-based fallback logic from navigation

**Timeline**: Only after Phase 6 testing confirms everything works

---

## Migration Strategy

### Approach: Incremental with Fallbacks
1. **Add capability checks alongside role checks** (Phase 2-4)
2. **Test thoroughly** (Phase 6)
3. **Remove role checks** (Phase 7)
4. **Keep role checks as fallback during migration** for safety

### Backward Compatibility
- Keep `RequireRole` working during migration
- Keep `roles` arrays in navigation as fallback
- Add deprecation warnings in development mode
- Remove only after full migration and testing

### Testing Strategy
- Test each phase independently
- Use feature flags if needed
- Test with both system roles and custom roles
- Verify no permission regressions

---

## Success Criteria

### Phase 1 Complete When:
- ✅ **Superadmin protection is implemented** (Task 1.0 - CRITICAL)
  - Backend prevents deleting/deactivating last superadmin
  - Frontend shows warnings and blocks dangerous actions
  - Emergency access procedures are documented
- ✅ Permission evaluator handles superadmin correctly
- ✅ Role capabilities system is updated
- ✅ User type system is documented

### Phase 1-2 Complete When:
- ✅ All routes use `RequireCapability` instead of `RequireRole`
- ✅ Navigation uses `requiredCapability` (with `roles` as fallback)
- ✅ All route protections work with custom roles
- ✅ **Superadmin protection is tested and working**

### Phase 3-4 Complete When:
- ✅ All components use `hasCapability()` instead of role comparisons
- ✅ Navigation filtering works with capabilities only
- ✅ All UI elements show/hide based on capabilities
- ✅ **Superadmin still has full access via capabilities**

### Phase 5-7 Complete When:
- ✅ No hard-coded role types remain
- ✅ All role references are dynamic (from API)
- ✅ Documentation is updated
- ✅ Deprecated code is removed
- ✅ Full test suite passes
- ✅ **Superadmin protection is fully tested and documented**

---

## Estimated Timeline

- **Phase 1**: 3-4 days (Foundation + Superadmin Protection)
  - Task 1.0 (Superadmin Protection): 1-2 days (CRITICAL - do first!)
  - Task 1.1-1.3: 2 days
- **Phase 2**: 3-4 days (Routes)
- **Phase 3**: 4-5 days (Navigation)
- **Phase 4**: 5-7 days (Components)
- **Phase 5**: 1-2 days (Types)
- **Phase 6**: 3-4 days (Testing)
- **Phase 7**: 1-2 days (Cleanup)

**Total**: ~20-27 days

---

## Risk Mitigation

### Risks:
1. **Breaking existing functionality** - Mitigate with fallbacks and thorough testing
2. **Performance impact** - Capability checks are fast, but monitor
3. **Complexity** - Keep migration incremental, test each phase

### Rollback Plan:
- Keep old code commented out during migration
- Use feature flags if needed
- Maintain git branches for each phase

---

## Notes

- **Super Admin**: Should have all capabilities defined in backend, not hard-coded bypass
- **Superadmin Protection**: CRITICAL - At least one superadmin must always exist (see Task 1.0)
- **Custom Roles**: Must be fully supported after migration
- **Backward Compatibility**: Maintain during migration, remove after validation
- **API Dependencies**: Ensure backend supports capability-based permissions

---

## Emergency Access Procedures

### Scenario: All Superadmins Locked Out

If all superadmin accounts are accidentally deleted, deactivated, or lose permissions:

#### Option 1: Database Direct Access (Recommended)
1. Connect directly to database
2. Reactivate/create superadmin user:
   ```sql
   -- Reactivate existing superadmin
   UPDATE users 
   SET is_active = 1, role = 'super_admin'
   WHERE email = 'admin@company.com';
   
   -- OR create new superadmin
   INSERT INTO users (employee_id, name, email, password, role, is_active, created_at, updated_at)
   VALUES ('EMERGENCY001', 'Emergency Admin', 'emergency@company.com', 
           '$2y$10$...', 'super_admin', 1, NOW(), NOW());
   ```
3. Reset password if needed via Laravel tinker or password reset endpoint

#### Option 2: Backend Console/Tinker
```php
// In Laravel Tinker: php artisan tinker
$user = User::where('email', 'admin@company.com')->first();
$user->role = 'super_admin';
$user->is_active = true;
$user->save();
```

#### Option 3: Emergency API Endpoint (If Implemented)
Create a special emergency endpoint that bypasses normal auth:
```php
// routes/emergency.php (only accessible from localhost or with special key)
Route::post('/emergency/restore-superadmin', function(Request $request) {
    // Verify emergency key from .env
    if ($request->key !== config('app.emergency_key')) {
        abort(403);
    }
    
    $user = User::where('email', $request->email)->first();
    $user->role = 'super_admin';
    $user->is_active = true;
    $user->save();
    
    return response()->json(['message' => 'Superadmin restored']);
});
```

### Prevention Measures

1. **Always maintain at least 2 superadmin accounts** (recommended)
2. **Document superadmin account details** in secure location
3. **Regular backups** of user table
4. **Audit logs** for all superadmin modifications
5. **Email notifications** when superadmin count drops below threshold

---

## Superadmin Capability Strategy

### How Superadmin Works in Capability System

1. **Identification Methods** (use at least one):
   - `user.role === 'super_admin'` (simple, works during migration)
   - `user.capabilities.is_master === true` (capability-based)
   - `user.is_super_admin === true` (database flag)

2. **Permission Evaluation**:
   ```typescript
   // Superadmin always has all permissions
   function isSuperAdmin(user: User | null): boolean {
     return user?.role === 'super_admin' || 
            user?.capabilities?.is_master === true ||
            user?.is_super_admin === true;
   }
   
   // In permission check:
   if (isSuperAdmin(user)) {
     return { allowed: true }; // Bypass all checks
   }
   ```

3. **Backend Capability Assignment**:
   - When user is set as superadmin, backend should:
     - Set `role = 'super_admin'`
     - Grant ALL capabilities automatically
     - Set `is_master: true` flag in capabilities
   - This ensures superadmin works in both role-based and capability-based systems

4. **Migration Path**:
   - **During Migration**: Keep role check as primary, add capability check
   - **After Migration**: Use capability check as primary, keep role as fallback
   - **Long-term**: Fully capability-based

---

## Quick Reference: Role → Capability Mappings

| Old Role Check | New Capability Check |
|---------------|---------------------|
| `role === 'super_admin'` | `hasCapability(user, 'user_management', 'read')` (or appropriate) |
| `role === 'admin'` | `hasCapability(user, 'reports', 'read')` OR specific capability |
| `role === 'supervisor'` | `hasCapability(user, 'gate_pass', 'approve')` |
| `role === 'guard'` | `hasCapability(user, 'gate_pass', 'validate')` |
| `role === 'inspector'` | `hasCapability(user, 'inspection', 'create')` |
| `role === 'clerk'` | `hasCapability(user, 'gate_pass', 'create')` |
| `role === 'yard_incharge'` | `hasStockyardCapability(user, 'inventory', 'read')` |
| `role === 'executive'` | `hasCapability(user, 'gate_pass', 'read')` |

**Note**: Exact capability depends on context. Review each use case individually.

---

## Getting Started

1. Start with **Phase 1** (Foundation)
2. Complete **Phase 2** (Routes) - highest impact
3. Move to **Phase 3** (Navigation)
4. Then **Phase 4** (Components)
5. Finish with **Phase 5-7** (Cleanup)

Good luck! 🚀


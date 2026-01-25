# Role Migration Quick Start Guide

## Overview
This guide helps you migrate from hard-coded roles to a capability-based permission system.

## 📋 Documents

1. **ROLE_TO_CAPABILITY_MIGRATION_PLAN.md** - Complete detailed migration plan
2. **ROLE_MIGRATION_CHECKLIST.md** - Trackable checklist
3. **This file** - Quick start guide

## 🚀 Getting Started

### Step 1: Run the Analysis Script
```bash
node scripts/find-role-references.js
```

This will:
- Scan all TypeScript/JavaScript files
- Find hard-coded role references
- Generate a report: `role-references-report.json`

### Step 2: Review the Migration Plan
Open `docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md` and review all 7 phases.

### Step 3: Start with Phase 1 (Foundation)
Begin with the foundation tasks to ensure the infrastructure is ready.

## 🎯 Migration Strategy

### Quick Wins (Start Here)
1. **Phase 2: Route Protection** - Replace `RequireRole` with `RequireCapability`
   - High impact, relatively low risk
   - Easy to test
   - ~6 instances in `App.tsx`

2. **Phase 3: Navigation** - Add `requiredCapability` to nav items
   - High visibility
   - Already has infrastructure support
   - ~50 instances

### Core Work
3. **Phase 4: Component Logic** - Replace role checks
   - Most time-consuming
   - Requires careful testing
   - ~30+ instances across multiple files

### Cleanup
4. **Phase 5-7**: Types, testing, documentation

## 🔧 Common Patterns

### Pattern 1: Route Protection
```typescript
// ❌ OLD
<RequireRole roles={["super_admin", "admin"]}>
  <MyComponent />
</RequireRole>

// ✅ NEW
<RequireCapability module="reports" action="read">
  <MyComponent />
</RequireCapability>
```

### Pattern 2: Component Visibility
```typescript
// ❌ OLD
{user?.role === 'admin' && <AdminWidget />}

// ✅ NEW
{hasCapability(user, 'reports', 'read') && <AdminWidget />}
```

### Pattern 3: Navigation Items
```typescript
// ❌ OLD
{
  id: "reports",
  label: "Reports",
  path: "/app/reports",
  roles: ["super_admin", "admin"],
}

// ✅ NEW
{
  id: "reports",
  label: "Reports",
  path: "/app/reports",
  requiredCapability: { module: 'reports', action: 'read' },
}
```

### Pattern 4: Conditional Logic
```typescript
// ❌ OLD
if (role === 'supervisor') {
  // supervisor logic
}

// ✅ NEW
if (hasCapability(user, 'gate_pass', 'approve')) {
  // approval logic
}
```

## 📊 Role → Capability Mapping Guide

| Context | Old Role Check | New Capability Check |
|---------|---------------|---------------------|
| **Reports Access** | `roles: ["super_admin", "admin"]` | `module: 'reports', action: 'read'` |
| **User Management** | `role === 'super_admin'` | `module: 'user_management', action: 'read'` |
| **Gate Pass Approval** | `role === 'supervisor'` | `module: 'gate_pass', action: 'approve'` |
| **Gate Pass Validation** | `role === 'guard'` | `module: 'gate_pass', action: 'validate'` |
| **Inspection Creation** | `role === 'inspector'` | `module: 'inspection', action: 'create'` |
| **Gate Pass Creation** | `role === 'clerk'` | `module: 'gate_pass', action: 'create'` |
| **Stockyard Inventory** | `role === 'yard_incharge'` | `module: 'stockyard', action: 'read', function: 'inventory'` |
| **Stockyard Access Control** | `role === 'guard'` | `module: 'stockyard', action: 'read', function: 'access_control'` |

**Note**: Use `hasStockyardCapability(user, 'access_control', 'read')` for stockyard function-specific checks.

## 🧪 Testing Checklist

After each phase:
- [ ] Test with system roles (admin, supervisor, guard, etc.)
- [ ] Test with custom roles from API
- [ ] Verify no permissions were accidentally removed
- [ ] Check that UI elements show/hide correctly
- [ ] Test navigation filtering
- [ ] Test route protection

## ⚠️ Important Notes

1. **CRITICAL: Superadmin Protection** - MUST implement Task 1.0 FIRST before any other migration work
   - At least one superadmin must always exist
   - Backend must prevent deleting/deactivating last superadmin
   - Frontend must show warnings and disable actions for last superadmin
   - See migration plan for detailed implementation

2. **Super Admin**: Should have all capabilities defined in backend, but keep bypass for safety
   - Superadmin bypass should work in both role-based and capability-based systems
   - Use `isSuperAdmin(user)` helper that checks both role and capabilities

3. **Backward Compatibility**: Keep role checks as fallback during migration
4. **Incremental**: Migrate one phase at a time, test thoroughly
5. **Documentation**: Update docs as you go
6. **Emergency Access**: Document emergency procedures for superadmin recovery

## 🐛 Troubleshooting

### Issue: Custom roles not working
- **Check**: Ensure backend returns capabilities for custom roles
- **Check**: Verify `hasCapability()` is checking user.capabilities correctly

### Issue: Navigation items not showing
- **Check**: Verify `requiredCapability` is set correctly
- **Check**: Test with `hasCapability()` directly
- **Check**: Navigation filter logic is using capabilities

### Issue: Routes not protecting correctly
- **Check**: `RequireCapability` is imported correctly
- **Check**: Capability module/action matches backend
- **Check**: User object has capabilities loaded

## 📞 Need Help?

1. Review the detailed migration plan
2. Check existing capability-based code for examples
3. Test with `hasCapability()` in browser console
4. Review `src/lib/permissions/README.md`

## ✅ Success Criteria

Migration is complete when:
- ✅ No `RequireRole` components in routes
- ✅ No `roles` arrays in navigation (or only as fallback)
- ✅ No direct `role === 'admin'` comparisons
- ✅ All permissions work with custom roles
- ✅ All tests pass
- ✅ Documentation updated

---

**Good luck with your migration!** 🚀


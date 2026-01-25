# Silent Failures - Action Plan

## Executive Summary

After comprehensive audit, I found:
- ✅ **Good News**: Most React Query hooks DO handle errors properly with toast notifications
- ⚠️ **Issues**: Some catch blocks lack logging, reports fail silently, API fallbacks have no user feedback
- 📊 **Impact**: Users don't know when operations fail, reports show empty states without explanation

## Critical Issues (Fix Immediately)

### 1. ExpenseReports.tsx - Silent Failure
**File**: `src/pages/expenses/ExpenseReports.tsx`
**Line**: 116-129
**Issue**: Sets empty stats without user notification
**Current Code**:
```typescript
} catch (error) {
  // Error is already handled by apiClient
  setStats({ total_expenses: 0, ... }); // Silent failure
}
```
**Fix**: Add error toast (same as AccessReports)
**Priority**: 🔴 CRITICAL

### 2. API Fallback Patterns - No User Feedback
**Files**: 
- `src/pages/stockyard/CreateStockyardRequest.tsx:43-45`
- `src/pages/stockyard/CreateComponentMovement.tsx:87-89`
**Issue**: `.catch(() => ({ data: [] }))` - silent fallback to empty arrays
**Impact**: Dropdowns are empty, user doesn't know why
**Fix**: Show warning toast when fallback is used
**Priority**: 🔴 CRITICAL

### 3. Catch Blocks - Missing Error Logging
**Files**:
- `src/pages/stockyard/access/AccessPassDetails.tsx:110-112, 131-133, 153-155`
- `src/pages/stockyard/access/components/dashboard/GuardDashboardContent.tsx:70-72, 81-83`
- `src/pages/stockyard/access/CreateAccessPass.tsx:150-151`
**Issue**: `catch { // Error handled by hook }` - no logging
**Note**: Hooks DO handle errors (verified), but catch blocks should log for debugging
**Fix**: Add `console.error('Operation failed:', error);`
**Priority**: 🟡 HIGH (hooks work, but need safety net)

## High Priority Issues

### 4. Activity Logging - Silent in Production
**Files**:
- Frontend: `src/lib/activityLogs.ts:149-155`
- Backend: Multiple controllers (GatePassController, GatePassValidationController)
**Issue**: Silently fails in production, only dev console warning
**Impact**: Audit trail incomplete, but doesn't break functionality
**Fix**: 
- Add error tracking in production
- Consider retry queue
- Track failure metrics
**Priority**: 🟡 HIGH

### 5. Reports - Missing Error States
**Files**: All report components
**Issue**: Show empty states without retry buttons
**Fix**: Add retry buttons and better error messages
**Priority**: 🟡 HIGH

## Medium Priority

### 6. Prefetch Failures
**File**: `src/hooks/usePrefetch.ts`
**Issue**: Multiple silent catch blocks
**Fix**: Add console.warn in dev, log to monitoring in prod
**Priority**: 🟢 MEDIUM

### 7. IndexedDB Operations
**Files**: `src/lib/idb-safe.ts`, `src/lib/offlineQueue.ts`
**Issue**: Silent failures with fallbacks
**Fix**: Add metrics, show notification if consistently failing
**Priority**: 🟢 MEDIUM

## Implementation Plan

### Phase 1: Critical Fixes (Today)

#### Fix 1: ExpenseReports Error Handling
```typescript
// In ExpenseReports.tsx, replace catch block:
} catch (error: any) {
  console.error('Failed to fetch expense report data:', error);
  setStats({ total_expenses: 0, ... });
  showToast({
    title: 'Failed to Load Reports',
    description: error?.response?.data?.message || error?.message || 'Unable to fetch report data.',
    variant: 'error',
  });
}
```

#### Fix 2: API Fallback Patterns
```typescript
// In CreateStockyardRequest.tsx and CreateComponentMovement.tsx:
try {
  const vehiclesRes = await apiClient.get('/v1/vehicles');
  setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : vehiclesRes.data.data || []);
} catch (error) {
  console.error('Failed to load vehicles:', error);
  showToast({
    title: 'Warning',
    description: 'Failed to load vehicles. Some options may be unavailable.',
    variant: 'warning',
  });
  setVehicles([]);
}
```

#### Fix 3: Add Error Logging to Catch Blocks
```typescript
// In AccessPassDetails.tsx, GuardDashboardContent.tsx, CreateAccessPass.tsx:
try {
  await mutation.mutateAsync(data);
  refetch();
} catch (error) {
  // Hook should handle via onError, but log for debugging
  console.error('Operation failed:', error);
  // Hooks verified to have onError handlers, so this is just safety net
}
```

### Phase 2: High Priority (This Week)

#### Fix 4: Activity Logging Improvements
```typescript
// In activityLogs.ts:
catch (error) {
  // Log to error tracking in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (Sentry/LogRocket)
    logger.error('Activity log failed', error, 'activityLogs');
  } else {
    console.warn('[activityLogs] Failed to log activity:', error);
  }
}
```

#### Fix 5: Add Retry Buttons to Reports
- Add retry button to error states
- Show error message with actionable retry option

### Phase 3: Monitoring Setup (Next Week)

1. Set up error tracking service (Sentry/LogRocket)
2. Add error boundaries for critical flows
3. Implement error metrics collection
4. Create error monitoring dashboard

## Verification Checklist

### React Query Hooks Status ✅
- ✅ `useRecordEntry` - Has onError with toast (line 387-398)
- ✅ `useRecordExit` - Has onError with toast (line 466-477)  
- ✅ `useCreateGatePass` - Has onError with toast (line 166-176)
- ✅ `useCancelGatePass` - Has onError with toast (line 280-290)

**Conclusion**: Hooks are properly configured. The "Error handled by hook" comments are CORRECT.

### What Needs Fixing

1. **ExpenseReports.tsx** - Add error toast ⚠️
2. **API Fallbacks** - Add user feedback ⚠️
3. **Catch Blocks** - Add error logging ⚠️
4. **Activity Logging** - Improve production logging ⚠️
5. **Reports** - Add retry buttons ⚠️

## Quick Wins (Can Do Now)

1. ✅ Fix AccessReports error handling (DONE)
2. Fix ExpenseReports error handling (5 min)
3. Add console.error to all catch blocks (15 min)
4. Fix API fallback patterns (30 min)

## Testing Strategy

1. **Disable Network**: Test all user actions, verify toasts appear
2. **Cause API Errors**: Test with invalid data, verify error messages
3. **Test Reports**: Verify error states show retry buttons
4. **Monitor Console**: Verify all errors are logged

## Files Created

1. `SILENT_FAILURES_AUDIT.md` - Comprehensive audit document
2. `SILENT_FAILURES_FIX_PLAN.md` - Detailed fix plan with code examples
3. `SILENT_FAILURES_SUMMARY.md` - Quick reference guide
4. `SILENT_FAILURES_ACTION_PLAN.md` - This file (prioritized action items)

## Next Steps

1. Review this plan
2. Start with Phase 1 fixes (today)
3. Move to Phase 2 (this week)
4. Set up monitoring (next week)


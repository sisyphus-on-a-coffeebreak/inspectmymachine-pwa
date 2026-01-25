# Silent Failures Summary & Quick Reference

## 🔍 What I Found

### ✅ Good News
- **React Query hooks DO handle errors**: `useRecordEntry`, `useRecordExit`, `useCreateGatePass` all have `onError` handlers that show toast notifications
- **AccessReports error handling**: Already fixed - now shows error toast
- **Error boundaries exist**: `ErrorBoundary.tsx` and `GatePassErrorBoundary.tsx` catch React errors

### ⚠️ Issues Found

## Critical Issues (User Actions Fail Silently)

### 1. AccessPassDetails.tsx
**Status**: Hooks handle errors, but catch blocks should add logging
**Files**: Lines 110-112, 131-133, 153-155
**Current**: `catch { // Error handled by hook }`
**Recommendation**: Add console.error for debugging, verify hooks work

### 2. GuardDashboardContent.tsx  
**Status**: Same as #1
**Files**: Lines 70-72, 81-83

### 3. CreateAccessPass.tsx
**Status**: Same as #1
**Files**: Line 150-151

**Note**: These are actually OK if hooks work, but should add logging as safety net

## High Priority Issues

### 4. ExpenseReports.tsx
**Status**: Needs error toast
**Files**: Lines 116-120
**Current**: Sets empty stats without notification
**Fix**: Add error toast (copy pattern from AccessReports)

### 5. Activity Logging Failures
**Status**: Acceptable but should improve
**Files**: 
- Frontend: `src/lib/activityLogs.ts:149-155`
- Backend: Multiple controllers log warnings only
**Current**: Silent in production, dev console warning
**Recommendation**: 
- Add error tracking in production
- Consider retry queue
- Track failure metrics

### 6. API Fallback Patterns
**Status**: Need user feedback
**Files**: 
- `CreateStockyardRequest.tsx:43-45`
- `CreateComponentMovement.tsx:87-89`
**Current**: `.catch(() => ({ data: [] }))` - silent fallback
**Fix**: Show warning toast when fallback is used

## Medium Priority

### 7. Prefetch Failures
**Files**: `src/hooks/usePrefetch.ts`
**Status**: Acceptable (optimization), but should log in production

### 8. IndexedDB Operations
**Files**: `src/lib/idb-safe.ts`, `src/lib/offlineQueue.ts`
**Status**: Acceptable (offline fallback), but should track metrics

## Low Priority (Acceptable)

- Web vitals initialization
- Cleanup operations
- QR scanner fallbacks
- Video play failures

## Quick Fix Checklist

### Immediate (Today)
- [ ] Verify all React Query hooks show error toasts (they do!)
- [ ] Add console.error to catch blocks in AccessPassDetails, GuardDashboardContent, CreateAccessPass
- [ ] Fix ExpenseReports error handling (add toast)

### This Week
- [ ] Fix API fallback patterns (CreateStockyardRequest, CreateComponentMovement)
- [ ] Improve activity logging error handling
- [ ] Add error logging to all catch blocks

### This Month
- [ ] Set up error tracking service
- [ ] Add error metrics collection
- [ ] Create error monitoring dashboard

## Verification

**React Query Hooks Status**:
- ✅ `useRecordEntry` - Has onError with toast (line 387-398)
- ✅ `useRecordExit` - Has onError with toast (line 466-477)
- ✅ `useCreateGatePass` - Has onError with toast (line 166-176)
- ❓ `useCancelGatePass` - Need to verify

**The "Error handled by hook" comments are CORRECT** - hooks do handle errors. However:
1. Catch blocks should still log errors for debugging
2. If hook's onError doesn't fire, there's no fallback
3. Should verify all hooks have onError handlers

## Recommended Pattern

```typescript
try {
  await mutation.mutateAsync(data);
  // Success handled by hook's onSuccess
} catch (error) {
  // Hook should handle via onError, but add safety net
  console.error('Operation failed:', error);
  
  // Verify hook handled it - if not, show fallback
  if (!mutation.isError) {
    // This shouldn't happen, but safety net
    showToast({
      title: 'Error',
      description: 'Operation failed. Please try again.',
      variant: 'error',
    });
  }
}
```


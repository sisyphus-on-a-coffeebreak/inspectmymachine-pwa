# Silent Failures Fix Plan - Prioritized Action Items

## 🔴 Critical Priority (Fix Immediately)

### 1. User Action Failures - No User Feedback

#### Issue: AccessPassDetails.tsx
**Files**: `src/pages/stockyard/access/AccessPassDetails.tsx`
**Lines**: 108-112, 128-133, 150-155
**Problem**: 
```typescript
try {
  await recordEntry.mutateAsync({ id, notes: undefined });
  refetch();
} catch {
  // Error handled by hook  ← SILENT FAILURE
}
```
**Impact**: User clicks "Record Entry" but sees nothing if it fails
**Fix**:
```typescript
try {
  await recordEntry.mutateAsync({ id, notes: undefined });
  refetch();
} catch (error) {
  // Hook should handle it, but add fallback
  console.error('Failed to record entry:', error);
  // Verify hook shows toast - if not, add explicit toast here
  if (!recordEntry.isError) {
    showToast({
      title: 'Error',
      description: 'Failed to record entry. Please try again.',
      variant: 'error',
    });
  }
}
```

#### Issue: GuardDashboardContent.tsx
**Files**: `src/pages/stockyard/access/components/dashboard/GuardDashboardContent.tsx`
**Lines**: 70-72, 81-83
**Same pattern as above - needs same fix**

#### Issue: CreateAccessPass.tsx
**Files**: `src/pages/stockyard/access/CreateAccessPass.tsx`
**Line**: 150-151
**Same pattern - verify hook provides feedback**

### 2. Report Failures - Silent Empty States

#### Issue: AccessReports.tsx ✅ (Already Fixed)
**Status**: Fixed in recent changes - now shows error toast

#### Issue: ExpenseReports.tsx
**Files**: `src/pages/expenses/ExpenseReports.tsx`
**Lines**: 116-120
**Problem**: Sets empty stats without user notification
**Fix**: Add error toast (same pattern as AccessReports)

## 🟡 High Priority (Fix This Week)

### 3. Activity Logging Failures

#### Issue: Frontend activityLogs.ts
**Files**: `src/lib/activityLogs.ts`
**Lines**: 149-155
**Problem**: Silently fails with only dev console warning
**Current**:
```typescript
catch (error) {
  // Silently handle errors - activity logging should not break main functionality
  if (process.env.NODE_ENV === 'development') {
    console.warn('[activityLogs] Failed to log activity:', error);
  }
}
```
**Fix**:
```typescript
catch (error) {
  // Log to error tracking in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    logger.error('Activity log failed', error, 'activityLogs');
  } else {
    console.warn('[activityLogs] Failed to log activity:', error);
  }
  
  // Track failure rate - if too high, show warning
  activityLogFailureCount++;
  if (activityLogFailureCount > 10) {
    console.warn('[activityLogs] High failure rate detected');
  }
}
```

#### Issue: Backend GatePassController.php
**Files**: `app/Http/Controllers/Api/GatePassController.php`
**Lines**: 713-714, 831-832
**Problem**: Only logs warning, no retry mechanism
**Fix**: Consider adding retry queue or at least metrics

### 4. API Fallback Failures

#### Issue: CreateStockyardRequest.tsx
**Files**: `src/pages/stockyard/CreateStockyardRequest.tsx`
**Lines**: 43-45
**Problem**: 
```typescript
apiClient.get('/v1/vehicles').catch(() => ({ data: [] }))
```
**Impact**: Empty dropdowns without explanation
**Fix**:
```typescript
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

## 🟢 Medium Priority (Fix This Month)

### 5. Prefetch Failures
**Files**: `src/hooks/usePrefetch.ts`
**Issue**: Multiple silent catch blocks
**Fix**: Add console.warn in development, log to monitoring in production

### 6. IndexedDB Operations
**Files**: `src/lib/idb-safe.ts`, `src/lib/offlineQueue.ts`
**Issue**: Many silent failures with fallbacks
**Fix**: Add metrics, show user notification if offline queue consistently fails

## Implementation Checklist

### Phase 1: Critical User Actions (Day 1-2)
- [ ] Fix AccessPassDetails.tsx - Add error handling
- [ ] Fix GuardDashboardContent.tsx - Add error handling  
- [ ] Fix CreateAccessPass.tsx - Verify hook feedback
- [ ] Test all gate pass actions show feedback

### Phase 2: Reports (Day 2-3)
- [x] Fix AccessReports.tsx error handling (DONE)
- [ ] Fix ExpenseReports.tsx error handling
- [ ] Add retry buttons to all reports
- [ ] Test report error scenarios

### Phase 3: Activity Logging (Day 3-4)
- [ ] Improve frontend activity log error handling
- [ ] Add error tracking for activity log failures
- [ ] Add retry mechanism for failed activity logs
- [ ] Add metrics/monitoring

### Phase 4: API Fallbacks (Day 4-5)
- [ ] Fix CreateStockyardRequest.tsx
- [ ] Fix CreateComponentMovement.tsx
- [ ] Review all `.catch(() => ({ data: [] }))` patterns
- [ ] Add user feedback for all API fallbacks

### Phase 5: Monitoring Setup (Week 2)
- [ ] Set up error tracking service (Sentry/LogRocket)
- [ ] Add error boundaries for critical flows
- [ ] Implement error metrics collection
- [ ] Create error monitoring dashboard

## Quick Wins (Can Fix Now)

1. **Add console.error to all catch blocks** - At minimum, log errors
2. **Verify React Query hooks show toasts** - Check useRecordEntry, useRecordExit, etc.
3. **Add error toasts to report failures** - Already done for AccessReports, do same for ExpenseReports
4. **Add retry buttons** - Let users retry failed operations

## Testing Strategy

1. **Manual Testing**: 
   - Disable network, try actions
   - Cause API errors, verify user sees feedback
   - Test all report pages with invalid data

2. **Automated Testing**:
   - Add tests for error scenarios
   - Verify toasts are shown on errors
   - Verify errors are logged

3. **Monitoring**:
   - Track error rates
   - Alert on high failure rates
   - Monitor activity log success rate


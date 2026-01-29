# VOMS PWA - Page-by-Page UI Action Plan

**Date**: January 2025  
**Based on**: UI Audit Report  
**Status**: Ready for Implementation

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Core Components](#core-components)
3. [Layout Components](#layout-components)
4. [Admin Pages](#admin-pages)
5. [Stockyard Access Pages](#stockyard-access-pages)
6. [Expense Pages](#expense-pages)
7. [Inspection Pages](#inspection-pages)
8. [Other Pages](#other-pages)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Quick Reference

### Priority Levels
- 🔴 **CRITICAL**: Blocks performance/maintainability, do first
- 🟡 **HIGH**: Significant impact, do soon
- 🟢 **MEDIUM**: Important but not urgent
- ⚪ **LOW**: Nice to have, can be done later

### Task Types
- **MD**: Replace mobile detection with CSS
- **DS**: Replace inline styles with design system tokens
- **ARIA**: Add accessibility attributes
- **KB**: Add keyboard navigation
- **SPLIT**: Split large component into smaller ones
- **CONSOLE**: Remove/replace console statements
- **MEMO**: Add memoization

### Estimated Effort
- **S**: Small (< 30 min)
- **M**: Medium (30 min - 2 hours)
- **L**: Large (2-4 hours)
- **XL**: Extra Large (4+ hours)

---

## Core Components

### 1. `src/components/ui/PageHeader.tsx`
**Priority**: 🔴 **CRITICAL**  
**Effort**: **S** (5 minutes)

**Issues**:
- Duplicate `className` prop (lines 44-45)

**Tasks**:
1. [ ] Fix duplicate className prop
   ```typescript
   // BEFORE (lines 44-45)
   className={`page-header ${className}`}
   className="page-header-responsive"  // ❌ Duplicate!
   
   // AFTER
   className={`page-header page-header-responsive ${className}`}
   ```

**Status**: ⬜ Not Started

---

### 2. `src/components/ui/input.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1 hour)

**Issues**:
- Uses Tailwind classes instead of design system
- Hardcoded colors not from theme

**Tasks**:
1. [ ] Replace Tailwind classes with design system
   ```typescript
   // BEFORE
   className={cn("h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base dark:bg-zinc-900 dark:border-zinc-700", className)}
   
   // AFTER
   style={{
     ...formStyles.input,
     fontSize: '16px', // Keep for iOS zoom prevention
     ...props.style
   }}
   ```
2. [ ] Import `formStyles` from theme
3. [ ] Test on mobile (iOS zoom prevention)
4. [ ] Test dark mode (if applicable)

**Status**: ⬜ Not Started

---

### 3. `src/components/ui/Modal.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` for layout decisions (line 45)
- Should use CSS for responsive behavior

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace mobile detection with CSS classes
3. [ ] Use CSS media queries for mobile/desktop layouts
4. [ ] Keep functional uses if any (document them)
5. [ ] Test modal on mobile and desktop

**Pattern**:
```typescript
// BEFORE
const isMobile = useMobileViewport();
backgroundColor: isMobile ? '#ffffff' : 'rgba(0, 0, 0, 0.4)'

// AFTER - Use CSS classes
<div className="modal-overlay">
  <div className="modal-content">
```

**Status**: ⬜ Not Started

---

### 4. `src/components/ui/button.tsx`
**Priority**: ⚪ **LOW**  
**Effort**: **M** (1 hour)

**Issues**:
- Inline style manipulation in event handlers
- Animation keyframes in component

**Tasks**:
1. [ ] Move hover styles to CSS classes
2. [ ] Move animation keyframes to CSS file
3. [ ] Use CSS transitions instead of JS manipulation

**Status**: ⬜ Not Started

---

### 5. `src/components/ui/QuickActionsPanel.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Mixed inline styles
- Not using design system tokens

**Tasks**:
1. [ ] Audit all inline styles
2. [ ] Replace with design system tokens
3. [ ] Use `responsiveSpacing` for padding/gaps
4. [ ] Use theme colors instead of hardcoded values

**Status**: ⬜ Not Started

---

## Layout Components

### 6. `src/components/layout/AppLayout.tsx`
**Priority**: 🔴 **CRITICAL**  
**Effort**: **XL** (4-6 hours)

**Issues**:
- 20+ instances of `isMobile` checks
- Complex component (1175 lines)
- Mixed responsive patterns

**Tasks**:
1. [ ] Audit all `isMobile` uses (20+ instances)
2. [ ] Categorize: styling vs functional
3. [ ] Replace styling uses with CSS
   - Sidebar visibility
   - Padding/margins
   - Layout direction
4. [ ] Keep functional uses (document why)
5. [ ] Test sidebar behavior on mobile/desktop
6. [ ] Test navigation on all breakpoints

**Key Areas**:
- Lines 97-114: Mobile state management
- Lines 151-183: Sidebar toggle logic
- Lines 402-461: Mobile-specific rendering
- Lines 1033-1034: Padding based on mobile
- Lines 1054-1169: Mobile breadcrumbs

**Status**: ⬜ Not Started

---

## Admin Pages

### 7. `src/pages/admin/UserDetails.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **S** (30 min)

**Issues**:
- Uses `isMobile` for font size (line 137)

**Tasks**:
1. [ ] Replace `isMobile ? '14px' : '12px'` with responsive typography
   ```typescript
   // BEFORE
   fontSize: isMobile ? '14px' : '12px'
   
   // AFTER
   ...typography.bodySmall // Uses clamp() automatically
   ```
2. [ ] Remove `useMobileViewport()` if only used for styling
3. [ ] Test font sizes on mobile/desktop

**Status**: ⬜ Not Started

---

### 8. `src/pages/admin/UserDetails.enhanced.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` for padding (lines 119, 140)
- Grid layout issues on mobile

**Tasks**:
1. [ ] Replace `isMobile` padding with `responsiveSpacing`
   ```typescript
   // BEFORE
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
2. [ ] Fix grid layout to use `ResponsiveGrid` components
3. [ ] Remove `useMobileViewport()` import if no longer needed
4. [ ] Test grid on mobile devices

**Status**: ⬜ Not Started

---

### 9. `src/pages/admin/CapabilityMatrix.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Issues**:
- May have mobile detection (verify)

**Tasks**:
1. [ ] Audit for `useMobileViewport()` or `isMobile` usage
2. [ ] Replace with CSS if found
3. [ ] Ensure responsive table layout
4. [ ] Test on mobile devices

**Status**: ⬜ Not Started

---

### 10. `src/pages/admin/BulkUserOperations.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Issues**:
- May need mobile detection removal (verify)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Test bulk operations on mobile

**Status**: ⬜ Not Started

---

### 11. `src/pages/admin/VehicleCostDashboard.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Ensure charts are responsive

**Status**: ⬜ Not Started

---

### 12. `src/pages/admin/RoleManagement.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Test role management on mobile

**Status**: ⬜ Not Started

---

## Stockyard Access Pages

### 13. `src/pages/stockyard/access/AccessPassDetails.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` for styling (line 45)
- Good component structure otherwise

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace `isMobile` padding with `responsiveSpacing`
   ```typescript
   // BEFORE (lines 190, 210)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Remove `isMobile` variable if only used for styling
4. [ ] Test pass details on mobile

**Status**: ⬜ Not Started

---

### 14. `src/pages/stockyard/access/AccessReports.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` for maxWidth (line 307)

**Tasks**:
1. [ ] Replace mobile detection with CSS
   ```typescript
   // BEFORE
   maxWidth: isMobile ? '100%' : '500px'
   
   // AFTER - Use CSS class or responsive utility
   className="responsive-max-width-500"
   ```
2. [ ] Use `PageContainer` if appropriate
3. [ ] Test reports on mobile

**Status**: ⬜ Not Started

---

### 15. `src/pages/stockyard/access/AccessDashboard.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Ensure dashboard widgets are responsive
4. [ ] Test on mobile devices

**Status**: ⬜ Not Started

---

### 16. `src/pages/stockyard/access/CreateAccessPass.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `window.innerWidth < 768` directly (line 168)
- Inconsistent pattern

**Tasks**:
1. [ ] Remove direct window check
2. [ ] Replace with CSS or `PageContainer`
   ```typescript
   // BEFORE
   const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
   maxWidth: isMobile ? '100%' : '800px'
   
   // AFTER
   <PageContainer maxWidth="800px">
   ```
3. [ ] Use `responsiveSpacing` for padding
4. [ ] Test form on mobile

**Status**: ⬜ Not Started

---

### 17. `src/pages/stockyard/access/BulkAccessOperations.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 57)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace with CSS
3. [ ] Test bulk operations on mobile

**Status**: ⬜ Not Started

---

### 18. `src/pages/stockyard/access/components/dashboard/GuardDashboardContent.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Hardcoded values
- Console.error statements (2 instances)
- Not using design system

**Tasks**:
1. [ ] Replace hardcoded values with design system tokens
2. [ ] Replace console.error with proper error handling
3. [ ] Use `responsiveSpacing` for all spacing
4. [ ] Use theme colors
5. [ ] Test dashboard on mobile

**Status**: ⬜ Not Started

---

### 19. `src/pages/stockyard/access/GuardRegister.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Test register on mobile

**Status**: ⬜ Not Started

---

## Expense Pages

### 20. `src/pages/expenses/ExpenseApproval.tsx`
**Priority**: 🔴 **CRITICAL**  
**Effort**: **XL** (4-6 hours)

**Issues**:
- 40+ inline style objects
- Not using design system tokens
- Good accessibility (aria-label, role="button") ✅

**Tasks**:
1. [ ] Audit all inline styles (40+ instances)
2. [ ] Create mapping of hardcoded values to design tokens
3. [ ] Replace padding/margins with `responsiveSpacing`
4. [ ] Replace colors with theme colors
5. [ ] Replace font sizes with typography tokens
6. [ ] Replace hardcoded values:
   - `'2rem'` → `responsiveSpacing.padding.xl`
   - `'1rem'` → `spacing.lg`
   - `fontSize: '2rem'` → `typography.headerLarge`
   - Color values → `colors.*`
7. [ ] Test approval flow on mobile/desktop
8. [ ] Verify accessibility still works

**Example Replacements**:
```typescript
// BEFORE
<div style={{ padding: '2rem', textAlign: 'center' }}>
  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
  <div style={{ color: '#6B7280' }}>Loading...</div>
</div>

// AFTER
<div style={{ 
  padding: responsiveSpacing.padding.xl, 
  textAlign: 'center' 
}}>
  <div style={{ 
    ...typography.headerLarge, 
    marginBottom: spacing.lg 
  }}>💰</div>
  <div style={{ color: colors.neutral[500] }}>Loading...</div>
</div>
```

**Status**: ⬜ Not Started

---

### 21. `src/pages/expenses/CreateExpense.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `window.innerWidth < 768` directly (line 866)
- Large component (2076 lines) - consider splitting

**Tasks**:
1. [ ] Remove direct window check
2. [ ] Replace with `PageContainer`
   ```typescript
   // BEFORE
   const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
   maxWidth: isMobile ? '100%' : '800px'
   
   // AFTER
   <PageContainer maxWidth="800px">
   ```
3. [ ] Use `responsiveSpacing` for padding
4. [ ] Consider splitting component (future task)
5. [ ] Test expense creation on mobile

**Status**: ⬜ Not Started

---

### 22. `src/pages/expenses/ExpenseReports.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Test reports on mobile

**Status**: ⬜ Not Started

---

### 23. `src/pages/expenses/ExpenseAnalytics.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 43)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 90)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Ensure charts are responsive
4. [ ] Test analytics on mobile

**Status**: ⬜ Not Started

---

### 24. `src/pages/expenses/EmployeeLedger.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 59)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 178)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Test ledger on mobile

**Status**: ⬜ Not Started

---

## Inspection Pages

### 25. `src/pages/inspections/InspectionDetails.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **L** (2-3 hours)

**Issues**:
- Multiple instances of `useMobileViewport()` (line 353)
- Multiple padding uses (lines 820, 831, 846, 865)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace all padding instances with `responsiveSpacing`
   ```typescript
   // BEFORE (lines 820, 831, 846, 865)
   padding: isMobile ? spacing.lg : spacing.xl
   padding: isMobile ? spacing.md : spacing.sm
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   padding: responsiveSpacing.padding.md
   ```
3. [ ] Test inspection details on mobile
4. [ ] Verify image viewing works on mobile

**Status**: ⬜ Not Started

---

### 26. `src/pages/inspections/InspectionCapture.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 31)
- Multiple padding uses (lines 326, 360)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (lines 326, 360)
   padding: isMobile ? spacing.md : spacing.sm
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.md
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Test capture flow on mobile

**Status**: ⬜ Not Started

---

### 27. `src/pages/inspections/InspectionSyncCenter.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 66)
- Padding uses (lines 305, 496)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 305)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Replace maxWidth with CSS
   ```typescript
   // BEFORE (line 496)
   maxWidth: isMobile ? '100%' : '600px'
   
   // AFTER - Use CSS class or PageContainer
   ```
4. [ ] Test sync center on mobile

**Status**: ⬜ Not Started

---

### 28. `src/pages/inspections/InspectionDashboard.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Tasks**:
1. [ ] Audit for mobile detection
2. [ ] Replace with CSS
3. [ ] Test dashboard on mobile

**Status**: ⬜ Not Started

---

## Other Pages

### 29. `src/pages/Dashboard.tsx`
**Priority**: 🔴 **CRITICAL**  
**Effort**: **XL** (4-6 hours)

**Issues**:
- Multiple `isMobile` checks for styling (line 190)
- Complex component (1367 lines) - consider splitting
- Good memoization of widget data ✅

**Tasks**:
1. [ ] Audit all `isMobile` uses
2. [ ] Replace styling uses with CSS
   ```typescript
   // BEFORE (lines 451, 589, 727)
   ...(isMobile ? {} : { maxHeight: '350px', overflowY: 'auto' })
   
   // AFTER - Use CSS classes
   className="scrollable-container"
   ```
3. [ ] Remove `useMobileViewport()` import if only used for styling
4. [ ] Consider splitting component (future task):
   - Extract `DashboardHeader`
   - Extract `DashboardStats`
   - Extract `DashboardWidgets`
   - Extract `DashboardModules`
5. [ ] Test dashboard on all breakpoints

**Status**: ⬜ Not Started

---

### 30. `src/pages/approvals/UnifiedApprovals.tsx`
**Priority**: 🟡 **HIGH**  
**Effort**: **L** (2-3 hours)

**Issues**:
- Mixed patterns: `useMobileViewport()` and `useIsMobile()` (lines 28-29)
- Multiple mobile checks (lines 216, 255, 264, 386, 388, 410, 412, 414, 420, 475, 476)

**Tasks**:
1. [ ] Remove both mobile detection hooks
2. [ ] Standardize on CSS
3. [ ] Replace all mobile checks:
   ```typescript
   // BEFORE
   padding: isMobileViewport ? spacing.lg : spacing.xl
   fullWidth={isMobile}
   flexDirection: isMobile ? 'column' : 'row'
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   className="responsive-full-width"
   className="responsive-flex-column"
   ```
4. [ ] Test approvals on mobile

**Status**: ⬜ Not Started

---

### 31. `src/pages/work/WorkPage.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 29)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 128)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Test work page on mobile

**Status**: ⬜ Not Started

---

### 32. `src/pages/stockyard/CreateStockyardRequest.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 28)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 102)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Test request creation on mobile

**Status**: ⬜ Not Started

---

### 33. `src/pages/stockyard/CreateComponentMovement.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (line 49)

**Tasks**:
1. [ ] Remove `useMobileViewport()` import
2. [ ] Replace padding with `responsiveSpacing`
   ```typescript
   // BEFORE (line 853)
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   padding: responsiveSpacing.padding.xl
   ```
3. [ ] Test movement creation on mobile

**Status**: ⬜ Not Started

---

### 34. `src/pages/NotFound.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **S** (30 min)

**Issues**:
- Some inline styles

**Tasks**:
1. [ ] Audit inline styles
2. [ ] Replace with design system tokens
3. [ ] Test 404 page on mobile

**Status**: ⬜ Not Started

---

### 35. `src/pages/approvals/components/ApprovalCard.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1 hour)

**Issues**:
- Uses `useMobileViewport()` for functional purposes (swipe gestures)
- Also uses for styling (lines 144, 152, 157, 160)

**Tasks**:
1. [ ] Keep functional use (swipe gestures) - document why
2. [ ] Replace styling uses with CSS
   ```typescript
   // BEFORE (lines 144, 152, 157, 160)
   flexDirection: isMobile ? 'column' : 'row'
   width: isMobile ? '100%' : 'auto'
   
   // AFTER - Use CSS classes
   className="responsive-flex-column responsive-full-width"
   ```
3. [ ] Test swipe gestures still work

**Status**: ⬜ Not Started

---

### 36. `src/components/inspection/DynamicFormRenderer.tsx`
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Issues**:
- Uses `useMobileViewport()` (lines 411, 464)
- Mixed styling and functional uses

**Tasks**:
1. [ ] Categorize uses: styling vs functional
2. [ ] Replace styling uses with CSS
3. [ ] Keep functional uses - document why
4. [ ] Test forms on mobile

**Status**: ⬜ Not Started

---

## Additional Tasks

### 37. Remove Console Statements
**Priority**: 🟡 **HIGH**  
**Effort**: **M** (1-2 hours)

**Files**:
- [ ] `src/lib/services/AccessService.ts` - 3 console.log
- [ ] `src/lib/activityLogs.ts` - 5 console.error/warn
- [ ] `src/components/RequireAuth.tsx` - 1 console.warn
- [ ] `src/pages/stockyard/access/components/dashboard/GuardDashboardContent.tsx` - 2 console.error

**Tasks**:
1. [ ] Create logging utility (if doesn't exist)
2. [ ] Replace all console.* with logger.*
3. [ ] Make development-only logging conditional
4. [ ] Test error handling still works

**Status**: ⬜ Not Started

---

### 38. Add Missing ARIA Labels
**Priority**: 🟡 **HIGH**  
**Effort**: **L** (2-4 hours)

**Tasks**:
1. [ ] Audit all icon-only buttons
2. [ ] Audit all clickable cards/lists
3. [ ] Audit all form fields without visible labels
4. [ ] Add `aria-label` or `aria-labelledby`
5. [ ] Test with screen reader

**Status**: ⬜ Not Started

---

### 39. Add Keyboard Navigation
**Priority**: 🟢 **MEDIUM**  
**Effort**: **L** (2-4 hours)

**Tasks**:
1. [ ] Audit all clickable divs
2. [ ] Add `role="button"` where needed
3. [ ] Add `tabIndex={0}` for keyboard access
4. [ ] Add `onKeyDown` handlers (Enter/Space)
5. [ ] Test keyboard navigation

**Status**: ⬜ Not Started

---

### 40. Remove Deprecated Grid Styles
**Priority**: 🟢 **MEDIUM**  
**Effort**: **M** (1-2 hours)

**Tasks**:
1. [ ] Search for `gridStyles.mobileFirst()`, `gridStyles.stats()`, etc.
2. [ ] Replace with `ResponsiveGrid` components
3. [ ] Remove deprecated exports from theme.ts (or move to separate file)
4. [ ] Test all grid layouts

**Status**: ⬜ Not Started

---

## Implementation Guidelines

### Step-by-Step Process

#### For Mobile Detection Removal:

1. **Identify Usage**
   ```typescript
   // Search for:
   - useMobileViewport()
   - useIsMobile()
   - window.innerWidth
   - isMobile checks
   ```

2. **Categorize**
   - **Styling**: Replace with CSS
   - **Functional**: Keep but document

3. **Replace Pattern**
   ```typescript
   // BEFORE
   import { useMobileViewport } from '@/lib/mobileUtils';
   const isMobile = useMobileViewport();
   padding: isMobile ? spacing.lg : spacing.xl
   
   // AFTER
   import { responsiveSpacing } from '@/lib/theme';
   padding: responsiveSpacing.padding.xl
   ```

4. **Test**
   - Test on mobile device (360px width)
   - Test on tablet (768px width)
   - Test on desktop (1280px+ width)
   - Verify no layout issues

#### For Design System Migration:

1. **Map Values**
   ```typescript
   // Common mappings:
   '2rem' → responsiveSpacing.padding.xl
   '1rem' → spacing.lg
   '16px' → typography.body.fontSize
   '#6B7280' → colors.neutral[500]
   ```

2. **Replace Systematically**
   - Start with spacing
   - Then colors
   - Then typography
   - Then shadows/borders

3. **Verify**
   - Visual regression test
   - Check mobile/desktop
   - Check dark mode (if applicable)

### Testing Checklist

For each page/component:
- [ ] Test on mobile (360px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px+)
- [ ] Test keyboard navigation
- [ ] Test with screen reader (if accessibility changes)
- [ ] Verify no console errors
- [ ] Verify performance (no unnecessary re-renders)

### Code Review Checklist

- [ ] No `useMobileViewport()` for styling
- [ ] All spacing uses design system tokens
- [ ] All colors use theme colors
- [ ] All typography uses typography tokens
- [ ] No hardcoded pixel values (except where necessary)
- [ ] No console statements
- [ ] Accessibility attributes present
- [ ] Keyboard navigation works

---

## Progress Tracking

### Summary

- **Total Pages/Components**: 40
- **Critical Priority**: 4
- **High Priority**: 12
- **Medium Priority**: 20
- **Low Priority**: 4

### Estimated Total Effort

- **Critical**: ~15-20 hours
- **High**: ~20-25 hours
- **Medium**: ~25-30 hours
- **Low**: ~5-8 hours
- **Total**: ~65-83 hours

### Recommended Sprint Plan

**Sprint 1 (Week 1)**: Critical Priority
- PageHeader fix (5 min)
- AppLayout (4-6 hours)
- Dashboard (4-6 hours)
- ExpenseApproval (4-6 hours)

**Sprint 2 (Week 2)**: High Priority Core Components
- Input component
- Modal component
- QuickActionsPanel
- Remove console statements

**Sprint 3 (Week 3)**: High Priority Pages
- AccessPassDetails
- AccessReports
- CreateAccessPass
- UnifiedApprovals
- InspectionDetails
- InspectionCapture

**Sprint 4 (Week 4)**: Medium Priority
- Remaining pages
- Accessibility improvements
- Grid style cleanup

---

## Notes

- **Functional Uses**: Some components legitimately need mobile detection for functional behavior (swipe gestures, conditional rendering). These should be kept but documented.

- **Testing**: After each change, test on actual mobile devices, not just browser dev tools.

- **Incremental**: Don't try to fix everything at once. Focus on one page/component at a time.

- **Documentation**: Update this document as you complete tasks.

---

**Last Updated**: January 2025  
**Next Review**: After Sprint 1 completion


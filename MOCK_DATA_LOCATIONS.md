# Mock/Demo Data Locations

This document lists all places in the codebase where mock/demo data is being shown because the Laravel backend is not configured or unavailable.

## Summary

**Total Locations:** 15 files with mock data fallbacks

---

## 1. Inspections Module

### 1.1 `src/pages/inspections/InspectionDashboard.tsx`
- **Location:** Lines 59-137
- **Trigger:** When API call to `/api/inspections/dashboard` fails
- **Mock Data:**
  - Dashboard stats (total_today, total_week, total_month, pending, completed, etc.)
  - Recent inspections list (4 sample inspections)
  - Inspector performance data
  - Vehicle type breakdown
  - Daily trends
- **UI Notice:** Shows warning banner: "Laravel backend not configured. Showing mock inspection data for demonstration." (Line 218)
- **State:** `usingMockData` flag set to `true`

### 1.2 `src/pages/inspections/InspectionDetails.tsx`
- **Location:** Lines 94-178
- **Trigger:** When API call to `/api/v1/inspections/{id}` fails
- **Mock Data:**
  - Complete inspection details object
  - Template data (mock-template-1)
  - Vehicle information
  - Inspector information
  - Sample answers
- **Console Warning:** "Backend not available, using mock data:"

### 1.3 `src/pages/inspections/InspectionCapture.tsx`
- **Location:** Lines 22-601 (FALLBACK_TEMPLATE constant)
- **Trigger:** When `templateId` is not provided or template fetch fails
- **Mock Data:**
  - Complete inspection template with 131+ questions
  - All sections and question types
  - Used as fallback template for offline/demo mode
- **UI Warning:** "Using offline demo template. Connect to fetch live templates." (Line 631, 651)
- **Template Source:** Set to `'mock'` when using fallback

---

## 2. Expenses Module

### 2.1 `src/pages/expenses/AssetManagementDashboard.tsx`
- **Location:** Lines 76-139
- **Trigger:** When API call to `/api/assets/management` fails
- **Mock Data:**
  - 3 sample assets (Vehicle ABC-1234, Laptop Dell XPS, Office Building)
  - Asset performance metrics
  - Expense breakdowns
  - ROI percentages
- **Console Error:** "Failed to fetch assets:"

### 2.2 `src/pages/expenses/ProjectManagementDashboard.tsx`
- **Location:** Lines 80-213
- **Trigger:** When API call to `/api/projects/management` fails
- **Mock Data:**
  - 3 sample projects (Project Alpha, Beta, Gamma)
  - Project budgets, expenses, revenue
  - Completion percentages
  - Expense category breakdowns
- **Console Error:** "Failed to fetch projects:"

### 2.3 `src/pages/expenses/CashflowAnalysisDashboard.tsx`
- **Location:** Lines 87-194
- **Trigger:** When API calls to `/api/expenses/cashflow-analysis` or `/api/expenses/investment-analysis` fail
- **Mock Data:**
  - Cashflow summary (revenue, expenses, profit)
  - Monthly trends (4 months)
  - Asset performance data
  - Project performance data
  - Investment analysis data
- **Console Error:** "Failed to fetch cashflow data:" or "Failed to fetch investment analysis:"

### 2.4 `src/pages/expenses/ExpenseHistory.tsx`
- **Location:** Lines 74-127
- **Trigger:** When API response shape is unexpected (not an array)
- **Mock Data:**
  - 4 sample expense records
  - Various categories (FUEL, FOOD, LOCAL_TRANSPORT, PARTS_REPAIR)
  - Different statuses (approved, pending)
- **Comment:** "Unexpected shape → fallback to mock"

### 2.5 `src/pages/expenses/ExpenseReports.tsx`
- **Location:** Lines 103-148
- **Trigger:** When API call to `/api/expenses/reports` fails
- **Mock Data:**
  - Report stats (total_expenses, pending, approved, rejected)
  - Category breakdown (5 categories)
  - Payment method breakdown
  - Daily trends (5 days)
  - Top spenders (3 employees)
  - Project expenses (3 projects)
  - Asset expenses (3 assets)
- **Console Error:** "Failed to fetch report data:"

### 2.6 `src/pages/expenses/ExpenseApproval.tsx`
- **Location:** Lines 61-102
- **Trigger:** When API calls to `/api/expense-approval/pending` or `/api/expense-approval/stats` fail
- **Mock Data:**
  - 2 sample pending expenses
  - Approval stats (total_expenses, pending, approved, rejected)
- **Console Error:** "Failed to fetch expenses:" or "Failed to fetch stats:"

---

## 3. Gate Pass Module

### 3.1 `src/pages/gatepass/VisitorManagement.tsx`
- **Location:** Lines 59-110
- **Trigger:** When API calls to `/api/visitor-management/visitors` or `/api/visitor-management/stats` fail
- **Mock Data:**
  - 3 sample visitors (John Smith, Sarah Johnson, Mike Wilson)
  - Visitor stats (total_visitors, active_visitors, frequent_visitors)
- **Console Error:** "Failed to fetch visitors:" or "Failed to fetch visitor stats:"

### 3.2 `src/pages/gatepass/GatePassReports.tsx`
- **Location:** Lines 91-122
- **Trigger:** When API calls to `/api/gate-pass-reports/stats`, `/api/gate-pass-reports/trends`, etc. fail
- **Mock Data:**
  - Report stats (total_passes, visitor_passes, vehicle_passes)
  - Trends data (5 days)
  - Popular times (6 hours)
  - Yard stats (3 yards)
- **Console Error:** "Failed to fetch report data:"

### 3.3 `src/pages/gatepass/GatePassCalendar.tsx`
- **Location:** Lines 61-102
- **Trigger:** When API call to `/api/gate-pass-calendar` fails
- **Mock Data:**
  - 3 sample calendar passes (visitor and vehicle passes)
  - Different dates and statuses
- **Console Error:** "Failed to fetch calendar data:"

### 3.4 `src/pages/gatepass/PassTemplates.tsx`
- **Location:** Lines 52-99
- **Trigger:** When API call to `/api/gate-pass-templates` fails
- **Mock Data:**
  - 3 sample templates (Vehicle Inspection, RTO Work, Service Visit)
  - Template usage counts
  - Template metadata
- **Console Error:** "Failed to fetch templates:"

### 3.5 `src/pages/gatepass/PassApproval.tsx`
- **Location:** Lines 73-137
- **Trigger:** When API calls to `/api/gate-pass-approval/pending` or `/api/gate-pass-approval/pass-details/{id}` fail
- **Mock Data:**
  - 2 sample approval requests
  - Pass details object
- **Console Error:** "Failed to fetch approval requests:" or "Failed to fetch pass details:"

### 3.6 `src/pages/gatepass/BulkOperations.tsx`
- **Location:** Lines 66-103
- **Trigger:** When API calls to `/api/gate-pass-bulk/operations` or `/api/gate-pass-bulk/templates` fail
- **Mock Data:**
  - 2 sample bulk operations
  - Bulk templates data
- **Console Error:** "Failed to fetch bulk operations:" or "Failed to fetch bulk templates:"

---

## 4. Backend (Laravel)

### 4.1 `vosm/app/Http/Controllers/InspectionDashboardController.php`
- **Location:** Lines 78-121
- **Trigger:** When database tables don't exist yet (catch block)
- **Mock Data:**
  - Dashboard stats
  - Recent inspections (2 samples)
  - Empty arrays for inspector_performance, vehicle_type_breakdown, daily_trends
- **Comment:** "Fallback to mock data if database tables don't exist yet"

---

## Common Patterns

### Error Handling Pattern
All mock data implementations follow a similar pattern:
```typescript
try {
  const response = await axios.get('/api/endpoint');
  setData(response.data);
} catch (error) {
  console.error('Failed to fetch data:', error);
  // Mock data for development
  setData([...mockData]);
}
```

### Console Warnings
Most implementations log warnings:
- `console.warn('Backend not available, using mock data:', apiError)`
- `console.error('Failed to fetch data:', error)`

### UI Indicators
- **InspectionDashboard:** Shows warning banner when using mock data
- **InspectionCapture:** Shows template source indicator ("offline demo" vs "network" vs "cache")

---

## Recommendations

1. **Backend API Endpoints:** Ensure all these endpoints are implemented in Laravel:
   - `/api/inspections/dashboard`
   - `/api/v1/inspections/{id}`
   - `/api/v1/inspection-templates/{id}`
   - `/api/assets/management`
   - `/api/projects/management`
   - `/api/expenses/cashflow-analysis`
   - `/api/expenses/investment-analysis`
   - `/api/expenses/reports`
   - `/api/expense-approval/pending`
   - `/api/expense-approval/stats`
   - `/api/visitor-management/visitors`
   - `/api/visitor-management/stats`
   - `/api/gate-pass-reports/*`
   - `/api/gate-pass-calendar`
   - `/api/gate-pass-templates`
   - `/api/gate-pass-approval/*`
   - `/api/gate-pass-bulk/*`

2. **Database Tables:** Ensure all required database tables exist:
   - `inspections`
   - `inspection_templates`
   - `assets`
   - `projects`
   - `expenses`
   - `gate_passes`
   - `visitors`
   - etc.

3. **Remove Mock Data:** Once backend is fully configured, consider:
   - Removing mock data fallbacks
   - Showing proper error messages instead
   - Implementing offline mode with service workers
   - Using cached data from previous successful fetches

---

## Files to Update After Backend Configuration

1. `src/pages/inspections/InspectionDashboard.tsx` - Remove mock data, keep error handling
2. `src/pages/inspections/InspectionDetails.tsx` - Remove mock data fallback
3. `src/pages/inspections/InspectionCapture.tsx` - Keep FALLBACK_TEMPLATE for offline mode, but ensure it's only used when truly offline
4. `src/pages/expenses/AssetManagementDashboard.tsx` - Remove mock data
5. `src/pages/expenses/ProjectManagementDashboard.tsx` - Remove mock data
6. `src/pages/expenses/CashflowAnalysisDashboard.tsx` - Remove mock data
7. `src/pages/expenses/ExpenseHistory.tsx` - Improve error handling instead of mock data
8. `src/pages/expenses/ExpenseReports.tsx` - Remove mock data
9. `src/pages/expenses/ExpenseApproval.tsx` - Remove mock data
10. `src/pages/gatepass/VisitorManagement.tsx` - Remove mock data
11. `src/pages/gatepass/GatePassReports.tsx` - Remove mock data
12. `src/pages/gatepass/GatePassCalendar.tsx` - Remove mock data
13. `src/pages/gatepass/PassTemplates.tsx` - Remove mock data
14. `src/pages/gatepass/PassApproval.tsx` - Remove mock data
15. `src/pages/gatepass/BulkOperations.tsx` - Remove mock data
16. `vosm/app/Http/Controllers/InspectionDashboardController.php` - Remove mock data fallback

---

**Last Updated:** 2024-01-20
**Status:** All mock data locations identified and documented


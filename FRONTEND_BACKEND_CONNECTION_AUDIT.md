# Frontend-Backend Connection Audit

## ✅ Connected Endpoints

### Gate Pass Module
- ✅ `/visitor-gate-passes` (GET, POST) - Connected
- ✅ `/vehicle-entry-passes` (GET, POST) - Connected
- ✅ `/vehicle-exit-passes` (GET, POST) - Connected
- ✅ `/gate-pass-records/sync` (POST) - Connected
- ✅ `/gate-pass-approval/*` - All routes connected

### Expense Module
- ✅ `/expense-approval/*` - All routes connected
- ✅ `/v1/projects` (GET) - Connected
- ✅ `/v1/assets` (GET) - Connected
- ✅ `/v1/expense-templates` (GET) - Connected

### Inspection Module
- ✅ `/v1/inspection-templates/*` - Connected
- ✅ `/v1/inspections/*` - Connected
- ✅ `/v1/vehicles/*` - Connected

### User Management
- ✅ `/v1/users/*` - All routes connected

## ❌ Missing Backend Endpoints

### Expense Management (Critical)
1. **`/v1/expenses`** (GET, POST)
   - Called by: `CreateExpense.tsx`, `ExpenseHistory.tsx`, `AccountsDashboard.tsx`
   - Status: **MISSING** - Need to create `ExpenseController`

2. **`/v1/expenses/{id}`** (GET, PATCH)
   - Called by: `AccountsDashboard.tsx` (category update)
   - Status: **MISSING**

3. **`/v1/expenses/{id}/audit`** (GET)
   - Called by: `AccountsDashboard.tsx` (audit trail)
   - Status: **MISSING**

4. **`/v1/expenses/{id}/reassign`** (PATCH)
   - Called by: `AccountsDashboard.tsx` (reassignment)
   - Status: **MISSING**

5. **`/v1/expenses/vehicle-kpis`** (GET)
   - Called by: `AccountsDashboard.tsx` (vehicle KPIs)
   - Status: **MISSING**

### Gate Pass Service (Medium Priority)
1. **`/gate-pass-records`** (GET)
   - Called by: `GatePassService.ts` (list method)
   - Status: **MISSING** - Only `/gate-pass-records/sync` exists

2. **`/gate-pass-records/stats`** (GET)
   - Called by: `GatePassService.ts` (getDashboardStats)
   - Status: **MISSING**

3. **`/visitor-gate-passes/{id}/entry`** (POST)
   - Called by: `GatePassService.ts` (markEntry)
   - Status: **NEED TO VERIFY** - Check if controller has this method

4. **`/visitor-gate-passes/{id}/exit`** (POST)
   - Called by: `GatePassService.ts`, `GatePassDashboard.tsx`
   - Status: **NEED TO VERIFY** - Check if controller has this method

5. **`/vehicle-exit-passes/{id}/entry`** (POST)
   - Called by: `GatePassService.ts` (markEntry)
   - Status: **NEED TO VERIFY**

6. **`/vehicle-exit-passes/{id}/exit`** (POST)
   - Called by: `GatePassService.ts` (markExit)
   - Status: **NEED TO VERIFY**

7. **`/vehicle-exit-passes/{id}`** (PUT)
   - Called by: `GatePassDashboard.tsx`
   - Status: **NEED TO VERIFY**

## 🔍 Verification Needed

### Route Path Mismatches
1. **Expense Approval**: Frontend calls `/api/expense-approval/*` but routes are defined as `/expense-approval/*`
   - Check: Axios baseURL configuration
   - Status: Likely OK if baseURL includes `/api`

2. **Gate Pass Service**: Uses `apiClient.get('/gate-pass-records')` but route is `/gate-pass-records/sync`
   - Issue: Service expects list endpoint but only sync exists
   - Fix: Either add list endpoint or update service

## 📋 Action Items

### High Priority (Blocks Features)
1. Create `ExpenseController` with:
   - `index()` - List expenses
   - `store()` - Create expense
   - `show($id)` - Get single expense
   - `update($id)` - Update expense (for category change)
   - `getAudit($id)` - Get audit trail
   - `reassign($id)` - Reassign expense
   - `getVehicleKPIs()` - Get vehicle KPIs

2. Add routes to `api.php`:
   ```php
   Route::prefix('v1')->group(function () {
       Route::apiResource('expenses', ExpenseController::class);
       Route::get('expenses/{id}/audit', [ExpenseController::class, 'getAudit']);
       Route::patch('expenses/{id}/reassign', [ExpenseController::class, 'reassign']);
       Route::get('expenses/vehicle-kpis', [ExpenseController::class, 'getVehicleKPIs']);
   });
   ```

### Medium Priority (Enhancements)
1. Add gate pass entry/exit endpoints to controllers
2. Add `/gate-pass-records` list endpoint
3. Add `/gate-pass-records/stats` endpoint

### Low Priority (Nice to Have)
1. Verify all route paths match frontend expectations
2. Add comprehensive API documentation


# Frontend Testing Guide - Phase 1 Implementation

## ✅ Servers Running

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Proxy**: Frontend proxies `/api/*` to backend

## 🧪 Testing Checklist

### 1. Login & Authentication ✅

1. **Open**: http://localhost:5173
2. **Login** with test credentials:
   - Employee ID: `ADMIN001`
   - Password: `password`
3. **Verify**: Should redirect to dashboard after login

### 2. Inspection Dashboard ✅

**URL**: http://localhost:5173/app/inspections

**What to Test**:
- [ ] Dashboard loads without errors
- [ ] Shows real stats (not mock data):
  - Total today
  - Total week
  - Total month
  - Pass rate
  - Average duration
  - Critical issues
- [ ] Shows recent inspections list
- [ ] Inspector names are displayed
- [ ] Vehicle details are shown

**Expected**: Real data from database, not mock data

**If you see mock data**: Check browser console for API errors

### 3. Gate Pass Approval ✅

**URL**: http://localhost:5173/app/gate-pass/approval

**What to Test**:
- [ ] Page loads without errors
- [ ] Shows pending approval requests (if any)
- [ ] Filter by status works (all/pending/approved/rejected)
- [ ] Click on an approval request:
  - [ ] Shows pass details
  - [ ] Shows approval history
- [ ] **Approve Button**:
  - [ ] Click "Approve"
  - [ ] Add notes (optional)
  - [ ] Submit
  - [ ] Request should be approved
  - [ ] Status should update
- [ ] **Reject Button**:
  - [ ] Click "Reject"
  - [ ] Enter rejection reason (required)
  - [ ] Submit
  - [ ] Request should be rejected
  - [ ] Status should update

**Expected**: Buttons actually work (not just UI)

### 4. Expense Approval ✅

**URL**: http://localhost:5173/app/expenses/approval

**What to Test**:
- [ ] Page loads without errors
- [ ] Shows statistics:
  - Total expenses
  - Pending count
  - Approved count
  - Rejected count
  - Amounts
- [ ] Shows expense list
- [ ] Filter by status works
- [ ] **Approve Button**:
  - [ ] Click "Approve" on an expense
  - [ ] Expense should be approved
  - [ ] Stats should update
- [ ] **Reject Button**:
  - [ ] Click "Reject" on an expense
  - [ ] Enter rejection reason
  - [ ] Expense should be rejected
  - [ ] Stats should update
- [ ] **Bulk Actions**:
  - [ ] Select multiple expenses
  - [ ] Click "Bulk Approve"
  - [ ] All selected should be approved
  - [ ] Click "Bulk Reject"
  - [ ] Enter reason
  - [ ] All selected should be rejected

**Expected**: All buttons work, stats update in real-time

### 5. Create Visitor Pass ✅

**URL**: http://localhost:5173/app/gate-pass/create-visitor

**What to Test**:
- [ ] Form loads correctly
- [ ] Fill in visitor details:
  - Visitor name
  - Phone number
  - Company (optional)
  - Purpose
  - Date/time
  - Notes (optional)
- [ ] Submit form
- [ ] **Verify Response**:
  - [ ] Success message appears
  - [ ] Pass is created
  - [ ] **QR Code is returned**:
    - [ ] `qr_payload` field exists in response
    - [ ] QR payload contains verification URL
    - [ ] QR token is generated
- [ ] Check browser console for response:
  ```json
  {
    "success": true,
    "pass": {
      "id": "...",
      "pass_number": "VP...",
      "qr_payload": "https://...",
      "access_code": "123456"
    }
  }
  ```

**Expected**: QR code with secure token, not 6-digit code

### 6. Create Vehicle Entry/Exit Pass ✅

**URL**: http://localhost:5173/app/gate-pass/create-vehicle

**What to Test**:
- [ ] Form loads correctly
- [ ] Select direction (inbound/outbound)
- [ ] Fill in vehicle details
- [ ] Submit form
- [ ] **Verify QR Code**:
  - [ ] QR payload is returned
  - [ ] Secure token is generated

## 🐛 Troubleshooting

### If Dashboard Shows Mock Data

1. **Check Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for API errors (404, 500, etc.)

2. **Check Network Tab**:
   - Open DevTools → Network tab
   - Look for `/api/v1/inspection-dashboard` request
   - Check response status and data

3. **Check Backend Logs**:
   ```bash
   cd /Users/narnolia/code/vosm
   tail -f storage/logs/laravel.log
   ```

### If Approval Buttons Don't Work

1. **Check Console for Errors**:
   - Look for JavaScript errors
   - Check for API errors

2. **Check Network Tab**:
   - See if API calls are being made
   - Check response status codes

3. **Verify Authentication**:
   - Make sure you're logged in
   - Check if session cookie exists

### If QR Code Not Generated

1. **Check Response**:
   - Open Network tab
   - Find the POST request to `/api/visitor-gate-passes`
   - Check response body for `qr_payload`

2. **Check Backend**:
   - Verify QRCodeService is working
   - Check Laravel logs for errors

### Common Issues

**CORS Errors**:
- Backend should allow `localhost:5173`
- Check `config/cors.php`

**CSRF Token Errors**:
- Frontend should handle CSRF automatically
- Check if CSRF token is being sent

**404 Errors**:
- Verify routes are registered: `php artisan route:list`
- Check route paths match frontend calls

**500 Errors**:
- Check Laravel logs: `storage/logs/laravel.log`
- Check database connection
- Verify migrations ran successfully

## 📊 Expected Results

### Inspection Dashboard
- ✅ Real stats from database
- ✅ Recent inspections with inspector names
- ✅ Pass rate calculated correctly
- ✅ Average duration shown

### Gate Pass Approval
- ✅ Pending requests listed
- ✅ Approve button actually approves
- ✅ Reject button actually rejects
- ✅ Status updates in real-time

### Expense Approval
- ✅ Statistics shown correctly
- ✅ Expenses listed
- ✅ Approve/reject buttons work
- ✅ Bulk actions work

### QR Codes
- ✅ Secure token generated (32 chars)
- ✅ Verification URL in payload
- ✅ Token expires after 30 days
- ✅ Not just 6-digit code

## ✅ Success Criteria

All of these should work:
1. ✅ Dashboard shows real data
2. ✅ Approval buttons actually work
3. ✅ QR codes have secure tokens
4. ✅ No console errors
5. ✅ No mock data fallbacks

## 🎯 Next Steps After Testing

1. **Remove Mock Data** from frontend files:
   - `src/pages/inspections/InspectionDashboard.tsx`
   - `src/pages/gatepass/PassApproval.tsx`
   - `src/pages/expenses/ExpenseApproval.tsx`

2. **Fix Any Issues** found during testing

3. **Deploy to cPanel** after all tests pass

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Inspection Dashboard:
- [ ] Loads correctly
- [ ] Shows real stats
- [ ] Shows recent inspections
- [ ] No errors

Gate Pass Approval:
- [ ] Loads correctly
- [ ] Shows pending requests
- [ ] Approve button works
- [ ] Reject button works
- [ ] No errors

Expense Approval:
- [ ] Loads correctly
- [ ] Shows stats
- [ ] Approve button works
- [ ] Reject button works
- [ ] Bulk actions work
- [ ] No errors

QR Code Generation:
- [ ] Visitor pass creates QR code
- [ ] QR payload contains URL
- [ ] Secure token generated
- [ ] No errors

Overall Status: [ ] Pass [ ] Fail
Notes: ________________________________
```


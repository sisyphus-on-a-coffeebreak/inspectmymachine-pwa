# Permission Debugging Guide

## Quick Check - Open Browser Console

1. **Login as yard_incharge user**
2. **Open Browser DevTools Console** (F12 → Console tab)
3. **Run these commands:**

```javascript
// 1. Check if you're logged in and what your role is
const authStore = JSON.parse(localStorage.getItem('auth') || '{}');
console.log('User:', authStore.user);
console.log('Role:', authStore.user?.role);

// 2. Check capabilities object
console.log('Capabilities:', authStore.user?.capabilities);

// 3. Import and test hasCapability directly (in React DevTools Console)
// Go to Components tab → find CreateGatePass component → check props
```

## Expected Results for yard_incharge:

```
User: { id: X, employee_id: "XXX", role: "yard_incharge", ... }
Role: "yard_incharge"
Capabilities: { gate_pass: [...], ... } or undefined (fallback to role-based)
```

## Common Issues:

### Issue 1: User object doesn't have role field
**Symptom:** `Role: undefined` or `Role: null`
**Fix:** Backend isn't sending role field. Check `/user` API endpoint response.

### Issue 2: User.capabilities has empty array for gate_pass
**Symptom:** `Capabilities: { gate_pass: [], ... }`
**Fix:** Backend is explicitly setting empty capabilities, blocking role-based fallback.

### Issue 3: Old cached user data
**Symptom:** Role shows as "clerk" or wrong role
**Fix:** Clear localStorage and re-login:
```javascript
localStorage.clear();
location.reload();
```

### Issue 4: User role is spelled differently
**Symptom:** `Role: "yard_incharge"` but button still doesn't show
**Check:** Ensure it's exactly "yard_incharge" not "yard-incharge" or "yardincharge"

## Deep Debugging:

If the above doesn't help, run this in console to trace the permission check:

```javascript
// Paste this entire block into console:
(function debugPermissions() {
  const authStr = localStorage.getItem('auth');
  if (!authStr) {
    console.error('❌ No auth data in localStorage');
    return;
  }

  const auth = JSON.parse(authStr);
  const user = auth.user;

  if (!user) {
    console.error('❌ No user in auth data');
    return;
  }

  console.log('=== PERMISSION DEBUG ===');
  console.log('✓ User ID:', user.id);
  console.log('✓ Employee ID:', user.employee_id);
  console.log('✓ Role:', user.role);
  console.log('✓ Capabilities object:', user.capabilities);

  // Check if capabilities.gate_pass exists
  if (user.capabilities) {
    console.log('✓ gate_pass capabilities:', user.capabilities.gate_pass);
    if (user.capabilities.gate_pass) {
      console.log('  - Has approve?', user.capabilities.gate_pass.includes('approve'));
    }
  } else {
    console.log('✓ No capabilities object (will use role-based fallback)');
  }

  // Expected for yard_incharge
  const expectedCapabilities = ['create', 'read', 'approve', 'validate'];
  console.log('\n=== EXPECTED FOR yard_incharge ===');
  console.log('Should have:', expectedCapabilities);

  if (user.role === 'yard_incharge') {
    console.log('✅ Role is correct: yard_incharge');

    // Check what hasCapability would return
    if (!user.capabilities || !user.capabilities.gate_pass) {
      console.log('✅ Will fallback to role-based check → SHOULD APPROVE');
    } else if (user.capabilities.gate_pass.includes('approve')) {
      console.log('✅ Has approve in capabilities → SHOULD APPROVE');
    } else {
      console.log('❌ Has gate_pass capabilities but missing approve → BLOCKED');
      console.log('   This is the bug! Capabilities object is blocking role fallback.');
    }
  } else {
    console.log('❌ Role mismatch! Expected yard_incharge, got:', user.role);
  }

  console.log('\n=== SOLUTION ===');
  if (user.role !== 'yard_incharge') {
    console.log('Contact admin to change your role to yard_incharge');
  } else if (user.capabilities?.gate_pass && !user.capabilities.gate_pass.includes('approve')) {
    console.log('User capabilities are explicitly set and missing approve.');
    console.log('Two solutions:');
    console.log('1. Backend: Add "approve" to user.capabilities.gate_pass array');
    console.log('2. Backend: Set user.capabilities to null/undefined for role-based fallback');
  } else {
    console.log('Permissions look correct. Check if page needs refresh or React state is stale.');
  }
})();
```

## Next Steps:

1. Run the debug script above
2. Copy the console output
3. Send it to me so I can see exactly what's wrong

## Force Refresh:

Sometimes React state gets stale. Try:
```javascript
// Clear all caches and reload
localStorage.clear();
sessionStorage.clear();
location.reload();
```

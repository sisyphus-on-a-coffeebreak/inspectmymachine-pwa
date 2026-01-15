# Permission Debugging Guide

## Quick Check - Open Browser Console

1. **Login as yard_incharge user**
2. **Open Browser DevTools Console** (F12 → Console tab)
3. **Run these commands:**

```javascript
// 1. Fetch the authenticated user (cookie-based auth; no localStorage auth)
const guessApiBase = () => {
  const preconnect = document.querySelector('link[rel="preconnect"]')?.getAttribute('href');
  if (preconnect) {
    return `${preconnect.replace(/\/$/, '')}/api`;
  }
  return `${location.origin}/api`;
};

const apiBase = guessApiBase();
fetch(`${apiBase}/user`, { credentials: 'include' })
  .then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then((payload) => {
    const user = payload.user || payload;
    console.log('User:', user);
    console.log('Role:', user?.role);
    console.log('Capabilities:', user?.capabilities);
  })
  .catch((err) => {
    console.error('❌ Failed to fetch /user. Check API base URL or session.', err);
  });

// 2. (Optional) Import and test hasCapability directly (in React DevTools Console)
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

### Issue 3: Stale session or cached UI state
**Symptom:** Role shows as "clerk" or wrong role after changes
**Fix:** Log out and log back in, then hard refresh:
```javascript
location.reload();
```

### Issue 4: User role is spelled differently
**Symptom:** `Role: "yard_incharge"` but button still doesn't show
**Check:** Ensure it's exactly "yard_incharge" not "yard-incharge" or "yardincharge"

## Deep Debugging:

If the above doesn't help, run this in console to trace the permission check:

```javascript
// Paste this entire block into console:
(async function debugPermissions() {
  const guessApiBase = () => {
    const preconnect = document.querySelector('link[rel="preconnect"]')?.getAttribute('href');
    if (preconnect) {
      return `${preconnect.replace(/\/$/, '')}/api`;
    }
    return `${location.origin}/api`;
  };

  const apiBase = guessApiBase();
  let user;
  try {
    const res = await fetch(`${apiBase}/user`, { credentials: 'include' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = await res.json();
    user = payload.user || payload;
  } catch (err) {
    console.error('❌ Unable to fetch /user. Verify session or API base URL.', err);
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
// Reload the app and re-check permissions
location.reload();
```

# Enhanced Permission System

## Overview

This module implements a comprehensive granular permission system with 5 levels of permission granularity:

1. **Field-level permissions** - Control access to specific fields within records
2. **Record-level permissions (scope)** - Control which records a user can access (own, yard, department, assigned, etc.)
3. **Conditional permissions** - Grant permissions based on record data conditions
4. **Time-based permissions** - Restrict access by time (date range, days of week, time of day)
5. **Contextual permissions** - Require MFA, IP whitelist, device type, location, approval, etc.

## Architecture

### Core Files

- **`types.ts`** - Complete type definitions for all permission structures
- **`evaluator.ts`** - Main permission checking engine
- **`scopeEvaluator.ts`** - Record-level scope evaluation
- **`conditionEvaluator.ts`** - Conditional rule evaluation
- **`fieldMasking.ts`** - Data masking utilities

### Integration

The enhanced permission system is integrated into `src/lib/users.ts`:

- `UserCapabilities` interface now includes `enhanced_capabilities?: EnhancedCapability[]`
- `hasCapability()` function uses the enhanced evaluator (backward compatible)
- Exports `checkPermission()` and `checkPermissions()` for granular checks

## Usage

### Basic Usage (Backward Compatible)

```typescript
import { hasCapability } from '@/lib/users';

// Works exactly as before
if (hasCapability(user, 'gate_pass', 'create')) {
  // User can create gate passes
}
```

### Enhanced Usage with Context

```typescript
import { checkPermission } from '@/lib/users';
import type { PermissionCheckContext } from '@/lib/permissions/types';

const context: PermissionCheckContext = {
  record: gatePassRecord,
  field: 'amount',
  timestamp: new Date(),
  ip_address: '192.168.1.1',
  device_type: 'desktop',
  mfa_verified: true
};

const result = checkPermission(user, 'expense', 'approve', context);

if (result.allowed) {
  // Permission granted
} else {
  console.log(result.reason); // Why it was denied
  console.log(result.failed_conditions); // Which conditions failed
}
```

### Enhanced Capability Example

```typescript
const enhancedCapability: EnhancedCapability = {
  module: 'expense',
  action: 'approve',
  
  // Record scope: only own expenses
  scope: {
    type: 'own_only'
  },
  
  // Conditional: only approve expenses < $10,000
  conditions: {
    conditions: [
      { field: 'amount', operator: '<', value: 10000 }
    ],
    combine_with: 'AND'
  },
  
  // Time-based: only during business hours
  time_restrictions: {
    days_of_week: [1, 2, 3, 4, 5], // Monday-Friday
    time_of_day: {
      start: '09:00',
      end: '17:00'
    }
  },
  
  // Contextual: require MFA for approvals
  context_restrictions: {
    require_mfa: true
  },
  
  // Metadata
  reason: 'Temporary approval access for expense management',
  expires_at: '2024-12-31T23:59:59Z'
};
```

### Data Masking

```typescript
import { applyDataMasking, getMaskedFields } from '@/lib/permissions/fieldMasking';

const maskingRules: DataMaskingRule[] = [
  {
    module: 'expense',
    field: 'amount',
    mask_type: 'partial',
    visible_with_capability: {
      module: 'expense',
      action: 'approve'
    }
  }
];

// Apply masking to data
const maskedData = applyDataMasking(expenseRecord, maskingRules, user);

// Get list of fields that should be masked
const maskedFields = getMaskedFields(maskingRules, user);
```

## Backward Compatibility

✅ **Fully backward compatible**

- Existing `hasCapability()` calls work without changes
- Basic capabilities (module + action) continue to work
- Enhanced capabilities are optional and additive
- Role-based fallback still works

## Next Steps

See the action plan for:
- Phase 2: Backend API endpoints
- Phase 3: UI components for managing permissions
- Phase 4: Testing & validation
- Phase 5: Security layer (MFA, etc.)
- Phase 6: Audit & compliance
- Phase 7: Documentation










# Capability Matrix Update Plan - Gate Pass as Stockyard Function

**Date:** 2025-01-23  
**Objective:** Consolidate Gate Pass into Stockyard as a function, with granular capabilities

---

## Current State

### Current Capability Structure:
```typescript
type CapabilityModule = 'gate_pass' | 'inspection' | 'expense' | 'user_management' | 'reports' | 'stockyard';
```

### Current Role Capabilities:
```typescript
guard: {
  gate_pass: ['read', 'validate'],
  stockyard: [], // No access
}

clerk: {
  gate_pass: ['create', 'read'],
  stockyard: [], // No access
}

yard_incharge: {
  gate_pass: ['create', 'read', 'approve', 'validate'],
  stockyard: [], // No access (but should have it)
}
```

---

## Target State

### Updated Capability Structure:
```typescript
type CapabilityModule = 'inspection' | 'expense' | 'user_management' | 'reports' | 'stockyard';
// Note: 'gate_pass' removed - it's now a function of 'stockyard'
```

### Granular Stockyard Capabilities:
```typescript
// Stockyard module has sub-functions:
type StockyardFunction = 
  | 'access_control'    // Gate pass functions
  | 'inventory'         // Component management
  | 'movements';        // Vehicle movements

// Actions remain the same:
type CapabilityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export';
```

### Updated Role Capabilities:
```typescript
guard: {
  stockyard: {
    access_control: ['read', 'validate'], // Only access control functions
    // No inventory or movements
  }
}

clerk: {
  stockyard: {
    access_control: ['create', 'read'], // Only pass creation
    // No validation, inventory, or movements
  }
}

yard_incharge: {
  stockyard: {
    access_control: ['create', 'read', 'approve', 'validate'],
    inventory: ['read'], // Should have inventory access
    movements: ['create', 'read', 'approve'],
  }
}

admin: {
  stockyard: {
    access_control: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
    inventory: ['create', 'read', 'update', 'delete', 'approve'],
    movements: ['create', 'read', 'update', 'delete', 'approve'],
  }
}
```

---

## Implementation Options

### Option 1: Function-Based Capabilities (RECOMMENDED)

**Structure:**
```typescript
interface UserCapabilities {
  stockyard?: {
    access_control?: CapabilityAction[];
    inventory?: CapabilityAction[];
    movements?: CapabilityAction[];
  };
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
}
```

**Pros:**
- ✅ Clear separation of functions
- ✅ Granular control per function
- ✅ Guards only see access_control
- ✅ Yard managers see all functions

**Cons:**
- ⚠️ More complex type structure
- ⚠️ Need to update all capability checks

---

### Option 2: Action Prefix (ALTERNATIVE)

**Structure:**
```typescript
interface UserCapabilities {
  stockyard?: CapabilityAction[];
  // But actions are prefixed:
  // 'access_create', 'access_validate', 'inventory_read', etc.
}
```

**Pros:**
- ✅ Simpler structure
- ✅ Backward compatible
- ✅ Easy to check: `hasCapability(user, 'stockyard', 'access_validate')`

**Cons:**
- ⚠️ Action names become longer
- ⚠️ Less type-safe

---

### Option 3: Separate Modules (NOT RECOMMENDED)

Keep `gate_pass` as separate module but make it clear it's part of yard management.

**Pros:**
- ✅ Minimal changes
- ✅ Backward compatible

**Cons:**
- ❌ Doesn't reflect logical grouping
- ❌ Still two separate modules
- ❌ Doesn't solve the architecture issue

---

## Recommended Implementation: Option 1 (Function-Based)

### Step 1: Update Type Definitions

**File: `src/lib/users.ts`**
```typescript
export type CapabilityModule = 'inspection' | 'expense' | 'user_management' | 'reports' | 'stockyard';
// Remove 'gate_pass'

export type StockyardFunction = 'access_control' | 'inventory' | 'movements';
export type CapabilityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export';

export interface StockyardCapabilities {
  access_control?: CapabilityAction[];
  inventory?: CapabilityAction[];
  movements?: CapabilityAction[];
}

export interface UserCapabilities {
  stockyard?: StockyardCapabilities;
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
}
```

---

### Step 2: Update Capability Check Function

**File: `src/lib/users.ts`**
```typescript
export function hasCapability(
  user: User | null,
  module: CapabilityModule,
  action: CapabilityAction,
  function?: StockyardFunction // Optional for stockyard
): boolean {
  if (!user || !user.capabilities) return false;
  
  const capabilities = user.capabilities;
  
  // Handle stockyard with function granularity
  if (module === 'stockyard' && function) {
    const stockyardCaps = capabilities.stockyard;
    if (!stockyardCaps) return false;
    
    const functionCaps = stockyardCaps[function];
    return functionCaps?.includes(action) ?? false;
  }
  
  // Handle other modules (backward compatible)
  const moduleCaps = capabilities[module];
  return moduleCaps?.includes(action) ?? false;
}
```

**Usage:**
```typescript
// Check if guard can validate gate passes
hasCapability(user, 'stockyard', 'validate', 'access_control')

// Check if yard manager can read inventory
hasCapability(user, 'stockyard', 'read', 'inventory')
```

---

### Step 3: Update Role Capabilities

**File: `src/lib/permissions/roleCapabilities.ts`**
```typescript
export function getRoleCapabilities(): Record<User['role'], UserCapabilities> {
  return {
    guard: {
      stockyard: {
        access_control: ['read', 'validate'],
      },
      inspection: ['read'],
      expense: ['read'],
    },
    clerk: {
      stockyard: {
        access_control: ['create', 'read'],
      },
      inspection: ['read'],
      expense: ['create', 'read'],
    },
    yard_incharge: {
      stockyard: {
        access_control: ['create', 'read', 'approve', 'validate'],
        inventory: ['read'],
        movements: ['create', 'read', 'approve'],
      },
      inspection: ['read', 'approve', 'review'],
      expense: ['read'],
      reports: ['read'],
    },
    admin: {
      stockyard: {
        access_control: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
        inventory: ['create', 'read', 'update', 'delete', 'approve'],
        movements: ['create', 'read', 'update', 'delete', 'approve'],
      },
      inspection: ['create', 'read', 'update', 'delete', 'approve', 'review'],
      expense: ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
      user_management: ['read', 'update'],
      reports: ['read', 'export'],
    },
    // ... other roles
  };
}
```

---

### Step 4: Update Navigation

**File: `src/lib/unifiedNavigation.ts`**
```typescript
// Remove gate_pass module
// Update stockyard navigation to show sub-sections

export const unifiedNavItems: UnifiedNavItem[] = [
  {
    id: "stockyard",
    label: "Yard Management",
    icon: Warehouse,
    path: "/app/stockyard",
    requiredCapability: { module: 'stockyard', action: 'read' },
    children: [
      {
        id: "stockyard-access",
        label: "Access Control",
        icon: Ticket,
        path: "/app/stockyard/access",
        requiredCapability: { 
          module: 'stockyard', 
          action: 'read',
          function: 'access_control' // New field
        },
        children: [
          { id: "access-dashboard", label: "Dashboard", path: "/app/stockyard/access" },
          { id: "access-create", label: "Create Pass", path: "/app/stockyard/access/create" },
          { id: "access-scan", label: "Scan", path: "/app/stockyard/access/scan" },
        ]
      },
      {
        id: "stockyard-inventory",
        label: "Inventory",
        icon: Package,
        path: "/app/stockyard/inventory",
        requiredCapability: { 
          module: 'stockyard', 
          action: 'read',
          function: 'inventory'
        },
      },
      {
        id: "stockyard-movements",
        label: "Movements",
        icon: ArrowRightLeft,
        path: "/app/stockyard/movements",
        requiredCapability: { 
          module: 'stockyard', 
          action: 'read',
          function: 'movements'
        },
      },
    ]
  },
  // ... other modules
];
```

---

### Step 5: Update Route Structure

**File: `src/App.tsx`**
```typescript
// Remove gate-pass routes
// Add stockyard/access routes

const StockyardAccessDashboard = lazy(() => import('./pages/stockyard/AccessDashboard'));
const CreateGatePass = lazy(() => import('./pages/stockyard/access/CreateGatePass'));
const GatePassScan = lazy(() => import('./pages/stockyard/access/GatePassScan'));
const GatePassDetails = lazy(() => import('./pages/stockyard/access/GatePassDetails'));

// Routes
<Route path="/app/stockyard" element={<LazyPage component={StockyardDashboard} />} />
<Route path="/app/stockyard/access" element={<LazyPage component={StockyardAccessDashboard} />} />
<Route path="/app/stockyard/access/create" element={<LazyPage component={CreateGatePass} />} />
<Route path="/app/stockyard/access/scan" element={<LazyPage component={GatePassScan} />} />
<Route path="/app/stockyard/access/:id" element={<LazyPage component={GatePassDetails} />} />

// Redirect old gate-pass routes
<Route path="/app/gate-pass/*" element={<Navigate to="/app/stockyard/access" replace />} />
```

---

### Step 6: Move Gate Pass Components

**File Structure:**
```
src/pages/stockyard/
├── StockyardDashboard.tsx
├── access/
│   ├── AccessDashboard.tsx (was GatePassDashboard)
│   ├── CreateGatePass.tsx (moved from gatepass/)
│   ├── GatePassScan.tsx (moved from gatepass/)
│   ├── GatePassDetails.tsx (moved from gatepass/)
│   └── components/ (moved from gatepass/components/)
├── inventory/
│   └── ...
└── movements/
    └── ...
```

---

## Migration Checklist

### Phase 1: Type System Updates
- [ ] Update `CapabilityModule` type (remove 'gate_pass')
- [ ] Add `StockyardFunction` type
- [ ] Update `UserCapabilities` interface
- [ ] Update `hasCapability` function
- [ ] Update all type imports

### Phase 2: Capability Definitions
- [ ] Update `roleCapabilities.ts` with new structure
- [ ] Map existing gate_pass capabilities to stockyard.access_control
- [ ] Update all role definitions
- [ ] Test capability checks

### Phase 3: Component Migration
- [ ] Move gate pass components to stockyard/access/
- [ ] Update imports
- [ ] Update route references
- [ ] Update navigation references

### Phase 4: Route Updates
- [ ] Add new stockyard/access routes
- [ ] Add redirects from old gate-pass routes
- [ ] Update all internal links
- [ ] Update breadcrumbs

### Phase 5: UI Updates
- [ ] Update navigation to show function-based sections
- [ ] Role-filtered views (guards see only access)
- [ ] Update capability checks in components
- [ ] Update permission checks

### Phase 6: Testing
- [ ] Test guard experience (only access functions)
- [ ] Test clerk experience (only create)
- [ ] Test yard manager experience (all functions)
- [ ] Test admin experience (full access)
- [ ] Test backward compatibility (redirects)

---

## Backward Compatibility

### URL Redirects:
```typescript
// Old URLs redirect to new structure
/app/gate-pass → /app/stockyard/access
/app/gate-pass/create → /app/stockyard/access/create
/app/gate-pass/scan → /app/stockyard/access/scan
/app/gate-pass/:id → /app/stockyard/access/:id
```

### API Compatibility:
- Backend can still use `gate_pass` module name
- Frontend maps to `stockyard.access_control`
- Or update backend to use new structure

---

## Guard Experience (Role-Based Filtering)

### What Guards See:
```
/stockyard/access
├── Scan QR Code
├── Expected Passes (today)
├── Inside Yard
└── Validation History
```

**Navigation:**
- Bottom nav: [Scan] [Expected] [Inside] [History]
- All routes: `/app/stockyard/access/*`
- No access to `/app/stockyard/inventory` or `/app/stockyard/movements`

**UI:**
- Simple, focused interface
- Only access control functions
- No "inventory" or "movements" visible
- Guard-optimized workflows

---

## Benefits

1. **Logical Grouping:**
   - Gate pass is access control function of yard management
   - All yard operations in one place

2. **Granular Control:**
   - Guards only see access functions
   - Yard managers see all functions
   - Clear capability boundaries

3. **Simplified Architecture:**
   - One module instead of two
   - Clearer information architecture
   - Better mental model

4. **Future-Proof:**
   - Easy to add new yard functions
   - Better integration between functions
   - Unified yard analytics

---

**Last Updated:** 2025-01-23  
**Status:** Implementation Plan Ready



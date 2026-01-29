/**
 * Unified Navigation Configuration
 * 
 * Single source of truth for navigation across desktop sidebar and mobile bottom nav.
 * Supports both role-based and capability-based access control.
 */

import {
  Home,
  ClipboardList,
  FileText,
  DollarSign,
  Warehouse,
  UserCog,
  Settings,
  AlertTriangle,
  CheckCircle,
  Shield,
  QrCode,
  Clock,
  Users,
  History,
  ClipboardCheck,
  Plus,
  BarChart3,
  Menu,
  Ticket,
  Wallet,
  Briefcase,
  Car,
  Package,
  ArrowRightLeft,
} from 'lucide-react';
import type { CapabilityModule, StockyardFunction } from './users';

/**
 * UserRole - Role type for navigation
 * 
 * ⚠️ MIGRATION: Changed from hard-coded union to `string` to support custom roles.
 * Role is now just a display name - use capabilities for permission checks.
 * 
 * @deprecated This type is kept for backward compatibility but should be replaced with `string`.
 * After migration, all role types should be `string` to support custom roles from API.
 */
export type UserRole = string; // Allow any string for custom roles

export interface UnifiedNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  // Access control - supports both role and capability checks
  roles?: UserRole[]; // For backward compatibility
  requiredCapability?: { 
    module: CapabilityModule; 
    action: string;
    function?: StockyardFunction; // For stockyard function-based checks
  };
  // Hierarchical structure for desktop sidebar
  children?: UnifiedNavItem[];
  // Mobile-specific configuration
  mobile?: {
    priority?: number; // For bottom nav ordering (lower = higher priority)
    showInFab?: boolean; // Show in FAB instead of bottom nav
    showInMore?: boolean; // Show in "More" drawer
    badge?: () => number | null; // Dynamic badge count
  };
}

/**
 * Unified navigation items - single source of truth
 * These items are used by both desktop sidebar and mobile bottom nav
 * 
 * ⚠️ MIGRATION STATUS:
 * - All items now have `requiredCapability` (preferred, capability-based)
 * - `roles` arrays are kept as fallback during migration (deprecated)
 * - Filter logic prioritizes `requiredCapability` over `roles`
 * - After migration complete, `roles` arrays will be removed
 * 
 * See: docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md for details
 */
export const unifiedNavItems: UnifiedNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/app/home",
    requiredCapability: { module: 'gate_pass', action: 'read' }, // Basic read access to see dashboard
    mobile: { priority: 1, showInFab: false },
  },
  {
    id: "work",
    label: "Work",
    icon: Briefcase,
    path: "/app/work",
    requiredCapability: { module: 'gate_pass', action: 'read' }, // Basic read access to see work items
    mobile: { priority: 2, showInFab: false },
  },
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
        requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' },
        children: [
          { 
            id: "access-dashboard", 
            label: "Dashboard", 
            icon: Ticket, 
            path: "/app/stockyard/access", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' } 
          },
          { 
            id: "create-visitor", 
            label: "Create Visitor Pass", 
            icon: Ticket, 
            path: "/app/stockyard/access/create?type=visitor", 
            requiredCapability: { module: 'stockyard', action: 'create', function: 'access_control' } 
          },
          { 
            id: "create-vehicle", 
            label: "Create Vehicle Pass", 
            icon: Ticket, 
            path: "/app/stockyard/access/create?type=outbound", 
            requiredCapability: { module: 'stockyard', action: 'create', function: 'access_control' } 
          },
          { 
            id: "guard-register", 
            label: "Guard Register", 
            icon: Ticket, 
            path: "/app/stockyard/access/register", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' } 
          },
          { 
            id: "validation", 
            label: "Validation", 
            icon: QrCode, 
            path: "/app/stockyard/access/scan", 
            requiredCapability: { module: 'gate_pass', action: 'validate' } 
          },
          { 
            id: "calendar", 
            label: "Calendar", 
            icon: Ticket, 
            path: "/app/stockyard/access/calendar", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'access_control' } 
          },
          { 
            id: "reports", 
            label: "Reports", 
            icon: Ticket, 
            path: "/app/stockyard/access/reports", 
            requiredCapability: { module: 'reports', action: 'read' } 
          },
          { 
            id: "approvals", 
            label: "Approvals", 
            icon: CheckCircle, 
            path: "/app/approvals?tab=stockyard_access", 
            requiredCapability: { module: 'stockyard', action: 'approve', function: 'access_control' } 
          }
        ],
        mobile: { priority: 2, showInFab: false },
      },
      {
        id: "stockyard-inventory",
        label: "Inventory",
        icon: Package,
        path: "/app/stockyard/components",
        requiredCapability: { module: 'stockyard', action: 'read', function: 'inventory' },
        children: [
          {
            id: "stockyard-dashboard", 
            label: "Dashboard", 
            icon: Warehouse, 
            path: "/app/stockyard", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'inventory' } 
          },
          { 
            id: "components", 
            label: "Component Ledger", 
            icon: Warehouse, 
            path: "/app/stockyard/components", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'inventory' } 
          },
          { 
            id: "create-component", 
            label: "Create Component", 
            icon: Warehouse, 
            path: "/app/stockyard/components/create", 
            requiredCapability: { module: 'stockyard', action: 'create', function: 'inventory' } 
          },
        ]
      },
      {
        id: "stockyard-movements",
        label: "Movements",
        icon: ArrowRightLeft,
        path: "/app/stockyard/create",
        requiredCapability: { module: 'stockyard', action: 'read', function: 'movements' },
        children: [
          { 
            id: "create-movement", 
            label: "Record Movement", 
            icon: Warehouse, 
            path: "/app/stockyard/create", 
            requiredCapability: { module: 'stockyard', action: 'create', function: 'movements' } 
          },
          { 
            id: "scan-vehicle", 
            label: "Scan Vehicle", 
            icon: Warehouse, 
            path: "/app/stockyard/scan", 
            requiredCapability: { module: 'stockyard', action: 'read', function: 'movements' } 
          },
        ]
      },
    ],
    mobile: { priority: 3, showInFab: false },
  },
  {
    id: "inspections",
    label: "Inspections",
    icon: FileText,
    path: "/app/inspections",
    requiredCapability: { module: 'inspection', action: 'read' },
    children: [
      { 
        id: "inspections-dashboard", 
        label: "Dashboard", 
        icon: FileText, 
        path: "/app/inspections", 
        requiredCapability: { module: 'inspection', action: 'read' } 
      },
      { 
        id: "new", 
        label: "New Inspection", 
        icon: FileText, 
        path: "/app/inspections/create", 
        requiredCapability: { module: 'inspection', action: 'create' },
        mobile: { priority: 2, showInFab: false },
      },
      { 
        id: "completed", 
        label: "Completed", 
        icon: FileText, 
        path: "/app/inspections/completed", 
        requiredCapability: { module: 'inspection', action: 'read' } 
      },
      { 
        id: "reports", 
        label: "Reports", 
        icon: FileText, 
        path: "/app/inspections/reports", 
        requiredCapability: { module: 'reports', action: 'read' } 
      }
    ],
    mobile: { priority: 3, showInFab: false, showInMore: true },
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: DollarSign,
    path: "/app/expenses",
    requiredCapability: { module: 'expense', action: 'read' },
    children: [
      { 
        id: "expenses-dashboard", 
        label: "Dashboard", 
        icon: DollarSign, 
        path: "/app/expenses", 
        requiredCapability: { module: 'expense', action: 'read' } 
      },
      { 
        id: "create", 
        label: "Create Expense", 
        icon: DollarSign, 
        path: "/app/expenses/create", 
        requiredCapability: { module: 'expense', action: 'create' } 
      },
      { 
        id: "history", 
        label: "History", 
        icon: DollarSign, 
        path: "/app/expenses/history", 
        requiredCapability: { module: 'expense', action: 'read' } 
      },
      { 
        id: "reports", 
        label: "Reports", 
        icon: DollarSign, 
        path: "/app/expenses/reports", 
        requiredCapability: { module: 'reports', action: 'read' } 
      },
      { 
        id: "analytics", 
        label: "Analytics", 
        icon: DollarSign, 
        path: "/app/expenses/analytics", 
        requiredCapability: { module: 'reports', action: 'read' } 
      }
    ],
    mobile: { priority: 3, showInFab: false },
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: AlertTriangle,
    path: "/app/alerts",
    requiredCapability: { module: 'reports', action: 'read' }, // Alerts are like reports
    mobile: { priority: 5, showInFab: false, showInMore: true },
  },
  {
    id: "users",
    label: "User Management",
    icon: UserCog,
    path: "/app/admin/users",
    requiredCapability: { module: 'user_management', action: 'read' },
    children: [
      { 
        id: "users-dashboard", 
        label: "Dashboard", 
        icon: UserCog, 
        path: "/app/admin/users", 
        requiredCapability: { module: 'user_management', action: 'read' } 
      },
      { 
        id: "roles", 
        label: "Role Management", 
        icon: Shield, 
        path: "/app/admin/roles", 
        requiredCapability: { module: 'user_management', action: 'read' } 
      },
      { 
        id: "user-activity", 
        label: "Activity Dashboard", 
        icon: UserCog, 
        path: "/app/admin/users/activity", 
        requiredCapability: { module: 'user_management', action: 'read' } 
      },
      { 
        id: "capability-matrix", 
        label: "Capability Matrix", 
        icon: UserCog, 
        path: "/app/admin/users/capability-matrix", 
        requiredCapability: { module: 'user_management', action: 'read' } 
      },
      { 
        id: "bulk-operations", 
        label: "Bulk Operations", 
        icon: UserCog, 
        path: "/app/admin/users/bulk-operations", 
        requiredCapability: { module: 'user_management', action: 'update' } 
      }
    ],
    mobile: { priority: 6, showInFab: false, showInMore: true },
  },
  {
    id: "vehicle-costs",
    label: "Vehicle Costs",
    icon: Car,
    path: "/app/admin/vehicles/costs",
    requiredCapability: { module: 'reports', action: 'read' }, // Vehicle costs are reports
    mobile: { priority: 7, showInFab: false, showInMore: true },
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/app/settings",
    requiredCapability: { module: 'gate_pass', action: 'read' }, // Basic read access for settings
    children: [
      { 
        id: "report-branding", 
        label: "Report Branding", 
        icon: Settings, 
        path: "/app/settings/report-branding", 
        requiredCapability: { module: 'reports', action: 'update' } 
      }
    ],
    mobile: { priority: 4, showInFab: false, showInMore: true },
  },
];

/**
 * FAB (Floating Action Button) actions configuration
 */
export interface FabAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export interface FabConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  actions: FabAction[];
}

/**
 * Get FAB configuration for a role
 */
/**
 * Get FAB configuration for a role
 * 
 * ⚠️ MIGRATION: This function now accepts any string as role (for custom roles).
 * The hard-coded role keys below are for system roles only.
 * Custom roles will return undefined (no FAB) unless explicitly added.
 */
export function getFabConfigForRole(role: UserRole): FabConfig | undefined {
  const configs: Partial<Record<UserRole, FabConfig | undefined>> = {
    guard: undefined, // No FAB for guards
    inspector: undefined, // No FAB for inspectors (already have "New" button)
    clerk: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
      ],
    },
    supervisor: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/create' },
      ],
    },
    yard_incharge: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
      ],
    },
    executive: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
      ],
    },
    admin: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/create' },
        { label: 'Stockyard', icon: Warehouse, route: '/app/stockyard/create' },
      ],
    },
    super_admin: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Access Pass', icon: Ticket, route: '/app/stockyard/access/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/create' },
        { label: 'Stockyard', icon: Warehouse, route: '/app/stockyard/create' },
      ],
    },
  };

  return configs[role];
}

/**
 * Role-specific mobile bottom nav configurations
 * These override the default unified items for mobile
 */
export interface MobileNavConfig {
  items: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string | null; // null = opens "More" sheet
    badge?: () => number | null;
  }>;
  fab?: FabConfig;
}

/**
 * Get mobile navigation configuration for a role
 * 
 * ⚠️ MIGRATION: This function now accepts any string as role (for custom roles).
 * The hard-coded role keys below are for system roles only.
 * Custom roles will need to be handled via capability-based checks or return a default config.
 */
export function getMobileNavConfigForRole(role: UserRole): MobileNavConfig {
  const configs: Partial<Record<UserRole, MobileNavConfig>> = {
    guard: {
      items: [
        { id: 'scan', label: 'Scan', icon: QrCode, route: '/app/stockyard/access/scan' },
        { id: 'expected', label: 'Expected', icon: Clock, route: '/app/stockyard/access?filter=expected' },
        { id: 'inside', label: 'Inside', icon: Users, route: '/app/stockyard/access?filter=inside' },
        { id: 'history', label: 'History', icon: History, route: '/app/stockyard/access?filter=today' },
      ],
    },
    inspector: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'new', label: 'New', icon: Plus, route: '/app/inspections/create' },
        { id: 'mine', label: 'Mine', icon: ClipboardCheck, route: '/app/inspections?filter=mine' },
        { id: 'profile', label: 'Profile', icon: Settings, route: '/app/settings' },
      ],
    },
    clerk: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'access', label: 'Access', icon: Ticket, route: '/app/stockyard/access' },
        { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('clerk'),
    },
    supervisor: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
        { id: 'reports', label: 'Reports', icon: BarChart3, route: '/app/expenses/reports' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('supervisor'),
    },
    yard_incharge: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
        { id: 'access', label: 'Access', icon: Ticket, route: '/app/stockyard/access' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('yard_incharge'),
    },
    executive: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'access', label: 'Access', icon: Ticket, route: '/app/stockyard/access' },
        { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('executive'),
    },
    admin: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/app/expenses/analytics' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('admin'),
    },
    super_admin: {
      items: [
        { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
        { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/app/expenses/analytics' },
        { id: 'more', label: 'More', icon: Menu, route: null },
      ],
      fab: getFabConfigForRole('super_admin'),
    },
  };

  // Fallback for custom/unknown roles: use clerk config so bottom nav always has .items
  const config = configs[role];
  if (config && Array.isArray(config.items)) {
    return config;
  }
  return configs['clerk'] ?? {
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/app/home' },
      { id: 'access', label: 'Access', icon: Ticket, route: '/app/stockyard/access' },
      { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses' },
      { id: 'more', label: 'More', icon: Menu, route: null },
    ],
  };
}

/**
 * Get "More" items for mobile navigation
 */
export function getMoreItemsForRole(role: UserRole): Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}> {
  const allItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string;
    roles: UserRole[];
  }> = [
    { id: 'access', label: 'Access Control', icon: Ticket, route: '/app/stockyard/access', roles: ['clerk', 'yard_incharge', 'executive', 'admin', 'super_admin'] },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, route: '/app/inspections', roles: ['clerk', 'admin', 'super_admin', 'supervisor', 'yard_incharge'] },
    { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses', roles: ['supervisor', 'executive', 'admin', 'super_admin'] },
    { id: 'stockyard', label: 'Stockyard', icon: Warehouse, route: '/app/stockyard', roles: ['admin', 'super_admin'] },
    { id: 'users', label: 'Users', icon: UserCog, route: '/app/admin/users', roles: ['admin', 'super_admin'] },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, route: '/app/alerts', roles: ['supervisor', 'yard_incharge', 'admin', 'super_admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/app/settings', roles: ['super_admin', 'admin', 'supervisor', 'yard_incharge', 'executive', 'inspector', 'guard', 'clerk'] },
  ];

  return allItems
    .filter(item => item.roles.includes(role))
    .map(({ roles, ...item }) => item);
}

/**
 * Filter navigation items based on user capabilities and roles
 */
export function filterNavItemsByAccess(
  items: UnifiedNavItem[],
  user: { role?: string } | null,
  hasCapability: (user: any, module: CapabilityModule, action: string) => boolean,
  hasStockyardCapability?: (user: any, functionType: StockyardFunction, action: string) => boolean
): UnifiedNavItem[] {
  if (!user) return [];

  return items
    .map(item => {
      // Check if user can access this item
      const canAccess = canUserAccessNavItem(item, user, hasCapability, hasStockyardCapability);
      if (!canAccess) return null;

      // Filter children recursively
      const filteredChildren = item.children
        ? filterNavItemsByAccess(item.children, user, hasCapability, hasStockyardCapability)
        : undefined;

      return {
        ...item,
        children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    })
    .filter((item): item is UnifiedNavItem => item !== null);
}

/**
 * Check if user can access a navigation item
 */
/**
 * Check if user can access a navigation item
 * 
 * ⚠️ MIGRATION: This function prioritizes capabilities over roles.
 * After migration, the roles fallback will be removed.
 * 
 * Priority order:
 * 1. Check requiredCapability (preferred, capability-based)
 * 2. Fall back to roles array (deprecated, migration period only)
 * 3. If no restrictions, allow access
 */
function canUserAccessNavItem(
  item: UnifiedNavItem,
  user: { role?: string } | null,
  hasCapability: (user: any, module: CapabilityModule, action: string) => boolean,
  hasStockyardCapability?: (user: any, functionType: StockyardFunction, action: string) => boolean
): boolean {
  if (!user) return false;

  // PRIORITY 1: Check capability first (preferred, works with custom roles)
  if (item.requiredCapability) {
    const { module, action, function: stockyardFunction } = item.requiredCapability;
    
    // Handle stockyard function-based capabilities
    if (module === 'stockyard' && stockyardFunction && hasStockyardCapability) {
      const hasCap = hasStockyardCapability(user, stockyardFunction, action);
      if (hasCap) return true;
    } else {
      // Standard capability check
      const hasCap = hasCapability(user, module, action);
      if (hasCap) return true;
    }
  }

  // PRIORITY 2: Check role-based access (backward compatibility - DEPRECATED)
  // ⚠️ This is a fallback during migration. After migration, this should be removed.
  if (item.roles && item.roles.length > 0) {
    // Show deprecation warning in development (only once per item to avoid spam)
    if (process.env.NODE_ENV === 'development' && !item._deprecationWarned) {
      console.warn(
        `Navigation item "${item.id}" uses deprecated "roles" array as fallback. ` +
        `Item has requiredCapability, so roles fallback should not be needed. ` +
        `See docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md`
      );
      // Mark as warned to avoid spam (this is a hack, but works for dev warnings)
      (item as any)._deprecationWarned = true;
    }
    if (item.roles.includes(user.role as UserRole)) {
      return true;
    }
  }

  // PRIORITY 3: If no access control specified, allow access
  if (!item.requiredCapability && (!item.roles || item.roles.length === 0)) {
    return true;
  }

  return false;
}


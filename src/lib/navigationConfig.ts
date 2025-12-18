/**
 * Role-Based Navigation Configuration
 * 
 * Defines navigation items and FAB actions for each role
 */

import {
  Home,
  QrCode,
  Clock,
  Users,
  History,
  ClipboardCheck,
  Plus,
  CheckCircle,
  BarChart3,
  Settings,
  Menu,
  Ticket,
  Wallet,
  Warehouse,
  UserCog,
  AlertTriangle,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string | null; // null means opens sheet
  badge?: () => number | null; // Dynamic badge count
}

export interface FabAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export interface NavConfig {
  items: NavItem[]; // Max 4 items for bottom nav
  fab?: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    actions: FabAction[];
  };
}

type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'inspector' | 'guard' | 'clerk';

export const navigationByRole: Record<UserRole, NavConfig> = {
  guard: {
    items: [
      { id: 'scan', label: 'Scan', icon: QrCode, route: '/app/gate-pass/scan' },
      { id: 'expected', label: 'Expected', icon: Clock, route: '/app/gate-pass?filter=expected' },
      { id: 'inside', label: 'Inside', icon: Users, route: '/app/gate-pass?filter=inside' },
      { id: 'history', label: 'History', icon: History, route: '/app/gate-pass?filter=today' },
    ],
    // No FAB for guards
  },

  inspector: {
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
      { id: 'new', label: 'New', icon: Plus, route: '/app/inspections/new' },
      { id: 'mine', label: 'Mine', icon: ClipboardCheck, route: '/app/inspections?filter=mine' },
      { id: 'profile', label: 'Profile', icon: Settings, route: '/app/settings' },
    ],
    // No FAB for inspectors (already have "New" button)
  },

  clerk: {
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
      { id: 'gate-pass', label: 'Passes', icon: Ticket, route: '/app/gate-pass' },
      { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses' },
      { id: 'more', label: 'More', icon: Menu, route: null }, // Opens sheet
    ],
    fab: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Gate Pass', icon: Ticket, route: '/app/gate-pass/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
      ],
    },
  },

  supervisor: {
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
      { id: 'reports', label: 'Reports', icon: BarChart3, route: '/app/expenses/reports' },
      { id: 'more', label: 'More', icon: Menu, route: null },
    ],
    fab: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Gate Pass', icon: Ticket, route: '/app/gate-pass/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/new' },
      ],
    },
  },

  admin: {
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/app/expenses/analytics' },
      { id: 'more', label: 'More', icon: Menu, route: null },
    ],
    fab: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Gate Pass', icon: Ticket, route: '/app/gate-pass/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/new' },
        { label: 'Stockyard', icon: Warehouse, route: '/app/stockyard/create' },
      ],
    },
  },

  super_admin: {
    // Same as admin
    items: [
      { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
      { id: 'approvals', label: 'Approvals', icon: CheckCircle, route: '/app/approvals' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, route: '/app/expenses/analytics' },
      { id: 'more', label: 'More', icon: Menu, route: null },
    ],
    fab: {
      icon: Plus,
      label: 'Create',
      actions: [
        { label: 'Gate Pass', icon: Ticket, route: '/app/gate-pass/create' },
        { label: 'Expense', icon: Wallet, route: '/app/expenses/create' },
        { label: 'Inspection', icon: ClipboardCheck, route: '/app/inspections/new' },
        { label: 'Stockyard', icon: Warehouse, route: '/app/stockyard/create' },
      ],
    },
  },
};

/**
 * Get more items for a role (items that appear in the "More" sheet)
 */
export function getMoreItemsForRole(role: UserRole): NavItem[] {
  const allItems: Array<NavItem & { roles: UserRole[] }> = [
    { id: 'gate-pass', label: 'Gate Passes', icon: Ticket, route: '/app/gate-pass', roles: ['clerk', 'admin', 'super_admin'] },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, route: '/app/inspections', roles: ['clerk', 'admin', 'super_admin', 'supervisor'] },
    { id: 'expenses', label: 'Expenses', icon: Wallet, route: '/app/expenses', roles: ['supervisor', 'admin', 'super_admin'] },
    { id: 'stockyard', label: 'Stockyard', icon: Warehouse, route: '/app/stockyard', roles: ['admin', 'super_admin'] },
    { id: 'users', label: 'Users', icon: UserCog, route: '/app/admin/users', roles: ['admin', 'super_admin'] },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, route: '/app/alerts', roles: ['supervisor', 'admin', 'super_admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, route: '/app/settings', roles: ['super_admin', 'admin', 'supervisor', 'inspector', 'guard', 'clerk'] },
  ];

  return allItems
    .filter(item => item.roles.includes(role))
    .map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roles, ...navItem } = item;
      return navItem;
    });
}






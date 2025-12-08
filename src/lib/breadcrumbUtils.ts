/**
 * Breadcrumb Utilities
 * 
 * Provides automatic breadcrumb generation from route paths
 * and manual breadcrumb mapping for specific routes
 */

import type { BreadcrumbItem } from '../components/ui/Breadcrumb';

// Route to breadcrumb label mapping
const routeLabels: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/app/gate-pass': 'Gate Pass',
  '/app/gate-pass/create-visitor': 'Create Visitor Pass',
  '/app/gate-pass/create-vehicle': 'Create Vehicle Movement',
  '/app/gate-pass/guard-register': 'Guard Register',
  '/app/gate-pass/reports': 'Gate Pass Reports',
  '/app/gate-pass/templates': 'Pass Templates',
  '/app/gate-pass/visitors': 'Visitor Management',
  '/app/gate-pass/calendar': 'Gate Pass Calendar',
  '/app/gate-pass/validation': 'Pass Validation',
  '/app/gate-pass/approval': 'Pass Approval',
  '/app/gate-pass/bulk': 'Bulk Operations',
  '/app/inspections': 'Inspections',
  '/app/inspections/studio': 'Inspection Studio',
  '/app/inspections/sync': 'Sync Center',
  '/app/inspections/completed': 'Completed Inspections',
  '/app/inspections/reports': 'Inspection Reports',
  '/app/inspections/new': 'New Inspection',
  '/app/expenses': 'Expenses',
  '/app/expenses/create': 'Create Expense',
  '/app/expenses/history': 'Expense History',
  '/app/expenses/assets': 'Asset Management',
  '/app/expenses/projects': 'Project Management',
  '/app/expenses/cashflow': 'Cashflow Analysis',
  '/app/expenses/approval': 'Expense Approval',
  '/app/expenses/reports': 'Expense Reports',
  '/app/expenses/accounts': 'Accounts Dashboard',
  '/app/expenses/receipts': 'Receipts Gallery',
  '/app/stockyard': 'Stockyard',
  '/app/stockyard/create': 'Create Movement',
  '/app/stockyard/scan': 'Scan Component',
  '/app/stockyard/components': 'Component Ledger',
  '/app/stockyard/components/create': 'Create Component',
  '/app/stockyard/components/transfers/approvals': 'Transfer Approvals',
  '/app/stockyard/components/cost-analysis': 'Cost Analysis',
  '/app/stockyard/components/health': 'Component Health',
  '/app/stockyard/buyer-readiness': 'Buyer Readiness',
  '/app/stockyard/alerts': 'Stockyard Alerts',
  '/app/admin/users': 'User Management',
  '/app/admin/users/activity': 'User Activity',
  '/app/admin/users/capability-matrix': 'Capability Matrix',
  '/app/admin/users/bulk-operations': 'Bulk User Operations',
  '/app/alerts': 'Alerts',
  '/app/notifications': 'Notifications',
};

// Route patterns for dynamic routes (with :id, :type, etc.)
const routePatterns: Array<{ pattern: RegExp; label: string; parent?: string }> = [
  { pattern: /^\/app\/gate-pass\/([^/]+)$/, label: 'Gate Pass Details', parent: '/app/gate-pass' },
  { pattern: /^\/app\/inspections\/([^/]+)$/, label: 'Inspection Details', parent: '/app/inspections' },
  { pattern: /^\/app\/inspections\/([^/]+)\/capture$/, label: 'Capture Inspection', parent: '/app/inspections' },
  { pattern: /^\/app\/inspections\/([^/]+)\/([^/]+)\/capture$/, label: 'Capture Inspection', parent: '/app/inspections' },
  { pattern: /^\/app\/expenses\/([^/]+)$/, label: 'Expense Details', parent: '/app/expenses' },
  { pattern: /^\/app\/stockyard\/([^/]+)$/, label: 'Request Details', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/yards\/([^/]+)\/map$/, label: 'Yard Map', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/requests\/([^/]+)\/checklist$/, label: 'Checklist', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/requests\/([^/]+)\/documents$/, label: 'Compliance Documents', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/requests\/([^/]+)\/transporter-bids$/, label: 'Transporter Bids', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/vehicles\/([^/]+)\/timeline$/, label: 'Vehicle Timeline', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/vehicles\/([^/]+)\/profitability$/, label: 'Profitability', parent: '/app/stockyard' },
  { pattern: /^\/app\/stockyard\/components\/([^/]+)\/([^/]+)$/, label: 'Component Details', parent: '/app/stockyard/components' },
  { pattern: /^\/app\/stockyard\/components\/([^/]+)\/([^/]+)\/edit$/, label: 'Edit Component', parent: '/app/stockyard/components' },
  { pattern: /^\/app\/admin\/users\/([^/]+)$/, label: 'User Details', parent: '/app/admin/users' },
];

/**
 * Generate breadcrumbs from a route path
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Always start with Dashboard
  items.push({ label: 'Dashboard', path: '/dashboard' });
  
  // Check for exact match first
  if (routeLabels[pathname]) {
    if (pathname !== '/dashboard') {
      items.push({ label: routeLabels[pathname], path: pathname });
    }
    return items;
  }
  
  // Check route patterns for dynamic routes
  for (const { pattern, label, parent } of routePatterns) {
    if (pattern.test(pathname)) {
      if (parent && routeLabels[parent]) {
        items.push({ label: routeLabels[parent], path: parent });
      }
      items.push({ label, path: pathname });
      return items;
    }
  }
  
  // Fallback: generate from path segments
  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;
    const label = routeLabels[currentPath] || formatSegment(segments[i]);
    
    // Don't add dashboard twice
    if (currentPath === '/dashboard') continue;
    
    // Last segment is current page (not clickable)
    const isLast = i === segments.length - 1;
    items.push({
      label,
      path: isLast ? undefined : currentPath,
    });
  }
  
  return items;
}

/**
 * Format a URL segment into a readable label
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get breadcrumb label for a specific route
 */
export function getBreadcrumbLabel(path: string): string {
  return routeLabels[path] || formatSegment(path.split('/').pop() || '');
}

/**
 * Check if a route should show breadcrumbs
 */
export function shouldShowBreadcrumbs(pathname: string): boolean {
  // Don't show breadcrumbs on these pages
  const hideBreadcrumbs = [
    '/',
    '/login',
    '/offline',
    '/dashboard', // Dashboard is the root, no need for breadcrumbs
  ];
  
  return !hideBreadcrumbs.includes(pathname);
}




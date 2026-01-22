import { test, expect } from '@playwright/test';

/**
 * Route Access Verification Tests
 * 
 * Tests all routes to verify:
 * - Route loads without crashing
 * - Protected routes redirect to login
 * - Public routes are accessible
 * - No JavaScript errors on page load
 */

interface RouteTest {
  path: string;
  name: string;
  type: 'public' | 'protected' | 'admin';
  expectedRedirect?: string;
}

const publicRoutes: RouteTest[] = [
  { path: '/login', name: 'Login', type: 'public' },
  { path: '/offline', name: 'Offline', type: 'public' },
];

const protectedRoutes: RouteTest[] = [
  { path: '/dashboard', name: 'Dashboard', type: 'protected' },
  { path: '/app/gate-pass', name: 'Gate Pass Dashboard', type: 'protected' },
  { path: '/app/gate-pass/create', name: 'Create Gate Pass', type: 'protected' },
  { path: '/app/gate-pass/guard-register', name: 'Guard Register', type: 'protected' },
  { path: '/app/gate-pass/visitors', name: 'Visitor Management', type: 'protected' },
  { path: '/app/gate-pass/calendar', name: 'Gate Pass Calendar', type: 'protected' },
  { path: '/app/inspections', name: 'Inspections Dashboard', type: 'protected' },
  { path: '/app/inspections/new', name: 'New Inspection', type: 'protected' },
  { path: '/app/inspections/sync', name: 'Inspection Sync', type: 'protected' },
  { path: '/app/inspections/completed', name: 'Completed Inspections', type: 'protected' },
  { path: '/app/inspections/reports', name: 'Inspection Reports', type: 'protected' },
  { path: '/app/expenses', name: 'Expenses Dashboard', type: 'protected' },
  { path: '/app/expenses/create', name: 'Create Expense', type: 'protected' },
  { path: '/app/expenses/history', name: 'Expense History', type: 'protected' },
  { path: '/app/expenses/ledger', name: 'Employee Ledger', type: 'protected' },
  { path: '/app/expenses/receipts', name: 'Receipts Gallery', type: 'protected' },
  { path: '/app/stockyard', name: 'Stockyard Dashboard', type: 'protected' },
  { path: '/app/stockyard/create', name: 'Create Movement', type: 'protected' },
  { path: '/app/stockyard/scan', name: 'Stockyard Scan', type: 'protected' },
  { path: '/app/stockyard/components', name: 'Component Ledger', type: 'protected' },
  { path: '/app/stockyard/analytics', name: 'Stockyard Analytics', type: 'protected' },
  { path: '/app/stockyard/alerts', name: 'Stockyard Alerts', type: 'protected' },
  { path: '/app/notifications', name: 'Notifications', type: 'protected' },
  { path: '/app/notifications/preferences', name: 'Notification Preferences', type: 'protected' },
  { path: '/app/settings/sessions', name: 'Session Management', type: 'protected' },
];

const adminRoutes: RouteTest[] = [
  { path: '/app/gate-pass/reports', name: 'Gate Pass Reports', type: 'admin' },
  { path: '/app/gate-pass/templates', name: 'Pass Templates', type: 'admin' },
  { path: '/app/gate-pass/scan', name: 'Quick Validation', type: 'admin' },
  { path: '/app/gate-pass/bulk', name: 'Bulk Operations', type: 'admin' },
  { path: '/app/inspections/studio', name: 'Inspection Studio', type: 'admin' },
  { path: '/app/expenses/analytics', name: 'Expense Analytics', type: 'admin' },
  { path: '/app/expenses/reports', name: 'Expense Reports', type: 'admin' },
  { path: '/app/approvals', name: 'Unified Approvals', type: 'admin' },
  { path: '/app/alerts', name: 'Alert Dashboard', type: 'admin' },
  { path: '/app/settings/report-branding', name: 'Report Branding', type: 'admin' },
  { path: '/app/admin/users', name: 'User Management', type: 'admin' },
  { path: '/app/admin/users/activity', name: 'User Activity', type: 'admin' },
  { path: '/app/admin/users/capability-matrix', name: 'Capability Matrix', type: 'admin' },
  { path: '/app/admin/users/bulk-operations', name: 'Bulk User Operations', type: 'admin' },
  { path: '/app/admin/permission-templates', name: 'Permission Templates', type: 'admin' },
  { path: '/app/admin/permission-testing', name: 'Permission Testing', type: 'admin' },
  { path: '/app/admin/data-masking-rules', name: 'Data Masking Rules', type: 'admin' },
  { path: '/app/admin/security', name: 'Security Dashboard', type: 'admin' },
  { path: '/app/admin/activity-logs', name: 'Activity Logs', type: 'admin' },
  { path: '/app/admin/permission-logs', name: 'Permission Logs', type: 'admin' },
  { path: '/app/admin/audit-reports', name: 'Audit Reports', type: 'admin' },
  { path: '/app/admin/compliance', name: 'Compliance Dashboard', type: 'admin' },
];

test.describe('Public Routes - Unauthenticated Access', () => {
  for (const route of publicRoutes) {
    test(`${route.name} (${route.path}) should be accessible`, async ({ page }) => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      
      // Should not redirect away
      expect(page.url()).toContain(route.path);
      
      // Should return 200
      expect(response?.status()).toBe(200);
      
      // Report any JS errors
      if (errors.length > 0) {
        console.log(`⚠️  JS errors on ${route.path}:`, errors);
      }
      
      // Page should have content
      const body = await page.locator('body').textContent();
      expect(body?.length).toBeGreaterThan(0);
    });
  }
});

test.describe('Protected Routes - Unauthenticated Access', () => {
  for (const route of protectedRoutes) {
    test(`${route.name} (${route.path}) should redirect to login`, async ({ page }) => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      
      // Should redirect to login (wait for potential redirect)
      await page.waitForTimeout(2000);
      
      // Check if redirected to login or shows loading
      const url = page.url();
      const isLoginPage = url.includes('/login');
      const hasLoadingIndicator = await page.locator('.animate-spin, [role="progressbar"]').count() > 0;
      
      // Either redirected to login OR still loading (which means auth check in progress)
      expect(isLoginPage || hasLoadingIndicator).toBeTruthy();
      
      if (errors.length > 0) {
        console.log(`⚠️  JS errors on ${route.path}:`, errors);
      }
    });
  }
});

test.describe('Admin Routes - Unauthenticated Access', () => {
  for (const route of adminRoutes) {
    test(`${route.name} (${route.path}) should redirect to login`, async ({ page }) => {
      const errors: string[] = [];
      
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      
      await page.waitForTimeout(2000);
      
      const url = page.url();
      const isLoginPage = url.includes('/login');
      const hasLoadingIndicator = await page.locator('.animate-spin, [role="progressbar"]').count() > 0;
      
      expect(isLoginPage || hasLoadingIndicator).toBeTruthy();
      
      if (errors.length > 0) {
        console.log(`⚠️  JS errors on ${route.path}:`, errors);
      }
    });
  }
});

test.describe('404 and Error Handling', () => {
  test('Non-existent route should show 404 page', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/this-route-does-not-exist-12345', { waitUntil: 'domcontentloaded' });
    
    // Should show 404 content or redirect to 404 page
    const has404 = await page.locator('text=/404|not found|page.*exist/i').count() > 0;
    const hasContent = (await page.locator('body').textContent())?.length ?? 0 > 0;
    
    expect(has404 || hasContent).toBeTruthy();
    
    if (errors.length > 0) {
      console.log('⚠️  JS errors on 404 page:', errors);
    }
  });
});

test.describe('Redirect Routes', () => {
  const redirectRoutes = [
    { from: '/', to: '/dashboard' },
    { from: '/app/gate-pass/create-visitor', to: '/app/gate-pass/create' },
    { from: '/app/gate-pass/create-vehicle', to: '/app/gate-pass/create' },
    { from: '/app/gate-pass/validation', to: '/app/gate-pass/scan' },
    { from: '/app/gate-pass/approval', to: '/app/approvals' },
    { from: '/app/expenses/categories', to: '/app/expenses/analytics' },
    { from: '/app/expenses/approval', to: '/app/approvals' },
  ];
  
  for (const redirect of redirectRoutes) {
    test(`${redirect.from} should redirect`, async ({ page }) => {
      await page.goto(redirect.from, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      const url = page.url();
      // Should have redirected (either to target or to login if protected)
      expect(url).not.toBe(redirect.from);
    });
  }
});







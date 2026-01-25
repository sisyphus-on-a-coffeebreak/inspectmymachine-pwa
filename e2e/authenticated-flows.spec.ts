import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Authenticated Flow Tests
 * 
 * Tests critical user flows with authenticated sessions.
 * These tests require the auth setup to have completed successfully.
 */

// Auth state file paths
const userAuthFile = path.join(__dirname, '../.playwright/.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.playwright/.auth/admin.json');
const supervisorAuthFile = path.join(__dirname, '../.playwright/.auth/supervisor.json');

// Helper to check if auth file exists
async function authFileExists(filePath: string): Promise<boolean> {
  try {
    const fs = await import('fs');
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

test.describe('Authenticated User Flows', () => {
  test.use({ storageState: userAuthFile });

  test.beforeEach(async ({ page }) => {
    // Skip if auth file doesn't exist
    if (!(await authFileExists(userAuthFile))) {
      test.skip();
    }
  });

  test('Dashboard loads with user data', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should show dashboard content (not redirect to login)
    expect(page.url()).toContain('/dashboard');
    
    // Should have some dashboard content
    const hasContent = await page.locator('main, [role="main"], .dashboard').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('Gate Pass dashboard accessible', async ({ page }) => {
    await page.goto('/app/gate-pass');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/gate-pass');
    
    // Should show gate pass content
    const pageTitle = await page.locator('h1, h2, [class*="title"]').first().textContent();
    expect(pageTitle?.toLowerCase()).toContain('gate');
  });

  test('Create Gate Pass form loads', async ({ page }) => {
    await page.goto('/app/gate-pass/create');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/create');
    
    // Should have form elements
    const hasForm = await page.locator('form, [role="form"]').count() > 0;
    expect(hasForm).toBeTruthy();
  });

  test('Inspections dashboard accessible', async ({ page }) => {
    await page.goto('/app/inspections');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/inspections');
  });

  test('Expenses dashboard accessible', async ({ page }) => {
    await page.goto('/app/expenses');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/expenses');
  });

  test('User can navigate between modules', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to gate pass
    await page.goto('/app/gate-pass');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/gate-pass');
    
    // Navigate to inspections
    await page.goto('/app/inspections');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/inspections');
    
    // Navigate to expenses
    await page.goto('/app/expenses');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/expenses');
  });

  test('Notifications page accessible', async ({ page }) => {
    await page.goto('/app/notifications');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/notifications');
  });
});

test.describe('Admin-Only Flows', () => {
  test.use({ storageState: adminAuthFile });

  test.beforeEach(async ({ page }) => {
    if (!(await authFileExists(adminAuthFile))) {
      test.skip();
    }
  });

  test('Admin can access User Management', async ({ page }) => {
    await page.goto('/app/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Should not redirect away (admin has access)
    expect(page.url()).toContain('/admin/users');
    
    // Should show user list or management UI
    const hasContent = await page.locator('table, [role="grid"], .user-list, [class*="user"]').count() > 0;
    // Allow for loading state
    const hasLoading = await page.locator('.animate-spin, [role="progressbar"]').count() > 0;
    expect(hasContent || hasLoading).toBeTruthy();
  });

  test('Admin can access Permission Templates', async ({ page }) => {
    await page.goto('/app/admin/permission-templates');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/permission-templates');
  });

  test('Admin can access Security Dashboard', async ({ page }) => {
    await page.goto('/app/admin/security');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/security');
  });

  test('Admin can access Gate Pass Reports', async ({ page }) => {
    await page.goto('/app/gate-pass/reports');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/reports');
  });

  test('Admin can access Expense Analytics', async ({ page }) => {
    await page.goto('/app/expenses/analytics');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/analytics');
  });

  test('Admin can access Unified Approvals', async ({ page }) => {
    await page.goto('/app/approvals');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/approvals');
  });

  test('Admin can access Activity Logs', async ({ page }) => {
    await page.goto('/app/admin/activity-logs');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/activity-logs');
  });

  test('Admin can access Inspection Studio', async ({ page }) => {
    await page.goto('/app/inspections/studio');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/studio');
  });
});

test.describe('Supervisor Flows', () => {
  test.use({ storageState: supervisorAuthFile });

  test.beforeEach(async ({ page }) => {
    if (!(await authFileExists(supervisorAuthFile))) {
      test.skip();
    }
  });

  test('Supervisor can access Approvals', async ({ page }) => {
    await page.goto('/app/approvals');
    await page.waitForLoadState('networkidle');
    
    // Supervisor should have access to approvals
    expect(page.url()).toContain('/approvals');
  });

  test('Supervisor can access Alerts', async ({ page }) => {
    await page.goto('/app/alerts');
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain('/alerts');
  });
});

test.describe('Role-Based Access Control', () => {
  // Test that non-admin users are properly restricted

  test('Standard user redirected from admin routes', async ({ browser }) => {
    // Skip if auth file doesn't exist
    if (!(await authFileExists(userAuthFile))) {
      test.skip();
      return;
    }
    
    const context = await browser.newContext({ storageState: userAuthFile });
    const page = await context.newPage();
    
    await page.goto('/app/admin/users');
    await page.waitForTimeout(3000);
    
    // Should redirect to dashboard (not admin/users)
    const url = page.url();
    const redirectedAway = !url.includes('/admin/users') || url.includes('/dashboard');
    
    expect(redirectedAway).toBeTruthy();
    
    await context.close();
  });
});

test.describe('API Integration Tests', () => {
  test.use({ storageState: adminAuthFile });

  test.beforeEach(async ({ page }) => {
    if (!(await authFileExists(adminAuthFile))) {
      test.skip();
    }
  });

  test('User list API returns data', async ({ page }) => {
    await page.goto('/app/admin/users');
    
    // Wait for network activity to settle
    await page.waitForLoadState('networkidle');
    
    // Check if users are displayed (either in table or list)
    await page.waitForTimeout(2000);
    
    const hasUserData = 
      await page.locator('table tbody tr, [class*="user-card"], [class*="user-row"]').count() > 0 ||
      await page.locator('text=/SUPER001|TEST001|EXEC002/').count() > 0;
    
    // Allow for empty state or loading
    const hasEmptyState = await page.locator('text=/no users|empty|loading/i').count() > 0;
    
    expect(hasUserData || hasEmptyState).toBeTruthy();
  });

  test('Gate pass list loads data', async ({ page }) => {
    await page.goto('/app/gate-pass');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Should have some content (either data or empty state)
    const hasContent = await page.locator('main').textContent();
    expect(hasContent?.length).toBeGreaterThan(0);
  });
});










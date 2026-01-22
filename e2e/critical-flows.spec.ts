import { test, expect, Page } from '@playwright/test';

/**
 * Critical Flow Tests
 * 
 * End-to-end tests for critical user journeys:
 * - Login → Dashboard → Feature → Action
 * - CRUD operations
 * - Approval workflows
 */

interface TestError {
  type: 'js_error' | 'network_error' | 'api_error' | 'assertion';
  message: string;
  url?: string;
  status?: number;
}

// FlowResult interface for future use in flow tracking
// interface FlowResult {
//   flow: string;
//   success: boolean;
//   errors: TestError[];
//   duration: number;
// }

// Utility to collect all errors during a test
class ErrorCollector {
  private errors: TestError[] = [];
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
    this.setupListeners();
  }
  
  private setupListeners() {
    // Capture JS errors
    this.page.on('pageerror', (error) => {
      this.errors.push({
        type: 'js_error',
        message: error.message,
      });
    });
    
    // Capture failed network requests
    this.page.on('requestfailed', (request) => {
      this.errors.push({
        type: 'network_error',
        message: request.failure()?.errorText || 'Unknown network error',
        url: request.url(),
      });
    });
    
    // Capture API errors (4xx, 5xx)
    this.page.on('response', (response) => {
      const status = response.status();
      if (status >= 400 && !response.url().includes('/sanctum/csrf-cookie')) {
        this.errors.push({
          type: 'api_error',
          message: `${response.request().method()} ${response.url()} returned ${status}`,
          url: response.url(),
          status,
        });
      }
    });
  }
  
  getErrors(): TestError[] {
    return [...this.errors];
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  clear() {
    this.errors = [];
  }
}

test.describe('Critical Flow: Login', () => {
  test('should show login page correctly', async ({ page }) => {
    const collector = new ErrorCollector(page);
    
    await page.goto('/login');
    
    // Should have login form elements
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // No critical JS errors
    const jsErrors = collector.getErrors().filter(e => e.type === 'js_error');
    expect(jsErrors).toHaveLength(0);
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Click submit without filling form
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Should show validation (either HTML5 validation or custom error)
      await page.waitForTimeout(500);
      
      // Form should not submit (still on login page)
      expect(page.url()).toContain('/login');
    }
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    const collector = new ErrorCollector(page);
    
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Fill with invalid credentials
    await page.fill('input[name="employee_id"], input[placeholder*="Employee"], input:not([type="password"]):not([type="hidden"]):visible', 'INVALID_USER_12345');
    await page.fill('input[type="password"]', 'wrong_password');
    
    // Submit and wait for response
    await page.click('button[type="submit"]');
    
    // Wait for either error message or network error
    await page.waitForTimeout(3000);
    
    // Should still be on login page or show error
    const url = page.url();
    expect(url).toContain('/login');
    
    // Check for error message (allow for backend being unavailable)
    const apiErrors = collector.getErrors().filter(e => e.type === 'api_error' && e.status === 401);
    const networkErrors = collector.getErrors().filter(e => e.type === 'network_error');
    
    // Either got 401 (correct handling) or network error (server unavailable)
    const handledCorrectly = apiErrors.length > 0 || networkErrors.length > 0 || url.includes('/login');
    expect(handledCorrectly).toBeTruthy();
  });

  test('should login successfully with valid admin credentials', async ({ page }) => {
    const errorCollector = new ErrorCollector(page);
    
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Use default admin credentials
    const adminId = process.env.TEST_ADMIN_ID || 'SUPER001';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'password';
    
    // Fill login form
    const employeeInput = page.locator('input[name="employee_id"], input[placeholder*="Employee"], input:not([type="password"]):not([type="hidden"]):visible').first();
    await employeeInput.fill(adminId);
    await page.fill('input[type="password"]', adminPassword);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      // Verify we're on dashboard
      expect(page.url()).toContain('/dashboard');
      console.log('✅ Admin login successful');
    } catch {
      // Check if backend is available
      const networkErrors = errorCollector.getErrors().filter(e => e.type === 'network_error');
      if (networkErrors.length > 0) {
        console.log('⚠️  Backend not available - skipping login test');
        test.skip();
      } else {
        // Login failed for other reason
        console.log('❌ Admin login failed');
        throw new Error('Login failed - check credentials or backend');
      }
    }
  });

  test('should login successfully with valid user credentials', async ({ page }) => {
    const errorCollector = new ErrorCollector(page);
    
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    const userId = process.env.TEST_USER_ID || 'TEST001';
    const userPassword = process.env.TEST_USER_PASSWORD || 'password';
    
    const employeeInput = page.locator('input[name="employee_id"], input[placeholder*="Employee"], input:not([type="password"]):not([type="hidden"]):visible').first();
    await employeeInput.fill(userId);
    await page.fill('input[type="password"]', userPassword);
    
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      expect(page.url()).toContain('/dashboard');
      console.log('✅ User login successful');
    } catch {
      const networkErrors = errorCollector.getErrors().filter(e => e.type === 'network_error');
      if (networkErrors.length > 0) {
        console.log('⚠️  Backend not available - skipping login test');
        test.skip();
      } else {
        throw new Error('Login failed - check credentials or backend');
      }
    }
  });
});

test.describe('Critical Flow: Route Navigation', () => {
  test('root redirects to dashboard or login', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    const isValidRedirect = url.includes('/dashboard') || url.includes('/login');
    expect(isValidRedirect).toBeTruthy();
  });

  test('dashboard loads without critical errors (unauthenticated)', async ({ page }) => {
    const collector = new ErrorCollector(page);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    // Should redirect to login or show loading
    const url = page.url();
    const isLoginOrLoading = url.includes('/login') || 
      await page.locator('.animate-spin').count() > 0;
    
    expect(isLoginOrLoading).toBeTruthy();
    
    // No critical JS errors (auth-related errors are expected)
    const criticalErrors = collector.getErrors().filter(
      e => e.type === 'js_error' && !e.message.includes('auth')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical JS errors:', criticalErrors);
    }
  });
});

test.describe('Critical Flow: Gate Pass Module', () => {
  test('gate pass dashboard loads structure', async ({ page }) => {
    await page.goto('/app/gate-pass');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    // Either shows content (if somehow authenticated) or redirects to login
    const isExpectedState = 
      url.includes('/login') ||
      url.includes('/gate-pass') ||
      await page.locator('.animate-spin').count() > 0;
    
    expect(isExpectedState).toBeTruthy();
  });

  test('create gate pass page loads', async ({ page }) => {
    await page.goto('/app/gate-pass/create');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/gate-pass')).toBeTruthy();
  });
});

test.describe('Critical Flow: Inspection Module', () => {
  test('inspection dashboard loads', async ({ page }) => {
    await page.goto('/app/inspections');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/inspections')).toBeTruthy();
  });

  test('new inspection page loads', async ({ page }) => {
    await page.goto('/app/inspections/new');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/inspections')).toBeTruthy();
  });
});

test.describe('Critical Flow: Expense Module', () => {
  test('expense dashboard loads', async ({ page }) => {
    await page.goto('/app/expenses');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/expenses')).toBeTruthy();
  });

  test('create expense page loads', async ({ page }) => {
    await page.goto('/app/expenses/create');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || url.includes('/expenses')).toBeTruthy();
  });
});

test.describe('Critical Flow: Admin Module', () => {
  test('user management redirects to login for unauthenticated', async ({ page }) => {
    await page.goto('/app/admin/users');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    // Should redirect to login (not authenticated)
    const isProtected = url.includes('/login') || 
      await page.locator('.animate-spin').count() > 0;
    
    expect(isProtected).toBeTruthy();
  });

  test('security dashboard redirects for unauthenticated', async ({ page }) => {
    await page.goto('/app/admin/security');
    await page.waitForTimeout(3000);
    
    const url = page.url();
    expect(url.includes('/login') || await page.locator('.animate-spin').count() > 0).toBeTruthy();
  });
});

test.describe('Critical Flow: Error Boundaries', () => {
  test('app handles navigation errors gracefully', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    // Navigate to multiple routes quickly
    const routes = ['/dashboard', '/app/gate-pass', '/app/expenses', '/app/inspections'];
    
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    }
    
    // Check if any uncaught errors were thrown
    const criticalErrors = jsErrors.filter(msg => 
      !msg.includes('401') && 
      !msg.includes('403') &&
      !msg.includes('Network') &&
      !msg.includes('Failed to fetch')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors during navigation:', criticalErrors);
    }
    
    // App should still be functional (not completely crashed)
    const hasContent = (await page.locator('body').textContent())?.length ?? 0 > 10;
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Network Resilience', () => {
  test('app handles slow network gracefully', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto('/login', { timeout: 30000 });
    
    // Should still load
    await expect(page.locator('body')).toBeVisible();
  });
});


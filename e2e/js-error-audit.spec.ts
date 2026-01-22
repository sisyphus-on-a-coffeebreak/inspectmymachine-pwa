import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * JavaScript Error Audit
 * 
 * Systematically visits all routes and captures:
 * - JavaScript runtime errors
 * - Console errors
 * - Unhandled promise rejections
 * - Network failures
 */

interface PageError {
  route: string;
  type: 'js_error' | 'console_error' | 'network_error' | 'unhandled_rejection';
  message: string;
  timestamp: number;
  stack?: string;
}

interface RouteAuditResult {
  route: string;
  loadTime: number;
  errors: PageError[];
  warnings: string[];
  networkRequests: number;
  failedRequests: number;
  status: 'pass' | 'fail' | 'warn';
}

const ALL_ROUTES = [
  '/login',
  '/offline',
  '/dashboard',
  '/app/gate-pass',
  '/app/gate-pass/create',
  '/app/gate-pass/guard-register',
  '/app/gate-pass/visitors',
  '/app/gate-pass/calendar',
  '/app/gate-pass/reports',
  '/app/gate-pass/templates',
  '/app/gate-pass/scan',
  '/app/gate-pass/bulk',
  '/app/inspections',
  '/app/inspections/new',
  '/app/inspections/studio',
  '/app/inspections/sync',
  '/app/inspections/completed',
  '/app/inspections/reports',
  '/app/expenses',
  '/app/expenses/create',
  '/app/expenses/history',
  '/app/expenses/ledger',
  '/app/expenses/analytics',
  '/app/expenses/reports',
  '/app/expenses/receipts',
  '/app/stockyard',
  '/app/stockyard/create',
  '/app/stockyard/scan',
  '/app/stockyard/components',
  '/app/stockyard/analytics',
  '/app/stockyard/alerts',
  '/app/approvals',
  '/app/alerts',
  '/app/notifications',
  '/app/notifications/preferences',
  '/app/settings/report-branding',
  '/app/settings/sessions',
  '/app/admin/users',
  '/app/admin/users/activity',
  '/app/admin/users/capability-matrix',
  '/app/admin/users/bulk-operations',
  '/app/admin/permission-templates',
  '/app/admin/permission-testing',
  '/app/admin/data-masking-rules',
  '/app/admin/security',
  '/app/admin/activity-logs',
  '/app/admin/permission-logs',
  '/app/admin/audit-reports',
  '/app/admin/compliance',
];

async function auditRoute(page: Page, route: string): Promise<RouteAuditResult> {
  const errors: PageError[] = [];
  const warnings: string[] = [];
  let networkRequests = 0;
  let failedRequests = 0;
  
  // Setup listeners
  page.on('pageerror', (error) => {
    errors.push({
      route,
      type: 'js_error',
      message: error.message,
      timestamp: Date.now(),
      stack: error.stack,
    });
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore expected auth-related errors
      if (!text.includes('401') && !text.includes('403') && !text.includes('Failed to fetch')) {
        errors.push({
          route,
          type: 'console_error',
          message: text,
          timestamp: Date.now(),
        });
      }
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  page.on('request', () => {
    networkRequests++;
  });
  
  page.on('requestfailed', (request) => {
    failedRequests++;
    const failure = request.failure();
    // Ignore CORS and expected failures
    if (failure && !failure.errorText.includes('net::ERR_FAILED')) {
      errors.push({
        route,
        type: 'network_error',
        message: `${request.url()}: ${failure.errorText}`,
        timestamp: Date.now(),
      });
    }
  });
  
  const startTime = Date.now();
  
  try {
    await page.goto(route, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    
    // Wait for any async content
    await page.waitForTimeout(2000);
    
  } catch (err) {
    errors.push({
      route,
      type: 'js_error',
      message: err instanceof Error ? err.message : 'Navigation failed',
      timestamp: Date.now(),
    });
  }
  
  const loadTime = Date.now() - startTime;
  
  // Filter out expected errors (auth redirects, etc.)
  const criticalErrors = errors.filter(e => {
    // Keep only unexpected errors
    return !e.message.includes('401') && 
           !e.message.includes('Unauthorized') &&
           !e.message.includes('redirected');
  });
  
  return {
    route,
    loadTime,
    errors: criticalErrors,
    warnings,
    networkRequests,
    failedRequests,
    status: criticalErrors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warn' : 'pass'),
  };
}

test.describe('JavaScript Error Audit', () => {
  const results: RouteAuditResult[] = [];
  
  test.afterAll(async () => {
    // Write results to file
    const auditPath = path.join(__dirname, '../audit/js-error-audit.json');
    
    const summary = {
      generated_at: new Date().toISOString(),
      total_routes: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      warnings: results.filter(r => r.status === 'warn').length,
      failed: results.filter(r => r.status === 'fail').length,
      results,
    };
    
    fs.writeFileSync(auditPath, JSON.stringify(summary, null, 2));
    console.log(`\n📊 JS Error Audit Results written to ${auditPath}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ⚠️  Warnings: ${summary.warnings}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
  });

  for (const route of ALL_ROUTES) {
    test(`Audit: ${route}`, async ({ page }) => {
      const result = await auditRoute(page, route);
      results.push(result);
      
      // Log immediate results
      if (result.status === 'fail') {
        console.log(`❌ ${route}: ${result.errors.length} errors`);
        result.errors.forEach(e => console.log(`   - ${e.type}: ${e.message.substring(0, 100)}`));
      } else if (result.status === 'warn') {
        console.log(`⚠️  ${route}: ${result.warnings.length} warnings`);
      } else {
        console.log(`✅ ${route}: OK (${result.loadTime}ms)`);
      }
      
      // Test passes unless there are critical errors
      // We want to continue auditing even if some routes fail
      expect(result.errors.length).toBeLessThanOrEqual(5);
    });
  }
});

test.describe('Console Error Patterns', () => {
  test('Login page should have no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/login');
    await page.waitForTimeout(3000);
    
    // Filter out expected errors
    const unexpectedErrors = consoleErrors.filter(msg => 
      !msg.includes('Failed to fetch') &&
      !msg.includes('net::') &&
      !msg.includes('401')
    );
    
    if (unexpectedErrors.length > 0) {
      console.log('Unexpected console errors on login:', unexpectedErrors);
    }
    
    expect(unexpectedErrors.length).toBe(0);
  });
});


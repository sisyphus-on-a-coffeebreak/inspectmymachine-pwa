/**
 * E2E User Flow Test Suite
 * 
 * Simulates actual user flows through the VOMS application
 * to identify bugs, broken pages, and issues.
 * 
 * Run with: npx tsx e2e-user-flow-test.ts
 */

const BASE_URL = 'http://localhost:5174';

interface TestResult {
  page: string;
  route: string;
  status: 'pass' | 'fail' | 'error' | 'redirect';
  loadTime?: number;
  error?: string;
  redirectTo?: string;
  elements?: {
    hasContent: boolean;
    hasForm?: boolean;
    hasButtons?: boolean;
    hasNavigation?: boolean;
  };
}

interface TestSummary {
  totalPages: number;
  passed: number;
  failed: number;
  errors: number;
  redirects: number;
  results: TestResult[];
  bugs: string[];
  warnings: string[];
}

// All routes in the application
const routes = {
  // Public routes
  public: [
    { path: '/login', name: 'Login Page', requiresAuth: false },
    { path: '/offline', name: 'Offline Page', requiresAuth: false },
  ],
  
  // Main routes
  main: [
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  ],
  
  // Gate Pass Module
  gatePass: [
    { path: '/app/gate-pass', name: 'Gate Pass Dashboard', requiresAuth: true },
    { path: '/app/gate-pass/create', name: 'Create Gate Pass', requiresAuth: true },
    { path: '/app/gate-pass/guard-register', name: 'Guard Register', requiresAuth: true },
    { path: '/app/gate-pass/reports', name: 'Gate Pass Reports', requiresAuth: true, adminOnly: true },
    { path: '/app/gate-pass/templates', name: 'Pass Templates', requiresAuth: true, adminOnly: true },
    { path: '/app/gate-pass/visitors', name: 'Visitor Management', requiresAuth: true },
    { path: '/app/gate-pass/calendar', name: 'Gate Pass Calendar', requiresAuth: true },
    { path: '/app/gate-pass/scan', name: 'Quick Validation', requiresAuth: true },
    { path: '/app/gate-pass/bulk', name: 'Bulk Operations', requiresAuth: true, adminOnly: true },
  ],
  
  // Inspections Module
  inspections: [
    { path: '/app/inspections', name: 'Inspection Dashboard', requiresAuth: true },
    { path: '/app/inspections/studio', name: 'Inspection Studio', requiresAuth: true, adminOnly: true },
    { path: '/app/inspections/sync', name: 'Sync Center', requiresAuth: true },
    { path: '/app/inspections/new', name: 'New Inspection', requiresAuth: true },
    { path: '/app/inspections/completed', name: 'Completed Inspections', requiresAuth: true },
    { path: '/app/inspections/reports', name: 'Inspection Reports', requiresAuth: true },
  ],
  
  // Expenses Module
  expenses: [
    { path: '/app/expenses', name: 'Expense Dashboard', requiresAuth: true },
    { path: '/app/expenses/create', name: 'Create Expense', requiresAuth: true },
    { path: '/app/expenses/history', name: 'Expense History', requiresAuth: true },
    { path: '/app/expenses/ledger', name: 'Employee Ledger', requiresAuth: true },
    { path: '/app/expenses/reconciliation', name: 'Ledger Reconciliation', requiresAuth: true },
    { path: '/app/expenses/analytics', name: 'Expense Analytics', requiresAuth: true, adminOnly: true },
    { path: '/app/expenses/reports', name: 'Expense Reports', requiresAuth: true, adminOnly: true },
    { path: '/app/expenses/receipts', name: 'Receipts Gallery', requiresAuth: true },
  ],
  
  // Stockyard Module
  stockyard: [
    { path: '/app/stockyard', name: 'Stockyard Dashboard', requiresAuth: true },
    { path: '/app/stockyard/create', name: 'Create Movement', requiresAuth: true },
    { path: '/app/stockyard/scan', name: 'Stockyard Scan', requiresAuth: true },
    { path: '/app/stockyard/components', name: 'Component Ledger', requiresAuth: true },
    { path: '/app/stockyard/analytics', name: 'Stockyard Analytics', requiresAuth: true },
    { path: '/app/stockyard/alerts', name: 'Stockyard Alerts', requiresAuth: true },
  ],
  
  // Admin Module
  admin: [
    { path: '/app/admin/users', name: 'User Management', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/users/activity', name: 'User Activity', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/users/capability-matrix', name: 'Capability Matrix', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/users/bulk-operations', name: 'Bulk User Operations', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/permission-templates', name: 'Permission Templates', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/permission-testing', name: 'Permission Testing', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/data-masking-rules', name: 'Data Masking Rules', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/security', name: 'Security Dashboard', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/activity-logs', name: 'Activity Logs', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/permission-logs', name: 'Permission Logs', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/audit-reports', name: 'Audit Reports', requiresAuth: true, adminOnly: true },
    { path: '/app/admin/compliance', name: 'Compliance Dashboard', requiresAuth: true, adminOnly: true },
  ],
  
  // Other Modules
  other: [
    { path: '/app/approvals', name: 'Unified Approvals', requiresAuth: true },
    { path: '/app/alerts', name: 'Alert Dashboard', requiresAuth: true },
    { path: '/app/notifications', name: 'Notifications', requiresAuth: true },
    { path: '/app/notifications/preferences', name: 'Notification Preferences', requiresAuth: true },
    { path: '/app/settings/report-branding', name: 'Report Branding', requiresAuth: true, adminOnly: true },
    { path: '/app/settings/sessions', name: 'Session Management', requiresAuth: true },
  ],
};

// Flatten all routes
const allRoutes = [
  ...routes.public,
  ...routes.main,
  ...routes.gatePass,
  ...routes.inspections,
  ...routes.expenses,
  ...routes.stockyard,
  ...routes.admin,
  ...routes.other,
];

async function testRoute(route: { path: string; name: string; requiresAuth: boolean; adminOnly?: boolean }): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${route.path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'VOMS-E2E-Test/1.0',
      },
      redirect: 'manual',
    });
    
    const loadTime = Date.now() - startTime;
    
    // Check for redirects
    if (response.status >= 300 && response.status < 400) {
      const redirectLocation = response.headers.get('location');
      return {
        page: route.name,
        route: route.path,
        status: 'redirect',
        loadTime,
        redirectTo: redirectLocation || 'unknown',
      };
    }
    
    // Check for errors
    if (!response.ok) {
      return {
        page: route.name,
        route: route.path,
        status: 'error',
        loadTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    // Get page content
    const html = await response.text();
    
    // Check for common issues
    const hasContent = html.length > 500;
    const hasErrorBoundary = html.includes('Something went wrong') || html.includes('error-boundary');
    const hasJSError = html.includes('TypeError') || html.includes('ReferenceError') || html.includes('SyntaxError');
    const hasReactRoot = html.includes('id="root"') || html.includes('data-reactroot');
    
    if (hasErrorBoundary || hasJSError) {
      return {
        page: route.name,
        route: route.path,
        status: 'fail',
        loadTime,
        error: hasJSError ? 'JavaScript error detected in page' : 'Error boundary triggered',
        elements: { hasContent },
      };
    }
    
    return {
      page: route.name,
      route: route.path,
      status: hasContent && hasReactRoot ? 'pass' : 'fail',
      loadTime,
      elements: {
        hasContent,
        hasForm: html.includes('<form'),
        hasButtons: html.includes('<button'),
        hasNavigation: html.includes('nav') || html.includes('sidebar'),
      },
    };
    
  } catch (error) {
    const loadTime = Date.now() - startTime;
    return {
      page: route.name,
      route: route.path,
      status: 'error',
      loadTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runE2ETests(): Promise<TestSummary> {
  console.log('🚀 VOMS E2E User Flow Test Suite');
  console.log('='.repeat(60));
  console.log(`Testing ${allRoutes.length} routes...\n`);
  
  const results: TestResult[] = [];
  const bugs: string[] = [];
  const warnings: string[] = [];
  
  // Test each route
  for (const route of allRoutes) {
    process.stdout.write(`Testing: ${route.name.padEnd(30)} `);
    const result = await testRoute(route);
    results.push(result);
    
    // Print result
    const statusEmoji = {
      'pass': '✅',
      'fail': '❌',
      'error': '💥',
      'redirect': '↪️',
    }[result.status];
    
    console.log(`${statusEmoji} ${result.status.toUpperCase()} (${result.loadTime}ms)`);
    
    // Track issues
    if (result.status === 'fail') {
      bugs.push(`[${route.path}] ${result.error || 'Page failed to render correctly'}`);
    } else if (result.status === 'error') {
      bugs.push(`[${route.path}] Error: ${result.error}`);
    } else if (result.status === 'redirect') {
      if (route.requiresAuth) {
        warnings.push(`[${route.path}] Redirected to ${result.redirectTo} (expected for unauthenticated users)`);
      } else {
        bugs.push(`[${route.path}] Unexpected redirect to ${result.redirectTo}`);
      }
    }
    
    // Small delay to prevent overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Calculate summary
  const summary: TestSummary = {
    totalPages: results.length,
    passed: results.filter(r => r.status === 'pass').length,
    failed: results.filter(r => r.status === 'fail').length,
    errors: results.filter(r => r.status === 'error').length,
    redirects: results.filter(r => r.status === 'redirect').length,
    results,
    bugs,
    warnings,
  };
  
  return summary;
}

async function main() {
  try {
    // Check if server is running
    try {
      await fetch(BASE_URL);
    } catch {
      console.error('❌ Error: Dev server is not running at', BASE_URL);
      console.error('Please start the server with: npm run dev');
      process.exit(1);
    }
    
    const summary = await runE2ETests();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages Tested: ${summary.totalPages}`);
    console.log(`✅ Passed:          ${summary.passed}`);
    console.log(`❌ Failed:          ${summary.failed}`);
    console.log(`💥 Errors:          ${summary.errors}`);
    console.log(`↪️  Redirects:       ${summary.redirects}`);
    console.log('='.repeat(60));
    
    // Print bugs
    if (summary.bugs.length > 0) {
      console.log('\n🐛 BUGS FOUND:');
      console.log('-'.repeat(40));
      summary.bugs.forEach((bug, i) => {
        console.log(`${i + 1}. ${bug}`);
      });
    }
    
    // Print warnings
    if (summary.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('-'.repeat(40));
      summary.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }
    
    // Exit with appropriate code
    process.exit(summary.failed + summary.errors > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();










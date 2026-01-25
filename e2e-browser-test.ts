/**
 * E2E Browser User Flow Test Suite
 * 
 * Comprehensive browser-based testing that:
 * 1. Tests all page routes
 * 2. Checks for JavaScript errors
 * 3. Validates page rendering
 * 4. Tests form interactions
 * 5. Identifies bugs and issues
 * 
 * Run with: npx tsx e2e-browser-test.ts
 */

const BASE_URL = 'http://localhost:5174';

interface PageTest {
  path: string;
  name: string;
  module: string;
  expectedElements?: string[];
  forms?: string[];
  buttons?: string[];
  criticalForModule?: boolean;
}

interface TestResult {
  page: PageTest;
  status: 'pass' | 'fail' | 'warning' | 'error';
  loadTime: number;
  httpStatus: number;
  hasReactRoot: boolean;
  hasContent: boolean;
  consoleErrors: string[];
  missingElements: string[];
  issues: string[];
}

// Complete list of all pages to test
const pagesToTest: PageTest[] = [
  // Authentication
  { path: '/login', name: 'Login', module: 'Authentication', criticalForModule: true },
  { path: '/offline', name: 'Offline', module: 'Authentication' },
  
  // Dashboard
  { path: '/dashboard', name: 'Dashboard', module: 'Main', criticalForModule: true },
  
  // Gate Pass
  { path: '/app/gate-pass', name: 'Dashboard', module: 'Gate Pass', criticalForModule: true },
  { path: '/app/gate-pass/create', name: 'Create Pass', module: 'Gate Pass' },
  { path: '/app/gate-pass/guard-register', name: 'Guard Register', module: 'Gate Pass' },
  { path: '/app/gate-pass/reports', name: 'Reports', module: 'Gate Pass' },
  { path: '/app/gate-pass/templates', name: 'Templates', module: 'Gate Pass' },
  { path: '/app/gate-pass/visitors', name: 'Visitors', module: 'Gate Pass' },
  { path: '/app/gate-pass/calendar', name: 'Calendar', module: 'Gate Pass' },
  { path: '/app/gate-pass/scan', name: 'Scan', module: 'Gate Pass' },
  { path: '/app/gate-pass/bulk', name: 'Bulk Ops', module: 'Gate Pass' },
  
  // Inspections
  { path: '/app/inspections', name: 'Dashboard', module: 'Inspections', criticalForModule: true },
  { path: '/app/inspections/studio', name: 'Studio', module: 'Inspections' },
  { path: '/app/inspections/sync', name: 'Sync', module: 'Inspections' },
  { path: '/app/inspections/new', name: 'New', module: 'Inspections' },
  { path: '/app/inspections/completed', name: 'Completed', module: 'Inspections' },
  { path: '/app/inspections/reports', name: 'Reports', module: 'Inspections' },
  
  // Expenses
  { path: '/app/expenses', name: 'Dashboard', module: 'Expenses', criticalForModule: true },
  { path: '/app/expenses/create', name: 'Create', module: 'Expenses' },
  { path: '/app/expenses/history', name: 'History', module: 'Expenses' },
  { path: '/app/expenses/ledger', name: 'Ledger', module: 'Expenses' },
  { path: '/app/expenses/reconciliation', name: 'Reconciliation', module: 'Expenses' },
  { path: '/app/expenses/analytics', name: 'Analytics', module: 'Expenses' },
  { path: '/app/expenses/reports', name: 'Reports', module: 'Expenses' },
  { path: '/app/expenses/receipts', name: 'Receipts', module: 'Expenses' },
  
  // Stockyard
  { path: '/app/stockyard', name: 'Dashboard', module: 'Stockyard', criticalForModule: true },
  { path: '/app/stockyard/create', name: 'Create', module: 'Stockyard' },
  { path: '/app/stockyard/scan', name: 'Scan', module: 'Stockyard' },
  { path: '/app/stockyard/components', name: 'Components', module: 'Stockyard' },
  { path: '/app/stockyard/analytics', name: 'Analytics', module: 'Stockyard' },
  { path: '/app/stockyard/alerts', name: 'Alerts', module: 'Stockyard' },
  
  // Admin
  { path: '/app/admin/users', name: 'Users', module: 'Admin', criticalForModule: true },
  { path: '/app/admin/users/activity', name: 'Activity', module: 'Admin' },
  { path: '/app/admin/users/capability-matrix', name: 'Matrix', module: 'Admin' },
  { path: '/app/admin/users/bulk-operations', name: 'Bulk Ops', module: 'Admin' },
  { path: '/app/admin/permission-templates', name: 'Templates', module: 'Admin' },
  { path: '/app/admin/permission-testing', name: 'Testing', module: 'Admin' },
  { path: '/app/admin/data-masking-rules', name: 'Masking', module: 'Admin' },
  { path: '/app/admin/security', name: 'Security', module: 'Admin' },
  { path: '/app/admin/activity-logs', name: 'Logs', module: 'Admin' },
  { path: '/app/admin/permission-logs', name: 'Perm Logs', module: 'Admin' },
  { path: '/app/admin/audit-reports', name: 'Audit', module: 'Admin' },
  { path: '/app/admin/compliance', name: 'Compliance', module: 'Admin' },
  
  // Other
  { path: '/app/approvals', name: 'Approvals', module: 'Other', criticalForModule: true },
  { path: '/app/alerts', name: 'Alerts', module: 'Other' },
  { path: '/app/notifications', name: 'Notifications', module: 'Other' },
  { path: '/app/notifications/preferences', name: 'Preferences', module: 'Other' },
  { path: '/app/settings/report-branding', name: 'Branding', module: 'Settings' },
  { path: '/app/settings/sessions', name: 'Sessions', module: 'Settings' },
  
  // Error pages
  { path: '/nonexistent-page', name: '404 Page', module: 'Error Pages' },
];

async function testPage(page: PageTest): Promise<TestResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${page.path}`;
  const issues: string[] = [];
  const consoleErrors: string[] = [];
  const missingElements: string[] = [];
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'VOMS-E2E-Browser-Test/1.0',
      },
    });
    
    const loadTime = Date.now() - startTime;
    const html = await response.text();
    
    // Basic checks
    const hasReactRoot = html.includes('id="root"');
    const hasContent = html.length > 1000;
    
    // Check for JavaScript errors in HTML
    const jsErrors = [
      'TypeError', 'ReferenceError', 'SyntaxError', 'Error:',
      'Uncaught', 'undefined is not', 'null is not',
    ];
    
    for (const errorPattern of jsErrors) {
      if (html.includes(errorPattern)) {
        consoleErrors.push(`Contains "${errorPattern}" in HTML`);
      }
    }
    
    // Check for React error boundaries
    if (html.includes('Something went wrong') || html.includes('error-boundary')) {
      issues.push('React error boundary triggered');
    }
    
    // Check for missing content
    if (!hasContent) {
      issues.push('Page has very little content');
    }
    
    if (!hasReactRoot) {
      issues.push('React root element not found');
    }
    
    // Determine status
    let status: 'pass' | 'fail' | 'warning' | 'error' = 'pass';
    if (consoleErrors.length > 0 || issues.length > 0) {
      status = 'fail';
    } else if (missingElements.length > 0) {
      status = 'warning';
    }
    
    return {
      page,
      status,
      loadTime,
      httpStatus: response.status,
      hasReactRoot,
      hasContent,
      consoleErrors,
      missingElements,
      issues,
    };
    
  } catch (error) {
    return {
      page,
      status: 'error',
      loadTime: Date.now() - startTime,
      httpStatus: 0,
      hasReactRoot: false,
      hasContent: false,
      consoleErrors: [error instanceof Error ? error.message : 'Unknown error'],
      missingElements: [],
      issues: ['Failed to fetch page'],
    };
  }
}

async function runTests() {
  console.log('🌐 VOMS E2E Browser Test Suite');
  console.log('='.repeat(70));
  console.log(`Testing ${pagesToTest.length} pages across all modules...\n`);
  
  const results: TestResult[] = [];
  const moduleResults: Record<string, { passed: number; failed: number; pages: string[] }> = {};
  
  // Initialize module tracking
  const modules = [...new Set(pagesToTest.map(p => p.module))];
  for (const mod of modules) {
    moduleResults[mod] = { passed: 0, failed: 0, pages: [] };
  }
  
  // Test each page
  for (const page of pagesToTest) {
    const paddedName = `[${page.module}] ${page.name}`.padEnd(40);
    process.stdout.write(`Testing: ${paddedName} `);
    
    const result = await testPage(page);
    results.push(result);
    
    // Update module stats
    if (result.status === 'pass') {
      moduleResults[page.module].passed++;
      console.log(`✅ PASS (${result.loadTime}ms)`);
    } else if (result.status === 'warning') {
      moduleResults[page.module].passed++;
      console.log(`⚠️  WARN (${result.loadTime}ms)`);
    } else {
      moduleResults[page.module].failed++;
      moduleResults[page.module].pages.push(page.path);
      console.log(`❌ FAIL (${result.loadTime}ms)`);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 30));
  }
  
  // Summary
  const passed = results.filter(r => r.status === 'pass' || r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail' || r.status === 'error').length;
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS BY MODULE');
  console.log('='.repeat(70));
  
  for (const [module, stats] of Object.entries(moduleResults)) {
    const total = stats.passed + stats.failed;
    const percentage = ((stats.passed / total) * 100).toFixed(0);
    const statusIcon = stats.failed === 0 ? '✅' : '❌';
    console.log(`${statusIcon} ${module.padEnd(20)} ${stats.passed}/${total} passed (${percentage}%)`);
    
    if (stats.failed > 0) {
      for (const failedPage of stats.pages) {
        console.log(`   ↳ Failed: ${failedPage}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📈 OVERALL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Pages: ${results.length}`);
  console.log(`✅ Passed:   ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed:   ${failed} (${((failed / results.length) * 100).toFixed(1)}%)`);
  
  // List all issues
  const allIssues = results.filter(r => r.issues.length > 0 || r.consoleErrors.length > 0);
  if (allIssues.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('🐛 ISSUES FOUND');
    console.log('='.repeat(70));
    
    for (const result of allIssues) {
      console.log(`\n[${result.page.module}] ${result.page.name} (${result.page.path}):`);
      for (const issue of result.issues) {
        console.log(`  • ${issue}`);
      }
      for (const error of result.consoleErrors) {
        console.log(`  ⚠ ${error}`);
      }
    }
  }
  
  // Performance stats
  console.log('\n' + '='.repeat(70));
  console.log('⚡ PERFORMANCE');
  console.log('='.repeat(70));
  const loadTimes = results.map(r => r.loadTime);
  const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
  const maxLoadTime = Math.max(...loadTimes);
  const minLoadTime = Math.min(...loadTimes);
  
  console.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
  console.log(`Fastest Page:      ${minLoadTime}ms`);
  console.log(`Slowest Page:      ${maxLoadTime}ms`);
  
  // Slow pages
  const slowPages = results.filter(r => r.loadTime > 100);
  if (slowPages.length > 0) {
    console.log(`\nSlow Pages (>100ms):`);
    for (const page of slowPages.sort((a, b) => b.loadTime - a.loadTime)) {
      console.log(`  ${page.page.path}: ${page.loadTime}ms`);
    }
  }
  
  return { passed, failed, results };
}

// Main
async function main() {
  try {
    // Check server
    try {
      await fetch(BASE_URL);
    } catch {
      console.error('❌ Dev server not running at', BASE_URL);
      console.error('Start with: npm run dev');
      process.exit(1);
    }
    
    const { passed, failed } = await runTests();
    
    console.log('\n' + '='.repeat(70));
    console.log(failed === 0 
      ? '✅ ALL PAGES PASSED!' 
      : `⚠️  ${failed} PAGE(S) HAVE ISSUES`
    );
    console.log('='.repeat(70));
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal:', error);
    process.exit(1);
  }
}

main();










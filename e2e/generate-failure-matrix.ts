/**
 * Failure Matrix Generator
 * 
 * Reads test results and produces a comprehensive failure matrix report.
 * 
 * Usage: npx ts-node e2e/generate-failure-matrix.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types for Playwright JSON output (flexible to handle actual format)
interface PlaywrightStats {
  startTime: string;
  duration: number;
  expected: number;
  unexpected: number;
  skipped: number;
}

interface PlaywrightTestResult {
  title?: string;
  status?: string;
  results?: Array<{
    error?: {
      message?: string;
      stack?: string;
    };
  }>;
}

interface PlaywrightSpec {
  tests?: PlaywrightTestResult[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSuite {
  specs?: PlaywrightSpec[];
}

interface PlaywrightResults {
  suites?: PlaywrightSuite[];
  stats?: PlaywrightStats;
}

interface JsErrorResult {
  route: string;
  status: string;
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
  }>;
}

interface JsErrorAudit {
  results?: JsErrorResult[];
}

interface FailureEntry {
  route: string;
  errorType: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  stackTrace?: string;
}

interface FailureMatrix {
  generated_at: string;
  summary: {
    total_tests: number;
    passed: number;
    failed: number;
    skipped: number;
    pass_rate: string;
  };
  failures: FailureEntry[];
  broken_flows: Array<{
    flow: string;
    errors: string[];
  }>;
  risk_ranking: Array<{
    risk: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    affected_routes: string[];
    recommendation: string;
  }>;
  untestable: Array<{
    item: string;
    reason: string;
  }>;
}

function classifySeverity(error: string): 'critical' | 'high' | 'medium' | 'low' {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('uncaught') || lowerError.includes('crash')) {
    return 'critical';
  }
  if (lowerError.includes('404') || lowerError.includes('undefined')) {
    return 'high';
  }
  if (lowerError.includes('timeout') || lowerError.includes('network')) {
    return 'medium';
  }
  return 'low';
}

function generateMatrix(): FailureMatrix {
  const resultsPath = path.join(__dirname, '../audit/test-results.json');
  const jsErrorPath = path.join(__dirname, '../audit/js-error-audit.json');
  
  let results: PlaywrightResults | null = null;
  let jsErrors: JsErrorAudit | null = null;
  
  try {
    if (fs.existsSync(resultsPath)) {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    }
  } catch {
    console.log('No test results found at', resultsPath);
  }
  
  try {
    if (fs.existsSync(jsErrorPath)) {
      jsErrors = JSON.parse(fs.readFileSync(jsErrorPath, 'utf-8'));
    }
  } catch {
    console.log('No JS error audit found at', jsErrorPath);
  }
  
  const failures: FailureEntry[] = [];
  const brokenFlows: Array<{ flow: string; errors: string[] }> = [];
  
  // Process Playwright results
  if (results?.suites) {
    for (const suite of results.suites) {
      for (const spec of suite.specs || []) {
        if (spec.tests) {
          for (const test of spec.tests) {
            if (test.status === 'unexpected' || test.status === 'failed') {
              const route = test.title?.match(/\(([^)]+)\)/)?.[1] || test.title || 'Unknown';
              
              failures.push({
                route,
                errorType: 'test_failure',
                message: test.results?.[0]?.error?.message || 'Test failed',
                severity: classifySeverity(test.results?.[0]?.error?.message || ''),
                stackTrace: test.results?.[0]?.error?.stack,
              });
            }
          }
        }
      }
    }
  }
  
  // Process JS error audit
  if (jsErrors?.results) {
    for (const result of jsErrors.results) {
      if (result.status === 'fail') {
        brokenFlows.push({
          flow: result.route,
          errors: result.errors.map((e) => e.message),
        });
        
        for (const error of result.errors) {
          failures.push({
            route: result.route,
            errorType: error.type,
            message: error.message,
            severity: classifySeverity(error.message),
            stackTrace: error.stack,
          });
        }
      }
    }
  }
  
  // Calculate summary
  const totalTests = results?.stats?.expected ?? 0;
  const passed = totalTests - (results?.stats?.unexpected ?? 0) - (results?.stats?.skipped ?? 0);
  const failed = results?.stats?.unexpected ?? failures.length;
  const skipped = results?.stats?.skipped ?? 0;
  
  // Generate risk ranking
  const riskRanking = [
    {
      risk: 'Authentication Bypass',
      severity: 'critical' as const,
      affected_routes: ['/app/admin/*', '/app/approvals'],
      recommendation: 'Verify all protected routes redirect unauthenticated users to login',
    },
    {
      risk: 'JavaScript Runtime Errors',
      severity: 'high' as const,
      affected_routes: failures.filter(f => f.errorType === 'js_error').map(f => f.route),
      recommendation: 'Fix all uncaught JavaScript errors before production deployment',
    },
    {
      risk: 'API Contract Violations',
      severity: 'medium' as const,
      affected_routes: failures.filter(f => f.errorType === 'api_error').map(f => f.route),
      recommendation: 'Ensure API responses match expected format and status codes',
    },
    {
      risk: 'Network Resilience',
      severity: 'medium' as const,
      affected_routes: failures.filter(f => f.errorType === 'network_error').map(f => f.route),
      recommendation: 'Add proper error handling for network failures',
    },
  ];
  
  // Document untestable items
  const untestable = [
    {
      item: 'Authenticated CRUD operations',
      reason: 'Requires valid test credentials (TEST_USER_ID, TEST_USER_PASSWORD)',
    },
    {
      item: 'Admin role-specific features',
      reason: 'Requires admin test credentials (TEST_ADMIN_ID, TEST_ADMIN_PASSWORD)',
    },
    {
      item: 'File upload flows',
      reason: 'Requires authenticated session and backend file storage',
    },
    {
      item: 'Real-time notifications',
      reason: 'Requires WebSocket connection to backend',
    },
    {
      item: 'Offline sync functionality',
      reason: 'Requires service worker and IndexedDB mocking',
    },
    {
      item: 'QR code scanning',
      reason: 'Requires camera access which is not available in headless mode',
    },
    {
      item: 'PDF generation',
      reason: 'Requires full DOM rendering and jsPDF execution',
    },
  ];
  
  return {
    generated_at: new Date().toISOString(),
    summary: {
      total_tests: totalTests || failures.length,
      passed,
      failed,
      skipped,
      pass_rate: totalTests > 0 ? `${((passed / totalTests) * 100).toFixed(1)}%` : 'N/A',
    },
    failures,
    broken_flows: brokenFlows,
    risk_ranking: riskRanking.filter(r => r.affected_routes.length > 0 || r.severity === 'critical'),
    untestable,
  };
}

// Run if executed directly
const matrix = generateMatrix();
const outputPath = path.join(__dirname, '../audit/failure-matrix.json');
fs.writeFileSync(outputPath, JSON.stringify(matrix, null, 2));

console.log('\n📊 Failure Matrix Generated');
console.log('============================');
console.log(`📁 Output: ${outputPath}`);
console.log(`\n📈 Summary:`);
console.log(`   Total Tests: ${matrix.summary.total_tests}`);
console.log(`   ✅ Passed: ${matrix.summary.passed}`);
console.log(`   ❌ Failed: ${matrix.summary.failed}`);
console.log(`   ⏭️  Skipped: ${matrix.summary.skipped}`);
console.log(`   📊 Pass Rate: ${matrix.summary.pass_rate}`);

if (matrix.failures.length > 0) {
  console.log(`\n❌ Failures (${matrix.failures.length}):`);
  matrix.failures.slice(0, 10).forEach(f => {
    console.log(`   - [${f.severity.toUpperCase()}] ${f.route}: ${f.message.substring(0, 80)}`);
  });
  if (matrix.failures.length > 10) {
    console.log(`   ... and ${matrix.failures.length - 10} more`);
  }
}

if (matrix.risk_ranking.length > 0) {
  console.log(`\n⚠️  Risk Ranking:`);
  matrix.risk_ranking.forEach(r => {
    console.log(`   - [${r.severity.toUpperCase()}] ${r.risk}`);
    console.log(`     ${r.recommendation}`);
  });
}

console.log(`\n🚫 Untestable Items (${matrix.untestable.length}):`);
matrix.untestable.forEach(u => {
  console.log(`   - ${u.item}: ${u.reason}`);
});


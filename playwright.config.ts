import { defineConfig, devices } from '@playwright/test';

/**
 * VOMS PWA - Playwright E2E Test Configuration
 * 
 * Headless testing harness for:
 * - Route access verification
 * - Authentication flows
 * - Role-based access control
 * - Critical user flows
 * 
 * Test Credentials (override via environment variables):
 * - TEST_ADMIN_ID / TEST_ADMIN_PASSWORD - Super Admin (SUPER001)
 * - TEST_USER_ID / TEST_USER_PASSWORD - Standard User (TEST001)
 * - TEST_SUPERVISOR_ID / TEST_SUPERVISOR_PASSWORD - Supervisor (EXEC002)
 * - TEST_CLERK_ID / TEST_CLERK_PASSWORD - Clerk (LIMITED1766562318270)
 * 
 * Default password for all test users: "password"
 */

// Set default test credentials if not provided
process.env.TEST_ADMIN_ID = process.env.TEST_ADMIN_ID || 'SUPER001';
process.env.TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password';
process.env.TEST_USER_ID = process.env.TEST_USER_ID || 'TEST001';
process.env.TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password';
process.env.TEST_SUPERVISOR_ID = process.env.TEST_SUPERVISOR_ID || 'EXEC002';
process.env.TEST_SUPERVISOR_PASSWORD = process.env.TEST_SUPERVISOR_PASSWORD || 'password';
process.env.TEST_CLERK_ID = process.env.TEST_CLERK_ID || 'LIMITED1766562318270';
process.env.TEST_CLERK_PASSWORD = process.env.TEST_CLERK_PASSWORD || 'password';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'audit/playwright-report' }],
    ['json', { outputFile: 'audit/test-results.json' }],
    ['list'],
  ],
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  use: {
    // Base URL - defaults to local dev server
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Capture video on failure
    video: 'retain-on-failure',
    
    // Headless mode (no UI)
    headless: true,
    
    // Viewport for consistent testing
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors for local dev
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Setup project for authentication state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Unauthenticated tests (routes, critical flows without login)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
      testMatch: /routes\.spec\.ts|critical-flows\.spec\.ts|api-contracts\.spec\.ts/,
    },
    
    // Authenticated tests (require setup to run first)
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: /authenticated-flows\.spec\.ts|js-error-audit\.spec\.ts/,
      dependencies: ['setup'],
    },
    
    // Mobile viewport tests
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
      },
      testMatch: /routes\.spec\.ts|critical-flows\.spec\.ts/,
    },
  ],

  // Web server configuration - starts the app before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});


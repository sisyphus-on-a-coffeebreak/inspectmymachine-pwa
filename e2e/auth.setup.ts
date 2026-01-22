import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');
const adminAuthFile = path.join(__dirname, '../.playwright/.auth/admin.json');
const supervisorAuthFile = path.join(__dirname, '../.playwright/.auth/supervisor.json');
const clerkAuthFile = path.join(__dirname, '../.playwright/.auth/clerk.json');

async function authenticateViaAPI(
  page: import('@playwright/test').Page,
  employeeId: string,
  password: string,
  roleName: string
): Promise<boolean> {
  try {
    console.log(`🔐 Authenticating as ${roleName}: ${employeeId}`);
    
    // First navigate to the app to establish context
    await page.goto('http://localhost:5173/login');
    
    // Use page.evaluate to make both CSRF and login requests with proper cookie handling
    const loginResult = await page.evaluate(async ({ employeeId, password }) => {
      // Step 1: Get CSRF cookie
      const csrfResponse = await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!csrfResponse.ok && csrfResponse.status !== 204) {
        return {
          ok: false,
          status: csrfResponse.status,
          body: 'CSRF request failed',
          step: 'csrf',
        };
      }
      
      // Step 2: Login with credentials
      const loginResponse = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: employeeId,
          password: password,
        }),
      });
      
      const text = await loginResponse.text();
      return {
        ok: loginResponse.ok,
        status: loginResponse.status,
        body: text,
        step: 'login',
      };
    }, { employeeId, password });

    if (loginResult.step === 'csrf') {
      console.log(`❌ ${roleName} - CSRF request failed: ${loginResult.status}`);
      return false;
    }

    console.log(`   Login response status: ${loginResult.status}`);

    if (!loginResult.ok) {
      console.log(`   Error: ${loginResult.body}`);
      console.log(`❌ ${roleName} login failed`);
      return false;
    }

    try {
      const data = JSON.parse(loginResult.body);
      
      if (data.message === 'Login successful' || data.user) {
        console.log(`✅ ${roleName} login successful`);
        // Navigate to dashboard to complete authentication
        await page.goto('http://localhost:5173/dashboard');
        await page.waitForTimeout(1000);
        return true;
      }
      
      console.log(`⚠️  ${roleName} - unexpected response`);
      return false;
    } catch (parseError) {
      console.log(`❌ ${roleName} - failed to parse response`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${roleName} error:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

setup.describe('Authentication Setup', () => {
  setup('authenticate as standard user (inspector)', async ({ page }) => {
    const employeeId = process.env.TEST_USER_ID || 'TEST001';
    const password = process.env.TEST_USER_PASSWORD || 'test123';
    
    const success = await authenticateViaAPI(page, employeeId, password, 'Standard User');
    
    if (success) {
      await page.context().storageState({ path: authFile });
      console.log(`📁 User auth state saved to ${authFile}`);
    } else {
      console.log('⚠️  Skipping user auth state save - login failed');
      setup.skip();
    }
  });

  setup('authenticate as admin user (super_admin)', async ({ page }) => {
    const adminId = process.env.TEST_ADMIN_ID || 'SUPER001';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'super123';
    
    const success = await authenticateViaAPI(page, adminId, adminPassword, 'Admin');
    
    if (success) {
      await page.context().storageState({ path: adminAuthFile });
      console.log(`📁 Admin auth state saved to ${adminAuthFile}`);
    } else {
      console.log('⚠️  Skipping admin auth state save - login failed');
      setup.skip();
    }
  });

  setup('authenticate as supervisor', async ({ page }) => {
    const supervisorId = process.env.TEST_SUPERVISOR_ID || 'EXEC002';
    const supervisorPassword = process.env.TEST_SUPERVISOR_PASSWORD || 'exec123';
    
    const success = await authenticateViaAPI(page, supervisorId, supervisorPassword, 'Supervisor');
    
    if (success) {
      await page.context().storageState({ path: supervisorAuthFile });
      console.log(`📁 Supervisor auth state saved to ${supervisorAuthFile}`);
    } else {
      console.log('⚠️  Skipping supervisor auth state save - login failed');
      setup.skip();
    }
  });

  setup('authenticate as clerk (limited permissions)', async ({ page }) => {
    const clerkId = process.env.TEST_CLERK_ID || 'LIMITED1766562318270';
    const clerkPassword = process.env.TEST_CLERK_PASSWORD || 'limited123';
    
    const success = await authenticateViaAPI(page, clerkId, clerkPassword, 'Clerk');
    
    if (success) {
      await page.context().storageState({ path: clerkAuthFile });
      console.log(`📁 Clerk auth state saved to ${clerkAuthFile}`);
    } else {
      console.log('⚠️  Skipping clerk auth state save - login failed');
      setup.skip();
    }
  });
});

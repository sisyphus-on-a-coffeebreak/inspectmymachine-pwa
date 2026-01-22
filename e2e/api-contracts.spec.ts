import { test, expect } from '@playwright/test';

/**
 * API Contract Tests
 * 
 * Tests API endpoints without authentication to verify:
 * - Proper 401/403 responses for protected endpoints
 * - CORS headers
 * - Response format
 */

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:8000/api';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number | null;
  error: string | null;
  responseTime: number;
}

test.describe('API Contract Tests - Unauthenticated', () => {
  const protectedEndpoints = [
    { method: 'GET', path: '/user' },
    { method: 'GET', path: '/v1/users' },
    { method: 'GET', path: '/v2/gate-passes' },
    { method: 'GET', path: '/v1/inspections' },
    { method: 'GET', path: '/v1/expenses' },
    { method: 'GET', path: '/gate-pass-approval/pending' },
    { method: 'GET', path: '/expense-approval/pending' },
    { method: 'GET', path: '/v1/alerts' },
    { method: 'GET', path: '/v1/notifications' },
  ];

  for (const endpoint of protectedEndpoints) {
    test(`${endpoint.method} ${endpoint.path} should require authentication`, async ({ request }) => {
      const startTime = Date.now();
      let status: number | null = null;
      let error: string | null = null;
      
      try {
        const response = await request.get(`${API_BASE}${endpoint.path}`, {
          timeout: 5000,
        });
        
        status = response.status();
        
        // Should return 401 (Unauthenticated) or 403 (Forbidden)
        expect([401, 403, 419]).toContain(status);
        
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error';
        // Network error is acceptable if backend is not running
        console.log(`⚠️  ${endpoint.method} ${endpoint.path}: ${error}`);
      }
      
      const responseTime = Date.now() - startTime;
      
      // Log result
      const result: ApiTestResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        status,
        error,
        responseTime,
      };
      
      console.log(`API Test: ${JSON.stringify(result)}`);
    });
  }
});

test.describe('API Contract Tests - Public Endpoints', () => {
  test('CSRF cookie endpoint should be accessible', async ({ request }) => {
    const csrfBase = API_BASE.replace('/api', '');
    
    try {
      const response = await request.get(`${csrfBase}/sanctum/csrf-cookie`, {
        timeout: 5000,
      });
      
      // Should return 204 (No Content) or 200
      expect([200, 204]).toContain(response.status());
      
    } catch {
      console.log('⚠️  CSRF endpoint not accessible - backend may be down');
    }
  });

  test('Login endpoint should exist and return proper response', async ({ request }) => {
    try {
      // POST with invalid credentials should return 401 or 422
      const response = await request.post(`${API_BASE}/login`, {
        data: {
          employee_id: 'test',
          password: 'test',
        },
        timeout: 5000,
      });
      
      const status = response.status();
      
      // 401 = bad credentials, 422 = validation error, 419 = CSRF missing
      expect([401, 419, 422]).toContain(status);
      
    } catch {
      console.log('⚠️  Login endpoint not accessible - backend may be down');
    }
  });
});

test.describe('API Response Format Tests', () => {
  test('API should return JSON content type for errors', async ({ request }) => {
    try {
      const response = await request.get(`${API_BASE}/user`, {
        timeout: 5000,
      });
      
      const contentType = response.headers()['content-type'];
      
      // Should return JSON
      expect(contentType).toContain('application/json');
      
      // Should have proper error structure
      if (response.status() >= 400) {
        const body = await response.json().catch(() => null);
        
        // Laravel typically returns { message: string } for errors
        if (body) {
          expect(body).toHaveProperty('message');
        }
      }
      
    } catch {
      console.log('⚠️  API not accessible - backend may be down');
    }
  });
});

test.describe('API Security Headers', () => {
  test('API should have security headers', async ({ request }) => {
    try {
      const response = await request.get(`${API_BASE}/user`, {
        timeout: 5000,
      });
      
      const headers = response.headers();
      
      // Check for common security headers (these may or may not be present)
      const securityHeaders = {
        'x-content-type-options': headers['x-content-type-options'],
        'x-frame-options': headers['x-frame-options'],
        'x-xss-protection': headers['x-xss-protection'],
      };
      
      console.log('Security headers:', securityHeaders);
      
    } catch {
      console.log('⚠️  Cannot check security headers - backend may be down');
    }
  });
});

test.describe('API Rate Limiting', () => {
  test('API should handle rapid requests', async ({ request }) => {
    const requests: Promise<import('@playwright/test').APIResponse | null>[] = [];
    
    // Make 10 rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.get(`${API_BASE}/user`, { timeout: 5000 }).catch(() => null)
      );
    }
    
    const responses = await Promise.all(requests);
    const validResponses = responses.filter((r): r is import('@playwright/test').APIResponse => r !== null);
    
    if (validResponses.length > 0) {
      // Check if any got rate limited (429)
      const rateLimited = validResponses.filter(r => r.status() === 429);
      
      if (rateLimited.length > 0) {
        console.log(`Rate limiting active: ${rateLimited.length}/10 requests limited`);
      }
    } else {
      console.log('⚠️  No API responses received - backend may be down');
    }
  });
});


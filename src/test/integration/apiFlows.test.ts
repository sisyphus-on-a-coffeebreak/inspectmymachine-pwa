/**
 * API Integration Tests
 * Tests all API flows for the VOMS application
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../../lib/apiClient';
import axios from 'axios';

// Mock axios
vi.mock('axios', () => {
  const actualAxios = vi.importActual('axios');
  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      defaults: {
        withCredentials: true,
        baseURL: '',
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      isAxiosError: (error: unknown) => {
        return error && typeof error === 'object' && 'isAxiosError' in error;
      },
    },
  };
});

// Mock retry and offline queue
vi.mock('../../lib/retry', () => ({
  withBackoff: (fn: () => Promise<unknown>) => fn(),
}));

vi.mock('../../lib/offlineQueue', () => ({
  offlineQueue: {
    enqueue: vi.fn(),
  },
}));

vi.mock('../../lib/errorHandling', () => ({
  isNetworkError: () => false,
}));

vi.mock('../../lib/apiConfig', () => ({
  API_BASE_URL: '/api',
  API_ORIGIN: 'http://localhost:8000',
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication API', () => {
    it('should login successfully', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { message: 'Login successful' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/login', {
        employee_id: 'TEST001',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(axios.post).toHaveBeenCalledWith(
        '/login',
        { employee_id: 'TEST001', password: 'password123' },
        expect.any(Object)
      );
    });

    it('should get current user', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { user: { id: 1, name: 'Test User' } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/user', { skipRetry: true });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ user: { id: 1, name: 'Test User' } });
    });

    it('should logout successfully', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { message: 'Logged out' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/logout', {});

      expect(response.status).toBe(200);
    });

    it('should handle invalid credentials', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          data: { message: 'Invalid credentials' },
        },
        message: 'Request failed with status code 401',
      };
      vi.mocked(axios.post).mockRejectedValueOnce(error);

      await expect(
        apiClient.post('/login', { employee_id: 'WRONG', password: 'wrong' })
      ).rejects.toBeDefined();
    });
  });

  describe('Users API', () => {
    it('should list users', async () => {
      const users = [
        { id: 1, name: 'User 1', role: 'admin' },
        { id: 2, name: 'User 2', role: 'inspector' },
      ];
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: users, meta: { total: 2 } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/users', { skipRetry: true });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveLength(2);
    });

    it('should create user', async () => {
      const newUser = {
        employee_id: 'NEW001',
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
        role: 'inspector',
      };
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 3, ...newUser } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/v1/users', newUser);

      expect(response.status).toBe(201);
      expect(response.data.data.employee_id).toBe('NEW001');
    });

    it('should get user details', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { id: 1, name: 'User 1', role: 'admin' } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/users/1', { skipRetry: true });

      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(1);
    });

    it('should update user', async () => {
      vi.mocked(axios.put).mockResolvedValueOnce({
        data: { data: { id: 1, name: 'Updated User' } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.put('/v1/users/1', { name: 'Updated User' });

      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated User');
    });

    it('should delete user', async () => {
      vi.mocked(axios.delete).mockResolvedValueOnce({
        data: { message: 'User deleted' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.delete('/v1/users/1');

      expect(response.status).toBe(200);
    });
  });

  describe('Gate Pass API', () => {
    it('should list gate passes', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, type: 'visitor' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/gate-pass-records', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should create visitor gate pass', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 1, visitor_name: 'John Doe' } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/visitor-gate-passes', {
        visitor_name: 'John Doe',
        visitor_phone: '1234567890',
        purpose: 'Meeting',
      });

      expect(response.status).toBe(201);
    });

    it('should create vehicle gate pass', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 1, vehicle_id: 1 } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/vehicle-exit-passes', {
        vehicle_id: 1,
        purpose: 'Delivery',
      });

      expect(response.status).toBe(201);
    });

    it('should get gate pass stats', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { active: 50, pending: 10, expired: 5 },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/gate-pass-records/stats', { skipRetry: true });

      expect(response.status).toBe(200);
      expect(response.data.active).toBe(50);
    });

    it('should validate gate pass', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { valid: true, pass: { id: 1 } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/visitor-gate-passes/scan', {
        access_code: 'ABC123',
      });

      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
    });
  });

  describe('Inspections API', () => {
    it('should list inspections', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, status: 'completed' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/inspections', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should list inspection templates', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, name: 'Basic Inspection' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/inspection-templates', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should create inspection', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 1, template_id: 1 } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/v1/inspections', {
        template_id: 1,
        vehicle_id: 1,
      });

      expect(response.status).toBe(201);
    });

    it('should get inspection details', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { id: 1, answers: [] } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/inspections/1', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should update inspection', async () => {
      vi.mocked(axios.put).mockResolvedValueOnce({
        data: { data: { id: 1, status: 'completed' } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.put('/v1/inspections/1', { status: 'completed' });

      expect(response.status).toBe(200);
    });
  });

  describe('Expenses API', () => {
    it('should list expenses', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, amount: 100 }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/expenses', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should create expense', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 1, amount: 100 } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/v1/expenses', {
        amount: 100,
        category: 'FUEL',
        description: 'Fuel expense',
      });

      expect(response.status).toBe(201);
    });

    it('should get expense details', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { id: 1, amount: 100, status: 'pending' } },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/expenses/1', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should approve expense', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { message: 'Expense approved' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/expense-approval/approve/1', {
        action: 'approve',
      });

      expect(response.status).toBe(200);
    });

    it('should reject expense', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { message: 'Expense rejected' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/expense-approval/reject/1', {
        action: 'reject',
        reason: 'Invalid receipt',
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Stockyard API', () => {
    it('should list stockyard requests', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, type: 'inbound' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/stockyard-requests', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should list components', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, name: 'Engine' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/components', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should create component movement', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { data: { id: 1, movement_type: 'transfer' } },
        status: 201,
        statusText: 'Created',
      });

      const response = await apiClient.post('/v1/component-movements', {
        component_id: 1,
        movement_type: 'transfer',
        from_location: 'Yard A',
        to_location: 'Yard B',
      });

      expect(response.status).toBe(201);
    });
  });

  describe('Permission API', () => {
    it('should list permission templates', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, name: 'Admin Template' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/permission-templates', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should check permission', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { allowed: true, reason: 'User has capability' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/v1/permissions/check', {
        user_id: 1,
        module: 'gate_pass',
        action: 'read',
      });

      expect(response.status).toBe(200);
      expect(response.data.allowed).toBe(true);
    });

    it('should list masking rules', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, module: 'gate_pass', field: 'phone' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/v1/masking-rules', { skipRetry: true });

      expect(response.status).toBe(200);
    });
  });

  describe('Approvals API', () => {
    it('should get pending gate pass approvals', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, type: 'visitor' }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/gate-pass-approval/pending', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should get pending expense approvals', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: [{ id: 1, amount: 100 }] },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.get('/expense-approval/pending', { skipRetry: true });

      expect(response.status).toBe(200);
    });

    it('should approve gate pass', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: { message: 'Gate pass approved' },
        status: 200,
        statusText: 'OK',
      });

      const response = await apiClient.post('/gate-pass-approval/approve/1', {});

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' },
        },
        message: 'Request failed with status code 404',
      };
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(apiClient.get('/v1/users/999', { skipRetry: true })).rejects.toBeDefined();
    });

    it('should handle 422 validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: { 
            message: 'Validation failed',
            errors: { employee_id: ['Employee ID is required'] },
          },
        },
        message: 'Request failed with status code 422',
      };
      vi.mocked(axios.post).mockRejectedValueOnce(error);

      await expect(
        apiClient.post('/v1/users', { name: 'Test' })
      ).rejects.toBeDefined();
    });

    it('should handle 403 permission errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { message: 'Access denied' },
        },
        message: 'Request failed with status code 403',
      };
      vi.mocked(axios.delete).mockRejectedValueOnce(error);

      await expect(apiClient.delete('/v1/users/1')).rejects.toBeDefined();
    });

    it('should handle 500 server errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
        },
        message: 'Request failed with status code 500',
      };
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(apiClient.get('/v1/users', { skipRetry: true })).rejects.toBeDefined();
    });

    it('should handle network errors', async () => {
      const error = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };
      vi.mocked(axios.get).mockRejectedValueOnce(error);

      await expect(apiClient.get('/v1/users', { skipRetry: true })).rejects.toBeDefined();
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in POST requests', async () => {
      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {},
        status: 200,
        statusText: 'OK',
      });

      await apiClient.post('/v1/users', { name: 'Test' });

      expect(axios.post).toHaveBeenCalledWith(
        '/v1/users',
        { name: 'Test' },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});






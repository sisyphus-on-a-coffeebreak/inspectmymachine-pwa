/**
 * Tests for error handling utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getUserFriendlyError,
  getErrorToast,
  isPermissionError,
  getRequiredCapability,
  getPermissionErrorToast,
  requiresAuthRedirect,
  isNetworkError,
  isRetryableError,
} from '../errorHandling';

describe('errorHandling utilities', () => {
  describe('getUserFriendlyError', () => {
    it('handles 401 unauthorized errors', () => {
      const error = { response: { status: 401 } };
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Session Expired');
      expect(result.statusCode).toBe(401);
      expect(result.showRetry).toBe(false);
      expect(result.showGoBack).toBe(true);
    });
    
    it('handles 403 forbidden errors with required_capability', () => {
      const error = {
        response: {
          status: 403,
          data: {
            error: 'Forbidden',
            message: 'You do not have permission to create users',
            required_capability: 'user_management.create',
          },
        },
      };
      
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Access Denied');
      expect(result.statusCode).toBe(403);
      expect(result.requiredCapability).toBe('user_management.create');
      expect(result.message).toContain('create users');
      expect(result.message).toContain('administrator');
    });
    
    it('handles 403 forbidden errors without required_capability', () => {
      const error = {
        response: {
          status: 403,
          data: {
            error: 'Forbidden',
            message: 'Access denied',
          },
        },
      };
      
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Access Denied');
      expect(result.message).toBe('Access denied');
    });
    
    it('handles 403 with context but no backend message', () => {
      const error = { response: { status: 403, data: {} } };
      const result = getUserFriendlyError(error, 'delete this record');
      
      expect(result.message).toContain('delete this record');
    });
    
    it('generates readable labels for known capabilities', () => {
      const capabilities = [
        ['user_management.create', 'create users'],
        ['gate_pass.approve', 'approve gate passes'],
        ['expense.read', 'view expenses'],
        ['inspection.delete', 'delete inspections'],
      ];
      
      for (const [capability, expectedLabel] of capabilities) {
        const error = {
          response: {
            status: 403,
            data: { required_capability: capability },
          },
        };
        
        const result = getUserFriendlyError(error);
        expect(result.message).toContain(expectedLabel);
      }
    });
    
    it('handles unknown capabilities gracefully', () => {
      const error = {
        response: {
          status: 403,
          data: { required_capability: 'some_module.some_action' },
        },
      };
      
      const result = getUserFriendlyError(error);
      expect(result.message).toContain('some_action');
      expect(result.message).toContain('some module');
    });
    
    it('handles 404 not found errors', () => {
      const error = { response: { status: 404 } };
      const result = getUserFriendlyError(error, 'user');
      
      expect(result.title).toBe('Not Found');
      expect(result.message).toContain('user');
      expect(result.statusCode).toBe(404);
    });
    
    it('handles 422 validation errors', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['The email field is required.'],
            },
          },
        },
      };
      
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Validation Error');
      expect(result.message).toBe('The email field is required.');
      expect(result.statusCode).toBe(422);
    });
    
    it('handles 500 server errors', () => {
      const error = { response: { status: 500 } };
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Server Error');
      expect(result.severity).toBe('error');
      expect(result.showRetry).toBe(true);
    });
    
    it('handles network errors', () => {
      const error = { code: 'ERR_NETWORK' };
      const result = getUserFriendlyError(error);
      
      expect(result.title).toBe('Network Error');
      expect(result.showRetry).toBe(true);
    });
  });
  
  describe('isPermissionError', () => {
    it('returns true for 403 status', () => {
      const error = { response: { status: 403 } };
      expect(isPermissionError(error)).toBe(true);
    });
    
    it('returns false for other status codes', () => {
      expect(isPermissionError({ response: { status: 401 } })).toBe(false);
      expect(isPermissionError({ response: { status: 404 } })).toBe(false);
      expect(isPermissionError({ response: { status: 500 } })).toBe(false);
    });
    
    it('returns false for non-HTTP errors', () => {
      expect(isPermissionError(new Error('Something went wrong'))).toBe(false);
    });
  });
  
  describe('getRequiredCapability', () => {
    it('extracts required_capability from 403 response', () => {
      const error = {
        response: {
          status: 403,
          data: { required_capability: 'user_management.delete' },
        },
      };
      
      expect(getRequiredCapability(error)).toBe('user_management.delete');
    });
    
    it('returns undefined for non-403 errors', () => {
      const error = {
        response: {
          status: 401,
          data: { required_capability: 'something' },
        },
      };
      
      expect(getRequiredCapability(error)).toBeUndefined();
    });
    
    it('returns undefined when no required_capability in response', () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };
      
      expect(getRequiredCapability(error)).toBeUndefined();
    });
  });
  
  describe('getPermissionErrorToast', () => {
    it('returns toast props with capability info', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'You cannot delete users',
            required_capability: 'user_management.delete',
          },
        },
      };
      
      const toast = getPermissionErrorToast(error);
      
      expect(toast.title).toBe('Access Denied');
      expect(toast.variant).toBe('warning');
      expect(toast.duration).toBe(6000);
      expect(toast.requiredCapability).toBe('user_management.delete');
    });
  });
  
  describe('getErrorToast', () => {
    it('returns appropriate toast props for errors', () => {
      const error = { response: { status: 500 } };
      const toast = getErrorToast(error);
      
      expect(toast.variant).toBe('error');
      expect(toast.duration).toBe(6000);
    });
    
    it('returns warning variant for 403 errors', () => {
      const error = { response: { status: 403 } };
      const toast = getErrorToast(error);
      
      expect(toast.variant).toBe('warning');
      expect(toast.duration).toBe(4000);
    });
  });
  
  describe('requiresAuthRedirect', () => {
    it('returns true for 401 errors', () => {
      expect(requiresAuthRedirect({ response: { status: 401 } })).toBe(true);
    });
    
    it('returns true for 419 CSRF errors', () => {
      expect(requiresAuthRedirect({ response: { status: 419 } })).toBe(true);
    });
    
    it('returns false for other errors', () => {
      expect(requiresAuthRedirect({ response: { status: 403 } })).toBe(false);
      expect(requiresAuthRedirect({ response: { status: 500 } })).toBe(false);
    });
  });
  
  describe('isNetworkError', () => {
    it('returns true for ERR_NETWORK', () => {
      expect(isNetworkError({ code: 'ERR_NETWORK' })).toBe(true);
    });
    
    it('returns true for ECONNABORTED', () => {
      expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true);
    });
    
    it('returns false for HTTP errors', () => {
      expect(isNetworkError({ response: { status: 500 } })).toBe(false);
    });
  });
  
  describe('isRetryableError', () => {
    it('returns true for 429 rate limit errors', () => {
      expect(isRetryableError({ response: { status: 429 } })).toBe(true);
    });
    
    it('returns true for 419 CSRF errors', () => {
      expect(isRetryableError({ response: { status: 419 } })).toBe(true);
    });
    
    it('returns false for 403 permission errors', () => {
      expect(isRetryableError({ response: { status: 403 } })).toBe(false);
    });
    
    it('returns false for 400 bad request', () => {
      expect(isRetryableError({ response: { status: 400 } })).toBe(false);
    });
    
    it('returns true for network errors', () => {
      expect(isRetryableError({ code: 'ERR_NETWORK' })).toBe(true);
    });
  });
});






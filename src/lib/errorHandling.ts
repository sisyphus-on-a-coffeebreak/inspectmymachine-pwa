/**
 * Standardized Error Handling Utilities
 * 
 * Provides consistent error handling patterns across all modules:
 * - User-friendly error messages
 * - Toast notification helpers
 * - Error component props
 * - Status code handling
 */

import { normalizeError } from './apiClient';

// Re-export normalizeError for convenience
export { normalizeError };

export interface UserFriendlyError {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  showRetry: boolean;
  showGoBack: boolean;
  statusCode?: number;
  requiredCapability?: string;
}

/**
 * Permission error response from backend
 */
interface PermissionErrorResponse {
  error?: string;
  message?: string;
  required_capability?: string;
}

/**
 * Map of capability names to human-readable descriptions
 */
const CAPABILITY_LABELS: Record<string, string> = {
  // User Management
  'user_management.create': 'create users',
  'user_management.read': 'view users',
  'user_management.update': 'edit users',
  'user_management.delete': 'delete users',
  
  // Gate Pass
  'gate_pass.create': 'create gate passes',
  'gate_pass.read': 'view gate passes',
  'gate_pass.update': 'edit gate passes',
  'gate_pass.delete': 'delete gate passes',
  'gate_pass.approve': 'approve gate passes',
  'gate_pass.validate': 'validate gate passes',
  
  // Expense
  'expense.create': 'create expenses',
  'expense.read': 'view expenses',
  'expense.update': 'edit expenses',
  'expense.delete': 'delete expenses',
  'expense.approve': 'approve expenses',
  'expense.reassign': 'reassign expenses',
  
  // Inspection
  'inspection.create': 'create inspections',
  'inspection.read': 'view inspections',
  'inspection.update': 'edit inspections',
  'inspection.delete': 'delete inspections',
  'inspection.approve': 'approve inspections',
  'inspection.review': 'review inspections',
  
  // Reports
  'reports.read': 'view reports',
  'reports.export': 'export reports',
  
  // Permission Templates
  'permission_templates.create': 'create permission templates',
  'permission_templates.read': 'view permission templates',
  'permission_templates.update': 'edit permission templates',
  'permission_templates.delete': 'delete permission templates',
  
  // Data Masking
  'data_masking.create': 'create masking rules',
  'data_masking.read': 'view masking rules',
  'data_masking.update': 'edit masking rules',
  'data_masking.delete': 'delete masking rules',
};

/**
 * Get human-readable description for a capability
 */
function getCapabilityLabel(capability: string): string {
  if (CAPABILITY_LABELS[capability]) {
    return CAPABILITY_LABELS[capability];
  }
  
  // Generate label from capability string (e.g., "module.action" → "action module")
  const [module, action] = capability.split('.');
  if (module && action) {
    const moduleName = module.replace(/_/g, ' ');
    return `${action} ${moduleName}`;
  }
  
  return capability;
}

/**
 * Convert any error to a user-friendly error object
 */
export function getUserFriendlyError(error: unknown, context?: string): UserFriendlyError {
  const apiError = normalizeError(error);
  const status = apiError.status;
  
  // Extract retry-after header from axios error if available
  let retryAfter: string | undefined;
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { headers?: Record<string, string | string[]> } };
    if (axiosError.response?.headers) {
      const headers = axiosError.response.headers;
      retryAfter = typeof headers['retry-after'] === 'string' 
        ? headers['retry-after']
        : Array.isArray(headers['retry-after']) 
          ? headers['retry-after'][0]
          : typeof headers['x-ratelimit-reset'] === 'string'
            ? headers['x-ratelimit-reset']
            : Array.isArray(headers['x-ratelimit-reset'])
              ? headers['x-ratelimit-reset'][0]
              : undefined;
    }
  }
  
  // Handle specific status codes
  if (status === 401) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      severity: 'warning',
      showRetry: false,
      showGoBack: true,
      statusCode: 401,
    };
  }
  
  if (status === 403) {
    // Extract required_capability from backend response
    const errorData = apiError.data as PermissionErrorResponse | undefined;
    const requiredCapability = errorData?.required_capability;
    const backendMessage = errorData?.message;
    
    // Build user-friendly message
    let message: string;
    if (requiredCapability) {
      const capabilityLabel = getCapabilityLabel(requiredCapability);
      message = `You don't have permission to ${capabilityLabel}. Please contact your administrator if you need access.`;
    } else if (backendMessage) {
      message = backendMessage;
    } else if (context) {
      message = `You don't have permission to ${context}.`;
    } else {
      message = "You don't have permission to access this resource.";
    }
    
    return {
      title: 'Access Denied',
      message,
      severity: 'warning',
      showRetry: false,
      showGoBack: true,
      statusCode: 403,
      requiredCapability,
    };
  }
  
  if (status === 404) {
    return {
      title: 'Not Found',
      message: context
        ? `The ${context} was not found.`
        : 'The requested resource was not found.',
      severity: 'info',
      showRetry: false,
      showGoBack: true,
      statusCode: 404,
    };
  }
  
  if (status === 422) {
    // Validation errors - try to extract field-specific messages
    const validationMessage = extractValidationMessage(apiError.data);
    return {
      title: 'Validation Error',
      message: validationMessage || 'The data you provided is invalid. Please check your input.',
      severity: 'warning',
      showRetry: false,
      showGoBack: false,
      statusCode: 422,
    };
  }
  
  if (status === 429) {
    let message = 'Too many requests. Please wait a moment and try again.';
    
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        if (seconds < 60) {
          message = `Too many requests. Please wait ${seconds} second${seconds !== 1 ? 's' : ''} and try again.`;
        } else {
          const minutes = Math.ceil(seconds / 60);
          message = `Too many requests. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} and try again.`;
        }
      }
    }
    
    return {
      title: 'Rate Limit Exceeded',
      message,
      severity: 'warning',
      showRetry: true,
      showGoBack: false,
      statusCode: 429,
    };
  }
  
  if (status === 419) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please refresh the page and try again.',
      severity: 'warning',
      showRetry: true,
      showGoBack: false,
      statusCode: 419,
    };
  }
  
  if (status && status >= 500) {
    return {
      title: 'Server Error',
      message: 'A server error occurred. Please try again later or contact support if the problem persists.',
      severity: 'error',
      showRetry: true,
      showGoBack: true, // Allow users to go back when server errors occur
      statusCode: status,
    };
  }
  
  // Handle network errors
  if (apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED') {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      severity: 'error',
      showRetry: true,
      showGoBack: true,
    };
  }
  
  if (apiError.code === 'ERR_TIMEOUT') {
    return {
      title: 'Request Timeout',
      message: 'The request took too long to complete. Please try again.',
      severity: 'warning',
      showRetry: true,
      showGoBack: false,
    };
  }
  
  // Generic error
  return {
    title: 'Error',
    message: apiError.message || 'Something went wrong. Please try again.',
    severity: 'error',
    showRetry: true,
    showGoBack: false,
  };
}

/**
 * Extract validation error message from Laravel validation response
 */
function extractValidationMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  
  const errorData = data as Record<string, unknown>;
  
  // Laravel validation errors format: { errors: { field: [messages] } }
  if (errorData.errors && typeof errorData.errors === 'object') {
    const errors = errorData.errors as Record<string, string[]>;
    const firstField = Object.keys(errors)[0];
    const firstMessage = errors[firstField]?.[0];
    if (firstMessage) {
      return firstMessage;
    }
  }
  
  // Direct message field
  if (typeof errorData.message === 'string') {
    return errorData.message;
  }
  
  return null;
}

/**
 * Get toast notification props from error
 */
export function getErrorToast(error: unknown, context?: string) {
  const friendlyError = getUserFriendlyError(error, context);
  
  return {
    title: friendlyError.title,
    description: friendlyError.message,
    variant: friendlyError.severity === 'error' ? 'error' as const 
      : friendlyError.severity === 'warning' ? 'warning' as const 
      : 'info' as const,
    duration: friendlyError.severity === 'error' ? 6000 : 4000,
  };
}

/**
 * Check if error requires authentication redirect
 */
export function requiresAuthRedirect(error: unknown): boolean {
  const apiError = normalizeError(error);
  return apiError.status === 401 || apiError.status === 419;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const apiError = normalizeError(error);
  return apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const apiError = normalizeError(error);
  
  // Don't retry client errors (4xx) except 429 (rate limit) and 419 (CSRF)
  if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
    return apiError.status === 429 || apiError.status === 419;
  }
  
  // For server errors (5xx), don't retry unless it's a timeout
  // 500 errors are often permanent server issues that won't be fixed by retrying
  // If we have a response with a 5xx status, the server responded, so don't retry
  if (apiError.status && apiError.status >= 500) {
    // Only retry timeouts, not actual server errors
    return apiError.code === 'ERR_TIMEOUT';
  }
  
  // Retry network errors (no status code) - these are true network failures
  return isNetworkError(error);
}

/**
 * Get error message for display in UI components
 */
export function getErrorMessage(error: unknown, resource?: string): string {
  const friendlyError = getUserFriendlyError(error, resource);
  return friendlyError.message;
}

/**
 * Get error title for display in UI components
 */
export function getErrorTitle(error: unknown): string {
  const friendlyError = getUserFriendlyError(error);
  return friendlyError.title;
}

/**
 * Check if error is a permission/authorization error (403)
 */
export function isPermissionError(error: unknown): boolean {
  const apiError = normalizeError(error);
  return apiError.status === 403;
}

/**
 * Get required capability from a permission error
 * Returns undefined if not a permission error or no capability specified
 */
export function getRequiredCapability(error: unknown): string | undefined {
  const apiError = normalizeError(error);
  if (apiError.status !== 403) {
    return undefined;
  }
  
  const errorData = apiError.data as PermissionErrorResponse | undefined;
  return errorData?.required_capability;
}

/**
 * Get permission error toast with detailed capability information
 */
export function getPermissionErrorToast(error: unknown, action?: string) {
  const friendlyError = getUserFriendlyError(error, action);
  const requiredCapability = getRequiredCapability(error);
  
  return {
    title: friendlyError.title,
    description: friendlyError.message,
    variant: 'warning' as const,
    duration: 6000,
    requiredCapability,
  };
}


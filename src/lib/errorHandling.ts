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
}

/**
 * Convert any error to a user-friendly error object
 */
export function getUserFriendlyError(error: unknown, context?: string): UserFriendlyError {
  const apiError = normalizeError(error);
  const status = apiError.status;
  
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
    return {
      title: 'Access Denied',
      message: context 
        ? `You don't have permission to ${context}.`
        : "You don't have permission to access this resource.",
      severity: 'warning',
      showRetry: false,
      showGoBack: true,
      statusCode: 403,
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
    return {
      title: 'Too Many Requests',
      message: 'Too many requests. Please wait a moment and try again.',
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
  
  // For server errors (5xx), only retry network errors or if it's a temporary issue
  // 500 errors are often permanent server issues that won't be fixed by retrying
  if (apiError.status && apiError.status >= 500) {
    // Only retry if it's a network error or timeout, not actual server errors
    return isNetworkError(error) || apiError.code === 'ERR_TIMEOUT';
  }
  
  // Retry network errors (no status code)
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


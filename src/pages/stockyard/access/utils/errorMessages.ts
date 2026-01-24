/**
 * Gate Pass Error Message Utilities
 * 
 * Provides standardized error message handling for gate pass operations
 */

import { ERROR_MESSAGES } from '../constants';
import { getUserFriendlyError } from '@/lib/errorHandling';
import type { UserFriendlyError } from '@/lib/errorHandling';

/**
 * Get user-friendly error message for gate pass operations
 */
export function getGatePassErrorMessage(
  error: unknown,
  operation: keyof typeof ERROR_MESSAGES | 'GENERIC' = 'GENERIC',
  context?: string
): string {
  // First try to get a specific gate pass error message
  if (operation !== 'GENERIC' && ERROR_MESSAGES[operation]) {
    return ERROR_MESSAGES[operation];
  }

  // Fall back to general error handling
  const friendlyError = getUserFriendlyError(error, context);
  return friendlyError.message || ERROR_MESSAGES.GENERIC;
}

/**
 * Get full error details for gate pass operations
 */
export function getGatePassErrorDetails(
  error: unknown,
  operation: keyof typeof ERROR_MESSAGES | 'GENERIC' = 'GENERIC',
  context?: string
): UserFriendlyError {
  const friendlyError = getUserFriendlyError(error, context);
  
  // Override message with gate pass specific message if available
  if (operation !== 'GENERIC' && ERROR_MESSAGES[operation]) {
    return {
      ...friendlyError,
      message: ERROR_MESSAGES[operation],
    };
  }

  return friendlyError;
}

/**
 * Get error message for API operations
 */
export function getApiErrorMessage(error: unknown, defaultMessage: string): string {
  if (!error) {
    return defaultMessage;
  }

  // Check if it's an axios error
  const axiosError = error as any;
  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return defaultMessage;
}



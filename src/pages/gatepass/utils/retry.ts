/**
 * Retry Utility
 * 
 * Provides retry logic for transient failures
 */

import { RETRY_CONFIG, ERROR_MESSAGES } from '../constants';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Check if an error is retryable based on status code
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Check if it's an axios error with response
  const axiosError = error as any;
  if (axiosError.response?.status) {
    return RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(axiosError.response.status);
  }

  // Check if it's a network error (no response)
  if (axiosError.request && !axiosError.response) {
    return true; // Network errors are retryable
  }

  // Check if error message indicates retryable error
  const errorMessage = axiosError.message || String(error);
  const retryableMessages = ['timeout', 'network', 'ECONNRESET', 'ETIMEDOUT'];
  return retryableMessages.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    retryDelay = RETRY_CONFIG.RETRY_DELAY,
    retryDelayMultiplier = RETRY_CONFIG.RETRY_DELAY_MULTIPLIER,
    onRetry,
  } = options;

  let lastError: unknown;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        break;
      }

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retrying (exponential backoff)
      await sleep(currentDelay);
      currentDelay *= retryDelayMultiplier;
    }
  }

  // All retries exhausted
  const error = lastError instanceof Error
    ? lastError
    : new Error(lastError ? String(lastError) : ERROR_MESSAGES.GENERIC);

  return {
    success: false,
    error,
    attempts: maxRetries + 1,
  };
}

/**
 * Create a retryable function wrapper
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const result = await retryWithBackoff(() => fn(...args), options);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }) as T;
}


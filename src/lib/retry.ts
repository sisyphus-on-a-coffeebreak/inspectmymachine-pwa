import axios, { AxiosError } from 'axios';
import { isRetryableError, normalizeError } from './errorHandling';

export interface RetryOptions {
  tries?: number;
  baseMs?: number;
  maxDelayMs?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Extract Retry-After header value from error response
 */
function getRetryAfter(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  
  const axiosError = error as AxiosError;
  if (!axiosError.response?.headers) return null;
  
  const headers = axiosError.response.headers;
  const retryAfter = headers['retry-after'] || headers['Retry-After'];
  
  if (typeof retryAfter === 'string') {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000; // Convert to milliseconds
    }
  }
  
  return null;
}

/**
 * Enhanced retry logic with exponential backoff and jitter
 * 
 * Features:
 * - Smart retry detection using error handling utilities
 * - Exponential backoff with jitter to prevent thundering herd
 * - Configurable retry attempts and delays
 * - Retry callbacks for UI feedback
 * - Special handling for CSRF token errors (419)
 * - Respects Retry-After header for 429 rate limit errors
 */
export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    tries = 3,
    baseMs = 400,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  let lastErr: unknown;
  
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastErr = error;
      
      // Check if this is the last attempt
      if (attempt === tries - 1) {
        break;
      }
      
      // Check if error is retryable using our error handling utilities
      if (!isRetryableError(error)) {
        break;
      }
      
      const apiError = normalizeError(error);
      
      // Special handling for 429 rate limit errors - respect Retry-After header
      if (apiError.status === 429) {
        const retryAfter = getRetryAfter(error);
        if (retryAfter) {
          // Use the Retry-After value, but cap it at maxDelayMs
          const delay = Math.min(retryAfter, maxDelayMs);
          
          // Notify about retry if callback provided
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          // Wait for the specified retry-after period
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // If no Retry-After header, use exponential backoff with longer delay for 429
        const exponentialDelay = Math.max(baseMs * Math.pow(2, attempt + 2), 2000); // Minimum 2 seconds for 429
        const jitter = Math.random() * (baseMs * 0.3);
        const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
        
        // Notify about retry if callback provided
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Special handling for CSRF token errors (419)
      if (apiError.status === 419) {
        // For CSRF errors, we might want to refresh the token
        // This is handled by apiClient's ensureCsrfToken, so we just retry
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseMs * Math.pow(2, attempt);
      const jitter = Math.random() * (baseMs * 0.3); // 30% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);
      
      // Notify about retry if callback provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries exhausted, throw the last error
  throw lastErr;
}

/**
 * Retry with exponential backoff (backward compatibility)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { tries = 3, baseMs = 400 }: { tries?: number; baseMs?: number } = {}
): Promise<T> {
  return withBackoff(fn, { tries, baseMs });
}
  
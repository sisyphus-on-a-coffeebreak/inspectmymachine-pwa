/**
 * Unified API Client for VOMS
 * 
 * Provides type-safe, consistent API consumption across all modules:
 * - Gate Pass, Inspection Studio, Expense Management, User Management
 * - Automatic error handling, retry logic, and telemetry
 * - React Query integration for caching and background refresh
 * - Offline support with retry queues
 */

import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { withBackoff } from './retry';
import { offlineQueue } from './offlineQueue';
import { isNetworkError } from './errorHandling';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");
const BASE_URL = (import.meta.env.VITE_API_BASE || `${API_ORIGIN}/api`).replace(/\/$/, "");

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Add response interceptor to handle expected failures silently
// Note: Browser network errors in the console cannot be suppressed as they come
// from the browser's XHR/fetch API. However, we mark errors for our own logging suppression.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Mark errors that should be suppressed for our own logging
    const config = error.config as ApiRequestConfig | undefined;
    if (config?.suppressErrorLog && axios.isAxiosError(error)) {
      // Store a flag on the error to indicate it should be suppressed
      // Using a type assertion since we're adding a custom property
      (error as AxiosError & { __suppressLog?: boolean }).__suppressLog = true;
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  data?: unknown;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipRetry?: boolean;
  retryCount?: number;
  suppressErrorLog?: boolean; // Suppress console errors for expected failures (e.g., auth checks)
}

/**
 * Convert axios errors to standardized API errors
 */
function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return {
      message: axiosError.response?.data?.message || 
               axiosError.response?.data?.error ||
               axiosError.message ||
               'An unexpected error occurred',
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      code: axiosError.code,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
}

/**
 * Unified API client with automatic CSRF handling, retry logic, and error normalization
 */
class ApiClient {
  private csrfInitialized = false;

  /**
   * Get CSRF token from cookie
   */
  private getCsrfToken(): string | null {
    const cookies = document.cookie;
    const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  }

  /**
   * Initialize CSRF token (called automatically on first request)
   */
  private async ensureCsrfToken(): Promise<void> {
    if (this.csrfInitialized && this.getCsrfToken()) return;
    try {
      const csrfUrl = `${API_ORIGIN}/sanctum/csrf-cookie`;
      await axios.get(csrfUrl, {
        withCredentials: true,
        baseURL: '',
      });
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));
      this.csrfInitialized = true;
    } catch {
      // CSRF token initialization failed - will retry on next request
    }
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired)
      await this.ensureCsrfToken();
      return axios.get<T>(path, config);
    };
    
    try {
      const response = config?.skipRetry 
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Suppress console errors for expected failures (e.g., auth checks)
      const headers = config?.headers || {};
      const isAuthCheck = headers['X-Auth-Check'] === 'true' || 
                         (typeof headers === 'object' && 'common' in headers && 
                          typeof (headers as Record<string, unknown>).common === 'object' &&
                          (headers as Record<string, Record<string, unknown>>).common?.['X-Auth-Check'] === 'true');
      const isExpectedFailure = config?.suppressErrorLog || 
                               (isAuthCheck && axios.isAxiosError(error) && error.response?.status === 401) ||
                               (config?.suppressErrorLog && axios.isAxiosError(error) && error.response?.status === 404);
      
      if (!isExpectedFailure) {
        // Queue request if it's a network error and queueing is enabled
        if (isNetworkError(error) && !config?.skipRetry) {
          await offlineQueue.enqueue('GET', path, undefined, config, error);
        }
      }
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post<T = unknown>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired)
      await this.ensureCsrfToken();
      const csrfToken = this.getCsrfToken();
      
      return axios.post<T>(path, data, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      });
    };
    
    try {
      const response = config?.skipRetry
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Queue request if it's a network error and queueing is enabled
      if (isNetworkError(error) && !config?.skipRetry) {
        await offlineQueue.enqueue('POST', path, data, config, error);
      }
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      await this.ensureCsrfToken();
      const csrfToken = this.getCsrfToken();
      
      return axios.put<T>(path, data, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      });
    };
    
    try {
      const response = config?.skipRetry
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Queue request if it's a network error and queueing is enabled
      if (isNetworkError(error) && !config?.skipRetry) {
        await offlineQueue.enqueue('PUT', path, data, config, error);
      }
      throw error;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T = unknown>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      await this.ensureCsrfToken();
      const csrfToken = this.getCsrfToken();
      
      return axios.patch<T>(path, data, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      });
    };
    
    try {
      const response = config?.skipRetry
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Queue request if it's a network error and queueing is enabled
      if (isNetworkError(error) && !config?.skipRetry) {
        await offlineQueue.enqueue('PATCH', path, data, config, error);
      }
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = unknown>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      await this.ensureCsrfToken();
      const csrfToken = this.getCsrfToken();
      
      return axios.delete<T>(path, {
        ...config,
        headers: {
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      });
    };
    
    try {
      const response = config?.skipRetry
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Queue request if it's a network error and queueing is enabled
      if (isNetworkError(error) && !config?.skipRetry) {
        await offlineQueue.enqueue('DELETE', path, undefined, config, error);
      }
      throw error;
    }
  }

  /**
   * Upload a file (multipart/form-data)
   */
  async upload<T = unknown>(
    path: string,
    formData: FormData,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    await this.ensureCsrfToken();
    
    const requestFn = async () => {
      await this.ensureCsrfToken();
      const csrfToken = this.getCsrfToken();
      
      return axios.post<T>(path, formData, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      });
    };
    
    // For uploads, use fewer retries and longer delays to avoid timeout issues
    const response = config?.skipRetry
      ? await requestFn()
      : await withBackoff(requestFn, { 
          tries: config?.retryCount || 2, 
          baseMs: 1000,
          maxDelayMs: 8000,
        });

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export error normalization utility
export { normalizeError };

// Export axios instance for advanced use cases
export { axios as apiAxios };


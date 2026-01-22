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
import { API_BASE_URL, API_ORIGIN } from './apiConfig';

// Use centralized API base URL
const BASE_URL = API_BASE_URL;

// In development, allow disabling CSRF to avoid connection errors when server is down
const ENABLE_CSRF = import.meta.env.VITE_ENABLE_CSRF !== 'false';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = BASE_URL;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Track suppressed requests to avoid console spam
const suppressedRequests = new WeakSet<AxiosRequestConfig>();

// Add request interceptor to mark CSRF requests for suppression
axios.interceptors.request.use(
  (config) => {
    // Mark CSRF cookie requests for error suppression
    const url = (config.url || '').toString();
    if (url.includes('/sanctum/csrf-cookie')) {
      suppressedRequests.add(config);
      // Mark config to suppress errors
      (config as ApiRequestConfig).suppressErrorLog = true;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Permission error event for global handling
 */
export interface PermissionErrorEvent {
  url: string;
  method: string;
  requiredCapability?: string;
  message: string;
}

// Custom event for permission errors
const PERMISSION_ERROR_EVENT = 'voms:permission-error';

/**
 * Dispatch a permission error event that can be listened to globally
 */
function dispatchPermissionError(detail: PermissionErrorEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PERMISSION_ERROR_EVENT, { detail }));
  }
}

/**
 * Subscribe to permission error events
 * @returns Unsubscribe function
 */
export function onPermissionError(
  callback: (event: PermissionErrorEvent) => void
): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<PermissionErrorEvent>).detail);
  };
  
  if (typeof window !== 'undefined') {
    window.addEventListener(PERMISSION_ERROR_EVENT, handler);
    return () => window.removeEventListener(PERMISSION_ERROR_EVENT, handler);
  }
  
  return () => {};
}

// Add response interceptor to handle expected failures silently
// Note: Browser network errors in the console cannot be fully suppressed as they come
// from the browser's XHR/fetch API. However, we can minimize them.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Mark errors that should be suppressed for our own logging
    const config = error.config as ApiRequestConfig | undefined;
    const shouldSuppress = config?.suppressErrorLog || 
                          suppressedRequests.has(config as AxiosRequestConfig) ||
                          (axios.isAxiosError(error) && 
                           (error.code === 'ERR_CONNECTION_REFUSED' || 
                            error.code === 'ERR_NETWORK' ||
                            error.message?.includes('ERR_CONNECTION_REFUSED')));
    
    if (shouldSuppress && axios.isAxiosError(error)) {
      // Store a flag on the error to indicate it should be suppressed
      (error as AxiosError & { __suppressLog?: boolean }).__suppressLog = true;
    }
    
    // Handle 403 permission errors - dispatch global event (unless suppressed)
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const config = error.config as ApiRequestConfig | undefined;
      const shouldSuppressPermissionError = config?.suppressPermissionError;
      
      if (!shouldSuppressPermissionError) {
        const responseData = error.response.data as {
          error?: string;
          message?: string;
          required_capability?: string;
        } | undefined;
        
        dispatchPermissionError({
          url: error.config?.url || '',
          method: error.config?.method?.toUpperCase() || 'GET',
          requiredCapability: responseData?.required_capability,
          message: responseData?.message || "You don't have permission to perform this action.",
        });
      }
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
  response?: {
    headers?: Record<string, string>;
  };
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
  suppressPermissionError?: boolean; // Suppress permission error events for expected 403s (e.g., permission checks)
}

/**
 * Convert axios errors to standardized API errors
 */
function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    // Extract headers for rate limiting
    const headers: Record<string, string> = {};
    if (axiosError.response?.headers) {
      Object.keys(axiosError.response.headers).forEach(key => {
        const value = axiosError.response?.headers[key];
        if (typeof value === 'string') {
          headers[key.toLowerCase()] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          headers[key.toLowerCase()] = value[0];
        }
      });
    }
    
    return {
      message: axiosError.response?.data?.message || 
               axiosError.response?.data?.error ||
               axiosError.message ||
               'An unexpected error occurred',
      status: axiosError.response?.status,
      statusText: axiosError.response?.statusText,
      data: axiosError.response?.data,
      code: axiosError.code,
      response: Object.keys(headers).length > 0 ? { headers } : undefined,
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
  private csrfInitializing = false;
  private serverUnavailable = false;
  private lastServerCheck = 0;
  private csrfFailedPermanently = false; // If CSRF fails once, don't try again
  private readonly SERVER_CHECK_INTERVAL = 30000; // Check every 30 seconds

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
   * Check if server is available (with caching to avoid excessive checks)
   * Uses a lightweight approach that doesn't make network requests
   */
  private async checkServerAvailability(): Promise<boolean> {
    const now = Date.now();
    // Only check if enough time has passed since last check
    if (now - this.lastServerCheck < this.SERVER_CHECK_INTERVAL) {
      return !this.serverUnavailable;
    }
    
    // Don't make a network request to check - instead, we'll try CSRF once
    // and if it fails, mark server as unavailable
    // This prevents the check itself from causing console errors
    return !this.serverUnavailable;
  }

  /**
   * Initialize CSRF token (called automatically on first request)
   * Silently fails if server is unavailable - won't block requests
   * If it fails once, it won't try again to avoid console spam
   */
  private async ensureCsrfToken(): Promise<void> {
    // Skip CSRF entirely if disabled via environment variable
    if (!ENABLE_CSRF) {
      return;
    }

    // If CSRF failed permanently (server not available), don't try again
    if (this.csrfFailedPermanently) {
      return;
    }

    // If we already have a token, no need to reinitialize
    if (this.csrfInitialized && this.getCsrfToken()) return;
    
    // If server is known to be unavailable, skip entirely
    if (this.serverUnavailable && Date.now() - this.lastServerCheck < this.SERVER_CHECK_INTERVAL) {
      this.csrfFailedPermanently = true; // Mark as permanently failed
      return;
    }
    
    // If already initializing, wait for it
    if (this.csrfInitializing) {
      // Wait up to 2 seconds for initialization
      let waited = 0;
      while (this.csrfInitializing && waited < 2000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waited += 100;
      }
      return;
    }

    // Check if server is available (cached check, no network request)
    const serverAvailable = await this.checkServerAvailability();
    if (!serverAvailable) {
      // Server unavailable - skip CSRF initialization silently
      // Don't make any network requests
      this.csrfFailedPermanently = true; // Mark as permanently failed
      return;
    }

    this.csrfInitializing = true;
    this.lastServerCheck = Date.now();
    
    try {
      const csrfUrl = API_ORIGIN.endsWith('/api') 
        ? `${API_ORIGIN.replace(/\/api$/, '')}/sanctum/csrf-cookie`
        : `${API_ORIGIN}/sanctum/csrf-cookie`;
      
      // Create a request with error suppression and short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Shorter timeout
      
      try {
        // Use fetch with minimal error handling - catch and suppress
        const response = await fetch(csrfUrl, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          // Add cache control to prevent browser from logging
          cache: 'no-store',
        }).catch((err) => {
          // Mark server as unavailable on any error and don't try again
          this.serverUnavailable = true;
          this.csrfFailedPermanently = true;
          return null;
        });
        
        if (response && response.ok) {
          // Small delay to ensure cookie is set
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Only mark as initialized if we actually got a token
          if (this.getCsrfToken()) {
            this.csrfInitialized = true;
            this.serverUnavailable = false;
            this.csrfFailedPermanently = false; // Reset on success
          } else {
            // No token received - server might not be fully ready
            this.serverUnavailable = true;
            this.csrfFailedPermanently = true;
          }
        } else if (response === null) {
          // Fetch failed - server unavailable, don't try again
          this.serverUnavailable = true;
          this.csrfFailedPermanently = true;
        }
      } catch (error) {
        // Silently handle CSRF initialization failures
        // This is expected when server is not available
        // Mark as permanently failed to avoid retrying
        this.serverUnavailable = true;
        this.csrfFailedPermanently = true;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Silently handle CSRF initialization failures
      // This is expected when server is not available
      // Mark as permanently failed to avoid retrying
      this.serverUnavailable = true;
      this.csrfFailedPermanently = true;
    } finally {
      this.csrfInitializing = false;
    }
  }

  /**
   * Make a GET request
   */
  async get<T = unknown>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
      };
      
      return axios.get<T>(path, requestConfig);
    };
    
    try {
      const response = config?.skipRetry 
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      // Reset server unavailable flag on success
      if (this.serverUnavailable) {
        this.serverUnavailable = false;
      }

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Suppress console errors for expected failures (e.g., auth checks, server unavailable)
      const headers = config?.headers || {};
      const isAuthCheck = headers['X-Auth-Check'] === 'true' || 
                         (typeof headers === 'object' && 'common' in headers && 
                          typeof (headers as Record<string, unknown>).common === 'object' &&
                          (headers as Record<string, Record<string, unknown>>).common?.['X-Auth-Check'] === 'true');
      const isExpectedFailure = config?.suppressErrorLog || 
                               this.serverUnavailable ||
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
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      const csrfToken = this.getCsrfToken();
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      };
      
      return axios.post<T>(path, data, requestConfig);
    };
    
    try {
      const response = config?.skipRetry
        ? await requestFn()
        : await withBackoff(requestFn, { 
            tries: config?.retryCount || 3, 
            baseMs: 400,
            maxDelayMs: 5000,
          });

      // Reset server unavailable flag on success
      if (this.serverUnavailable) {
        this.serverUnavailable = false;
      }

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Enhanced error logging for debugging
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: Record<string, string[]> }>;
        const responseData = axiosError.response?.data;
        console.error('[apiClient] POST request failed:', {
          url: path,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          responseData: responseData,
          responseMessage: responseData?.message || responseData?.error || 'No error message',
          responseErrors: responseData?.errors,
          requestData: data,
          requestDataStringified: JSON.stringify(data, null, 2),
          message: axiosError.message,
          code: axiosError.code,
        });
        
        // Also log the full response for debugging
        if (responseData) {
          console.error('[apiClient] Full response data:', JSON.stringify(responseData, null, 2));
        }
      } else {
        console.error('[apiClient] POST request error (non-axios):', error);
      }

      // Queue request if it's a network error and queueing is enabled
      if (isNetworkError(error) && !config?.skipRetry && !this.serverUnavailable) {
        await offlineQueue.enqueue('POST', path, data, config, error);
      }
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = unknown>(path: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      const csrfToken = this.getCsrfToken();
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      };
      
      return axios.put<T>(path, data, requestConfig);
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
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      const csrfToken = this.getCsrfToken();
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      };
      
      return axios.patch<T>(path, data, requestConfig);
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
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      const csrfToken = this.getCsrfToken();
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
        headers: {
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      };
      
      return axios.delete<T>(path, requestConfig);
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
    // Only ensure CSRF token if not skipping auth, server might be available, and CSRF hasn't failed permanently
    if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
      await this.ensureCsrfToken();
    }
    
    const requestFn = async () => {
      // Re-ensure CSRF token on retry (in case it expired) - but only if server is available and CSRF hasn't failed
      if (!config?.skipAuth && !this.serverUnavailable && !this.csrfFailedPermanently) {
        await this.ensureCsrfToken();
      }
      const csrfToken = this.getCsrfToken();
      
      // Mark config to suppress errors if server is unavailable
      const requestConfig: ApiRequestConfig = {
        ...config,
        suppressErrorLog: config?.suppressErrorLog || this.serverUnavailable || this.csrfFailedPermanently,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          ...config?.headers,
        },
      };
      
      return axios.post<T>(path, formData, requestConfig);
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


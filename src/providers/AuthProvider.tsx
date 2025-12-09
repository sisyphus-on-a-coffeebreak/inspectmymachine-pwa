import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AxiosError } from "axios";
import { apiClient, normalizeError } from "../lib/apiClient";
import { AuthContext } from "./AuthContext";
import type { User, AuthContextType, ApiErrorResponse } from "./authTypes";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://api.inspectmymachine.in/api" : "http://localhost:8000/api");
const API_BASE = (import.meta.env.VITE_API_BASE || API_ORIGIN).replace(/\/$/, "");

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_BASE;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    // Install axios interceptors once (response only)

    let retrying = false;
    const res = axios.interceptors.response.use(
      (r) => r,
      async (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';
        const method = error?.config?.method?.toLowerCase() || '';
        const headers = error?.config?.headers || {};
        const isAuthCheck = (url.includes('/user') || url.endsWith('/user')) && method === 'get';
        const isAuthCheckHeader = headers['X-Auth-Check'] === 'true' || (headers as any).common?.['X-Auth-Check'] === 'true';
        const skipRetry = error?.config?.skipRetry === true;
        
        // Don't retry 401s for auth check requests or requests with skipRetry flag
        // These are expected when user is not logged in
        if (status === 401 && (isAuthCheck || isAuthCheckHeader || skipRetry)) {
          setUser(null);
          // Suppress error logging for expected auth check failures
          return Promise.reject(error);
        }
        
        // 419 CSRF or 401 unauthenticated → try to refresh CSRF + retry once
        // But only if not already retrying and not an auth check
        // Skip if it's a connection error (server unavailable)
        const isConnectionError = !error.response && (error.code === 'ERR_CONNECTION_REFUSED' || error.code === 'ERR_NETWORK');
        if ((status === 419 || status === 401) && !retrying && !isAuthCheck && !isAuthCheckHeader && !skipRetry && !isConnectionError) {
          try {
            retrying = true;
            const csrfUrl = API_ORIGIN.endsWith('/api') 
              ? `${API_ORIGIN.replace(/\/api$/, '')}/sanctum/csrf-cookie`
              : `${API_ORIGIN}/sanctum/csrf-cookie`;
            await axios.get(csrfUrl, {
              withCredentials: true,
              baseURL: '', // Override baseURL to use full URL
            });
            return await axios.request(error.config);
          } catch {
            // Fall through to logout / propagate
          } finally {
            retrying = false;
          }
        }

        // If still unauthorized, clear user
        if (status === 401) {
          setUser(null);
          // Silently handle 401 errors - don't spam console
          // The error will be handled by the calling code
        }
        return Promise.reject(error);
      }
    );

    // CSRF token initialization is handled automatically by apiClient on first request
    // No need to pre-initialize - it will happen when needed
    checkAuth();

    return () => {
      axios.interceptors.response.eject(res);
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Add timeout to prevent hanging on connection errors
      // Reduced to 2 seconds for faster initial render
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 2000);
      });
      
      // Mark this request as an auth check by using a custom header that the interceptor can check
      const response = await Promise.race([
        apiClient.get<{ user: User }>("/user", {
        skipRetry: true, // Don't retry on 401 - user is just not authenticated
        suppressErrorLog: true, // Suppress console errors for expected auth check failures
        headers: {
          'X-Auth-Check': 'true', // Custom header to identify auth check requests
        },
        } as any),
        timeoutPromise
      ]) as any;
      
      // Handle both { user: User } and direct User response formats
      setUser((response.data as any).user || response.data);
    } catch (err) {
      // Silently handle authentication check failures
      // 401 means user is not logged in, which is fine
      // Timeout or connection errors are also fine - just assume not authenticated
      // This is expected behavior, not an error
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (employeeId: string, password: string) => {
    try {
      // apiClient automatically handles CSRF token initialization
      // Step 1: Login - apiClient handles CSRF and headers automatically
      await apiClient.post("/login", {
        employee_id: employeeId.trim(),
        password: password,
      });

      // Step 2: Get user data
      const response = await apiClient.get<{ user: User }>("/user");
      // Handle both { user: User } and direct User response formats
      setUser((response.data as any).user || response.data);
    } catch (err) {
      const apiError = normalizeError(err);
      
      // Handle 500 Internal Server Error
      if (apiError.status === 500) {
        throw new Error(
          'Server error occurred. Please contact support if this persists.'
        );
      }

      // Handle validation errors (422)
      if (apiError.status === 422) {
        const errorData = apiError.data as { errors?: Record<string, string[]>; message?: string };
        
        // Log the full error for debugging (only in development)
        if (import.meta.env.DEV) {
          logger.debug('Validation error details', errorData, 'AuthProvider');
        }
        
        if (errorData && typeof errorData === 'object' && 'errors' in errorData) {
          // Laravel validation errors - format all errors
          const errors = errorData.errors as Record<string, string[]>;
          const errorMessages = Object.entries(errors)
            .flatMap(([field, messages]) => messages.map(msg => `${field}: ${msg}`));
          
          // Show the first error, or all errors if there are multiple
          const errorMessage = errorMessages.length > 0 
            ? errorMessages[0] 
            : 'Validation failed. Please check your credentials.';
          
          throw new Error(errorMessage);
        }
        throw new Error(errorData?.message || 'Invalid credentials. Please check your employee ID and password.');
      }

      // Handle other errors
      throw new Error(apiError.message || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await apiClient.post("/logout", {});
      setUser(null);
    } catch (err) {
      // Even if logout fails on server, clear local state
      setUser(null);
    }
  };

  // Legacy fetchJson for backward compatibility with existing modules
  const fetchJson = async <T = unknown,>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      
      const response = await fetch(fullUrl, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as ApiErrorResponse).message || 
          `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    fetchJson,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AxiosError } from "axios";
import { AuthContext } from "./AuthContext";
import type { User, AuthContextType, ApiErrorResponse } from "./authTypes";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");
const API_BASE = (import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? "https://api.inspectmymachine.in/api" : `${API_ORIGIN}/api`)
).replace(/\/$/, "");

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
        // 419 CSRF or 401 unauthenticated → try to refresh CSRF + retry once
        if ((status === 419 || status === 401) && !retrying) {
          try {
            retrying = true;
            const csrfUrl = `${API_ORIGIN}/sanctum/csrf-cookie`;
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

    // Initialize CSRF token
    const initCSRF = async () => {
      try {
        // Use API_ORIGIN (not API_BASE) for Sanctum CSRF cookie
        const csrfUrl = `${API_ORIGIN}/sanctum/csrf-cookie`;
        await axios.get(csrfUrl, {
          withCredentials: true,
          baseURL: '', // Override baseURL to use full URL
        });
        console.log('CSRF token initialized');
      } catch (error) {
        console.warn('Failed to initialize CSRF token:', error);
      }
    };

    initCSRF();
    checkAuth();

    return () => {
      axios.interceptors.response.eject(res);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get<{ user: User }>("/user", {
        // Don't retry on 401 - user is just not authenticated
        validateStatus: (status) => status < 500
      });
      setUser(response.data.user);  // 🎯 Extract the nested user object
    } catch (err) {
      // Silently handle authentication check failures
      // 401 means user is not logged in, which is fine
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (employeeId: string, password: string) => {
    try {
      // Step 1: Get CSRF token - use API_ORIGIN (not API_BASE) for Sanctum
      const csrfUrl = `${API_ORIGIN}/sanctum/csrf-cookie`;
      console.log('[Auth] Fetching CSRF token from:', csrfUrl);

      await axios.get(csrfUrl, {
        withCredentials: true,
        baseURL: '', // Override baseURL to use full URL
      });

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 2: Login - use API_ORIGIN for login endpoint
      const loginUrl = `${API_ORIGIN}/api/login`;
      console.log('[Auth] Sending login request to:', loginUrl);
      console.log('[Auth] Request payload:', { employee_id: employeeId.trim(), password: '[REDACTED]' });

      const loginResponse = await axios.post(loginUrl, {
        employee_id: employeeId.trim(),
        password: password,
      }, {
        withCredentials: true,
        baseURL: '', // Override baseURL to use full URL
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('[Auth] Login response status:', loginResponse.status);

      // Step 3: Get user data
      const response = await axios.get<{ user: User }>("/user");
      console.log('[Auth] User data fetched successfully');
      setUser(response.data.user);  // 🎯 Extract the nested user object
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse | { errors?: Record<string, string[]>; message?: string }>;

        // Log detailed error information for debugging
        console.error('[Auth] Login failed with status:', axiosError.response?.status);
        console.error('[Auth] Error response:', axiosError.response?.data);
        console.error('[Auth] Error headers:', axiosError.response?.headers);

        // Handle 500 Internal Server Error
        if (axiosError.response?.status === 500) {
          console.error('[Auth] Backend server error. Check backend logs for details.');
          throw new Error(
            'Server error occurred. Please contact support if this persists. ' +
            'Error details logged to console.'
          );
        }

        // Handle validation errors (422)
        if (axiosError.response?.status === 422) {
          const errorData = axiosError.response.data;
          if (errorData && typeof errorData === 'object' && 'errors' in errorData) {
            // Laravel validation errors
            const errors = errorData.errors as Record<string, string[]>;
            const firstError = Object.values(errors)[0]?.[0];
            throw new Error(firstError || 'Validation failed. Please check your credentials.');
          }
          throw new Error(errorData?.message || 'Invalid credentials. Please check your employee ID and password.');
        }

        // Handle other errors
        throw new Error(
          axiosError.response?.data?.message ||
          axiosError.message ||
          "Login failed"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const logout = async () => {
    try {
      await axios.post("/logout", {}, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
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
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
            await axios.get('/sanctum/csrf-cookie');
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
        await axios.get('/sanctum/csrf-cookie');
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
      const response = await axios.get<{ user: User }>("/api/user", {
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
      // Step 1: Get CSRF token
      await axios.get("/sanctum/csrf-cookie");

      // Step 2: Login with proper headers
      await axios.post("/api/login", {
        employee_id: employeeId,
        password: password,
      }, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      // Step 3: Get user data
      const response = await axios.get<{ user: User }>("/api/user");
      setUser(response.data.user);  // 🎯 Extract the nested user object
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
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
      await axios.post("/api/logout", {}, {
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
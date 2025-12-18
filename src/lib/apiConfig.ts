/**
 * Centralized API Configuration
 * 
 * SINGLE SOURCE OF TRUTH for API base URL across the entire application.
 * 
 * This ensures all API calls go to the correct backend domain and prevents
 * accidental relative URL resolution against the frontend domain.
 */

/**
 * API Base URL - Production default: https://api.inspectmymachine.in
 * 
 * Can be overridden via environment variables:
 * - VITE_API_BASE: Full base URL (e.g., "https://api.inspectmymachine.in/api")
 * - VITE_API_ORIGIN: API origin (e.g., "https://api.inspectmymachine.in/api")
 * 
 * In production, defaults to: https://api.inspectmymachine.in/api
 * In development, defaults to: http://localhost:8000/api
 */
export const API_BASE_URL = (() => {
  // Check for explicit base URL override
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, '');
  }
  
  // Check for origin override
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  }
  
  // Default based on environment
  if (import.meta.env.PROD) {
    return 'https://api.inspectmymachine.in/api';
  }
  
  return 'http://localhost:8000/api';
})();

/**
 * API Origin (without /api suffix) - used for CSRF cookie endpoint
 * 
 * CSRF endpoint is at /sanctum/csrf-cookie (not under /api)
 */
export const API_ORIGIN = (() => {
  if (import.meta.env.VITE_API_ORIGIN) {
    const origin = import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
    // If it ends with /api, remove it for CSRF endpoint
    return origin.endsWith('/api') ? origin.replace(/\/api$/, '') : origin;
  }
  
  if (import.meta.env.VITE_API_BASE) {
    const base = import.meta.env.VITE_API_BASE.replace(/\/$/, '');
    // If it ends with /api, remove it for CSRF endpoint
    return base.endsWith('/api') ? base.replace(/\/api$/, '') : base;
  }
  
  // Default based on environment
  if (import.meta.env.PROD) {
    return 'https://api.inspectmymachine.in';
  }
  
  return 'http://localhost:8000';
})();

/**
 * Build full API URL from a path
 * 
 * @param path - API path (e.g., "/v1/analytics/vitals" or "v1/analytics/vitals")
 * @returns Full URL (e.g., "https://api.inspectmymachine.in/api/v1/analytics/vitals")
 */
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

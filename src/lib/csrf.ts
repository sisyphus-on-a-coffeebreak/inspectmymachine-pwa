import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://api.inspectmymachine.in/api" : "http://localhost:8000");

// CSRF Token Utility for Laravel Sanctum
export const ensureCsrfToken = async (): Promise<string> => {
  try {
    // Fetch CSRF cookie - use full URL (not relative, since it's outside /api)
    const csrfUrl = API_ORIGIN.endsWith('/api') 
      ? `${API_ORIGIN.replace(/\/api$/, '')}/sanctum/csrf-cookie`
      : `${API_ORIGIN}/sanctum/csrf-cookie`;
    await axios.get(csrfUrl, {
      withCredentials: true,
      baseURL: '', // Override baseURL to use full URL
    });
    // Small delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (csrfError) {
    throw new Error('Authentication issue. Please refresh the page and try again.');
  }

  // Get CSRF token from cookie
  const getCsrfToken = () => {
    const cookies = document.cookie;
    
    // Try to find XSRF-TOKEN cookie
    const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      return token;
    }
    
    return null;
  };

  const csrfToken = getCsrfToken();
  
  if (!csrfToken) {
    throw new Error('CSRF token not found. Please refresh the page and try again.');
  }

  return csrfToken;
};

// Helper function to create headers with CSRF token
export const createCsrfHeaders = async (): Promise<Record<string, string>> => {
  const csrfToken = await ensureCsrfToken();
  
  return {
    'X-XSRF-TOKEN': csrfToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

// Helper function for POST requests with CSRF
export const postWithCsrf = async <T = any>(url: string, data: any) => {
  const headers = await createCsrfHeaders();
  return axios.post<T>(url, data, { 
    headers,
    withCredentials: true 
  });
};

// Helper function for PUT requests with CSRF
export const putWithCsrf = async <T = any>(url: string, data: any) => {
  const headers = await createCsrfHeaders();
  return axios.put<T>(url, data, { 
    headers,
    withCredentials: true 
  });
};

export default {
  ensureCsrfToken,
  createCsrfHeaders,
  postWithCsrf,
  putWithCsrf
};


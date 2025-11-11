import axios from 'axios';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 
  (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");

// CSRF Token Utility for Laravel Sanctum
export const ensureCsrfToken = async (): Promise<string> => {
  try {
    // Fetch CSRF cookie - use full URL (not relative, since it's outside /api)
    await axios.get(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      withCredentials: true,
      baseURL: '', // Override baseURL to use full URL
    });
    console.log('CSRF token obtained');
    
    // Small delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (csrfError) {
    console.error('CSRF token failed:', csrfError);
    throw new Error('Authentication issue. Please refresh the page and try again.');
  }

  // Get CSRF token from cookie
  const getCsrfToken = () => {
    const cookies = document.cookie;
    console.log('All cookies:', cookies);
    
    // Try to find XSRF-TOKEN cookie
    const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      console.log('Found CSRF token:', token);
      return token;
    }
    
    console.log('No CSRF token found in cookies');
    return null;
  };

  const csrfToken = getCsrfToken();
  console.log('CSRF token from cookie:', csrfToken);
  
  if (!csrfToken) {
    console.error('No CSRF token found in cookies');
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


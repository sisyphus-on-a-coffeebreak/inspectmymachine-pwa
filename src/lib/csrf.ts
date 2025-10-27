import axios from 'axios';

// CSRF Token Utility for Laravel Sanctum
export const ensureCsrfToken = async (): Promise<string> => {
  try {
    // Fetch CSRF cookie
    await axios.get('/sanctum/csrf-cookie');
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
export const postWithCsrf = async (url: string, data: any) => {
  const headers = await createCsrfHeaders();
  return axios.post(url, data, { headers });
};

// Helper function for PUT requests with CSRF
export const putWithCsrf = async (url: string, data: any) => {
  const headers = await createCsrfHeaders();
  return axios.put(url, data, { headers });
};

export default {
  ensureCsrfToken,
  createCsrfHeaders,
  postWithCsrf,
  putWithCsrf
};


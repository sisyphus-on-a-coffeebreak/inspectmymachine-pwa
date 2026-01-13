import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiClient } from '../apiClient';

// Mock axios
vi.mock('axios', () => {
  const actualAxios = vi.importActual('axios');
  return {
    ...actualAxios,
    default: {
      ...actualAxios.default,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: {
        withCredentials: true,
        baseURL: '',
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      isAxiosError: (error: unknown) => {
        return error && typeof error === 'object' && 'isAxiosError' in error;
      },
    },
  };
});

// Mock other dependencies
vi.mock('../retry', () => ({
  withBackoff: (fn: () => Promise<unknown>) => fn(),
}));

vi.mock('../offlineQueue', () => ({
  offlineQueue: {
    enqueue: vi.fn(),
  },
}));

vi.mock('../errorHandling', () => ({
  isNetworkError: () => false,
}));

vi.mock('../apiConfig', () => ({
  API_BASE_URL: '/api',
  API_ORIGIN: 'http://localhost:8000',
}));

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET request successfully', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { success: true },
      status: 200,
      statusText: 'OK',
    });

    const result = await apiClient.get('/test', { skipRetry: true });
    expect(result.data).toEqual({ success: true });
    expect(result.status).toBe(200);
  });

  it('should make GET request', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: { message: 'Success' },
      status: 200,
      statusText: 'OK',
    });

    const result = await apiClient.get('/test');
    
    expect(axios.get).toHaveBeenCalledWith('/test', expect.any(Object));
    expect(result.data).toEqual({ message: 'Success' });
    expect(result.status).toBe(200);
  });

  it('should make POST request', async () => {
    const postData = { name: 'Test User' };
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { id: 1, ...postData },
      status: 201,
      statusText: 'Created',
    });

    const result = await apiClient.post('/users', postData);
    
    expect(axios.post).toHaveBeenCalledWith(
      '/users',
      postData,
      expect.objectContaining({
        headers: expect.any(Object),
      })
    );
    expect(result.data).toEqual({ id: 1, ...postData });
    expect(result.status).toBe(201);
  });

  it('should handle errors gracefully', async () => {
    const mockError = {
      isAxiosError: true,
      response: {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Resource not found' },
      },
      message: 'Request failed',
    };

    vi.mocked(axios.get).mockRejectedValueOnce(mockError);

    await expect(apiClient.get('/not-found')).rejects.toBeDefined();
    expect(axios.get).toHaveBeenCalled();
  });
});


import axios from 'axios';

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'inspector' | 'supervisor' | 'guard' | 'clerk';
  yard_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  employee_id: string;
  name: string;
  email: string;
  password: string;
  role: User['role'];
  yard_id?: string | null;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: User['role'];
  yard_id?: string | null;
  is_active?: boolean;
}

export interface UsersResponse {
  data: User[];
  total?: number;
  per_page?: number;
  current_page?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.PROD ? 'https://api.inspectmymachine.in/api' : 'http://localhost:8000/api');

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  try {
    const response = await axios.get<UsersResponse | User[]>(`${API_BASE}/v1/users`, {
      withCredentials: true,
      validateStatus: (status) => status < 500,
    });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Endpoint doesn't exist yet, return empty array
        return [];
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
    throw error;
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(id: number): Promise<User> {
  try {
    const response = await axios.get<{ data: User } | User>(`${API_BASE}/v1/users/${id}`, {
      withCredentials: true,
      validateStatus: (status) => status < 500,
    });
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const response = await axios.post<{ data: User } | User>(`${API_BASE}/v1/users`, payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to create user');
    }
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  try {
    const response = await axios.put<{ data: User } | User>(`${API_BASE}/v1/users/${id}`, payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
  try {
    await axios.delete(`${API_BASE}/v1/users/${id}`, {
      withCredentials: true,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
    throw error;
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  try {
    await axios.post(
      `${API_BASE}/v1/users/${id}/reset-password`,
      { password: newPassword },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
    throw error;
  }
}

/**
 * Get available roles
 */
export function getAvailableRoles(): Array<{ value: User['role']; label: string; description: string }> {
  return [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'Administrative access' },
    { value: 'supervisor', label: 'Supervisor', description: 'Can approve passes and expenses' },
    { value: 'inspector', label: 'Inspector', description: 'Can perform vehicle inspections' },
    { value: 'guard', label: 'Guard', description: 'Can validate gate passes' },
    { value: 'clerk', label: 'Clerk', description: 'Basic operations' },
  ];
}


import { apiClient } from './apiClient';
import { API_BASE_URL } from './apiConfig';

export type CapabilityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export';
export type CapabilityModule = 'gate_pass' | 'inspection' | 'expense' | 'user_management' | 'reports';

export interface UserCapabilities {
  gate_pass?: CapabilityAction[];
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
}

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'inspector' | 'supervisor' | 'guard' | 'clerk';
  capabilities?: UserCapabilities; // Capability matrix (module-level + CRUD flags)
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
  role?: User['role']; // Optional - can use capabilities instead
  capabilities?: UserCapabilities; // Capability matrix
  yard_id?: string | null;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: User['role']; // Optional - can use capabilities instead
  capabilities?: UserCapabilities; // Capability matrix
  yard_id?: string | null;
  is_active?: boolean;
}

export interface UsersResponse {
  data: User[];
  total?: number;
  per_page?: number;
  current_page?: number;
}

const API_BASE = API_BASE_URL;

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  try {
    const response = await apiClient.get<UsersResponse | User[]>('/v1/users', {
      skipRetry: true,
    });
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return (response.data as UsersResponse).data || [];
  } catch (error: any) {
    if (error?.status === 404) {
      // Endpoint doesn't exist yet, return empty array
      return [];
    }
    throw new Error(error?.message || 'Failed to fetch users');
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(id: number): Promise<User> {
  try {
    const response = await apiClient.get<{ data: User } | User>(`/v1/users/${id}`, {
      skipRetry: true,
    });
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as User;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch user');
  }
}

/**
 * Create a new user
 */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  try {
    const response = await apiClient.post<{ data: User } | User>('/v1/users', payload);
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as User;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to create user');
  }
}

/**
 * Update a user
 */
export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  try {
    const response = await apiClient.put<{ data: User } | User>(`/v1/users/${id}`, payload);
    
    if ('data' in response.data) {
      return response.data.data;
    }
    return response.data as User;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to update user');
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: number): Promise<void> {
  try {
    await apiClient.delete(`/v1/users/${id}`);
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to delete user');
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  try {
    await apiClient.post(`/v1/users/${id}/reset-password`, { password: newPassword });
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to reset password');
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

/**
 * Get user permissions
 * GET /v1/users/{id}/permissions
 */
export async function getUserPermissions(id: number): Promise<{ user_id: number; role: string; capabilities: UserCapabilities }> {
  try {
    const response = await apiClient.get<{ user_id: number; role: string; capabilities: UserCapabilities }>(`/v1/users/${id}/permissions`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to fetch user permissions');
  }
}

/**
 * Check if user has capability
 */
export function hasCapability(user: User | null, module: CapabilityModule, action: CapabilityAction): boolean {
  if (!user) return false;
  
  // Super admin has all capabilities
  if (user.role === 'super_admin') return true;
  
  // Check capability matrix
  if (user.capabilities && user.capabilities[module]) {
    return user.capabilities[module]!.includes(action);
  }
  
  // Fallback to role-based check (backward compatibility)
  return hasRoleCapability(user.role, module, action);
}

/**
 * Check if role has capability (backward compatibility)
 */
function hasRoleCapability(role: User['role'], module: CapabilityModule, action: CapabilityAction): boolean {
  const roleCapabilities: Record<User['role'], UserCapabilities> = {
    super_admin: {
      gate_pass: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
      inspection: ['create', 'read', 'update', 'delete', 'approve', 'review'],
      expense: ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
      user_management: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export'],
    },
    admin: {
      gate_pass: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
      inspection: ['create', 'read', 'update', 'delete', 'approve', 'review'],
      expense: ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
      user_management: ['read', 'update'],
      reports: ['read', 'export'],
    },
    supervisor: {
      gate_pass: ['read', 'approve', 'validate'],
      inspection: ['read', 'approve', 'review'],
      expense: ['read', 'approve'],
      user_management: [],
      reports: ['read'],
    },
    inspector: {
      gate_pass: ['read'],
      inspection: ['create', 'read', 'update'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
    },
    guard: {
      gate_pass: ['read', 'validate'],
      inspection: ['read'],
      expense: ['read'],
      user_management: [],
      reports: [],
    },
    clerk: {
      gate_pass: ['create', 'read'],
      inspection: ['read'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
    },
  };
  
  const capabilities = roleCapabilities[role];
  return capabilities[module]?.includes(action) ?? false;
}


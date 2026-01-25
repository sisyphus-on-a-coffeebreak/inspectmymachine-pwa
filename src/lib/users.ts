import { apiClient } from './apiClient';
import { API_BASE_URL } from './apiConfig';
import type { EnhancedCapability } from './permissions/types';
import { hasCapability as hasEnhancedCapability } from './permissions/evaluator';

// Re-export types for backward compatibility
export type CapabilityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export';
export type CapabilityModule = 'inspection' | 'expense' | 'user_management' | 'reports' | 'stockyard' | 'gate_pass';

// Stockyard function types for granular capability checks
export type StockyardFunction = 'access_control' | 'inventory' | 'movements';

export interface UserCapabilities {
  // Gate pass capabilities (unified module)
  gate_pass?: CapabilityAction[];
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
  stockyard?: CapabilityAction[]; // Basic stockyard capabilities (for backward compat during transition)
  // Enhanced capabilities with granularity support (preferred)
  enhanced_capabilities?: EnhancedCapability[];
}

/**
 * User Interface
 * 
 * ⚠️ MIGRATION NOTE: Role-based permissions are being migrated to capability-based system.
 * 
 * ROLE FIELD:
 * - The `role` field is now primarily a DISPLAY NAME for UI purposes
 * - Role can be any string (e.g., "admin", "supervisor", "custom_role_123")
 * - Role does NOT determine permissions - use `capabilities` instead
 * - Exception: `role === 'super_admin'` has special meaning (full access bypass)
 * 
 * CAPABILITIES (Source of Truth):
 * - `capabilities`: Basic module-level capabilities (backward compatible)
 * - `enhanced_capabilities`: Granular capabilities with scope, conditions, time restrictions
 * - Permissions are checked via `hasCapability(user, module, action)` function
 * - Always check capabilities, not role, for permission decisions
 * 
 * MIGRATION STATUS:
 * - During migration: Both role and capabilities may be used
 * - After migration: Capabilities are the only source of truth
 * - Role remains for display/UI purposes only
 * 
 * See: docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md for details
 */
export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  /** 
   * Role is a DISPLAY NAME only - not used for permissions!
   * Can be any string. Only 'super_admin' has special meaning (full access bypass).
   * Use `capabilities` for permission checks, not this field.
   */
  role: string;
  /** 
   * Capability matrix - THIS IS THE SOURCE OF TRUTH for permissions
   * Module-level capabilities (backward compatible during migration)
   */
  capabilities?: UserCapabilities;
  /** 
   * Enhanced capabilities with granularity (preferred, long-term)
   * Supports scope, conditions, time restrictions, field-level permissions
   */
  enhanced_capabilities?: EnhancedCapability[];
  yard_id: string | null;
  is_active: boolean;
  skip_approval_gate_pass?: boolean; // Auto-approve gate passes created by this user
  skip_approval_expense?: boolean; // Auto-approve expenses created by this user
  last_login_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  employee_id: string;
  name: string;
  email: string;
  password: string;
  /** 
   * Role (display name) - Optional, can use capabilities instead
   * This is just for UI display, not for permissions
   */
  role?: User['role'];
  /** 
   * Database role ID (preferred over role string)
   * Links to roles table for capability inheritance
   */
  role_id?: number;
  /** 
   * Capability matrix - REQUIRED for permissions
   * User must have at least one capability (basic or enhanced)
   */
  capabilities?: UserCapabilities;
  yard_id?: string | null;
  is_active?: boolean;
  skip_approval_gate_pass?: boolean; // Auto-approve gate passes created by this user
  skip_approval_expense?: boolean; // Auto-approve expenses created by this user
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  /** 
   * Role (display name) - Optional, can use capabilities instead
   * This is just for UI display, not for permissions
   */
  role?: User['role'];
  /** 
   * Database role ID (preferred over role string)
   * Links to roles table for capability inheritance
   */
  role_id?: number;
  /** 
   * Capability matrix - Updates user permissions
   * User must have at least one capability (basic or enhanced)
   */
  capabilities?: UserCapabilities;
  yard_id?: string | null;
  is_active?: boolean;
  skip_approval_gate_pass?: boolean; // Auto-approve gate passes created by this user
  skip_approval_expense?: boolean; // Auto-approve expenses created by this user
}

export interface GetUsersParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
}

export interface UsersResponse {
  data: User[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links?: {
    next: string | null;
    prev: string | null;
  };
  total?: number;
  per_page?: number;
  current_page?: number;
}

const API_BASE = API_BASE_URL;

/**
 * Get all users with pagination support
 */
export async function getUsers(params?: GetUsersParams): Promise<UsersResponse> {
  try {
    const response = await apiClient.get<UsersResponse | User[]>('/v1/users', {
      skipRetry: true,
      params: params ? {
        page: params.page,
        per_page: params.per_page,
        search: params.search,
        role: params.role,
        status: params.status,
      } : undefined,
    });
    
    // Handle array response (backward compatibility)
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          current_page: 1,
          per_page: response.data.length,
          total: response.data.length,
          last_page: 1,
        },
        links: {
          next: null,
          prev: null,
        },
      };
    }
    
    // Handle paginated response
    const data = response.data as UsersResponse;
    
    // If meta is missing but we have legacy fields, construct meta
    if (!data.meta && (data.total !== undefined || data.current_page !== undefined)) {
      return {
        ...data,
        meta: {
          current_page: data.current_page || 1,
          per_page: data.per_page || data.data.length,
          total: data.total || data.data.length,
          last_page: data.per_page && data.total 
            ? Math.ceil(data.total / data.per_page) 
            : 1,
        },
        links: data.links || {
          next: null,
          prev: null,
        },
      };
    }
    
    // Ensure meta exists
    if (!data.meta) {
      return {
        ...data,
        meta: {
          current_page: 1,
          per_page: data.data.length,
          total: data.data.length,
          last_page: 1,
        },
        links: {
          next: null,
          prev: null,
        },
      };
    }
    
    return data;
  } catch (error: any) {
    if (error?.status === 404) {
      // Endpoint doesn't exist yet, return empty response
      return {
        data: [],
        meta: {
          current_page: 1,
          per_page: 50,
          total: 0,
          last_page: 1,
        },
        links: {
          next: null,
          prev: null,
        },
      };
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
 * Check if user is a superadmin
 * 
 * Note: There's also an isSuperAdmin in permissions/evaluator.ts with enhanced logic.
 * This version is kept here to avoid circular dependencies (evaluator imports from users).
 * Both implementations check user.role === 'super_admin' as the primary method.
 */
export function isSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

/**
 * Check if user is the last active superadmin
 * This requires checking all users, so it's async
 */
export async function isLastSuperAdmin(userId: number): Promise<boolean> {
  try {
    const response = await getUsers({ role: 'super_admin', status: 'active' });
    const superAdmins = response.data.filter(u => u.is_active && u.role === 'super_admin');
    return superAdmins.length === 1 && superAdmins[0].id === userId;
  } catch (error) {
    // On error, be safe and assume it might be the last one
    console.error('Error checking last superadmin:', error);
    return false;
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
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access with all capabilities' },
    { value: 'admin', label: 'Admin', description: 'Administrative access - create, approve, and validate passes' },
    { value: 'yard_incharge', label: 'Yard In-charge', description: 'Create, approve, and validate gate passes' },
    { value: 'supervisor', label: 'Supervisor', description: 'Approve and validate passes and expenses' },
    { value: 'executive', label: 'Executive', description: 'Create and validate gate passes (submit for approval)' },
    { value: 'inspector', label: 'Inspector', description: 'Perform vehicle inspections' },
    { value: 'guard', label: 'Guard', description: 'Validate gate passes at entry/exit' },
    { value: 'clerk', label: 'Clerk', description: 'Create passes and expenses (submit for approval)' },
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
 * 
 * ⚠️ IMPORTANT: This is the PRIMARY way to check permissions!
 * 
 * DO NOT check `user.role` for permissions - use this function instead.
 * Role is just a display name - capabilities are the source of truth.
 * 
 * This function uses the enhanced permission evaluator which supports:
 * - Basic capabilities (backward compatible)
 * - Enhanced capabilities with granularity (scope, conditions, time, context)
 * - Superadmin bypass (safety mechanism)
 * 
 * For granular permission checks with context, use checkPermission from './permissions/evaluator'
 * For stockyard function-specific checks, use hasStockyardCapability()
 * 
 * @param user - The user to check
 * @param module - The module to check
 * @param action - The action to check
 * @returns true if user has the capability
 * 
 * @example
 * // ✅ CORRECT: Check capabilities
 * if (hasCapability(user, 'gate_pass', 'create')) {
 *   // User can create gate passes
 * }
 * 
 * // ❌ WRONG: Don't check role for permissions
 * if (user.role === 'admin') {
 *   // This is wrong - use hasCapability() instead
 * }
 */
export function hasCapability(user: User | null, module: CapabilityModule, action: CapabilityAction): boolean {
  // Use enhanced evaluator which handles both basic and enhanced capabilities
  return hasEnhancedCapability(user, module, action);
}

/**
 * Check if user has stockyard capability for specific function
 * This is the preferred way to check stockyard capabilities
 * 
 * @param user - The user to check
 * @param function - The stockyard function (access_control, inventory, movements)
 * @param action - The action to check
 * @returns true if user has the capability
 */
export function hasStockyardCapability(
  user: User | null,
  functionType: StockyardFunction,
  action: CapabilityAction
): boolean {
  if (!user) return false;
  
  // Check enhanced capabilities first (preferred)
  if (user.enhanced_capabilities) {
    const hasEnhanced = user.enhanced_capabilities.some(cap => 
      cap.module === 'stockyard' &&
      cap.action === action &&
      cap.scope?.type === 'function' &&
      cap.scope.value === functionType
    );
    if (hasEnhanced) return true;
  }
  
  // Also check capabilities.enhanced_capabilities (if stored there)
  if (user.capabilities?.enhanced_capabilities) {
    const hasEnhanced = user.capabilities.enhanced_capabilities.some(cap => 
      cap.module === 'stockyard' &&
      cap.action === action &&
      cap.scope?.type === 'function' &&
      cap.scope.value === functionType
    );
    if (hasEnhanced) return true;
  }
  
  // Fallback to basic capabilities (for backward compat during transition)
  // Basic stockyard capabilities apply to access_control only during transition
  // This ensures guards/clerks don't get inventory access
  const hasBasic = hasCapability(user, 'stockyard', action);
  
  if (hasBasic) {
    // During transition: if user has basic stockyard capability,
    // check if it should apply to this function
    // For now, basic capabilities apply to access_control only
    return functionType === 'access_control';
  }
  
  return false;
}

/**
 * Legacy helper: Check gate pass capability (maps to stockyard.access_control)
 * This will be removed after migration is complete
 * 
 * @deprecated Use hasStockyardCapability(user, 'access_control', action) instead
 */
export function hasGatePassCapability(
  user: User | null,
  action: CapabilityAction
): boolean {
  return hasStockyardCapability(user, 'access_control', action);
}

// Role-based capability checks removed - permissions are now based solely on capabilities
// Role is just a display name, not tied to permissions

// Export enhanced permission system
export { checkPermission, checkPermissions } from './permissions/evaluator';
export * from './permissions/types';


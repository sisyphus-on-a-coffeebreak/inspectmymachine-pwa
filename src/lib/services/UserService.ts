/**
 * User Service
 * 
 * Service layer for User Management API
 * Handles all API calls to /v1/users endpoints
 */

import { apiClient } from '../apiClient';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UsersResponse,
  GetUsersParams,
  UserCapabilities,
} from '../users';
import type { EnhancedCapability } from '../permissions/types';

const BASE_URL = '/v1/users';

class UserService {
  /**
   * List users with filters and pagination
   */
  async list(params?: GetUsersParams): Promise<UsersResponse> {
    try {
      const queryParams: Record<string, any> = {};
      
      if (params?.page) queryParams.page = params.page;
      if (params?.per_page) queryParams.per_page = params.per_page;
      if (params?.search) queryParams.search = params.search;
      if (params?.role) queryParams.role = params.role;
      if (params?.status) queryParams.status = params.status;

      const response = await apiClient.get<UsersResponse | User[]>(BASE_URL, {
        skipRetry: true,
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
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
      throw error;
    }
  }

  /**
   * Get a single user by ID
   */
  async get(id: number): Promise<User> {
    try {
      const response = await apiClient.get<{ data: User } | User>(`${BASE_URL}/${id}`, {
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
  async create(payload: CreateUserPayload): Promise<User> {
    try {
      const response = await apiClient.post<{ data: User } | User>(BASE_URL, payload);

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
  async update(id: number, payload: UpdateUserPayload): Promise<User> {
    try {
      const response = await apiClient.put<{ data: User } | User>(`${BASE_URL}/${id}`, payload);

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
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/${id}`);
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to delete user');
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(id: number): Promise<{ user_id: number; role: string; capabilities: UserCapabilities }> {
    try {
      const response = await apiClient.get<{ user_id: number; role: string; capabilities: UserCapabilities }>(
        `${BASE_URL}/${id}/permissions`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch user permissions');
    }
  }

  /**
   * Update user capabilities
   */
  async updateCapabilities(
    id: number,
    capabilities: UserCapabilities,
    enhanced?: EnhancedCapability[]
  ): Promise<User> {
    try {
      const response = await apiClient.patch<{ data: User } | User>(`${BASE_URL}/${id}/capabilities`, {
        capabilities,
        enhanced_capabilities: enhanced,
      });

      if ('data' in response.data) {
        return response.data.data;
      }
      return response.data as User;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to update capabilities');
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(id: number, password: string, sendEmail = false): Promise<void> {
    try {
      await apiClient.post(`${BASE_URL}/${id}/reset-password`, { password, send_email: sendEmail });
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to reset password');
    }
  }

  /**
   * Bulk operations
   */
  async bulkOperation(
    action: string,
    userIds: number[],
    payload?: any
  ): Promise<{ success: number; failed: number; errors?: Array<{ user_id: number; error: string }> }> {
    try {
      const response = await apiClient.post<{
        success: number;
        failed: number;
        errors?: Array<{ user_id: number; error: string }>;
      }>(`${BASE_URL}/bulk`, {
        action,
        user_ids: userIds,
        payload,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to perform bulk operation');
    }
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<Array<{
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
  }>> {
    try {
      const response = await apiClient.get<Array<{
        id: number;
        name: string;
        display_name: string;
        description?: string;
        is_system_role: boolean;
        is_active: boolean;
      }>>('/v1/roles');
      return response.data || [];
    } catch (error: any) {
      // If roles endpoint doesn't exist, return empty array
      if (error?.response?.status === 404 || error?.response?.status === 503) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Export users
   * Supports CSV and Excel formats via API or client-side export
   */
  async exportUsers(
    format: 'csv' | 'excel',
    filters?: GetUsersParams
  ): Promise<Blob | void> {
    try {
      // Try API endpoint first
      const response = await apiClient.get<Blob>(`${BASE_URL}/export`, {
        params: { ...filters, format: format === 'excel' ? 'xlsx' : 'csv' },
        // @ts-expect-error - responseType is valid
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      // If export endpoint doesn't exist, return void (client-side export will be used)
      if (error?.response?.status === 404) {
        return;
      }
      throw error;
    }
  }
}

export const userService = new UserService();


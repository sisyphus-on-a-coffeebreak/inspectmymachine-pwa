/**
 * React Query Hooks for User Management
 * 
 * Custom hooks using TanStack Query for User Management API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { userService } from '../lib/services/UserService';
import { useToast } from '../providers/ToastProvider';
import { logActivity } from '../lib/activityLogs';
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  UsersResponse,
  GetUsersParams,
  UserCapabilities,
} from '../lib/users';
import type { EnhancedCapability } from '../lib/permissions/types';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: GetUsersParams) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching users list
 */
export function useUsers(
  filters?: GetUsersParams,
  options?: Omit<UseQueryOptions<UsersResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.list(filters),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // For pagination
    ...options,
  });
}

/**
 * Hook for fetching a single user
 */
export function useUser(
  id: number | null,
  enabled = true,
  options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userService.get(id!),
    enabled: enabled && id !== null,
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
}

/**
 * Hook for fetching available roles
 */
export function useRoles(
  options?: Omit<UseQueryOptions<Array<{
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
  }>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => userService.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for creating a user
 */
export function useCreateUser(
  options?: Omit<UseMutationOptions<User, Error, CreateUserPayload>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: async (user) => {
      // Invalidate lists
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Pre-populate detail cache
      queryClient.setQueryData(userKeys.detail(user.id), user);

      // Log activity
      await logActivity({
        action: 'create',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: {
          name: user.name,
          email: user.email,
          employee_id: user.employee_id,
          role: user.role,
        },
      }).catch((err) => {
        console.error('Failed to log activity:', err);
        // Don't fail the mutation if logging fails
      });

      showToast({
        title: 'User created',
        description: `${user.name} has been added successfully`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create user';
      showToast({
        title: 'Failed to create user',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}

/**
 * Hook for updating a user
 */
export function useUpdateUser(
  options?: Omit<UseMutationOptions<User, Error, { id: number; payload: UpdateUserPayload }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      userService.update(id, payload),
    onSuccess: async (user, variables) => {
      // Update cache
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Log activity
      await logActivity({
        action: 'update',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: {
          changes: variables.payload,
        },
      }).catch((err) => {
        console.error('Failed to log activity:', err);
      });

      showToast({
        title: 'User updated',
        description: `${user.name} has been updated`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update user';
      showToast({
        title: 'Failed to update user',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser(
  options?: Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: async (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Log activity
      await logActivity({
        action: 'delete',
        module: 'user_management',
        resource_type: 'user',
        resource_id: userId.toString(),
      }).catch((err) => {
        console.error('Failed to log activity:', err);
      });

      showToast({
        title: 'User deleted',
        description: 'User has been removed',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to delete user';
      showToast({
        title: 'Failed to delete user',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}

/**
 * Hook for updating user capabilities
 */
export function useUpdateCapabilities(
  options?: Omit<UseMutationOptions<User, Error, {
    id: number;
    capabilities: UserCapabilities;
    enhanced?: EnhancedCapability[];
  }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, capabilities, enhanced }: {
      id: number;
      capabilities: UserCapabilities;
      enhanced?: EnhancedCapability[];
    }) => userService.updateCapabilities(id, capabilities, enhanced),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      await logActivity({
        action: 'update',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: {
          type: 'capabilities',
        },
      }).catch((err) => {
        console.error('Failed to log activity:', err);
      });

      showToast({
        title: 'Capabilities updated',
        description: `Permissions for ${user.name} have been updated`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to update capabilities';
      showToast({
        title: 'Failed to update capabilities',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}

/**
 * Hook for resetting user password
 */
export function useResetPassword(
  options?: Omit<UseMutationOptions<void, Error, {
    id: number;
    password: string;
    sendEmail?: boolean;
  }>, 'mutationFn'>
) {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, password, sendEmail }: { id: number; password: string; sendEmail?: boolean }) =>
      userService.resetPassword(id, password, sendEmail),
    onSuccess: () => {
      showToast({
        title: 'Password reset',
        description: 'Password has been reset successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to reset password';
      showToast({
        title: 'Failed to reset password',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}

/**
 * Hook for bulk user operations
 */
export function useBulkUserOperation(
  options?: Omit<UseMutationOptions<{
    success: number;
    failed: number;
    errors?: Array<{ user_id: number; error: string }>;
  }, Error, {
    action: string;
    userIds: number[];
    payload?: any;
  }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ action, userIds, payload }: { action: string; userIds: number[]; payload?: any }) =>
      userService.bulkOperation(action, userIds, payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      await logActivity({
        action: 'bulk_operation',
        module: 'user_management',
        resource_type: 'user',
        details: {
          action,
          count: result.success,
        },
      }).catch((err) => {
        console.error('Failed to log activity:', err);
      });

      showToast({
        title: 'Bulk operation completed',
        description: `${result.success} users updated, ${result.failed} failed`,
        variant: result.failed > 0 ? 'warning' : 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to perform bulk operation';
      showToast({
        title: 'Bulk operation failed',
        description: errorMessage,
        variant: 'error',
      });
    },
    ...options,
  });
}


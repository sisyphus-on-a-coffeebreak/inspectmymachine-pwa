/**
 * React Query Hooks for Gate Passes
 * 
 * Custom hooks using TanStack Query for unified Gate Pass API v2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { gatePassService } from '../lib/services/GatePassService';
import { useToast } from '../providers/ToastProvider';
import { getGatePassErrorMessage } from '@/pages/gatepass/utils/errorMessages';
import { RETRY_CONFIG } from '@/pages/gatepass/constants';
import type {
  GatePass,
  GatePassFilters,
  GatePassListResponse,
  GatePassStats,
  CreateGatePassData,
  UpdateGatePassData,
  ValidatePassRequest,
  ValidatePassResponse,
  GuardLogParams,
} from '@/pages/gatepass/gatePassTypes';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const gatePassKeys = {
  all: ['gate-passes'] as const,
  lists: () => [...gatePassKeys.all, 'list'] as const,
  list: (filters?: GatePassFilters) => [...gatePassKeys.lists(), filters] as const,
  details: () => [...gatePassKeys.all, 'detail'] as const,
  detail: (id: string) => [...gatePassKeys.details(), id] as const,
  stats: (yardId?: string) => [...gatePassKeys.all, 'stats', yardId] as const,
  guardLogs: (params?: GuardLogParams) => [...gatePassKeys.all, 'guard-logs', params] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching gate passes list
 */
export function useGatePasses(
  filters?: GatePassFilters,
  options?: Omit<UseQueryOptions<GatePassListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  // Add retry configuration for transient failures
  const retryConfig = {
    retry: RETRY_CONFIG.MAX_RETRIES,
    retryDelay: (attemptIndex: number) => 
      RETRY_CONFIG.RETRY_DELAY * Math.pow(RETRY_CONFIG.RETRY_DELAY_MULTIPLIER, attemptIndex),
  };
  return useQuery({
    queryKey: gatePassKeys.list(filters),
    queryFn: () => gatePassService.list(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: retryConfig.retry,
    retryDelay: retryConfig.retryDelay,
    ...options,
  });
}

/**
 * Hook for fetching gate pass statistics
 */
export function useGatePassStats(
  yardId?: string,
  options?: Omit<UseQueryOptions<GatePassStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gatePassKeys.stats(yardId),
    queryFn: () => gatePassService.getStats(yardId),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto refetch every 60 seconds
    ...options,
  });
}

/**
 * Hook for fetching a single gate pass
 */
export function useGatePass(
  id: string | undefined,
  options?: Omit<UseQueryOptions<GatePass, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gatePassKeys.detail(id!),
    queryFn: () => gatePassService.get(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook for fetching guard logs
 */
export function useGuardLogs(
  params?: GuardLogParams,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: gatePassKeys.guardLogs(params),
    queryFn: () => gatePassService.getGuardLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for creating a gate pass
 */
export function useCreateGatePass(
  options?: Omit<UseMutationOptions<GatePass, Error, CreateGatePassData>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (data: CreateGatePassData) => gatePassService.create(data),
    onSuccess: (data) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gatePassKeys.stats() });
      
      // Pre-populate detail cache
      queryClient.setQueryData(gatePassKeys.detail(data.id), data);
      
      // Show success toast
      showToast({
        title: 'Success',
        description: `Gate pass ${data.pass_number} created successfully!`,
        variant: 'success',
      });
      
      options?.onSuccess?.(data, data as any, undefined as any);
    },
    onError: (error) => {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to create gate pass',
        variant: 'error',
      });
      if (options?.onError) {
        // @ts-ignore - React Query callback signature
        options.onError(error, undefined, undefined);
      }
    },
    ...options,
  });
}

/**
 * Hook for updating a gate pass
 */
export function useUpdateGatePass(
  options?: Omit<UseMutationOptions<GatePass, Error, { id: string; data: UpdateGatePassData }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGatePassData }) =>
      gatePassService.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
      
      // Update detail cache
      queryClient.setQueryData(gatePassKeys.detail(variables.id), data);
      
      showToast({
        title: 'Success',
        description: 'Gate pass updated successfully!',
        variant: 'success',
      });
      
      if (options?.onSuccess) {
        // @ts-ignore - React Query callback signature
        options.onSuccess(data, variables, undefined);
      }
    },
    onError: (error) => {
      const errorMessage = getGatePassErrorMessage(error, 'UPDATE_FAILED', 'update gate pass');
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      if (options?.onError) {
        // @ts-ignore - React Query callback signature
        options.onError(error, undefined, undefined);
      }
    },
    ...options,
  });
}

/**
 * Hook for cancelling a gate pass
 */
export function useCancelGatePass(
  options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => gatePassService.cancel(id),
    onSuccess: (_, id) => {
      // Invalidate lists, detail, and stats
      queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gatePassKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gatePassKeys.stats() });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: gatePassKeys.detail(id) });
      
      showToast({
        title: 'Success',
        description: 'Gate pass cancelled successfully!',
        variant: 'success',
      });
      
      if (options?.onSuccess) {
        // @ts-ignore - React Query callback signature
        options.onSuccess(_, id, undefined);
      }
    },
    onError: (error) => {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to cancel gate pass',
        variant: 'error',
      });
      if (options?.onError) {
        // @ts-ignore - React Query callback signature
        options.onError(error, undefined, undefined);
      }
    },
    ...options,
  });
}

/**
 * Hook for validating and processing a pass
 */
export function useValidatePass(
  options?: Omit<UseMutationOptions<ValidatePassResponse, Error, ValidatePassRequest>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ValidatePassRequest) => gatePassService.validateAndProcess(data),
    onSuccess: (data, variables) => {
      // If action was taken, invalidate lists and stats
      if (data.action_taken) {
        queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
        queryClient.invalidateQueries({ queryKey: gatePassKeys.stats() });
        
        // Update detail cache if pass is returned
        if (data.pass) {
          queryClient.setQueryData(gatePassKeys.detail(data.pass.id), data.pass);
        }
      }
      
      if (options?.onSuccess) {
        // @ts-ignore - React Query callback signature
        options.onSuccess(data, variables, undefined);
      }
    },
    ...options,
  });
}

/**
 * Hook for recording entry
 */
export function useRecordEntry(
  options?: Omit<UseMutationOptions<GatePass, Error, { id: string; notes?: string }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      gatePassService.recordEntry(id, notes),
    onSuccess: (data, variables) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gatePassKeys.stats() });
      
      // Update detail cache
      queryClient.setQueryData(gatePassKeys.detail(variables.id), data);
      
      showToast({
        title: 'Success',
        description: 'Entry recorded successfully!',
        variant: 'success',
      });
      
      if (options?.onSuccess) {
        // @ts-ignore - React Query callback signature
        options.onSuccess(data, variables, undefined);
      }
    },
    onError: (error) => {
      const errorMessage = getGatePassErrorMessage(error, 'RECORD_ENTRY_FAILED', 'record entry');
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      if (options?.onError) {
        // @ts-ignore - React Query callback signature
        options.onError(error, undefined, undefined);
      }
    },
    ...options,
  });
}

/**
 * Hook for recording exit
 */
export function useRecordExit(
  options?: Omit<UseMutationOptions<GatePass, Error, { id: string; notes?: string }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      gatePassService.recordExit(id, notes),
    onSuccess: (data, variables) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: gatePassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gatePassKeys.stats() });
      
      // Update detail cache
      queryClient.setQueryData(gatePassKeys.detail(variables.id), data);
      
      showToast({
        title: 'Success',
        description: 'Exit recorded successfully!',
        variant: 'success',
      });
      
      if (options?.onSuccess) {
        // @ts-ignore - React Query callback signature
        options.onSuccess(data, variables, undefined);
      }
    },
    onError: (error) => {
      const errorMessage = getGatePassErrorMessage(error, 'RECORD_EXIT_FAILED', 'record exit');
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      if (options?.onError) {
        // @ts-ignore - React Query callback signature
        options.onError(error, undefined, undefined);
      }
    },
    ...options,
  });
}

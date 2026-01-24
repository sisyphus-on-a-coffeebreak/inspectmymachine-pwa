/**
 * React Query Hooks for Access Passes (formerly Gate Passes)
 * 
 * Custom hooks using TanStack Query for unified Access Pass API v2
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { accessService } from '../lib/services/AccessService';
import { useToast } from '../providers/ToastProvider';
import { getGatePassErrorMessage } from '@/pages/stockyard/access/utils/errorMessages';
import { RETRY_CONFIG } from '@/pages/stockyard/access/constants';
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
} from '@/pages/stockyard/access/gatePassTypes';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const accessPassKeys = {
  all: ['access-passes'] as const,
  lists: () => [...accessPassKeys.all, 'list'] as const,
  list: (filters?: GatePassFilters) => [...accessPassKeys.lists(), filters] as const,
  details: () => [...accessPassKeys.all, 'detail'] as const,
  detail: (id: string) => [...accessPassKeys.details(), id] as const,
  stats: (yardId?: string) => [...accessPassKeys.all, 'stats', yardId] as const,
  guardLogs: (params?: GuardLogParams) => [...accessPassKeys.all, 'guard-logs', params] as const,
} as const;

// Backward compatibility: keep old key name for gradual migration
export const gatePassKeys = accessPassKeys;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Hook for fetching access passes list (formerly gate passes)
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
    queryKey: accessPassKeys.list(filters),
    queryFn: () => accessService.list(filters),
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
    queryKey: accessPassKeys.stats(yardId),
    queryFn: () => accessService.getStats(yardId),
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
  // Validate id is not undefined and not the literal string ':id'
  const validId = id && id !== ':id' ? id : undefined;
  
  return useQuery({
    queryKey: accessPassKeys.detail(validId!),
    queryFn: () => accessService.get(validId!),
    enabled: !!validId && validId !== ':id',
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
    queryKey: accessPassKeys.guardLogs(params),
    queryFn: () => accessService.getGuardLogs(params),
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
    mutationFn: (data: CreateGatePassData) => accessService.create(data),
    onSuccess: (data) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.stats() });
      
      // Pre-populate detail cache
      queryClient.setQueryData(accessPassKeys.detail(data.id), data);
      
      // Show success toast
      showToast({
        title: 'Success',
        description: `Access pass ${data.pass_number} created successfully!`,
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
      accessService.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      
      // Update detail cache
      queryClient.setQueryData(accessPassKeys.detail(variables.id), data);
      
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
    mutationFn: (id: string) => accessService.cancel(id),
    onSuccess: (_, id) => {
      // Invalidate lists, detail, and stats
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.stats() });
      
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: accessPassKeys.detail(id) });
      
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
    mutationFn: (data: ValidatePassRequest) => accessService.validateAndProcess(data),
    onSuccess: (data, variables) => {
      // If action was taken, invalidate lists and stats
      if (data.action_taken) {
        queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
        queryClient.invalidateQueries({ queryKey: accessPassKeys.stats() });
        
        // Update detail cache if pass is returned
        if (data.pass) {
          queryClient.setQueryData(accessPassKeys.detail(data.pass.id), data.pass);
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
  options?: Omit<UseMutationOptions<GatePass, Error, { 
    id: string; 
    notes?: string;
    gate_id?: string;
    guard_id?: number;
    location?: { lat: number; lng: number };
    photos?: string[];
    condition_snapshot?: Record<string, unknown>;
  }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes, gate_id, guard_id, location, photos, condition_snapshot }: { 
      id: string; 
      notes?: string;
      gate_id?: string;
      guard_id?: number;
      location?: { lat: number; lng: number };
      photos?: string[];
      condition_snapshot?: Record<string, unknown>;
    }) =>
      accessService.recordEntry(id, { notes, gate_id, guard_id, location, photos, condition_snapshot }),
    onSuccess: (data, variables) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.stats() });
      
      // Update detail cache
      queryClient.setQueryData(accessPassKeys.detail(variables.id), data);
      
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
  options?: Omit<UseMutationOptions<GatePass, Error, { 
    id: string; 
    notes?: string;
    gate_id?: string;
    guard_id?: number;
    location?: { lat: number; lng: number };
    photos?: string[];
    odometer_km?: number;
    component_snapshot?: Record<string, unknown>;
  }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, notes, gate_id, guard_id, location, photos, odometer_km, component_snapshot }: { 
      id: string; 
      notes?: string;
      gate_id?: string;
      guard_id?: number;
      location?: { lat: number; lng: number };
      photos?: string[];
      odometer_km?: number;
      component_snapshot?: Record<string, unknown>;
    }) =>
      accessService.recordExit(id, { notes, gate_id, guard_id, location, photos, odometer_km, component_snapshot }),
    onSuccess: (data, variables) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: accessPassKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accessPassKeys.stats() });
      
      // Update detail cache
      queryClient.setQueryData(accessPassKeys.detail(variables.id), data);
      
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

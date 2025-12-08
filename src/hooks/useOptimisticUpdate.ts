/**
 * Optimistic Update Hook
 * 
 * Hook for implementing optimistic UI updates with rollback on error
 */

import { useState, useCallback, useRef } from 'react';

export interface OptimisticUpdateOptions<T> {
  onUpdate: (data: T) => Promise<T>;
  onError?: (error: Error, previousData: T) => void;
  onSuccess?: (data: T) => void;
  rollbackOnError?: boolean;
}

export interface OptimisticUpdateReturn<T> {
  update: (optimisticData: T) => Promise<T | null>;
  isUpdating: boolean;
  error: Error | null;
  rollback: () => void;
}

/**
 * Hook for optimistic UI updates
 * 
 * @example
 * const { update, isUpdating } = useOptimisticUpdate({
 *   onUpdate: async (newData) => {
 *     const response = await apiClient.put('/items/1', newData);
 *     return response.data;
 *   },
 *   onError: (error, previousData) => {
 *     // Handle error, previousData is the data before optimistic update
 *   },
 * });
 * 
 * // In component:
 * await update(newItemData); // UI updates immediately, then syncs with server
 */
export function useOptimisticUpdate<T>(
  options: OptimisticUpdateOptions<T>
): OptimisticUpdateReturn<T> {
  const { onUpdate, onError, onSuccess, rollbackOnError = true } = options;
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T | null>(null);
  const rollbackCallbackRef = useRef<(() => void) | null>(null);

  const update = useCallback(async (optimisticData: T): Promise<T | null> => {
    setIsUpdating(true);
    setError(null);
    
    // Store previous data for potential rollback
    previousDataRef.current = optimisticData;

    try {
      // Perform the actual update
      const result = await onUpdate(optimisticData);
      
      setIsUpdating(false);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const updateError = err instanceof Error ? err : new Error('Update failed');
      setError(updateError);
      setIsUpdating(false);
      
      // Call error handler with previous data
      if (previousDataRef.current) {
        onError?.(updateError, previousDataRef.current);
      }
      
      // Rollback if enabled
      if (rollbackOnError && rollbackCallbackRef.current) {
        rollbackCallbackRef.current();
      }
      
      return null;
    }
  }, [onUpdate, onError, onSuccess, rollbackOnError]);

  const rollback = useCallback(() => {
    if (rollbackCallbackRef.current) {
      rollbackCallbackRef.current();
      rollbackCallbackRef.current = null;
    }
  }, []);

  return {
    update,
    isUpdating,
    error,
    rollback,
  };
}

/**
 * Helper to create optimistic update with React Query
 */
export function createOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  queryClient: any,
  queryKey: any[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
) {
  return {
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(queryKey, (old: TData | undefined) =>
        updateFn(old, variables)
      );

      // Return context with previous data
      return { previousData };
    },
    onError: (err: Error, variables: TVariables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
    },
  };
}



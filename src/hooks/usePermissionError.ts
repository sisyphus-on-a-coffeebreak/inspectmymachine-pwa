/**
 * Hook for handling permission errors globally
 * 
 * Listens for 403 permission errors from the API and provides
 * callback/toast integration for user feedback.
 */

import { useEffect, useCallback } from 'react';
import { onPermissionError, type PermissionErrorEvent } from '../lib/apiClient';
import { useToast } from '../providers/ToastProvider';
import { getPermissionErrorToast } from '../lib/errorHandling';

interface UsePermissionErrorOptions {
  /** Show toast automatically on permission error */
  showToast?: boolean;
  /** Custom callback for permission errors */
  onError?: (event: PermissionErrorEvent) => void;
}

/**
 * Hook to handle permission errors globally
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   usePermissionError({
 *     showToast: true,
 *     onError: (event) => {
 *       console.log('Permission denied:', event.requiredCapability);
 *     }
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePermissionError(options: UsePermissionErrorOptions = {}) {
  const { showToast: shouldShowToast = true, onError } = options;
  const { showToast } = useToast();
  
  const handlePermissionError = useCallback(
    (event: PermissionErrorEvent) => {
      // Show toast if enabled
      if (shouldShowToast) {
        const toastProps = getPermissionErrorToast(
          { response: { status: 403, data: { message: event.message, required_capability: event.requiredCapability } } },
          undefined
        );
        showToast({
          title: toastProps.title,
          description: toastProps.description,
          variant: toastProps.variant,
          duration: toastProps.duration,
        });
      }
      
      // Call custom handler if provided
      onError?.(event);
    },
    [shouldShowToast, showToast, onError]
  );
  
  useEffect(() => {
    const unsubscribe = onPermissionError(handlePermissionError);
    return unsubscribe;
  }, [handlePermissionError]);
}

export type { PermissionErrorEvent };









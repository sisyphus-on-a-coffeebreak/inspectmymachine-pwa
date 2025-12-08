/**
 * Prefetch Hook
 * 
 * Hook for intelligent prefetching of routes and data
 */

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queries';

export interface PrefetchOptions {
  enabled?: boolean;
  prefetchDelay?: number; // Delay before prefetching (ms)
  prefetchOnHover?: boolean;
}

/**
 * Hook for intelligent prefetching
 * 
 * Prefetches data for likely next routes on hover or after delay
 */
export function usePrefetch(options: PrefetchOptions = {}) {
  const {
    enabled = true,
    prefetchDelay = 100, // 100ms delay before prefetching
    prefetchOnHover = true,
  } = options;

  const queryClient = useQueryClient();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Prefetch dashboard stats
   */
  const prefetchDashboard = useCallback(() => {
    if (!enabled) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: async () => {
        const { apiClient } = await import('../lib/apiClient');
        const response = await apiClient.get<{ success?: boolean; data?: unknown }>('/v1/dashboard', {
          suppressErrorLog: true, // Suppress errors for prefetch requests
        });
        const data = response.data as { success?: boolean; data?: unknown };
        return data.success && data.data ? data.data : data;
      },
    }).catch(() => {
      // Silently handle prefetch errors - prefetching is just an optimization
    });
  }, [queryClient, enabled]);

  /**
   * Prefetch gate passes using v2 API
   */
  const prefetchGatePasses = useCallback(() => {
    if (!enabled) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.gatePasses.list({}),
      queryFn: async () => {
        // Use the gatePassService for proper API v2 calls
        const { gatePassService } = await import('../lib/services/GatePassService');
        return await gatePassService.list({
          per_page: 20,
          page: 1,
        });
      },
    }).catch(() => {
      // Silently handle prefetch errors - prefetching is just an optimization
    });
  }, [queryClient, enabled]);

  /**
   * Prefetch inspections
   */
  const prefetchInspections = useCallback(() => {
    if (!enabled) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.inspections.list({}),
      queryFn: async () => {
        const { apiClient } = await import('../lib/apiClient');
        const response = await apiClient.get('/v1/inspections', {
          params: { per_page: 20, page: 1 },
          suppressErrorLog: true, // Suppress errors for prefetch requests
        });
        return response.data;
      },
    }).catch(() => {
      // Silently handle prefetch errors - prefetching is just an optimization
    });
  }, [queryClient, enabled]);

  /**
   * Prefetch expenses
   */
  const prefetchExpenses = useCallback(() => {
    if (!enabled) return;
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.all,
      queryFn: async () => {
        const { apiClient } = await import('../lib/apiClient');
        const response = await apiClient.get('/v1/expenses', {
          params: { per_page: 20, page: 1 },
          suppressErrorLog: true, // Suppress errors for prefetch requests
        });
        return response.data;
      },
    }).catch(() => {
      // Silently handle prefetch errors - prefetching is just an optimization
    });
  }, [queryClient, enabled]);

  /**
   * Prefetch route data based on path
   */
  const prefetchRoute = useCallback((path: string) => {
    if (!enabled) return;

    // Clear any existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Set timeout for prefetch
    prefetchTimeoutRef.current = setTimeout(() => {
      if (path.startsWith('/app/gate-pass')) {
        prefetchGatePasses();
      } else if (path.startsWith('/app/inspections')) {
        prefetchInspections();
      } else if (path.startsWith('/app/expenses')) {
        prefetchExpenses();
      } else if (path === '/dashboard') {
        prefetchDashboard();
      }
    }, prefetchDelay);
  }, [enabled, prefetchDelay, prefetchGatePasses, prefetchInspections, prefetchExpenses, prefetchDashboard]);

  /**
   * Handle link hover for prefetching
   */
  const handleLinkHover = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!prefetchOnHover || !enabled) return;
    
    const href = e.currentTarget.getAttribute('href');
    if (href && href.startsWith('/')) {
      prefetchRoute(href);
    }
  }, [prefetchOnHover, enabled, prefetchRoute]);

  /**
   * Prefetch likely next routes on mount
   */
  useEffect(() => {
    if (!enabled) return;

    // Prefetch dashboard stats on mount (likely to be visited)
    prefetchDashboard();
  }, [enabled, prefetchDashboard]);

  return {
    prefetchRoute,
    prefetchDashboard,
    prefetchGatePasses,
    prefetchInspections,
    prefetchExpenses,
    handleLinkHover,
  };
}



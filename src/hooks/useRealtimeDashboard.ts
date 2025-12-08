/**
 * Real-time Dashboard Hook
 * 
 * Hook for real-time dashboard statistics updates via WebSocket
 * Falls back to polling if WebSocket is not available
 */

import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReverbWebSocket } from './useReverbWebSocket';
import type { ReverbWebSocketMessage } from './useReverbWebSocket';
import { useDashboardStats } from '../lib/queries';
import { queryKeys } from '../lib/queries';

export interface RealtimeDashboardStats {
  gate_pass?: {
    active_passes?: number;
    completed_today?: number;
  };
  inspection?: {
    completed_today?: number;
    pending?: number;
    critical_issues?: number;
  };
  expense?: {
    pending_approval?: number;
    urgent?: number;
  };
  overall?: {
    completed_today?: number;
    pending_tasks?: number;
    urgent_items?: number;
    efficiency?: number;
  };
}

export interface UseRealtimeDashboardOptions {
  enabled?: boolean;
  pollingInterval?: number; // Fallback polling interval in ms
  useWebSocket?: boolean;
}

/**
 * Hook for real-time dashboard updates
 */
export function useRealtimeDashboard(options: UseRealtimeDashboardOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 30000, // 30 seconds
    useWebSocket: useWs = true,
  } = options;

  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: ReverbWebSocketMessage) => {
    if (message.type === 'dashboard.stats.update') {
      // Update React Query cache with new stats
      queryClient.setQueryData(
        queryKeys.dashboard.stats(),
        message.data
      );
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    } else if (message.type === 'dashboard.stats.partial') {
      // Partial update - merge with existing data
      queryClient.setQueryData(
        queryKeys.dashboard.stats(),
        (oldData: any) => ({
          ...oldData,
          ...message.data,
        })
      );
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);
    }
  }, [queryClient]);

  // Reverb WebSocket connection
  // Disabled by default in development to avoid connection errors
  // Enable by setting VITE_ENABLE_WEBSOCKET=true in .env.local
  const wsEnabled = enabled && useWs && (
    import.meta.env.PROD || 
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true')
  );
  
  const ws = useReverbWebSocket({
    enabled: wsEnabled,
    onMessage: handleWebSocketMessage,
    onError: () => {
      // Silently handle WebSocket errors - fallback to polling happens automatically
      // Don't log to console to avoid spam
    },
  });

  // Fallback polling if WebSocket is not connected
  const { refetch } = useDashboardStats({
    refetchInterval: enabled && !ws.isConnected ? pollingInterval : false,
  });

  return {
    ...ws,
    lastUpdate,
    updateCount,
    refetch,
    isRealtime: ws.isConnected,
  };
}


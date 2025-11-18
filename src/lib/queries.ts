/**
 * React Query Hooks for VOMS
 * 
 * Provides reusable query hooks for common API operations:
 * - Dashboard stats
 * - List queries with pagination
 * - Detail queries
 * - Mutation hooks for create/update/delete
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient, normalizeError } from './apiClient';

// Query Keys - Centralized for consistency
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  
  // Gate Passes
  gatePasses: {
    all: ['gate-passes'] as const,
    lists: () => [...queryKeys.gatePasses.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.gatePasses.lists(), filters] as const,
    details: () => [...queryKeys.gatePasses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.gatePasses.details(), id] as const,
    stats: () => [...queryKeys.gatePasses.all, 'stats'] as const,
  },
  
  // Expenses
  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.expenses.lists(), filters] as const,
    details: () => [...queryKeys.expenses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.expenses.details(), id] as const,
    approval: {
      all: () => [...queryKeys.expenses.all, 'approval'] as const,
      pending: (filters?: Record<string, unknown>) => [...queryKeys.expenses.approval.all(), 'pending', filters] as const,
      stats: () => [...queryKeys.expenses.approval.all(), 'stats'] as const,
    },
  },
  
  // Inspections
  inspections: {
    all: ['inspections'] as const,
    lists: () => [...queryKeys.inspections.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.inspections.lists(), filters] as const,
    details: () => [...queryKeys.inspections.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inspections.details(), id] as const,
    templates: {
      all: () => [...queryKeys.inspections.all, 'templates'] as const,
      list: () => [...queryKeys.inspections.templates.all(), 'list'] as const,
      detail: (id: string) => [...queryKeys.inspections.templates.all(), id] as const,
    },
    dashboard: () => [...queryKeys.inspections.all, 'dashboard'] as const,
  },
  
  // Stockyard
  stockyard: {
    all: ['stockyard'] as const,
    requests: {
      all: () => [...queryKeys.stockyard.all, 'requests'] as const,
      lists: () => [...queryKeys.stockyard.requests.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.requests.lists(), filters] as const,
      details: () => [...queryKeys.stockyard.requests.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.stockyard.requests.details(), id] as const,
      stats: () => [...queryKeys.stockyard.requests.all(), 'stats'] as const,
    },
    components: {
      all: () => [...queryKeys.stockyard.all, 'components'] as const,
      lists: () => [...queryKeys.stockyard.components.all(), 'list'] as const,
      list: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.components.lists(), filters] as const,
      details: () => [...queryKeys.stockyard.components.all(), 'detail'] as const,
      detail: (type: string, id: string) => [...queryKeys.stockyard.components.details(), type, id] as const,
      costAnalysis: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.components.all(), 'cost-analysis', filters] as const,
      healthDashboard: () => [...queryKeys.stockyard.components.all(), 'health-dashboard'] as const,
      custodyEvents: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.components.all(), 'custody-events', filters] as const,
      analytics: (type: string, id: string) => [...queryKeys.stockyard.components.all(), 'analytics', type, id] as const,
    },
    yards: {
      all: () => [...queryKeys.stockyard.all, 'yards'] as const,
      map: (yardId: string) => [...queryKeys.stockyard.yards.all(), 'map', yardId] as const,
      slotSuggestions: (yardId: string, filters?: Record<string, unknown>) => [...queryKeys.stockyard.yards.all(), 'slot-suggestions', yardId, filters] as const,
    },
    checklists: {
      all: () => [...queryKeys.stockyard.all, 'checklists'] as const,
      detail: (requestId: string, type?: string) => [...queryKeys.stockyard.checklists.all(), 'detail', requestId, type] as const,
    },
    documents: {
      all: () => [...queryKeys.stockyard.all, 'documents'] as const,
      list: (requestId: string) => [...queryKeys.stockyard.documents.all(), 'list', requestId] as const,
    },
    compliance: {
      all: () => [...queryKeys.stockyard.all, 'compliance'] as const,
      tasks: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.compliance.all(), 'tasks', filters] as const,
    },
    transporter: {
      all: () => [...queryKeys.stockyard.all, 'transporter'] as const,
      bids: (requestId: string) => [...queryKeys.stockyard.transporter.all(), 'bids', requestId] as const,
    },
    buyerReadiness: {
      all: () => [...queryKeys.stockyard.all, 'buyer-readiness'] as const,
      list: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.buyerReadiness.all(), 'list', filters] as const,
    },
    analytics: {
      all: () => [...queryKeys.stockyard.all, 'analytics'] as const,
      timeline: (vehicleId: string, filters?: Record<string, unknown>) => [...queryKeys.stockyard.analytics.all(), 'timeline', vehicleId, filters] as const,
      alerts: (filters?: Record<string, unknown>) => [...queryKeys.stockyard.analytics.all(), 'alerts', filters] as const,
      profitability: (vehicleId: string) => [...queryKeys.stockyard.analytics.all(), 'profitability', vehicleId] as const,
      daysSinceEntry: (vehicleId?: string) => [...queryKeys.stockyard.analytics.all(), 'days-since-entry', vehicleId] as const,
    },
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    activity: {
      all: () => [...queryKeys.users.all, 'activity'] as const,
      logs: (filters?: Record<string, unknown>) => [...queryKeys.users.activity.all(), 'logs', filters] as const,
      statistics: () => [...queryKeys.users.activity.all(), 'statistics'] as const,
      permissionChanges: (filters?: Record<string, unknown>) => [...queryKeys.users.activity.all(), 'permission-changes', filters] as const,
    },
  },
  
  // Alerts
  alerts: {
    all: ['alerts'] as const,
    lists: () => [...queryKeys.alerts.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.alerts.lists(), filters] as const,
    details: () => [...queryKeys.alerts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.alerts.details(), id] as const,
    statistics: () => [...queryKeys.alerts.all, 'statistics'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.notifications.lists(), filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
} as const;

// Default query options
const defaultQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  retry: 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
};

/**
 * Hook for fetching dashboard stats
 */
export function useDashboardStats(options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: any }>('/v1/dashboard');
      // Handle both response formats: { success: true, data: {...} } or direct data
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching user activity logs
 */
export function useUserActivityLogs(
  filters?: { user_id?: string; action?: string; resource_type?: string; date_from?: string; date_to?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.activity.logs(filters),
    queryFn: async () => {
      const response = await apiClient.get('/v1/users/activity', { params: filters });
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching user activity statistics
 */
export function useUserActivityStatistics(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.activity.statistics(),
    queryFn: async () => {
      const response = await apiClient.get('/v1/users/activity/statistics');
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching permission changes
 */
export function usePermissionChanges(
  filters?: { user_id?: string; change_type?: string; date_from?: string; date_to?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.users.activity.permissionChanges(filters),
    queryFn: async () => {
      const response = await apiClient.get('/v1/users/permission-changes', { params: filters });
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching gate passes (visitor + vehicle)
 */
export function useGatePasses(
  filters?: { status?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.gatePasses.list(filters),
    queryFn: async () => {
      // Fetch visitor and vehicle passes separately
      const [visitorRes, vehicleEntryRes, vehicleExitRes] = await Promise.allSettled([
        apiClient.get('/visitor-gate-passes', { params: filters }),
        apiClient.get('/vehicle-entry-passes', { params: filters }),
        apiClient.get('/vehicle-exit-passes', { params: filters }),
      ]);

      const visitorPasses = visitorRes.status === 'fulfilled' 
        ? (Array.isArray(visitorRes.value.data) ? visitorRes.value.data : visitorRes.value.data?.data || [])
        : [];
      
      const vehicleEntryPasses = vehicleEntryRes.status === 'fulfilled'
        ? (Array.isArray(vehicleEntryRes.value.data) ? vehicleEntryRes.value.data : vehicleEntryRes.value.data?.data || [])
        : [];
      
      const vehicleExitPasses = vehicleExitRes.status === 'fulfilled'
        ? (Array.isArray(vehicleExitRes.value.data) ? vehicleExitRes.value.data : vehicleExitRes.value.data?.data || [])
        : [];

      const vehicleMovements = [...vehicleEntryPasses, ...vehicleExitPasses];
      const total = visitorPasses.length + vehicleMovements.length;

      return {
        visitorPasses,
        vehicleMovements,
        total,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching gate pass statistics
 */
export function useGatePassStats(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.gatePasses.stats(),
    queryFn: async () => {
      // Fetch stats from multiple endpoints
      const [visitorRes, vehicleEntryRes, vehicleExitRes] = await Promise.allSettled([
        apiClient.get('/visitor-gate-passes/stats').catch(() => ({ data: {} })),
        apiClient.get('/vehicle-entry-passes/stats').catch(() => ({ data: {} })),
        apiClient.get('/vehicle-exit-passes/stats').catch(() => ({ data: {} })),
      ]);

      const visitorStats = visitorRes.status === 'fulfilled' ? visitorRes.value.data : {};
      const vehicleEntryStats = vehicleEntryRes.status === 'fulfilled' ? vehicleEntryRes.value.data : {};
      const vehicleExitStats = vehicleExitRes.status === 'fulfilled' ? vehicleExitRes.value.data : {};

      return {
        ...visitorStats,
        ...vehicleEntryStats,
        ...vehicleExitStats,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching expenses list with filters
 */
export function useExpenses(
  filters?: { mine?: boolean; status?: string; per_page?: number; page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/v1/expenses', { params: filters });
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.items || [];
      return {
        data,
        total: (response.data as any)?.total || data.length,
        page: (response.data as any)?.page || 1,
        per_page: (response.data as any)?.per_page || filters?.per_page || 20,
        last_page: (response.data as any)?.last_page || 1,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching float balance
 */
export function useFloatBalance(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['float', 'balance'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/float/me');
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching expense approvals (pending/approved/rejected)
 */
export function useExpenseApprovals(
  filters?: { status?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.expenses.approval.pending(filters),
    queryFn: async () => {
      const response = await apiClient.get('/expense-approval/pending', { params: filters });
      const expensesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data || [];
      return {
        data: expensesData,
        total: (response.data as any)?.total || expensesData.length,
        page: (response.data as any)?.page || filters?.page || 1,
        per_page: (response.data as any)?.per_page || filters?.per_page || 20,
        last_page: (response.data as any)?.last_page || 1,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching expense approval statistics
 */
export function useExpenseApprovalStats(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.expenses.approval.stats(),
    queryFn: async () => {
      const response = await apiClient.get('/expense-approval/stats');
      return Array.isArray(response.data) ? response.data : (response.data as any)?.data || response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for approving an expense
 */
export function useApproveExpense(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data?: Record<string, unknown> }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: Record<string, unknown> }) => {
      const response = await apiClient.post(`/expense-approval/${id}/approve`, data || {});
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.approval.all() });
      queryClient.invalidateQueries({ queryKeys: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    ...options,
  });
}

/**
 * Hook for rejecting an expense
 */
export function useRejectExpense(
  options?: Omit<UseMutationOptions<any, Error, { id: string; reason: string }>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await apiClient.post(`/expense-approval/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.approval.all() });
      queryClient.invalidateQueries({ queryKeys: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    ...options,
  });
}

/**
 * Hook for fetching stockyard requests
 */
export function useStockyardRequests(
  filters?: { status?: string; type?: string; per_page?: number; page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.requests.list(filters),
    queryFn: async () => {
      const { getStockyardRequests } = await import('./stockyard');
      return await getStockyardRequests(filters as any);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching stockyard statistics
 */
export function useStockyardStats(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.requests.stats(),
    queryFn: async () => {
      const { getStockyardStats } = await import('./stockyard');
      return await getStockyardStats();
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for creating a stockyard request
 */
export function useCreateStockyardRequest(
  options?: Omit<UseMutationOptions<any, Error, any>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const { createStockyardRequest } = await import('./stockyard');
      return await createStockyardRequest(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.stats() });
    },
    ...options,
  });
}

/**
 * Hook for fetching inspection dashboard data
 */
export function useInspectionDashboard(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inspections.dashboard(),
    queryFn: async () => {
      const response = await apiClient.get('/v1/inspection-dashboard');
      // Handle response format: { stats: {...}, recent_inspections: [...] }
      return {
        stats: response.data.stats || response.data,
        recent_inspections: response.data.recent_inspections || [],
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching inspection templates
 */
export function useInspectionTemplates(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inspections.templates.list(),
    queryFn: async () => {
      const response = await apiClient.get('/v1/inspection-templates');
      return Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
    },
    ...defaultQueryOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for templates (rarely change)
    ...options,
  });
}

/**
 * Hook for fetching inspections list with filters
 */
export function useInspections(
  filters?: { vehicle_id?: string; status?: string; per_page?: number; page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.inspections.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/v1/inspections', { params: filters });
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data || [];
      const meta = (response.data as any)?.meta || {};
      return {
        data,
        total: meta.total || data.length,
        page: meta.current_page || 1,
        per_page: meta.per_page || filters?.per_page || 20,
        last_page: meta.last_page || 1,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching alerts list with filters
 */
export function useAlerts(
  filters?: { status?: string; severity?: string; module?: string; type?: string; per_page?: number; page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters),
    queryFn: async () => {
      const response = await apiClient.get('/v1/alerts', { params: filters });
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any)?.data?.data || (response.data as any)?.data || [];
      const meta = (response.data as any)?.data?.meta || {};
      return {
        data,
        total: meta.total || data.length,
        page: meta.current_page || filters?.page || 1,
        per_page: meta.per_page || filters?.per_page || 20,
        last_page: meta.last_page || 1,
      };
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching alert statistics
 */
export function useAlertStatistics(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.alerts.statistics(),
    queryFn: async () => {
      const response = await apiClient.get('/v1/alerts/statistics');
      return (response.data as any)?.data || response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for acknowledging an alert
 */
export function useAcknowledgeAlert(
  options?: Omit<UseMutationOptions<any, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/v1/alerts/${id}/acknowledge`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for resolving an alert
 */
export function useResolveAlert(
  options?: Omit<UseMutationOptions<any, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/v1/alerts/${id}/resolve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for dismissing an alert
 */
export function useDismissAlert(
  options?: Omit<UseMutationOptions<any, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/v1/alerts/${id}/dismiss`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for bulk acknowledge alerts
 */
export function useBulkAcknowledgeAlerts(
  options?: Omit<UseMutationOptions<any, Error, string[]>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const response = await apiClient.post('/v1/alerts/bulk-acknowledge', { alert_ids: alertIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for bulk resolve alerts
 */
export function useBulkResolveAlerts(
  options?: Omit<UseMutationOptions<any, Error, string[]>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const response = await apiClient.post('/v1/alerts/bulk-resolve', { alert_ids: alertIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for bulk dismiss alerts
 */
export function useBulkDismissAlerts(
  options?: Omit<UseMutationOptions<any, Error, string[]>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const response = await apiClient.post('/v1/alerts/bulk-dismiss', { alert_ids: alertIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
    ...options,
  });
}

/**
 * Hook for fetching components list with filters
 */
export function useComponents(
  filters?: { type?: string; status?: string; vehicle_id?: string; search?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.components.list(filters),
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/components', { params: filters });
        if (response.data.success && response.data.data) {
          return {
            data: response.data.data,
            total: response.data.total || 0,
            page: response.data.page || 1,
            per_page: response.data.per_page || 20,
            last_page: response.data.last_page || 1,
          };
        }
        return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        if (error?.response?.status === 404) {
          // Only log in development mode
          if (import.meta.env.DEV) {
            console.debug('Components endpoint not found, returning empty list');
          }
          return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
        }
        // Only log unexpected errors
        if (import.meta.env.DEV) {
          console.error('Failed to fetch components:', error);
        }
        return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
      }
    },
    ...defaultQueryOptions,
    retry: false, // Don't retry on 404
    ...options,
  });
}

/**
 * Hook for fetching component details
 */
export function useComponent(
  type: string,
  id: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.components.detail(type, id),
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/v1/components/${type}/${id}`);
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        return null;
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        if (error?.response?.status === 404) {
          // Only log in development mode
          if (import.meta.env.DEV) {
            console.debug(`Component ${type}/${id} not found`);
          }
          return null;
        }
        // Only log unexpected errors
        if (import.meta.env.DEV) {
          console.error('Failed to fetch component:', error);
        }
        return null;
      }
    },
    ...defaultQueryOptions,
    enabled: !!type && !!id,
    retry: false, // Don't retry on 404
    ...options,
  });
}

/**
 * Hook for creating a component
 */
export function useCreateComponent(
  options?: UseMutationOptions<any, Error, any>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/v1/components', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.all() });
    },
    ...options,
  });
}

/**
 * Hook for updating a component
 */
export function useUpdateComponent(
  options?: UseMutationOptions<any, Error, { type: string; id: string; data: any }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id, data }: { type: string; id: string; data: any }) => {
      const response = await apiClient.patch(`/v1/components/${type}/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.detail(variables.type, variables.id) });
    },
    ...options,
  });
}

/**
 * Hook for deleting a component
 */
export function useDeleteComponent(
  options?: UseMutationOptions<any, Error, { type: string; id: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const response = await apiClient.delete(`/v1/components/${type}/${id}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Remove the specific component from cache to avoid refetching a deleted component
      queryClient.removeQueries({ queryKey: queryKeys.stockyard.components.detail(variables.type, variables.id) });
      // Invalidate the list query to refresh the component list
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.components.all() });
    },
    ...options,
  });
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(
  filters?: { read?: string; type?: string; page?: number; per_page?: number },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/notifications', { params: filters });
        if (response.data.success && response.data.data) {
          return {
            data: response.data.data,
            total: response.data.total || 0,
            page: response.data.page || 1,
            per_page: response.data.per_page || 20,
            last_page: response.data.last_page || 1,
          };
        }
        return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        if (error?.response?.status === 404) {
          // Only log in development mode
          if (import.meta.env.DEV) {
            console.debug('Notifications endpoint not found, returning empty list');
          }
          return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
        }
        // Only log unexpected errors
        if (import.meta.env.DEV) {
          console.error('Failed to fetch notifications:', error);
        }
        return { data: [], total: 0, page: 1, per_page: 20, last_page: 1 };
      }
    },
    ...defaultQueryOptions,
    retry: false, // Don't retry on 404
    ...options,
  });
}

/**
 * Hook for fetching unread notification count
 */
export function useUnreadNotificationCount(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/notifications/unread-count', {
          suppressErrorLog: true, // Suppress console errors for this frequently called endpoint
        });
        if (response.data.success && response.data.data) {
          return response.data.data.unread_count || 0;
        }
        return 0;
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        // If endpoint doesn't exist, return 0 (no unread notifications)
        if (error?.response?.status === 404) {
          // Silently return 0 - endpoint might not be implemented yet
          return 0;
        }
        // For other errors, also return 0 to prevent UI breakage
        // Only log unexpected errors in development
        if (import.meta.env.DEV && error?.response?.status !== 404) {
          console.error('Failed to fetch unread notification count:', error);
        }
        return 0;
      }
    },
    ...defaultQueryOptions,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false, // Don't retry on 404
    ...options,
  });
}

/**
 * Hook for marking notification as read
 */
export function useMarkNotificationAsRead(
  options?: UseMutationOptions<any, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/v1/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
}

/**
 * Hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead(
  options?: UseMutationOptions<any, Error, void>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/v1/notifications/mark-all-read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
}

/**
 * Hook for deleting a notification
 */
export function useDeleteNotification(
  options?: UseMutationOptions<any, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/v1/notifications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    ...options,
  });
}

/**
 * Hook for fetching component cost analysis
 */
export function useComponentCostAnalysis(
  filters?: {
    date_from?: string;
    date_to?: string;
    component_type?: 'battery' | 'tyre' | 'spare_part';
    vehicle_id?: string;
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.components.costAnalysis(filters),
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/components/cost-analysis', {
          params: filters,
        });
        return response.data;
      } catch (error: any) {
        // Handle 404 or other errors gracefully
        if (error?.response?.status === 404) {
          // Only log in development mode
          if (import.meta.env.DEV) {
            console.debug('Components cost-analysis endpoint not found');
          }
          return { success: false, data: null };
        }
        // Only log unexpected errors
        if (import.meta.env.DEV) {
          console.error('Failed to fetch component cost analysis:', error);
        }
        return { success: false, data: null };
      }
    },
    ...defaultQueryOptions,
    ...options,
  });
}

// ==================== New Stockyard Feature Hooks ====================

/**
 * Hook for fetching yard map
 */
export function useYardMap(
  yardId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.yards.map(yardId),
    queryFn: async () => {
      const { getYardMap } = await import('./stockyard');
      return await getYardMap(yardId);
    },
    ...defaultQueryOptions,
    enabled: !!yardId,
    ...options,
  });
}

/**
 * Hook for fetching slot suggestions
 */
export function useSlotSuggestions(
  yardId: string,
  vehicleId: string,
  stockyardRequestId?: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.yards.slotSuggestions(yardId, { vehicleId, stockyardRequestId }),
    queryFn: async () => {
      const { getSlotSuggestions } = await import('./stockyard');
      return await getSlotSuggestions(yardId, vehicleId, stockyardRequestId);
    },
    ...defaultQueryOptions,
    enabled: !!yardId && !!vehicleId,
    ...options,
  });
}

/**
 * Hook for fetching checklist
 */
export function useChecklist(
  stockyardRequestId: string,
  type?: 'inbound' | 'outbound',
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.checklists.detail(stockyardRequestId, type),
    queryFn: async () => {
      const { getChecklist } = await import('./stockyard');
      return await getChecklist(stockyardRequestId, type);
    },
    ...defaultQueryOptions,
    enabled: !!stockyardRequestId,
    ...options,
  });
}

/**
 * Hook for fetching component custody events
 */
export function useComponentCustodyEvents(
  filters?: {
    component_type?: 'battery' | 'tyre' | 'spare_part';
    component_id?: string;
    vehicle_id?: string;
    event_type?: string;
    page?: number;
    per_page?: number;
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.components.custodyEvents(filters),
    queryFn: async () => {
      const { getComponentCustodyEvents } = await import('./stockyard');
      return await getComponentCustodyEvents(filters);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching component analytics
 */
export function useComponentAnalytics(
  componentType: 'battery' | 'tyre' | 'spare_part',
  componentId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.components.analytics(componentType, componentId),
    queryFn: async () => {
      const { getComponentAnalytics } = await import('./stockyard');
      return await getComponentAnalytics(componentType, componentId);
    },
    ...defaultQueryOptions,
    enabled: !!componentType && !!componentId,
    ...options,
  });
}

/**
 * Hook for fetching stockyard documents
 */
export function useStockyardDocuments(
  stockyardRequestId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.documents.list(stockyardRequestId),
    queryFn: async () => {
      const { getStockyardDocuments } = await import('./stockyard');
      return await getStockyardDocuments(stockyardRequestId);
    },
    ...defaultQueryOptions,
    enabled: !!stockyardRequestId,
    ...options,
  });
}

/**
 * Hook for fetching compliance tasks
 */
export function useComplianceTasks(
  filters?: {
    stockyard_request_id?: string;
    vehicle_id?: string;
    status?: 'pending' | 'completed' | 'overdue';
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.compliance.tasks(filters),
    queryFn: async () => {
      const { getComplianceTasks } = await import('./stockyard');
      return await getComplianceTasks(filters);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching transporter bids
 */
export function useTransporterBids(
  stockyardRequestId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.transporter.bids(stockyardRequestId),
    queryFn: async () => {
      const { getTransporterBids } = await import('./stockyard');
      return await getTransporterBids(stockyardRequestId);
    },
    ...defaultQueryOptions,
    enabled: !!stockyardRequestId,
    ...options,
  });
}

/**
 * Hook for fetching buyer readiness records
 */
export function useBuyerReadinessRecords(
  filters?: {
    stage?: string;
    vehicle_id?: string;
    page?: number;
    per_page?: number;
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.buyerReadiness.list(filters),
    queryFn: async () => {
      const { getBuyerReadinessRecords } = await import('./stockyard');
      return await getBuyerReadinessRecords(filters);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching vehicle timeline
 */
export function useVehicleTimeline(
  vehicleId: string,
  filters?: {
    date_from?: string;
    date_to?: string;
    event_types?: string[];
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.analytics.timeline(vehicleId, filters),
    queryFn: async () => {
      const { getVehicleTimeline } = await import('./stockyard');
      return await getVehicleTimeline(vehicleId, filters);
    },
    ...defaultQueryOptions,
    enabled: !!vehicleId,
    ...options,
  });
}

/**
 * Hook for fetching stockyard alerts
 */
export function useStockyardAlerts(
  filters?: {
    vehicle_id?: string;
    component_id?: string;
    type?: string;
    severity?: 'info' | 'warning' | 'critical';
    acknowledged?: boolean;
  },
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.analytics.alerts(filters),
    queryFn: async () => {
      const { getStockyardAlerts } = await import('./stockyard');
      return await getStockyardAlerts(filters);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

/**
 * Hook for fetching profitability forecast
 */
export function useProfitabilityForecast(
  vehicleId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.analytics.profitability(vehicleId),
    queryFn: async () => {
      const { getProfitabilityForecast } = await import('./stockyard');
      return await getProfitabilityForecast(vehicleId);
    },
    ...defaultQueryOptions,
    enabled: !!vehicleId,
    ...options,
  });
}

/**
 * Hook for fetching days since entry
 */
export function useDaysSinceEntry(
  vehicleId?: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.stockyard.analytics.daysSinceEntry(vehicleId),
    queryFn: async () => {
      const { getDaysSinceEntry } = await import('./stockyard');
      return await getDaysSinceEntry(vehicleId);
    },
    ...defaultQueryOptions,
    ...options,
  });
}

// ==================== Stockyard Mutation Hooks ====================

/**
 * Hook for assigning vehicle to slot
 */
export function useAssignVehicleToSlot(
  options?: UseMutationOptions<any, Error, { slotId: string; vehicleId: string; stockyardRequestId: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ slotId, vehicleId, stockyardRequestId }) => {
      const { assignVehicleToSlot } = await import('./stockyard');
      return await assignVehicleToSlot(slotId, vehicleId, stockyardRequestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.yards.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
    },
    ...options,
  });
}

/**
 * Hook for reassigning vehicle between slots
 */
export function useReassignVehicleSlot(
  options?: UseMutationOptions<any, Error, { fromSlotId: string; toSlotId: string; vehicleId: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fromSlotId, toSlotId, vehicleId }) => {
      const { reassignVehicleSlot } = await import('./stockyard');
      return await reassignVehicleSlot(fromSlotId, toSlotId, vehicleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.yards.all() });
    },
    ...options,
  });
}

/**
 * Hook for creating checklist
 */
export function useCreateChecklist(
  options?: UseMutationOptions<any, Error, any>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { createChecklist } = await import('./stockyard');
      return await createChecklist(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.checklists.detail(variables.stockyard_request_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
    },
    ...options,
  });
}

/**
 * Hook for updating checklist item
 */
export function useUpdateChecklistItem(
  options?: UseMutationOptions<any, Error, { checklistId: string; itemId: string; data: any }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checklistId, itemId, data }) => {
      const { updateChecklistItem } = await import('./stockyard');
      return await updateChecklistItem(checklistId, itemId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.checklists.all() });
    },
    ...options,
  });
}

/**
 * Hook for completing checklist
 */
export function useCompleteChecklist(
  options?: UseMutationOptions<any, Error, { checklistId: string; notes?: string }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ checklistId, notes }) => {
      const { completeChecklist } = await import('./stockyard');
      return await completeChecklist(checklistId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.checklists.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
    },
    ...options,
  });
}

/**
 * Hook for uploading stockyard document
 */
export function useUploadStockyardDocument(
  options?: UseMutationOptions<any, Error, { stockyardRequestId: string; formData: FormData }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ stockyardRequestId, formData }) => {
      const { uploadStockyardDocument } = await import('./stockyard');
      return await uploadStockyardDocument(stockyardRequestId, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.documents.list(variables.stockyardRequestId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.compliance.all() });
    },
    ...options,
  });
}

/**
 * Hook for approving document
 */
export function useApproveDocument(
  options?: UseMutationOptions<any, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId) => {
      const { approveDocument } = await import('./stockyard');
      return await approveDocument(documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.compliance.all() });
    },
    ...options,
  });
}

/**
 * Hook for creating transporter bid
 */
export function useCreateTransporterBid(
  options?: UseMutationOptions<any, Error, any>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const { createTransporterBid } = await import('./stockyard');
      return await createTransporterBid(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.transporter.bids(variables.stockyard_request_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
    },
    ...options,
  });
}

/**
 * Hook for accepting transporter bid
 */
export function useAcceptTransporterBid(
  options?: UseMutationOptions<any, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bidId) => {
      const { acceptTransporterBid } = await import('./stockyard');
      return await acceptTransporterBid(bidId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.transporter.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.requests.all() });
    },
    ...options,
  });
}

/**
 * Hook for updating buyer readiness stage
 */
export function useUpdateBuyerReadinessStage(
  options?: UseMutationOptions<any, Error, { recordId: string; stage: string; metadata?: any }>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId, stage, metadata }) => {
      const { updateBuyerReadinessStage } = await import('./stockyard');
      return await updateBuyerReadinessStage(recordId, stage as any, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.buyerReadiness.all() });
    },
    ...options,
  });
}

/**
 * Hook for acknowledging stockyard alert
 */
export function useAcknowledgeStockyardAlert(
  options?: UseMutationOptions<any, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId) => {
      const { acknowledgeAlert } = await import('./stockyard');
      return await acknowledgeAlert(alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stockyard.analytics.alerts() });
    },
    ...options,
  });
}

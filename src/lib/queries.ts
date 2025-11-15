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
      return response.data;
    },
    ...defaultQueryOptions,
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
      const response = await apiClient.get(`/v1/components/${type}/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    },
    ...defaultQueryOptions,
    enabled: !!type && !!id,
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
    onSuccess: () => {
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
      return response.data;
    },
    ...defaultQueryOptions,
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
      const response = await apiClient.get('/v1/notifications/unread-count');
      if (response.data.success && response.data.data) {
        return response.data.data.unread_count || 0;
      }
      return 0;
    },
    ...defaultQueryOptions,
    refetchInterval: 30000, // Refetch every 30 seconds
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
      const response = await apiClient.get('/v1/components/cost-analysis', {
        params: filters,
      });
      return response.data;
    },
    ...defaultQueryOptions,
    ...options,
  });
}

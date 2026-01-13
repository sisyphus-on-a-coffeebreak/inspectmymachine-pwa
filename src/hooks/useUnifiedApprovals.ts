/**
 * Unified Approvals Hook
 * 
 * Aggregates approvals from multiple modules:
 * - Gate Pass approvals
 * - Expense approvals
 * - Stockyard transfer approvals
 * 
 * Provides a unified interface for the approvals hub
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queries';

export type ApprovalType = 'gate_pass' | 'expense' | 'transfer';

export interface UnifiedApproval {
  id: string;
  type: ApprovalType;
  referenceNumber: string;
  title: string;
  subtitle: string;
  requestedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  requestedAt: Date;
  metadata: Record<string, unknown>; // Type-specific data
  actions: {
    canApprove: boolean;
    canReject: boolean;
    canView: boolean;
  };
}

export interface ApprovalFilters {
  type?: ApprovalType | 'all';
  sortBy?: 'oldest' | 'newest';
  requesterId?: string;
  search?: string;
}

/**
 * Map gate pass approval to unified format
 */
function mapGatePassToUnified(data: any[]): UnifiedApproval[] {
  return data.map((item) => ({
    id: `gate_pass_${item.id}`,
    type: 'gate_pass' as ApprovalType,
    referenceNumber: item.pass_number || item.id,
    title: item.pass_type === 'visitor' 
      ? `${item.visitor_name || 'Visitor'} - ${item.purpose || 'Visit'}`
      : `${item.vehicle_registration || 'Vehicle'} - ${item.purpose || 'Entry'}`,
    subtitle: item.pass_type === 'visitor' ? 'Visitor Pass' : 'Vehicle Pass',
    requestedBy: {
      id: item.requester_id || '',
      name: item.requester_name || 'Unknown',
    },
    requestedAt: new Date(item.request_date || item.created_at),
    metadata: {
      pass_id: item.pass_id,
      pass_type: item.pass_type,
      approval_level: item.approval_level,
      status: item.status,
      urgency: item.urgency,
      valid_from: item.valid_from,
      valid_to: item.valid_to,
    },
    actions: {
      canApprove: item.status === 'pending',
      canReject: item.status === 'pending',
      canView: true,
    },
  }));
}

/**
 * Map expense approval to unified format
 */
function mapExpenseToUnified(data: any[]): UnifiedApproval[] {
  return data.map((item) => ({
    id: `expense_${item.id}`,
    type: 'expense' as ApprovalType,
    referenceNumber: `EXP-${item.id}`,
    title: `${item.category || 'Expense'} - ₹${item.amount?.toLocaleString('en-IN') || '0'}`,
    subtitle: `${item.payment_method || 'Payment'} • ${item.employee_name || 'Employee'}`,
    requestedBy: {
      id: item.employee_id || '',
      name: item.employee_name || 'Unknown',
    },
    requestedAt: new Date(item.created_at),
    metadata: {
      expense_id: item.id,
      amount: item.amount,
      category: item.category,
      payment_method: item.payment_method,
      receipt_key: item.receipt_key,
      project_name: item.project_name,
      asset_name: item.asset_name,
      status: item.status,
    },
    actions: {
      canApprove: item.status === 'pending',
      canReject: item.status === 'pending',
      canView: true,
    },
  }));
}

/**
 * Map stockyard transfer approval to unified format
 */
function mapTransferToUnified(data: any[]): UnifiedApproval[] {
  return data.map((item) => {
    const component = item.component || {};
    const fromVehicle = item.from_vehicle?.registration_number || 'Unknown';
    const toVehicle = item.to_vehicle?.registration_number || 'Unknown';
    
    return {
      id: `transfer_${item.id}`,
      type: 'transfer' as ApprovalType,
      referenceNumber: `TRF-${item.id}`,
      title: `${component.brand || ''} ${component.model || ''} ${component.name || ''}`.trim() || 'Component Transfer',
      subtitle: `${fromVehicle} → ${toVehicle}`,
      requestedBy: {
        id: item.requested_by?.id || '',
        name: item.requested_by?.name || 'Unknown',
      },
      requestedAt: new Date(item.requested_at || item.created_at),
      metadata: {
        transfer_id: item.id,
        component_type: item.component_type,
        component_id: item.component_id,
        from_vehicle: item.from_vehicle,
        to_vehicle: item.to_vehicle,
        reason: item.reason,
      },
      actions: {
        canApprove: true,
        canReject: true,
        canView: true,
      },
    };
  });
}

/**
 * Hook for fetching unified approvals from all modules
 */
export function useUnifiedApprovals(filters: ApprovalFilters = {}) {
  const queryClient = useQueryClient();

  // Fetch gate pass approvals
  const gatePassQuery = useQuery({
    queryKey: ['approvals', 'gate_pass', filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/gate-pass-approval/pending', {
          params: { status: 'pending' },
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch expense approvals
  const expenseQuery = useQuery({
    queryKey: queryKeys.expenses.approval.pending({ status: 'pending' }),
    queryFn: async () => {
      try {
        const response = await apiClient.get('/expense-approval/pending', {
          params: { status: 'pending' },
        });
        const expensesData = Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.data || [];
        return expensesData;
      } catch (error) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch stockyard transfer approvals
  const transferQuery = useQuery({
    queryKey: ['approvals', 'transfers', filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/components/transfers/pending');
        if (response.data.success) {
          return response.data.data || [];
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Merge and filter approvals
  const allApprovals = useMemo(() => {
    const merged: UnifiedApproval[] = [
      ...mapGatePassToUnified(gatePassQuery.data || []),
      ...mapExpenseToUnified(expenseQuery.data || []),
      ...mapTransferToUnified(transferQuery.data || []),
    ];

    // Apply filters
    let filtered = merged;

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((a) => a.type === filters.type);
    }

    // Filter by requester
    if (filters.requesterId) {
      filtered = filtered.filter((a) => a.requestedBy.id === filters.requesterId);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchLower) ||
          a.subtitle.toLowerCase().includes(searchLower) ||
          a.referenceNumber.toLowerCase().includes(searchLower) ||
          a.requestedBy.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (filters.sortBy === 'oldest') {
        return a.requestedAt.getTime() - b.requestedAt.getTime();
      }
      return b.requestedAt.getTime() - a.requestedAt.getTime();
    });

    return sorted;
  }, [
    gatePassQuery.data,
    expenseQuery.data,
    transferQuery.data,
    filters.type,
    filters.sortBy,
    filters.requesterId,
    filters.search,
  ]);

  // Calculate counts
  const counts = useMemo(() => {
    const gatePassCount = gatePassQuery.data?.length || 0;
    const expenseCount = expenseQuery.data?.length || 0;
    const transferCount = transferQuery.data?.length || 0;

    return {
      all: gatePassCount + expenseCount + transferCount,
      gate_pass: gatePassCount,
      expense: expenseCount,
      transfer: transferCount,
    };
  }, [gatePassQuery.data, expenseQuery.data, transferQuery.data]);

  return {
    approvals: allApprovals,
    counts,
    isLoading: gatePassQuery.isLoading || expenseQuery.isLoading || transferQuery.isLoading,
    isError: gatePassQuery.isError || expenseQuery.isError || transferQuery.isError,
    refetch: () => {
      gatePassQuery.refetch();
      expenseQuery.refetch();
      transferQuery.refetch();
    },
  };
}

/**
 * Hook for bulk approval operations
 */
export function useBulkApproval() {
  const queryClient = useQueryClient();

  const bulkApprove = async (approvalIds: string[]) => {
    // Group by type
    const byType: Record<ApprovalType, string[]> = {
      gate_pass: [],
      expense: [],
      transfer: [],
    };

    approvalIds.forEach((id) => {
      if (id.startsWith('gate_pass_')) {
        byType.gate_pass.push(id.replace('gate_pass_', ''));
      } else if (id.startsWith('expense_')) {
        byType.expense.push(id.replace('expense_', ''));
      } else if (id.startsWith('transfer_')) {
        byType.transfer.push(id.replace('transfer_', ''));
      }
    });

    // Execute approvals in parallel
    const promises: Promise<any>[] = [];

    if (byType.gate_pass.length > 0) {
      promises.push(
        Promise.all(
          byType.gate_pass.map((id) =>
            apiClient.post(`/gate-pass-approval/approve/${id}`, {})
          )
        )
      );
    }

    if (byType.expense.length > 0) {
      promises.push(
        apiClient.post('/expense-approval/bulk-approve', {
          expense_ids: byType.expense,
        })
      );
    }

    if (byType.transfer.length > 0) {
      promises.push(
        Promise.all(
          byType.transfer.map((id) =>
            apiClient.post(`/v1/components/transfers/${id}/approve`, {})
          )
        )
      );
    }

    await Promise.all(promises);

    // Invalidate all approval queries
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.approval.all() });
  };

  const bulkReject = async (approvalIds: string[], reason: string) => {
    // Group by type
    const byType: Record<ApprovalType, string[]> = {
      gate_pass: [],
      expense: [],
      transfer: [],
    };

    approvalIds.forEach((id) => {
      if (id.startsWith('gate_pass_')) {
        byType.gate_pass.push(id.replace('gate_pass_', ''));
      } else if (id.startsWith('expense_')) {
        byType.expense.push(id.replace('expense_', ''));
      } else if (id.startsWith('transfer_')) {
        byType.transfer.push(id.replace('transfer_', ''));
      }
    });

    // Execute rejections in parallel
    const promises: Promise<any>[] = [];

    if (byType.gate_pass.length > 0) {
      promises.push(
        Promise.all(
          byType.gate_pass.map((id) =>
            apiClient.post(`/gate-pass-approval/reject/${id}`, { reason })
          )
        )
      );
    }

    if (byType.expense.length > 0) {
      promises.push(
        apiClient.post('/expense-approval/bulk-reject', {
          expense_ids: byType.expense,
          reason,
        })
      );
    }

    if (byType.transfer.length > 0) {
      promises.push(
        Promise.all(
          byType.transfer.map((id) =>
            apiClient.post(`/v1/components/transfers/${id}/reject`, { reason })
          )
        )
      );
    }

    await Promise.all(promises);

    // Invalidate all approval queries
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.approval.all() });
  };

  return { bulkApprove, bulkReject };
}











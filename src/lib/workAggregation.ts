/**
 * Work Aggregation Service
 * 
 * Aggregates work items from all modules:
 * - Pending approvals (gate pass, expense, transfer)
 * - Today's tasks and activities
 * - User's assigned/created items
 * 
 * Provides unified interface for the /app/work section
 */

import { apiClient } from './apiClient';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/useAuth';
import { hasCapability } from './permissions/evaluator';
import { useUnifiedApprovals } from '../hooks/useUnifiedApprovals';
import { fetchTasks } from './services/TaskService';
import type { Task } from './workflow/types';

export type WorkItemType = 
  | 'approval_gate_pass' 
  | 'approval_expense' 
  | 'approval_transfer'
  | 'task_inspection'
  | 'task_clerking'
  | 'task_maintenance'
  | 'activity_gate_pass'
  | 'activity_expense'
  | 'activity_inspection'
  | 'activity_stockyard';

export interface WorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  subtitle: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedTo?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
  actions: {
    canView: boolean;
    canEdit?: boolean;
    canApprove?: boolean;
    canReject?: boolean;
    canComplete?: boolean;
  };
  route: string; // Route to view/edit this item
}

export interface WorkFilters {
  type?: WorkItemType | 'all';
  status?: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all';
  assignedTo?: 'me' | 'others' | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

/**
 * Map unified approval to work item
 */
function mapApprovalToWorkItem(approval: any, type: 'gate_pass' | 'expense' | 'transfer'): WorkItem {
  const workItemType: WorkItemType = 
    type === 'gate_pass' ? 'approval_gate_pass' :
    type === 'expense' ? 'approval_expense' :
    'approval_transfer';

  // Determine priority from metadata
  const urgency = approval.metadata?.urgency || 'medium';
  const priority: WorkItem['priority'] = 
    urgency === 'urgent' ? 'urgent' :
    urgency === 'high' ? 'high' :
    urgency === 'low' ? 'low' :
    'medium';

  // Determine route based on type
  const route = 
    type === 'gate_pass' ? `/app/gate-pass/${approval.metadata.pass_id}` :
    type === 'expense' ? `/app/expenses/${approval.metadata.expense_id}` :
    `/app/stockyard/components/${approval.metadata.component_id}`;

  return {
    id: approval.id,
    type: workItemType,
    title: approval.title,
    subtitle: approval.subtitle,
    description: approval.metadata?.reason || approval.metadata?.purpose,
    priority,
    status: 'pending',
    createdBy: approval.requestedBy,
    createdAt: approval.requestedAt,
    updatedAt: approval.requestedAt,
    metadata: approval.metadata,
    actions: approval.actions,
    route,
  };
}

/**
 * Fetch today's activities
 */
async function fetchTodaysActivities(userId?: string): Promise<WorkItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const items: WorkItem[] = [];

  try {
    // Fetch today's gate passes
    const gatePassResponse = await apiClient.get('/v2/gate-passes', {
      params: {
        filter: 'today',
        start_date: today.toISOString(),
        end_date: tomorrow.toISOString(),
      },
    });
    const gatePasses = Array.isArray(gatePassResponse.data) 
      ? gatePassResponse.data 
      : gatePassResponse.data?.data || [];

    gatePasses.forEach((pass: any) => {
      items.push({
        id: `activity_gate_pass_${pass.id}`,
        type: 'activity_gate_pass',
        title: pass.pass_type === 'visitor' 
          ? `${pass.visitor_name || 'Visitor'} - ${pass.purpose || 'Visit'}`
          : `${pass.vehicle_registration || 'Vehicle'} - ${pass.purpose || 'Entry'}`,
        subtitle: pass.pass_type === 'visitor' ? 'Visitor Pass' : 'Vehicle Pass',
        priority: pass.urgency === 'urgent' ? 'urgent' : 'medium',
        status: pass.status === 'validated' ? 'completed' : 'pending',
        createdBy: pass.created_by ? { id: pass.created_by.id, name: pass.created_by.name } : undefined,
        createdAt: new Date(pass.created_at),
        updatedAt: new Date(pass.updated_at),
        metadata: { pass_id: pass.id, pass_type: pass.pass_type },
        actions: { canView: true },
        route: `/app/gate-pass/${pass.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors
  }

  try {
    // Fetch today's expenses
    const expenseResponse = await apiClient.get('/v1/expenses', {
      params: {
        date_from: today.toISOString().split('T')[0],
        date_to: today.toISOString().split('T')[0],
      },
    });
    const expenses = Array.isArray(expenseResponse.data)
      ? expenseResponse.data
      : expenseResponse.data?.data || [];

    expenses.forEach((expense: any) => {
      items.push({
        id: `activity_expense_${expense.id}`,
        type: 'activity_expense',
        title: `${expense.category || 'Expense'} - ₹${expense.amount?.toLocaleString('en-IN') || '0'}`,
        subtitle: `${expense.payment_method || 'Payment'} • ${expense.employee_name || 'Employee'}`,
        priority: expense.amount > 10000 ? 'high' : 'medium',
        status: expense.status === 'approved' ? 'completed' : expense.status === 'pending' ? 'pending' : 'in_progress',
        createdBy: expense.employee_id ? { id: expense.employee_id, name: expense.employee_name } : undefined,
        createdAt: new Date(expense.created_at),
        updatedAt: new Date(expense.updated_at),
        metadata: { expense_id: expense.id, amount: expense.amount },
        actions: { canView: true },
        route: `/app/expenses/${expense.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors
  }

  try {
    // Fetch today's inspections
    const inspectionResponse = await apiClient.get('/v1/inspection-dashboard', {
      params: {
        filter: 'today',
      },
    });
    const inspections = Array.isArray(inspectionResponse.data)
      ? inspectionResponse.data
      : inspectionResponse.data?.data || [];

    inspections.forEach((inspection: any) => {
      items.push({
        id: `activity_inspection_${inspection.id}`,
        type: 'activity_inspection',
        title: `Inspection - ${inspection.vehicle_registration || 'Vehicle'}`,
        subtitle: inspection.template_name || 'Inspection',
        priority: 'medium',
        status: inspection.status === 'completed' ? 'completed' : 'in_progress',
        createdBy: inspection.inspector_id ? { id: inspection.inspector_id, name: inspection.inspector_name } : undefined,
        createdAt: new Date(inspection.created_at),
        updatedAt: new Date(inspection.updated_at),
        metadata: { inspection_id: inspection.id },
        actions: { canView: true },
        route: `/app/inspections/${inspection.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors
  }

  return items;
}

/**
 * Fetch user's assigned/created items
 */
async function fetchMyItems(userId: string): Promise<WorkItem[]> {
  const items: WorkItem[] = [];

  try {
    // Fetch my expenses
    const expenseResponse = await apiClient.get('/v1/expenses', {
      params: {
        employee_id: userId,
        status: 'pending,submitted',
      },
    });
    const expenses = Array.isArray(expenseResponse.data)
      ? expenseResponse.data
      : expenseResponse.data?.data || [];

    expenses.forEach((expense: any) => {
      items.push({
        id: `my_expense_${expense.id}`,
        type: 'activity_expense',
        title: `${expense.category || 'Expense'} - ₹${expense.amount?.toLocaleString('en-IN') || '0'}`,
        subtitle: `Status: ${expense.status}`,
        priority: expense.status === 'pending' ? 'high' : 'medium',
        status: expense.status === 'approved' ? 'completed' : expense.status === 'pending' ? 'pending' : 'in_progress',
        createdBy: { id: userId, name: expense.employee_name || 'Me' },
        createdAt: new Date(expense.created_at),
        updatedAt: new Date(expense.updated_at),
        metadata: { expense_id: expense.id },
        actions: { canView: true, canEdit: expense.status === 'pending' },
        route: `/app/expenses/${expense.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors
  }

  try {
    // Fetch my inspections
    const inspectionResponse = await apiClient.get('/v1/inspection-dashboard', {
      params: {
        filter: 'mine',
        inspector_id: userId,
      },
    });
    const inspections = Array.isArray(inspectionResponse.data)
      ? inspectionResponse.data
      : inspectionResponse.data?.data || [];

    inspections.forEach((inspection: any) => {
      items.push({
        id: `my_inspection_${inspection.id}`,
        type: 'activity_inspection',
        title: `Inspection - ${inspection.vehicle_registration || 'Vehicle'}`,
        subtitle: inspection.status === 'draft' ? 'Draft' : inspection.template_name || 'Inspection',
        priority: inspection.status === 'draft' ? 'high' : 'medium',
        status: inspection.status === 'completed' ? 'completed' : inspection.status === 'draft' ? 'pending' : 'in_progress',
        createdBy: { id: userId, name: inspection.inspector_name || 'Me' },
        createdAt: new Date(inspection.created_at),
        updatedAt: new Date(inspection.updated_at),
        metadata: { inspection_id: inspection.id },
        actions: { canView: true, canEdit: inspection.status === 'draft' },
        route: `/app/inspections/${inspection.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors
  }

  return items;
}

/**
 * Fetch workflow tasks
 */
async function fetchWorkflowTasks(userId?: string, filters?: WorkFilters): Promise<WorkItem[]> {
  const items: WorkItem[] = [];

  try {
    const tasks = await fetchTasks({
      status: filters?.status === 'pending' ? 'pending' : 
              filters?.status === 'in_progress' ? 'in_progress' :
              filters?.status === 'completed' ? 'completed' : undefined,
      assignedTo: filters?.assignedTo === 'me' ? userId : undefined,
      priority: filters?.priority !== 'all' ? filters?.priority : undefined,
    });

    tasks.forEach((task: Task) => {
      // Map task type to work item type
      let workItemType: WorkItemType = 'task_maintenance';
      if (task.type === 'inspection') workItemType = 'task_inspection';
      else if (task.type === 'clerking') workItemType = 'task_clerking';
      else if (task.type === 'maintenance') workItemType = 'task_maintenance';

      items.push({
        id: `task_${task.id}`,
        type: workItemType,
        title: task.title,
        subtitle: task.description || '',
        description: task.description,
        priority: task.priority,
        status: task.status === 'pending' ? 'pending' :
                task.status === 'in_progress' ? 'in_progress' :
                task.status === 'completed' ? 'completed' :
                'overdue',
        assignedTo: task.assignedTo ? { id: task.assignedTo.id, name: task.assignedTo.name } : undefined,
        createdBy: task.createdBy ? { id: task.createdBy.id, name: task.createdBy.name } : undefined,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        metadata: { task_id: task.id, ...task.metadata },
        actions: {
          canView: true,
          canEdit: task.status !== 'completed',
          canComplete: task.status !== 'completed',
        },
        route: `/app/work?task=${task.id}`,
      });
    });
  } catch (error) {
    // Silently handle errors - tasks API may not be ready yet
  }

  return items;
}

/**
 * Hook for fetching work items
 */
export function useWorkItems(filters: WorkFilters = {}) {
  const { user } = useAuth();
  const userId = user?.id?.toString();

  // Fetch pending approvals using existing hook
  const { approvals, isLoading: approvalsLoading } = useUnifiedApprovals(
    { type: filters.type === 'approval_gate_pass' ? 'gate_pass' : 
             filters.type === 'approval_expense' ? 'expense' :
             filters.type === 'approval_transfer' ? 'transfer' : 'all' },
    { enabled: true }
  );

  // Fetch workflow tasks
  const tasksQuery = useQuery({
    queryKey: ['work', 'tasks', userId, filters],
    queryFn: () => fetchWorkflowTasks(userId, filters),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch today's activities
  const todaysQuery = useQuery({
    queryKey: ['work', 'today', userId],
    queryFn: () => fetchTodaysActivities(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Fetch my items
  const myItemsQuery = useQuery({
    queryKey: ['work', 'mine', userId],
    queryFn: () => fetchMyItems(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Combine all work items
  const allWorkItems: WorkItem[] = [
    ...approvals.map(a => {
      const type = a.type === 'gate_pass' ? 'approval_gate_pass' :
                   a.type === 'expense' ? 'approval_expense' :
                   'approval_transfer';
      return mapApprovalToWorkItem(a, a.type);
    }),
    ...(tasksQuery.data || []),
    ...(todaysQuery.data || []),
    ...(myItemsQuery.data || []),
  ];

  // Apply filters
  let filtered = allWorkItems;

  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(item => item.type === filters.type);
  }

  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(item => item.status === filters.status);
  }

  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter(item => item.priority === filters.priority);
  }

  if (filters.assignedTo === 'me' && userId) {
    filtered = filtered.filter(item => 
      item.assignedTo?.id === userId || item.createdBy?.id === userId
    );
  } else if (filters.assignedTo === 'others' && userId) {
    filtered = filtered.filter(item => 
      item.assignedTo?.id !== userId && item.createdBy?.id !== userId
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(searchLower) ||
      item.subtitle.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.dateRange) {
    filtered = filtered.filter(item => {
      const itemDate = item.dueDate || item.createdAt;
      return itemDate >= filters.dateRange!.start && itemDate <= filters.dateRange!.end;
    });
  }

  // Sort by priority and date
  const sorted = [...filtered].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    items: sorted,
    isLoading: approvalsLoading || tasksQuery.isLoading || todaysQuery.isLoading || myItemsQuery.isLoading,
    isError: tasksQuery.isError || todaysQuery.isError || myItemsQuery.isError,
    refetch: () => {
      tasksQuery.refetch();
      todaysQuery.refetch();
      myItemsQuery.refetch();
    },
    counts: {
      pending: allWorkItems.filter(i => i.status === 'pending').length,
      inProgress: allWorkItems.filter(i => i.status === 'in_progress').length,
      completed: allWorkItems.filter(i => i.status === 'completed').length,
      overdue: allWorkItems.filter(i => i.status === 'overdue').length,
      approvals: approvals.length,
      today: todaysQuery.data?.length || 0,
      mine: myItemsQuery.data?.length || 0,
    },
  };
}


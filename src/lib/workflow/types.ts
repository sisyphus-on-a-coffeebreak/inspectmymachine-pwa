/**
 * Workflow Types
 * 
 * Type definitions for workflow automation system
 */

export type WorkflowEventType =
  | 'vehicle.entered'
  | 'vehicle.exited'
  | 'expense.created'
  | 'expense.approved'
  | 'expense.rejected'
  | 'inspection.completed'
  | 'inspection.draft_saved'
  | 'component.installed'
  | 'component.removed'
  | 'gate_pass.created'
  | 'gate_pass.validated'
  | 'gate_pass.expired'
  | 'stockyard_request.approved'
  | 'stockyard_request.rejected'
  | 'advance.issued'
  | 'advance.recorded'
  | 'balance.negative'
  | 'maintenance_task.created'
  | 'task.assigned'
  | 'task.completed'
  | 'task.overdue';

export interface WorkflowEvent {
  type: WorkflowEventType;
  timestamp: Date;
  userId?: string;
  metadata: Record<string, unknown>;
}

export type TaskType =
  | 'clerking_sheet'
  | 'component_accounting'
  | 'maintenance_job_card'
  | 'reconciliation'
  | 'inspection_review'
  | 'advance_approval'
  | 'status_change_approval'
  | 'custom';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>; // Type-specific data
  relatedEntity?: {
    type: 'vehicle' | 'expense' | 'inspection' | 'gate_pass' | 'component' | 'advance';
    id: string;
  };
}

export interface TaskAssignment {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
  reason?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  eventType: WorkflowEventType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface WorkflowAction {
  type: 'create_task' | 'send_notification' | 'update_status' | 'assign_user' | 'trigger_webhook';
  config: Record<string, unknown>;
}





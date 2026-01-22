/**
 * Activity Logs API Client
 * 
 * Provides functions for fetching and managing user activity logs.
 */

import { apiClient } from './apiClient';

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  user_id: number;
  user_name: string;
  user_email?: string;
  action: ActivityAction;
  module: ActivityModule;
  resource_type?: string;
  resource_id?: string | number;
  resource_name?: string;
  ip_address: string;
  user_agent?: string;
  details?: Record<string, unknown>;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

/**
 * Activity action types
 */
export type ActivityAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'validate'
  | 'export'
  | 'import'
  | 'assign'
  | 'unassign'
  | 'lock'
  | 'unlock'
  | 'reset_password'
  | 'change_password'
  | 'permission_change';

/**
 * Activity module types
 */
export type ActivityModule =
  | 'auth'
  | 'user_management'
  | 'gate_pass'
  | 'expense'
  | 'inspection'
  | 'stockyard'
  | 'reports'
  | 'settings'
  | 'system';

/**
 * Activity logs response
 */
export interface ActivityLogsResponse {
  data: ActivityLogEntry[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Activity log filter params
 */
export interface ActivityLogFilters {
  page?: number;
  per_page?: number;
  user_id?: number;
  action?: ActivityAction;
  module?: ActivityModule;
  from_date?: string;
  to_date?: string;
  search?: string;
}

/**
 * Get activity logs
 */
export async function getActivityLogs(filters?: ActivityLogFilters): Promise<ActivityLogsResponse> {
  try {
    const response = await apiClient.get<ActivityLogsResponse>('/v1/activity-logs', {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error('[activityLogs] Failed to fetch activity logs:', error);
    throw error;
  }
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(
  userId: number,
  filters?: Omit<ActivityLogFilters, 'user_id'>
): Promise<ActivityLogsResponse> {
  return getActivityLogs({ ...filters, user_id: userId });
}

/**
 * Export activity logs
 */
export async function exportActivityLogs(
  filters?: ActivityLogFilters,
  format: 'csv' | 'xlsx' = 'csv'
): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>('/v1/activity-logs/export', {
      params: { ...filters, format },
      // @ts-expect-error - responseType is valid
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('[activityLogs] Failed to export activity logs:', error);
    throw error;
  }
}

/**
 * Get action icon
 */
export function getActionIcon(action: ActivityAction): string {
  switch (action) {
    case 'create':
      return '➕';
    case 'read':
      return '👁️';
    case 'update':
      return '✏️';
    case 'delete':
      return '🗑️';
    case 'login':
      return '🔑';
    case 'logout':
      return '🚪';
    case 'approve':
      return '✅';
    case 'reject':
      return '❌';
    case 'validate':
      return '✔️';
    case 'export':
      return '📤';
    case 'import':
      return '📥';
    case 'assign':
      return '👤';
    case 'unassign':
      return '👤';
    case 'lock':
      return '🔒';
    case 'unlock':
      return '🔓';
    case 'reset_password':
      return '🔄';
    case 'change_password':
      return '🔑';
    case 'permission_change':
      return '🛡️';
    default:
      return '📋';
  }
}

/**
 * Get action label
 */
export function getActionLabel(action: ActivityAction): string {
  switch (action) {
    case 'create':
      return 'Created';
    case 'read':
      return 'Viewed';
    case 'update':
      return 'Updated';
    case 'delete':
      return 'Deleted';
    case 'login':
      return 'Logged In';
    case 'logout':
      return 'Logged Out';
    case 'approve':
      return 'Approved';
    case 'reject':
      return 'Rejected';
    case 'validate':
      return 'Validated';
    case 'export':
      return 'Exported';
    case 'import':
      return 'Imported';
    case 'assign':
      return 'Assigned';
    case 'unassign':
      return 'Unassigned';
    case 'lock':
      return 'Locked';
    case 'unlock':
      return 'Unlocked';
    case 'reset_password':
      return 'Reset Password';
    case 'change_password':
      return 'Changed Password';
    case 'permission_change':
      return 'Changed Permissions';
    default:
      return action;
  }
}

/**
 * Get action color
 */
export function getActionColor(action: ActivityAction): string {
  switch (action) {
    case 'create':
      return '#10B981'; // Green
    case 'update':
      return '#3B82F6'; // Blue
    case 'delete':
      return '#EF4444'; // Red
    case 'approve':
      return '#10B981'; // Green
    case 'reject':
      return '#EF4444'; // Red
    case 'login':
      return '#8B5CF6'; // Purple
    case 'logout':
      return '#6B7280'; // Gray
    case 'lock':
      return '#F59E0B'; // Amber
    case 'unlock':
      return '#10B981'; // Green
    case 'permission_change':
      return '#F59E0B'; // Amber
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get module label
 */
export function getModuleLabel(module: ActivityModule): string {
  switch (module) {
    case 'auth':
      return 'Authentication';
    case 'user_management':
      return 'User Management';
    case 'gate_pass':
      return 'Gate Pass';
    case 'expense':
      return 'Expense';
    case 'inspection':
      return 'Inspection';
    case 'stockyard':
      return 'Stockyard';
    case 'reports':
      return 'Reports';
    case 'settings':
      return 'Settings';
    case 'system':
      return 'System';
    default:
      return module;
  }
}






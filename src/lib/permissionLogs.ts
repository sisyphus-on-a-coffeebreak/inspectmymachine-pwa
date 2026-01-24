/**
 * Permission Logs API Client
 * 
 * Provides functions for fetching permission change history
 * for audit and compliance purposes.
 */

import { apiClient } from './apiClient';
import type { CapabilityModule, CapabilityAction } from './users';

/**
 * Permission change log entry
 */
export interface PermissionChangeLog {
  id: string;
  target_user_id: number;
  target_user_name: string;
  target_user_email?: string;
  changed_by_id: number;
  changed_by_name: string;
  change_type: 'grant' | 'revoke' | 'modify' | 'template_apply' | 'bulk_update';
  module?: CapabilityModule;
  action?: CapabilityAction;
  capability_description?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  ip_address: string;
  created_at: string;
}

/**
 * Permission logs response
 */
export interface PermissionLogsResponse {
  data: PermissionChangeLog[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Permission log filter params
 */
export interface PermissionLogFilters {
  page?: number;
  per_page?: number;
  target_user_id?: number;
  changed_by_id?: number;
  change_type?: PermissionChangeLog['change_type'];
  module?: CapabilityModule;
  from_date?: string;
  to_date?: string;
}

/**
 * Get permission change logs
 */
export async function getPermissionLogs(
  filters?: PermissionLogFilters
): Promise<PermissionLogsResponse> {
  try {
    const response = await apiClient.get<PermissionLogsResponse>('/v1/permission-logs', {
      params: filters,
    });
    return response.data;
  } catch (error) {
    console.error('[permissionLogs] Failed to fetch permission logs:', error);
    throw error;
  }
}

/**
 * Get permission logs for a specific user
 */
export async function getUserPermissionLogs(
  userId: number,
  filters?: Omit<PermissionLogFilters, 'target_user_id'>
): Promise<PermissionLogsResponse> {
  return getPermissionLogs({ ...filters, target_user_id: userId });
}

/**
 * Export permission logs
 */
export async function exportPermissionLogs(
  filters?: PermissionLogFilters,
  format: 'csv' | 'xlsx' | 'pdf' = 'csv'
): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>('/v1/permission-logs/export', {
      params: { ...filters, format },
      // @ts-expect-error - responseType is valid
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('[permissionLogs] Failed to export permission logs:', error);
    throw error;
  }
}

/**
 * Get change type color
 */
export function getChangeTypeColor(type: PermissionChangeLog['change_type']): string {
  switch (type) {
    case 'grant':
      return '#10B981'; // Green
    case 'revoke':
      return '#EF4444'; // Red
    case 'modify':
      return '#3B82F6'; // Blue
    case 'template_apply':
      return '#8B5CF6'; // Purple
    case 'bulk_update':
      return '#F59E0B'; // Amber
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get change type label
 */
export function getChangeTypeLabel(type: PermissionChangeLog['change_type']): string {
  switch (type) {
    case 'grant':
      return 'Granted';
    case 'revoke':
      return 'Revoked';
    case 'modify':
      return 'Modified';
    case 'template_apply':
      return 'Template Applied';
    case 'bulk_update':
      return 'Bulk Update';
    default:
      return type;
  }
}

/**
 * Get change type icon
 */
export function getChangeTypeIcon(type: PermissionChangeLog['change_type']): string {
  switch (type) {
    case 'grant':
      return '✅';
    case 'revoke':
      return '🚫';
    case 'modify':
      return '✏️';
    case 'template_apply':
      return '📋';
    case 'bulk_update':
      return '📦';
    default:
      return '🔄';
  }
}








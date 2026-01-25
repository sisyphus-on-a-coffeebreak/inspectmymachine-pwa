/**
 * Audit Reports API Client
 * 
 * Provides functions for generating and fetching compliance reports.
 */

import { apiClient } from './apiClient';

/**
 * Report types available
 */
export type ReportType = 
  | 'user_access'
  | 'permission_changes'
  | 'login_activity'
  | 'security_events'
  | 'data_access'
  | 'compliance_summary';

/**
 * Report status
 */
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Report definition
 */
export interface ReportDefinition {
  type: ReportType;
  name: string;
  description: string;
  icon: string;
  parameters: ReportParameter[];
}

/**
 * Report parameter
 */
export interface ReportParameter {
  key: string;
  label: string;
  type: 'date' | 'select' | 'text' | 'user' | 'boolean';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: unknown;
}

/**
 * Generated report
 */
export interface GeneratedReport {
  id: string;
  type: ReportType;
  name: string;
  status: ReportStatus;
  parameters: Record<string, unknown>;
  generated_by: {
    id: number;
    name: string;
  };
  file_url?: string;
  file_size?: number;
  row_count?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Reports response
 */
export interface ReportsResponse {
  data: GeneratedReport[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Get available report definitions
 */
export function getReportDefinitions(): ReportDefinition[] {
  return [
    {
      type: 'user_access',
      name: 'User Access Report',
      description: 'Summary of user permissions and access levels',
      icon: '👥',
      parameters: [
        { key: 'include_inactive', label: 'Include Inactive Users', type: 'boolean', required: false, defaultValue: false },
        { key: 'role', label: 'Filter by Role', type: 'select', required: false, options: [
          { value: 'all', label: 'All Roles' },
          { value: 'super_admin', label: 'Super Admin' },
          { value: 'admin', label: 'Admin' },
          { value: 'inspector', label: 'Inspector' },
          { value: 'guard', label: 'Guard' },
          { value: 'clerk', label: 'Clerk' },
        ]},
      ],
    },
    {
      type: 'permission_changes',
      name: 'Permission Changes Report',
      description: 'History of all permission modifications',
      icon: '🔐',
      parameters: [
        { key: 'from_date', label: 'From Date', type: 'date', required: true },
        { key: 'to_date', label: 'To Date', type: 'date', required: true },
      ],
    },
    {
      type: 'login_activity',
      name: 'Login Activity Report',
      description: 'User login and logout history',
      icon: '🔑',
      parameters: [
        { key: 'from_date', label: 'From Date', type: 'date', required: true },
        { key: 'to_date', label: 'To Date', type: 'date', required: true },
        { key: 'include_failed', label: 'Include Failed Attempts', type: 'boolean', required: false, defaultValue: true },
      ],
    },
    {
      type: 'security_events',
      name: 'Security Events Report',
      description: 'Security incidents and alerts',
      icon: '🛡️',
      parameters: [
        { key: 'from_date', label: 'From Date', type: 'date', required: true },
        { key: 'to_date', label: 'To Date', type: 'date', required: true },
        { key: 'severity', label: 'Severity', type: 'select', required: false, options: [
          { value: 'all', label: 'All Severities' },
          { value: 'critical', label: 'Critical' },
          { value: 'warning', label: 'Warning' },
          { value: 'info', label: 'Info' },
        ]},
      ],
    },
    {
      type: 'compliance_summary',
      name: 'Compliance Summary',
      description: 'Overall compliance status and metrics',
      icon: '📋',
      parameters: [
        { key: 'as_of_date', label: 'As of Date', type: 'date', required: false },
      ],
    },
  ];
}

/**
 * Generate a new report
 */
export async function generateReport(
  type: ReportType,
  parameters: Record<string, unknown>,
  format: 'csv' | 'xlsx' | 'pdf' = 'csv'
): Promise<GeneratedReport> {
  try {
    const response = await apiClient.post<GeneratedReport>('/v1/reports/generate', {
      type,
      parameters,
      format,
    });
    return response.data;
  } catch (error) {
    console.error('[auditReports] Failed to generate report:', error);
    throw error;
  }
}

/**
 * Get generated reports history
 */
export async function getGeneratedReports(params?: {
  page?: number;
  per_page?: number;
  type?: ReportType;
}): Promise<ReportsResponse> {
  try {
    const response = await apiClient.get<ReportsResponse>('/v1/reports', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('[auditReports] Failed to fetch reports:', error);
    throw error;
  }
}

/**
 * Get a specific report
 */
export async function getReport(reportId: string): Promise<GeneratedReport> {
  try {
    const response = await apiClient.get<GeneratedReport>(`/v1/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('[auditReports] Failed to fetch report:', error);
    throw error;
  }
}

/**
 * Download a report
 */
export async function downloadReport(reportId: string): Promise<Blob> {
  try {
    const response = await apiClient.get<Blob>(`/v1/reports/${reportId}/download`, {
      // @ts-expect-error - responseType is valid
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('[auditReports] Failed to download report:', error);
    throw error;
  }
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string): Promise<void> {
  try {
    await apiClient.delete(`/v1/reports/${reportId}`);
  } catch (error) {
    console.error('[auditReports] Failed to delete report:', error);
    throw error;
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: ReportStatus): string {
  switch (status) {
    case 'completed':
      return '#10B981'; // Green
    case 'generating':
    case 'pending':
      return '#3B82F6'; // Blue
    case 'failed':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'generating':
      return 'Generating...';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}









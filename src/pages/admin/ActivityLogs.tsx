/**
 * Activity Logs Page
 * 
 * Provides admins with a detailed view of user activity logs
 * with filtering, searching, and export capabilities.
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { LoadingError } from '@/components/ui/LoadingError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/providers/ToastProvider';
import {
  getActivityLogs,
  exportActivityLogs,
  getActionIcon,
  getActionLabel,
  getActionColor,
  getModuleLabel,
  type ActivityLogEntry,
  type ActivityAction,
  type ActivityModule,
  type ActivityLogFilters,
} from '@/lib/activityLogs';
import { formatRelativeTime } from '@/lib/sessions';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import {
  Activity,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

// Query key
const queryKey = (filters: ActivityLogFilters) => ['activity-logs', filters];

export function ActivityLogs() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActivityAction | 'all'>('all');
  const [moduleFilter, setModuleFilter] = useState<ActivityModule | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Build filters
  const filters: ActivityLogFilters = useMemo(() => ({
    page,
    per_page: perPage,
    search: searchTerm || undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
  }), [page, perPage, searchTerm, actionFilter, moduleFilter]);
  
  // Fetch activity logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKey(filters),
    queryFn: () => getActivityLogs(filters),
  });
  
  const logs = logsData?.data || [];
  const meta = logsData?.meta;
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportActivityLogs(filters, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({
        title: 'Export Complete',
        description: 'Activity logs have been exported.',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Export Failed',
        description: 'Failed to export activity logs.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Toggle log expansion
  const toggleLogExpansion = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };
  
  // Action options
  const actionOptions: Array<{ value: ActivityAction | 'all'; label: string }> = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'approve', label: 'Approve' },
    { value: 'reject', label: 'Reject' },
    { value: 'permission_change', label: 'Permission Change' },
  ];
  
  // Module options
  const moduleOptions: Array<{ value: ActivityModule | 'all'; label: string }> = [
    { value: 'all', label: 'All Modules' },
    { value: 'auth', label: 'Authentication' },
    { value: 'user_management', label: 'User Management' },
    { value: 'gate_pass', label: 'Gate Pass' },
    { value: 'expense', label: 'Expense' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'stockyard', label: 'Stockyard' },
    { value: 'reports', label: 'Reports' },
    { value: 'settings', label: 'Settings' },
  ];
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Activity Logs"
        subtitle="View detailed user activity and audit trail"
        icon={<Activity size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/admin' },
          { label: 'Activity Logs' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => refetch()}
              icon={<RefreshCw size={18} />}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={isExporting}
              icon={<Download size={18} />}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        }
      />
      
      {/* Filters */}
      <div style={{ ...cardStyles.base, padding: spacing.lg, marginBottom: spacing.lg }}>
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.neutral[400],
              }}
            />
            <input
              type="text"
              placeholder="Search by user, action, or resource..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                paddingLeft: '44px',
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter size={18} />}
          >
            Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        
        {/* Filter Dropdowns */}
        {showFilters && (
          <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            <div>
              <label style={{ ...typography.caption, color: colors.neutral[600], display: 'block', marginBottom: 4 }}>
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value as ActivityAction | 'all');
                  setPage(1);
                }}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  minWidth: 150,
                }}
              >
                {actionOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ ...typography.caption, color: colors.neutral[600], display: 'block', marginBottom: 4 }}>
                Module
              </label>
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value as ActivityModule | 'all');
                  setPage(1);
                }}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  minWidth: 150,
                }}
              >
                {moduleOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Activity Logs Table */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : error ? (
        <LoadingError
          resource="activity logs"
          error={error}
          onRetry={() => refetch()}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Activity Logs"
          description={searchTerm || actionFilter !== 'all' || moduleFilter !== 'all'
            ? "No logs match your filters. Try adjusting your search."
            : "Activity logs will appear here as users interact with the system."}
          icon="📋"
        />
      ) : (
        <>
          <div style={{ ...cardStyles.base, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.neutral[50] }}>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600, width: 40 }}></th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>Action</th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>User</th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>Module</th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>Resource</th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>IP Address</th>
                  <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleLogExpansion(log.id)}
                      style={{
                        borderTop: `1px solid ${colors.neutral[200]}`,
                        cursor: 'pointer',
                        backgroundColor: expandedLogId === log.id ? colors.neutral[50] : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <td style={{ padding: spacing.md, fontSize: '18px' }}>
                        {getActionIcon(log.action)}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: `2px 8px`,
                            backgroundColor: getActionColor(log.action) + '20',
                            color: getActionColor(log.action),
                            borderRadius: borderRadius.full,
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <User size={14} color={colors.neutral[500]} />
                          <span style={{ color: colors.neutral[900], fontWeight: 500 }}>
                            {log.user_name}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                        {getModuleLabel(log.module)}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        {log.resource_name ? (
                          <span style={{ color: colors.neutral[700] }}>
                            {log.resource_type}: {log.resource_name}
                          </span>
                        ) : log.resource_id ? (
                          <span style={{ color: colors.neutral[500] }}>
                            #{log.resource_id}
                          </span>
                        ) : (
                          <span style={{ color: colors.neutral[400] }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <code style={{
                          ...typography.caption,
                          backgroundColor: colors.neutral[100],
                          padding: '2px 6px',
                          borderRadius: borderRadius.sm,
                        }}>
                          {log.ip_address}
                        </code>
                      </td>
                      <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                        {formatRelativeTime(log.created_at)}
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {expandedLogId === log.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <LogDetails log={log} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {meta && (
            <Pagination
              currentPage={meta.current_page}
              totalPages={meta.last_page}
              totalItems={meta.total}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Log Details Component
function LogDetails({ log }: { log: ActivityLogEntry }) {
  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.neutral[50],
        borderTop: `1px solid ${colors.neutral[200]}`,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
        {/* User Info */}
        <div>
          <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
            User Details
          </h4>
          <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
            {log.user_name}
          </p>
          {log.user_email && (
            <p style={{ ...typography.caption, color: colors.neutral[600], margin: 0 }}>
              {log.user_email}
            </p>
          )}
        </div>
        
        {/* Timestamp */}
        <div>
          <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
            Timestamp
          </h4>
          <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
            {new Date(log.created_at).toLocaleString()}
          </p>
        </div>
        
        {/* User Agent */}
        {log.user_agent && (
          <div>
            <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
              User Agent
            </h4>
            <p style={{ ...typography.caption, color: colors.neutral[600], margin: 0, wordBreak: 'break-all' }}>
              {log.user_agent}
            </p>
          </div>
        )}
      </div>
      
      {/* Changes */}
      {(log.old_values || log.new_values) && (
        <div style={{ marginTop: spacing.lg }}>
          <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.sm }}>
            Changes
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            {log.old_values && (
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.critical + '10',
                  borderRadius: borderRadius.md,
                  borderLeft: `3px solid ${colors.critical}`,
                }}
              >
                <h5 style={{ ...typography.caption, color: colors.critical, marginBottom: spacing.xs }}>
                  Old Values
                </h5>
                <pre style={{ 
                  ...typography.caption, 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  color: colors.neutral[700],
                }}>
                  {JSON.stringify(log.old_values, null, 2)}
                </pre>
              </div>
            )}
            {log.new_values && (
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.success + '10',
                  borderRadius: borderRadius.md,
                  borderLeft: `3px solid ${colors.success}`,
                }}
              >
                <h5 style={{ ...typography.caption, color: colors.success, marginBottom: spacing.xs }}>
                  New Values
                </h5>
                <pre style={{ 
                  ...typography.caption, 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  color: colors.neutral[700],
                }}>
                  {JSON.stringify(log.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Additional Details */}
      {log.details && Object.keys(log.details).length > 0 && (
        <div style={{ marginTop: spacing.lg }}>
          <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.sm }}>
            Additional Details
          </h4>
          <pre style={{ 
            ...typography.caption, 
            padding: spacing.md,
            backgroundColor: colors.neutral[100],
            borderRadius: borderRadius.md,
            margin: 0, 
            whiteSpace: 'pre-wrap',
            color: colors.neutral[700],
          }}>
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default ActivityLogs;









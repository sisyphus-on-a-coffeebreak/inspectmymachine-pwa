/**
 * Permission Change Logs Page
 * 
 * Displays audit trail of permission changes for compliance.
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
  getPermissionLogs,
  exportPermissionLogs,
  getChangeTypeColor,
  getChangeTypeLabel,
  getChangeTypeIcon,
  type PermissionChangeLog,
  type PermissionLogFilters,
} from '@/lib/permissionLogs';
import { formatRelativeTime } from '@/lib/sessions';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import {
  Shield,
  Search,
  Filter,
  Download,
  User,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

// Query key
const queryKey = (filters: PermissionLogFilters) => ['permission-logs', filters];

export function PermissionChangeLogs() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState<PermissionChangeLog['change_type'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Build filters
  const filters: PermissionLogFilters = useMemo(() => ({
    page,
    per_page: perPage,
    change_type: changeTypeFilter !== 'all' ? changeTypeFilter : undefined,
  }), [page, perPage, changeTypeFilter]);
  
  // Fetch permission logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKey(filters),
    queryFn: () => getPermissionLogs(filters),
  });
  
  const logs = logsData?.data || [];
  const meta = logsData?.meta;
  
  // Filter by search term (client-side for now)
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.target_user_name.toLowerCase().includes(term) ||
      log.changed_by_name.toLowerCase().includes(term) ||
      log.capability_description?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);
  
  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportPermissionLogs(filters, 'csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `permission-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({
        title: 'Export Complete',
        description: 'Permission logs have been exported.',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Export Failed',
        description: 'Failed to export permission logs.',
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
  
  // Change type options
  const changeTypeOptions: Array<{ value: PermissionChangeLog['change_type'] | 'all'; label: string }> = [
    { value: 'all', label: 'All Changes' },
    { value: 'grant', label: 'Granted' },
    { value: 'revoke', label: 'Revoked' },
    { value: 'modify', label: 'Modified' },
    { value: 'template_apply', label: 'Template Applied' },
    { value: 'bulk_update', label: 'Bulk Update' },
  ];
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Permission Change Logs"
        subtitle="Audit trail of permission modifications for compliance"
        icon={<Shield size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/admin' },
          { label: 'Permission Logs' },
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
              placeholder="Search by user name or capability..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                Change Type
              </label>
              <select
                value={changeTypeFilter}
                onChange={(e) => {
                  setChangeTypeFilter(e.target.value as PermissionChangeLog['change_type'] | 'all');
                  setPage(1);
                }}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  minWidth: 180,
                }}
              >
                {changeTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Permission Logs List */}
      {isLoading ? (
        <SkeletonTable rows={10} />
      ) : error ? (
        <LoadingError
          resource="permission logs"
          error={error}
          onRetry={() => refetch()}
        />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Permission Changes"
          description={searchTerm || changeTypeFilter !== 'all'
            ? "No logs match your filters."
            : "Permission changes will appear here when users' access is modified."}
          icon="🔐"
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {filteredLogs.map((log) => (
              <PermissionLogCard
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggle={() => toggleLogExpansion(log.id)}
              />
            ))}
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

// Permission Log Card Component
interface PermissionLogCardProps {
  log: PermissionChangeLog;
  isExpanded: boolean;
  onToggle: () => void;
}

function PermissionLogCard({ log, isExpanded, onToggle }: PermissionLogCardProps) {
  const changeColor = getChangeTypeColor(log.change_type);
  
  return (
    <div
      style={{
        ...cardStyles.base,
        borderLeft: `4px solid ${changeColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: spacing.lg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: borderRadius.lg,
            backgroundColor: changeColor + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}
        >
          {getChangeTypeIcon(log.change_type)}
        </div>
        
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Change Type Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <span
              style={{
                display: 'inline-block',
                padding: `2px 10px`,
                backgroundColor: changeColor + '20',
                color: changeColor,
                borderRadius: borderRadius.full,
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {getChangeTypeLabel(log.change_type)}
            </span>
            {log.capability_description && (
              <span style={{ ...typography.body, color: colors.neutral[700] }}>
                {log.capability_description}
              </span>
            )}
          </div>
          
          {/* Users */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <UserCheck size={16} color={colors.neutral[500]} />
              <span style={{ ...typography.body, color: colors.neutral[600] }}>
                <strong style={{ color: colors.neutral[900] }}>{log.changed_by_name}</strong> changed
              </span>
            </div>
            <ArrowRight size={16} color={colors.neutral[400]} />
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <User size={16} color={colors.neutral[500]} />
              <span style={{ ...typography.body, color: colors.neutral[900], fontWeight: 500 }}>
                {log.target_user_name}
              </span>
            </div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
            {formatRelativeTime(log.created_at)}
          </p>
          <p style={{ ...typography.caption, color: colors.neutral[400], margin: 0 }}>
            {log.ip_address}
          </p>
        </div>
        
        {/* Expand Icon */}
        <div>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div
          style={{
            padding: spacing.lg,
            paddingTop: 0,
            borderTop: `1px solid ${colors.neutral[200]}`,
            backgroundColor: colors.neutral[50],
          }}
        >
          <div style={{ paddingTop: spacing.lg }}>
            {/* Change Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
              {/* Target User */}
              <div>
                <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
                  Target User
                </h4>
                <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
                  {log.target_user_name}
                </p>
                {log.target_user_email && (
                  <p style={{ ...typography.caption, color: colors.neutral[600], margin: 0 }}>
                    {log.target_user_email}
                  </p>
                )}
              </div>
              
              {/* Changed By */}
              <div>
                <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
                  Changed By
                </h4>
                <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
                  {log.changed_by_name}
                </p>
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
              
              {/* Module/Action */}
              {log.module && (
                <div>
                  <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
                    Permission
                  </h4>
                  <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
                    {log.module}.{log.action}
                  </p>
                </div>
              )}
            </div>
            
            {/* Reason */}
            {log.reason && (
              <div style={{ marginTop: spacing.lg }}>
                <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.xs }}>
                  Reason
                </h4>
                <p style={{ 
                  ...typography.body, 
                  color: colors.neutral[700], 
                  margin: 0,
                  padding: spacing.md,
                  backgroundColor: colors.neutral[100],
                  borderRadius: borderRadius.md,
                }}>
                  {log.reason}
                </p>
              </div>
            )}
            
            {/* Old/New Values */}
            {(log.old_value !== undefined || log.new_value !== undefined) && (
              <div style={{ marginTop: spacing.lg }}>
                <h4 style={{ ...typography.caption, color: colors.neutral[500], marginBottom: spacing.sm }}>
                  Value Change
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.critical + '10',
                      borderRadius: borderRadius.md,
                      borderLeft: `3px solid ${colors.critical}`,
                    }}
                  >
                    <h5 style={{ ...typography.caption, color: colors.critical, marginBottom: spacing.xs }}>
                      Before
                    </h5>
                    <pre style={{ 
                      ...typography.caption, 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      color: colors.neutral[700],
                    }}>
                      {log.old_value !== undefined 
                        ? JSON.stringify(log.old_value, null, 2)
                        : '(none)'}
                    </pre>
                  </div>
                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.success + '10',
                      borderRadius: borderRadius.md,
                      borderLeft: `3px solid ${colors.success}`,
                    }}
                  >
                    <h5 style={{ ...typography.caption, color: colors.success, marginBottom: spacing.xs }}>
                      After
                    </h5>
                    <pre style={{ 
                      ...typography.caption, 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      color: colors.neutral[700],
                    }}>
                      {log.new_value !== undefined 
                        ? JSON.stringify(log.new_value, null, 2)
                        : '(none)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PermissionChangeLogs;





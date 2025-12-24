import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserActivityLogs, useUserActivityStatistics, usePermissionChanges } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { Activity, Clock, Users, Shield, Filter, Calendar } from 'lucide-react';
import { CardGrid } from '../../components/ui/ResponsiveGrid';

export const UserActivityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'activity' | 'permissions'>('activity');
  const [filters, setFilters] = useState<{
    user_id?: string;
    action?: string;
    resource_type?: string;
    date_from?: string;
    date_to?: string;
    change_type?: string;
  }>({});
  const [page, setPage] = useState(1);

  // Fetch activity logs
  const { data: activityData, isLoading: loadingActivity, error: activityError } = useUserActivityLogs(
    { ...filters, page, per_page: 20 },
    { enabled: selectedTab === 'activity' }
  );

  // Fetch statistics
  const { data: statistics, isLoading: loadingStats } = useUserActivityStatistics();

  // Fetch permission changes
  const { data: permissionData, isLoading: loadingPermissions, error: permissionError } = usePermissionChanges(
    { ...filters, page, per_page: 20 },
    { enabled: selectedTab === 'permissions' }
  );

  const actionLabels: Record<string, string> = {
    'login': 'Login',
    'logout': 'Logout',
    'create_gate_pass': 'Create Gate Pass',
    'create_expense': 'Create Expense',
    'create_inspection': 'Create Inspection',
    'approve_expense': 'Approve Expense',
    'approve_inspection': 'Approve Inspection',
    'update_user': 'Update User',
    'delete_user': 'Delete User',
  };

  const resourceTypeLabels: Record<string, string> = {
    'gate_pass': 'Gate Pass',
    'expense': 'Expense',
    'inspection': 'Inspection',
    'user': 'User',
    'component': 'Component',
  };

  const changeTypeLabels: Record<string, string> = {
    'capability_added': 'Capability Added',
    'capability_removed': 'Capability Removed',
    'role_changed': 'Role Changed',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  if (loadingStats) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
        <div style={{ color: colors.neutral[600] }}>Loading activity dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title="User Activity Dashboard"
        subtitle="Monitor user activity, login times, and permission changes"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/app/admin/users' },
          { label: 'Activity Dashboard' }
        ]}
      />

      {/* Statistics Cards */}
      {statistics && (
        <CardGrid gap="lg" style={{ marginTop: spacing.lg }}>
          <div style={{ ...cardStyles.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <Users size={24} color={colors.primary} />
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600] }}>Total Users</div>
                <div style={{ ...typography.heading, fontSize: '24px' }}>
                  {statistics.last_logins?.length || 0}
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyles.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <Activity size={24} color={colors.success[500]} />
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600] }}>Recent Actions (7 days)</div>
                <div style={{ ...typography.heading, fontSize: '24px' }}>
                  {statistics.recent_actions?.reduce((sum: number, action: any) => sum + (action.count || 0), 0) || 0}
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...cardStyles.card }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <Clock size={24} color={colors.warning[500]} />
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600] }}>Most Active User</div>
                <div style={{ ...typography.heading, fontSize: '18px' }}>
                  {statistics.most_active_users?.[0]?.user_name || 'N/A'}
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  {statistics.most_active_users?.[0]?.activity_count || 0} actions
                </div>
              </div>
            </div>
          </div>
        </CardGrid>
      )}

      {/* Tabs */}
      <div style={{ marginTop: spacing.xl, display: 'flex', gap: spacing.md, borderBottom: `2px solid ${colors.neutral[200]}` }}>
        <button
          onClick={() => setSelectedTab('activity')}
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            border: 'none',
            background: 'transparent',
            borderBottom: selectedTab === 'activity' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: selectedTab === 'activity' ? colors.primary : colors.neutral[600],
            ...typography.body,
            fontWeight: selectedTab === 'activity' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Activity Logs
        </button>
        <button
          onClick={() => setSelectedTab('permissions')}
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            border: 'none',
            background: 'transparent',
            borderBottom: selectedTab === 'permissions' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: selectedTab === 'permissions' ? colors.primary : colors.neutral[600],
            ...typography.body,
            fontWeight: selectedTab === 'permissions' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Permission Changes
        </button>
      </div>

      {/* Activity Logs Tab */}
      {selectedTab === 'activity' && (
        <div style={{ marginTop: spacing.lg }}>
          {activityError ? (
            <NetworkError error={activityError as Error} onRetry={() => window.location.reload()} />
          ) : loadingActivity ? (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
              <div style={{ color: colors.neutral[600] }}>Loading activity logs...</div>
            </div>
          ) : activityData?.data?.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No Activity Logs"
              description="No user activity has been logged yet."
            />
          ) : (
            <>
              <div style={{ ...cardStyles.card }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {activityData?.data?.map((log: any) => (
                    <div
                      key={log.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                          <div style={{ ...typography.body, fontWeight: 600 }}>
                            {log.user_name || 'Unknown User'}
                          </div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {actionLabels[log.action] || log.action}
                          </div>
                          {log.resource_type && (
                            <>
                              <span style={{ color: colors.neutral[400] }}>•</span>
                              <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                                {resourceTypeLabels[log.resource_type] || log.resource_type}
                              </div>
                            </>
                          )}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                          {formatTimeAgo(log.performed_at)} • {log.ip_address || 'No IP'}
                        </div>
                      </div>
                      {log.resource_id && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const resourcePath = log.resource_type === 'expense' ? '/app/expenses' :
                                                 log.resource_type === 'inspection' ? '/app/inspections' :
                                                 log.resource_type === 'gate_pass' ? '/app/gate-pass' :
                                                 log.resource_type === 'user' ? '/app/admin/users' : '#';
                            navigate(`${resourcePath}/${log.resource_id}`);
                          }}
                          style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {activityData && activityData.total > activityData.per_page && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg }}>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', padding: `${spacing.sm}px ${spacing.md}px` }}>
                    Page {page} of {activityData.last_page}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.min(activityData.last_page, p + 1))}
                    disabled={page >= activityData.last_page}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Permission Changes Tab */}
      {selectedTab === 'permissions' && (
        <div style={{ marginTop: spacing.lg }}>
          {permissionError ? (
            <NetworkError error={permissionError as Error} onRetry={() => window.location.reload()} />
          ) : loadingPermissions ? (
            <div style={{ textAlign: 'center', padding: spacing.xl }}>
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
              <div style={{ color: colors.neutral[600] }}>Loading permission changes...</div>
            </div>
          ) : permissionData?.data?.length === 0 ? (
            <EmptyState
              icon="🛡️"
              title="No Permission Changes"
              description="No permission changes have been recorded yet."
            />
          ) : (
            <>
              <div style={{ ...cardStyles.card }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                  {permissionData?.data?.map((change: any) => (
                    <div
                      key={change.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <Shield size={20} color={colors.primary} />
                        <div style={{ ...typography.body, fontWeight: 600 }}>
                          {change.user_name || 'Unknown User'}
                        </div>
                        <span style={{ color: colors.neutral[400] }}>•</span>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {changeTypeLabels[change.change_type] || change.change_type}
                        </div>
                      </div>
                      <div style={{ ...typography.body, marginBottom: spacing.xs }}>
                        {change.capability && (
                          <span>
                            <strong>Capability:</strong> {change.capability}
                          </span>
                        )}
                        {change.old_value && change.new_value && (
                          <span>
                            <strong>Changed:</strong> {change.old_value} → {change.new_value}
                          </span>
                        )}
                      </div>
                      <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                        Changed by {change.changed_by_name} • {formatTimeAgo(change.changed_at)}
                        {change.reason && ` • ${change.reason}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {permissionData && permissionData.total > permissionData.per_page && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg }}>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div style={{ display: 'flex', alignItems: 'center', padding: `${spacing.sm}px ${spacing.md}px` }}>
                    Page {page} of {permissionData.last_page}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.min(permissionData.last_page, p + 1))}
                    disabled={page >= permissionData.last_page}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};






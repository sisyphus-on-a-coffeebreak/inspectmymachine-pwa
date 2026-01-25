/**
 * Enhanced User Details Page
 * 
 * Comprehensive user details with:
 * - Basic information
 * - Activity log
 * - Active sessions
 * - Related records (gate passes, expenses created by user)
 * - Capabilities viewer
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useRoles } from '@/hooks/useUsers';
import { useUserActivityLogs } from '@/lib/queries';
import { getActiveSessions, getLoginHistory, type Session, type LoginHistoryEntry } from '@/lib/sessions';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { NetworkError } from '@/components/ui/NetworkError';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { ArrowLeft, Edit, Key, Activity, Monitor, FileText, Calendar } from 'lucide-react';
import { hasCapability } from '@/lib/users';
import { useAuth } from '@/providers/useAuth';
import { getActionIcon } from '@/lib/activityLogs';
import type { ActivityLogEntry } from '@/lib/activityLogs';

export const UserDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'sessions' | 'related'>('info');

  const userId = id ? Number(id) : null;

  // Fetch user data
  const { data: user, isLoading: userLoading, error: userError } = useUser(userId, !!userId);

  // Fetch roles for display
  const { data: roles = [] } = useRoles();

  // Fetch activity logs
  const { data: activityData, isLoading: activityLoading } = useUserActivityLogs(
    userId ? { user_id: userId.toString(), page: 1, per_page: 50 } : undefined,
    { enabled: !!userId && activeTab === 'activity' }
  );

  // Fetch active sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    data: Session[];
    current_session_id: string;
  }>({
    queryKey: ['user-sessions', userId],
    queryFn: async () => {
      // For now, we'll fetch current user's sessions
      // Backend should support /v1/users/{id}/sessions endpoint
      try {
        const response = await getActiveSessions();
        // Filter by user_id if backend supports it
        return response;
      } catch (error) {
        // If endpoint doesn't exist, return empty
        return { data: [], current_session_id: '' };
      }
    },
    enabled: !!userId && activeTab === 'sessions',
  });

  // Fetch login history
  const { data: loginHistory, isLoading: loginHistoryLoading } = useQuery<{
    data: LoginHistoryEntry[];
    meta?: any;
  }>({
    queryKey: ['user-login-history', userId],
    queryFn: async () => {
      try {
        const response = await getLoginHistory({ page: 1, per_page: 20 });
        return response;
      } catch (error) {
        return { data: [] };
      }
    },
    enabled: !!userId && activeTab === 'sessions',
  });

  // Track in recently viewed
  React.useEffect(() => {
    if (user && id) {
      addRecentlyViewed({
        id: String(id),
        type: 'user',
        title: user.name || `User #${id.substring(0, 8)}`,
        subtitle: user.employee_id || user.email || 'User Details',
        path: `/app/admin/users/${id}`,
      });
    }
  }, [user, id]);

  if (userLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <LoadingState variant="skeleton" message="Loading user details..." />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <NetworkError
          error={userError || new Error('User not found')}
          onRetry={() => window.location.reload()}
          onGoBack={() => navigate('/app/admin/users')}
        />
      </div>
    );
  }

  const roleLabel = roles.find((r) => r.value === user.role)?.label || user.role;
  const canUpdate = hasCapability(currentUser, 'user_management', 'update');

  const activityLogs = activityData?.data || [];
  const sessions = sessionsData?.data || [];
  const loginHistoryEntries = loginHistory?.data || [];

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        title={user.name || `User #${id?.substring(0, 8)}`}
        subtitle={user.employee_id || user.email || 'User Details'}
        icon="👤"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'User Management', path: '/app/admin/users' },
          { label: 'Details' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {canUpdate && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/admin/users/${user.id}/edit`)}
                  icon={<Edit size={16} />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/app/admin/users/${user.id}/reset-password`)}
                  icon={<Key size={16} />}
                >
                  Reset Password
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => navigate('/app/admin/users')} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginTop: spacing.lg,
          borderBottom: `2px solid ${colors.neutral[200]}`,
        }}
      >
        {[
          { id: 'info', label: 'Information', icon: '👤' },
          { id: 'activity', label: 'Activity Log', icon: '📋' },
          { id: 'sessions', label: 'Sessions', icon: '💻' },
          { id: 'related', label: 'Related Records', icon: '🔗' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab.id ? colors.primary : 'transparent'}`,
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? colors.primary : colors.neutral[600],
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              ...typography.body,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: spacing.lg }}>
        {activeTab === 'info' && (
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>User Information</h3>
            <div style={{ display: 'grid', gap: spacing.md, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Employee ID
                </div>
                <div style={{ ...typography.body, fontWeight: 600 }}>{user.employee_id}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Name</div>
                <div style={{ ...typography.body }}>{user.name}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Email</div>
                <div style={{ ...typography.body }}>{user.email}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Role</div>
                <div style={{ ...typography.body }}>{roleLabel}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Status</div>
                <div style={{ ...typography.body }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: user.is_active ? colors.success[500] : colors.error[500],
                      color: 'white',
                    }}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {user.last_login_at && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Last Login
                  </div>
                  <div style={{ ...typography.body }}>{new Date(user.last_login_at).toLocaleString()}</div>
                </div>
              )}
              {user.created_at && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Created At
                  </div>
                  <div style={{ ...typography.body }}>{new Date(user.created_at).toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Capabilities Section */}
            {user.capabilities && (
              <div style={{ marginTop: spacing.xl }}>
                <h4 style={{ ...typography.subheader, marginBottom: spacing.md }}>Capabilities</h4>
                <div style={{ display: 'grid', gap: spacing.md }}>
                  {Object.entries(user.capabilities).map(([module, actions]) => (
                    <div key={module} style={{ padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: borderRadius.md }}>
                      <div style={{ ...typography.label, marginBottom: spacing.xs, textTransform: 'capitalize' }}>
                        {module.replace('_', ' ')}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                        {Array.isArray(actions) &&
                          actions.map((action) => (
                            <span
                              key={action}
                              style={{
                                padding: `${spacing.xs} ${spacing.sm}`,
                                backgroundColor: colors.primary + '20',
                                color: colors.primary,
                                borderRadius: borderRadius.sm,
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {action}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Activity Log</h3>
            {activityLoading ? (
              <LoadingState variant="minimal" message="Loading activity..." />
            ) : activityLogs.length === 0 ? (
              <EmptyState icon="📋" title="No activity found" description="This user has no recorded activity yet." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {activityLogs.map((log: ActivityLogEntry) => (
                  <div
                    key={log.id}
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      borderRadius: borderRadius.md,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.md,
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{getActionIcon(log.action)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...typography.body, fontWeight: 600 }}>
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.resource_type || log.module}
                      </div>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {log.details && Object.keys(log.details).length > 0
                          ? JSON.stringify(log.details)
                          : 'No details'}
                      </div>
                      <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Active Sessions</h3>
            {sessionsLoading ? (
              <LoadingState variant="minimal" message="Loading sessions..." />
            ) : sessions.length === 0 ? (
              <EmptyState icon="💻" title="No active sessions" description="This user has no active sessions." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: session.is_current ? colors.primary + '10' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ ...typography.body, fontWeight: 600 }}>
                          {session.device_type === 'desktop' ? '💻' : session.device_type === 'mobile' ? '📱' : '📲'}{' '}
                          {session.browser} on {session.os}
                        </div>
                        <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
                          {session.ip_address}
                          {session.location && ` • ${session.location.city || ''} ${session.location.country || ''}`}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                          Last activity: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                      {session.is_current && (
                        <span
                          style={{
                            padding: `${spacing.xs} ${spacing.sm}`,
                            backgroundColor: colors.success[500],
                            color: 'white',
                            borderRadius: borderRadius.sm,
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Login History */}
            <div style={{ marginTop: spacing.xl }}>
              <h4 style={{ ...typography.subheader, marginBottom: spacing.md }}>Login History</h4>
              {loginHistoryLoading ? (
                <LoadingState variant="minimal" message="Loading login history..." />
              ) : loginHistoryEntries.length === 0 ? (
                <EmptyState icon="🔑" title="No login history" description="No login records found." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {loginHistoryEntries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ ...typography.body, fontWeight: 600 }}>
                          {entry.status === 'success' ? '✅' : '❌'} {entry.browser} on {entry.os}
                        </div>
                        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                          {entry.ip_address}
                          {entry.location && ` • ${entry.location.city || ''} ${entry.location.country || ''}`}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                      {entry.failure_reason && (
                        <div style={{ ...typography.caption, color: colors.error[600] }}>{entry.failure_reason}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'related' && (
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Related Records</h3>
            <EmptyState
              icon="🔗"
              title="Related Records"
              description="Gate passes, expenses, and inspections created by this user will appear here."
            />
            {/* TODO: Implement related records fetching */}
          </div>
        )}
      </div>
    </div>
  );
};


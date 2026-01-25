/**
 * Session Management Page
 * 
 * Allows users to view and manage their active sessions,
 * including terminating sessions from other devices.
 */

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { LoadingError } from '@/components/ui/LoadingError';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActiveSessionCard } from '@/components/settings/ActiveSessionCard';
import { useToast } from '@/providers/ToastProvider';
import {
  getActiveSessions,
  terminateSession,
  terminateAllOtherSessions,
  getLoginHistory,
  type Session,
  type LoginHistoryEntry,
  formatRelativeTime,
} from '@/lib/sessions';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { 
  Shield, 
  LogOut, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Monitor,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

// Query keys
const queryKeys = {
  sessions: ['sessions', 'active'],
  loginHistory: (page: number) => ['sessions', 'history', page],
};

export function SessionManagement() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'history'>('sessions');
  const [historyPage, setHistoryPage] = useState(1);
  
  // Fetch active sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: queryKeys.sessions,
    queryFn: getActiveSessions,
  });
  
  // Fetch login history
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: queryKeys.loginHistory(historyPage),
    queryFn: () => getLoginHistory({ page: historyPage, per_page: 20 }),
    enabled: activeTab === 'history',
  });
  
  // Terminate single session mutation
  const terminateMutation = useMutation({
    mutationFn: terminateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      showToast({
        title: 'Session Terminated',
        description: 'The session has been ended successfully.',
        variant: 'success',
      });
      setTerminatingId(null);
    },
    onError: (error) => {
      showToast({
        title: 'Failed to Terminate Session',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      });
      setTerminatingId(null);
    },
  });
  
  // Terminate all sessions mutation
  const terminateAllMutation = useMutation({
    mutationFn: terminateAllOtherSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      showToast({
        title: 'All Other Sessions Terminated',
        description: `${data.terminated_count} session(s) have been ended.`,
        variant: 'success',
      });
      setShowTerminateAll(false);
    },
    onError: (error) => {
      showToast({
        title: 'Failed to Terminate Sessions',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      });
    },
  });
  
  const handleTerminateSession = useCallback((sessionId: string) => {
    setTerminatingId(sessionId);
    terminateMutation.mutate(sessionId);
  }, [terminateMutation]);
  
  const handleTerminateAll = useCallback(() => {
    terminateAllMutation.mutate();
  }, [terminateAllMutation]);
  
  const sessions = sessionsData?.data || [];
  const otherSessionsCount = sessions.filter(s => !s.is_current).length;
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Session Management"
        subtitle="View and manage your active sessions across devices"
        icon={<Shield size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Settings', path: '/settings' },
          { label: 'Sessions' },
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => refetchSessions()}
            icon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>
        }
      />
      
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          borderBottom: `1px solid ${colors.neutral[200]}`,
          paddingBottom: spacing.sm,
        }}
      >
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: activeTab === 'sessions' ? colors.primary + '10' : 'transparent',
            color: activeTab === 'sessions' ? colors.primary : colors.neutral[600],
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontWeight: activeTab === 'sessions' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <Monitor size={18} />
          Active Sessions
          {sessions.length > 0 && (
            <span
              style={{
                backgroundColor: colors.primary,
                color: '#fff',
                padding: `2px 8px`,
                borderRadius: borderRadius.full,
                fontSize: '12px',
                marginLeft: spacing.xs,
              }}
            >
              {sessions.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: activeTab === 'history' ? colors.primary + '10' : 'transparent',
            color: activeTab === 'history' ? colors.primary : colors.neutral[600],
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <History size={18} />
          Login History
        </button>
      </div>
      
      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          {/* Security Banner */}
          {otherSessionsCount > 0 && (
            <div
              style={{
                ...cardStyles.base,
                backgroundColor: colors.warning + '10',
                borderColor: colors.warning,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: spacing.md,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <AlertTriangle size={24} color={colors.warning} />
                <div>
                  <h3 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: 2 }}>
                    {otherSessionsCount} other active session{otherSessionsCount !== 1 ? 's' : ''}
                  </h3>
                  <p style={{ ...typography.caption, color: colors.neutral[600] }}>
                    If you don't recognize any of these sessions, end them immediately.
                  </p>
                </div>
              </div>
              <Button
                variant="warning"
                onClick={() => setShowTerminateAll(true)}
                icon={<LogOut size={18} />}
              >
                End All Other Sessions
              </Button>
            </div>
          )}
          
          {/* Sessions List */}
          {sessionsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sessionsError ? (
            <LoadingError
              resource="sessions"
              error={sessionsError}
              onRetry={() => refetchSessions()}
            />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No Active Sessions"
              description="You don't have any active sessions."
              icon="🔐"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {sessions
                .sort((a, b) => (a.is_current ? -1 : b.is_current ? 1 : 0))
                .map((session) => (
                  <ActiveSessionCard
                    key={session.id}
                    session={session}
                    onTerminate={handleTerminateSession}
                    isTerminating={terminatingId === session.id}
                  />
                ))}
            </div>
          )}
        </>
      )}
      
      {/* Login History Tab */}
      {activeTab === 'history' && (
        <>
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : historyError ? (
            <LoadingError
              resource="login history"
              error={historyError}
              onRetry={() => setHistoryPage(1)}
            />
          ) : !historyData?.data?.length ? (
            <EmptyState
              title="No Login History"
              description="Your login history will appear here."
              icon="📋"
            />
          ) : (
            <div style={{ ...cardStyles.base, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: colors.neutral[50] }}>
                    <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                      Device
                    </th>
                    <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                      Location
                    </th>
                    <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                      IP Address
                    </th>
                    <th style={{ ...typography.caption, padding: spacing.md, textAlign: 'left', fontWeight: 600 }}>
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.data.map((entry: LoginHistoryEntry) => (
                    <tr 
                      key={entry.id}
                      style={{ 
                        borderTop: `1px solid ${colors.neutral[200]}`,
                        backgroundColor: entry.status === 'failed' ? colors.critical + '05' : 'transparent',
                      }}
                    >
                      <td style={{ padding: spacing.md }}>
                        {entry.status === 'success' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <CheckCircle size={16} color={colors.success} />
                            <span style={{ color: colors.success, fontWeight: 500 }}>Success</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <XCircle size={16} color={colors.critical} />
                            <span style={{ color: colors.critical, fontWeight: 500 }}>Failed</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          {entry.device_type === 'mobile' ? (
                            <Smartphone size={16} color={colors.neutral[500]} />
                          ) : (
                            <Monitor size={16} color={colors.neutral[500]} />
                          )}
                          <span style={{ ...typography.body, color: colors.neutral[700] }}>
                            {entry.browser} on {entry.os}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                        {entry.location?.city && entry.location?.country 
                          ? `${entry.location.city}, ${entry.location.country}`
                          : 'Unknown'}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <code style={{ 
                          ...typography.caption, 
                          backgroundColor: colors.neutral[100],
                          padding: `2px 6px`,
                          borderRadius: borderRadius.sm,
                        }}>
                          {entry.ip_address}
                        </code>
                      </td>
                      <td style={{ padding: spacing.md, color: colors.neutral[600] }}>
                        {formatRelativeTime(entry.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Terminate All Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showTerminateAll}
        onClose={() => setShowTerminateAll(false)}
        onConfirm={handleTerminateAll}
        title="End All Other Sessions?"
        message={`This will log you out from ${otherSessionsCount} other device${otherSessionsCount !== 1 ? 's' : ''}. You will remain logged in on this device.`}
        confirmText="End All Sessions"
        confirmVariant="warning"
        isLoading={terminateAllMutation.isPending}
      />
    </div>
  );
}

export default SessionManagement;









/**
 * Security Dashboard Page
 * 
 * Provides admins with an overview of security metrics,
 * failed login attempts, locked accounts, and security events.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { LoadingError } from '@/components/ui/LoadingError';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import {
  getSecurityMetrics,
  getFailedLogins,
  getLockedAccounts,
  getSecurityEvents,
  unlockAccount,
  getSeverityColor,
  getEventTypeIcon,
  getEventTypeLabel,
  type SecurityMetrics,
  type FailedLoginAttempt,
  type LockedAccount,
  type SecurityEvent,
} from '@/lib/security';
import { formatRelativeTime } from '@/lib/sessions';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';
import {
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  Activity,
  Clock,
  Monitor,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

// Query keys
const queryKeys = {
  metrics: ['security', 'metrics'],
  failedLogins: ['security', 'failed-logins'],
  lockedAccounts: ['security', 'locked-accounts'],
  events: (page: number) => ['security', 'events', page],
};

export function SecurityDashboard() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [unlockingId, setUnlockingId] = useState<number | null>(null);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState<LockedAccount | null>(null);
  const [eventsPage, setEventsPage] = useState(1);
  
  // Fetch security metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: queryKeys.metrics,
    queryFn: getSecurityMetrics,
  });
  
  // Fetch failed logins
  const {
    data: failedLoginsData,
    isLoading: failedLoginsLoading,
  } = useQuery({
    queryKey: queryKeys.failedLogins,
    queryFn: () => getFailedLogins({ per_page: 10, hours: 24 }),
  });
  
  // Fetch locked accounts
  const {
    data: lockedAccountsData,
    isLoading: lockedAccountsLoading,
  } = useQuery({
    queryKey: queryKeys.lockedAccounts,
    queryFn: getLockedAccounts,
  });
  
  // Fetch security events
  const {
    data: eventsData,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: queryKeys.events(eventsPage),
    queryFn: () => getSecurityEvents({ page: eventsPage, per_page: 10 }),
  });
  
  // Unlock account mutation
  const unlockMutation = useMutation({
    mutationFn: (userId: number) => unlockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lockedAccounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics });
      showToast({
        title: 'Account Unlocked',
        description: 'The account has been unlocked successfully.',
        variant: 'success',
      });
      setShowUnlockConfirm(null);
    },
    onError: (error) => {
      showToast({
        title: 'Failed to Unlock Account',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'error',
      });
    },
  });
  
  const handleUnlock = (account: LockedAccount) => {
    setShowUnlockConfirm(account);
  };
  
  const confirmUnlock = () => {
    if (showUnlockConfirm) {
      unlockMutation.mutate(showUnlockConfirm.id);
    }
  };
  
  const failedLogins = failedLoginsData?.data || [];
  const lockedAccounts = lockedAccountsData?.data || [];
  const events = eventsData?.data || [];
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Security Dashboard"
        subtitle="Monitor security metrics and manage account security"
        icon={<Shield size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/admin' },
          { label: 'Security' },
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => refetchMetrics()}
            icon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>
        }
      />
      
      {/* Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <MetricCard
          title="Active Sessions"
          value={metrics?.active_sessions ?? '-'}
          icon={<Users size={24} color={colors.primary} />}
          loading={metricsLoading}
        />
        <MetricCard
          title="Failed Logins (24h)"
          value={metrics?.failed_logins_24h ?? '-'}
          icon={<AlertTriangle size={24} color={colors.warning} />}
          loading={metricsLoading}
          variant={metrics?.failed_logins_24h && metrics.failed_logins_24h > 10 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Locked Accounts"
          value={metrics?.locked_accounts ?? '-'}
          icon={<Lock size={24} color={colors.critical} />}
          loading={metricsLoading}
          variant={metrics?.locked_accounts && metrics.locked_accounts > 0 ? 'critical' : 'default'}
        />
        <MetricCard
          title="New Devices (7d)"
          value={metrics?.new_devices_7d ?? '-'}
          icon={<Monitor size={24} color={colors.info || colors.primary} />}
          loading={metricsLoading}
        />
      </div>
      
      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {/* Failed Login Attempts */}
        <div style={{ ...cardStyles.base, padding: spacing.lg }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}>
            <h2 style={{ ...typography.subheader, color: colors.neutral[900], margin: 0 }}>
              <AlertTriangle size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle' }} />
              Failed Login Attempts
            </h2>
            <span style={{ ...typography.caption, color: colors.neutral[500] }}>
              Last 24 hours
            </span>
          </div>
          
          {failedLoginsLoading ? (
            <SkeletonCard />
          ) : failedLogins.length === 0 ? (
            <EmptyState
              title="No Failed Logins"
              description="No failed login attempts in the last 24 hours."
              icon="✅"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {failedLogins.slice(0, 5).map((attempt) => (
                <FailedLoginRow key={attempt.id} attempt={attempt} />
              ))}
              {failedLogins.length > 5 && (
                <Button variant="ghost" size="sm" style={{ alignSelf: 'center' }}>
                  View All ({failedLogins.length}) <ChevronRight size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Locked Accounts */}
        <div style={{ ...cardStyles.base, padding: spacing.lg }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: spacing.lg,
          }}>
            <h2 style={{ ...typography.subheader, color: colors.neutral[900], margin: 0 }}>
              <Lock size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle' }} />
              Locked Accounts
            </h2>
            <span style={{ ...typography.caption, color: colors.neutral[500] }}>
              {lockedAccounts.length} locked
            </span>
          </div>
          
          {lockedAccountsLoading ? (
            <SkeletonCard />
          ) : lockedAccounts.length === 0 ? (
            <EmptyState
              title="No Locked Accounts"
              description="All accounts are currently accessible."
              icon="🔓"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {lockedAccounts.map((account) => (
                <LockedAccountRow 
                  key={account.id} 
                  account={account} 
                  onUnlock={handleUnlock}
                  isUnlocking={unlockingId === account.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Security Events */}
      <div style={{ ...cardStyles.base, padding: spacing.lg, marginTop: spacing.lg }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}>
          <h2 style={{ ...typography.subheader, color: colors.neutral[900], margin: 0 }}>
            <Activity size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle' }} />
            Recent Security Events
          </h2>
        </div>
        
        {eventsLoading ? (
          <SkeletonCard />
        ) : events.length === 0 ? (
          <EmptyState
            title="No Security Events"
            description="Security events will appear here."
            icon="📋"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {events.map((event) => (
              <SecurityEventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
      
      {/* Unlock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!showUnlockConfirm}
        onClose={() => setShowUnlockConfirm(null)}
        onConfirm={confirmUnlock}
        title="Unlock Account?"
        message={`Are you sure you want to unlock the account for ${showUnlockConfirm?.name} (${showUnlockConfirm?.email})?`}
        confirmText="Unlock Account"
        confirmVariant="primary"
        isLoading={unlockMutation.isPending}
      />
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'warning' | 'critical';
}

function MetricCard({ title, value, icon, loading, variant = 'default' }: MetricCardProps) {
  const bgColor = variant === 'critical' 
    ? colors.critical + '10' 
    : variant === 'warning' 
      ? colors.warning + '10' 
      : colors.neutral[50];
  
  const borderColor = variant === 'critical'
    ? colors.critical
    : variant === 'warning'
      ? colors.warning
      : colors.neutral[200];
  
  return (
    <div
      style={{
        ...cardStyles.base,
        padding: spacing.lg,
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: variant !== 'default' ? 2 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
            {title}
          </p>
          {loading ? (
            <div 
              style={{ 
                width: 60, 
                height: 32, 
                backgroundColor: colors.neutral[200], 
                borderRadius: borderRadius.md,
                animation: 'pulse 1.5s infinite',
              }} 
            />
          ) : (
            <p style={{ 
              ...typography.header, 
              fontSize: '28px', 
              color: colors.neutral[900], 
              margin: 0,
            }}>
              {value}
            </p>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: borderRadius.lg,
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.sm,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Failed Login Row Component
function FailedLoginRow({ attempt }: { attempt: FailedLoginAttempt }) {
  return (
    <div
      style={{
        padding: spacing.sm,
        backgroundColor: colors.critical + '05',
        borderRadius: borderRadius.md,
        borderLeft: `3px solid ${colors.critical}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ ...typography.body, fontWeight: 500, color: colors.neutral[900], margin: 0 }}>
            {attempt.email || attempt.employee_id || 'Unknown'}
          </p>
          <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
            {attempt.ip_address} • {attempt.reason.replace('_', ' ')}
          </p>
        </div>
        <span style={{ ...typography.caption, color: colors.neutral[500] }}>
          {formatRelativeTime(attempt.created_at)}
        </span>
      </div>
    </div>
  );
}

// Locked Account Row Component
function LockedAccountRow({ 
  account, 
  onUnlock, 
  isUnlocking 
}: { 
  account: LockedAccount; 
  onUnlock: (account: LockedAccount) => void;
  isUnlocking: boolean;
}) {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <p style={{ ...typography.body, fontWeight: 500, color: colors.neutral[900], margin: 0 }}>
          {account.name}
        </p>
        <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
          {account.email} • {account.failed_attempts} failed attempts
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onUnlock(account)}
        disabled={isUnlocking}
        icon={<Unlock size={14} />}
      >
        {isUnlocking ? 'Unlocking...' : 'Unlock'}
      </Button>
    </div>
  );
}

// Security Event Row Component
function SecurityEventRow({ event }: { event: SecurityEvent }) {
  const severityColor = getSeverityColor(event.severity);
  
  return (
    <div
      style={{
        padding: spacing.sm,
        borderLeft: `3px solid ${severityColor}`,
        backgroundColor: severityColor + '05',
        borderRadius: `0 ${borderRadius.md} ${borderRadius.md} 0`,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <span style={{ fontSize: '18px' }}>{getEventTypeIcon(event.type)}</span>
      <div style={{ flex: 1 }}>
        <p style={{ ...typography.body, color: colors.neutral[900], margin: 0 }}>
          {getEventTypeLabel(event.type)}
          {event.user_name && (
            <span style={{ color: colors.neutral[600] }}> - {event.user_name}</span>
          )}
        </p>
        <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
          {event.ip_address} • {formatRelativeTime(event.created_at)}
        </p>
      </div>
    </div>
  );
}

export default SecurityDashboard;









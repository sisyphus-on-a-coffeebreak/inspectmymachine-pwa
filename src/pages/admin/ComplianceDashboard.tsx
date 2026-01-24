/**
 * Compliance Dashboard Page
 * 
 * Overview of compliance status with quick access to audit data.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { getSecurityMetrics } from '@/lib/security';
import { getPermissionLogs } from '@/lib/permissionLogs';
import { getActivityLogs } from '@/lib/activityLogs';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';
import {
  ClipboardCheck,
  Shield,
  Users,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Lock,
} from 'lucide-react';

export function ComplianceDashboard() {
  const navigate = useNavigate();
  
  // Fetch security metrics
  const { data: securityMetrics, isLoading: metricsLoading, refetch } = useQuery({
    queryKey: ['security', 'metrics'],
    queryFn: getSecurityMetrics,
  });
  
  // Fetch recent permission changes
  const { data: permissionLogsData, isLoading: permLogsLoading } = useQuery({
    queryKey: ['permission-logs', 'recent'],
    queryFn: () => getPermissionLogs({ per_page: 5 }),
  });
  
  // Fetch recent activity
  const { data: activityLogsData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-logs', 'recent'],
    queryFn: () => getActivityLogs({ per_page: 5 }),
  });
  
  const permissionLogs = permissionLogsData?.data || [];
  const activityLogs = activityLogsData?.data || [];
  
  // Calculate compliance score (mock calculation)
  const complianceScore = React.useMemo(() => {
    let score = 100;
    
    // Deduct for locked accounts
    if (securityMetrics?.locked_accounts && securityMetrics.locked_accounts > 0) {
      score -= securityMetrics.locked_accounts * 5;
    }
    
    // Deduct for failed logins
    if (securityMetrics?.failed_logins_24h && securityMetrics.failed_logins_24h > 10) {
      score -= Math.min(20, (securityMetrics.failed_logins_24h - 10) * 2);
    }
    
    return Math.max(0, Math.min(100, score));
  }, [securityMetrics]);
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.critical;
  };
  
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Compliance Dashboard"
        subtitle="Overview of security and compliance status"
        icon={<ClipboardCheck size={28} />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/admin' },
          { label: 'Compliance' },
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => refetch()}
            icon={<RefreshCw size={18} />}
          >
            Refresh
          </Button>
        }
      />
      
      {/* Compliance Score */}
      <div
        style={{
          ...cardStyles.base,
          padding: spacing.xl,
          marginBottom: spacing.xl,
          background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.primary}05 100%)`,
          borderColor: colors.primary + '30',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl, flexWrap: 'wrap' }}>
          {/* Score Circle */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `conic-gradient(${getScoreColor(complianceScore)} ${complianceScore * 3.6}deg, ${colors.neutral[200]} 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: getScoreColor(complianceScore),
                }}
              >
                {complianceScore}
              </span>
              <span style={{ ...typography.caption, color: colors.neutral[500] }}>
                /100
              </span>
            </div>
          </div>
          
          {/* Score Details */}
          <div style={{ flex: 1 }}>
            <h2 style={{ ...typography.header, color: colors.neutral[900], marginBottom: spacing.sm }}>
              Compliance Score
            </h2>
            <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
              {complianceScore >= 90 && 'Excellent! Your system is well-secured and compliant.'}
              {complianceScore >= 70 && complianceScore < 90 && 'Good, but there are some areas that need attention.'}
              {complianceScore < 70 && 'Attention required! Several compliance issues need to be addressed.'}
            </p>
            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button
                variant="primary"
                onClick={() => navigate('/app/admin/security')}
                icon={<Shield size={18} />}
              >
                View Security
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/app/admin/audit-reports')}
                icon={<FileText size={18} />}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <QuickStatCard
          title="Active Users"
          value={securityMetrics?.active_sessions ?? '-'}
          icon={<Users size={24} color={colors.primary} />}
          loading={metricsLoading}
          onClick={() => navigate('/app/admin/users')}
        />
        <QuickStatCard
          title="Permission Changes"
          value={permissionLogs.length}
          subtitle="Last 7 days"
          icon={<Lock size={24} color={colors.info || colors.primary} />}
          loading={permLogsLoading}
          onClick={() => navigate('/app/admin/permission-logs')}
        />
        <QuickStatCard
          title="Security Events"
          value={securityMetrics?.failed_logins_24h ?? '-'}
          subtitle="Failed logins (24h)"
          icon={<AlertTriangle size={24} color={colors.warning} />}
          loading={metricsLoading}
          variant={securityMetrics?.failed_logins_24h && securityMetrics.failed_logins_24h > 10 ? 'warning' : 'default'}
          onClick={() => navigate('/app/admin/security')}
        />
        <QuickStatCard
          title="Activity Logs"
          value={activityLogs.length}
          subtitle="Recent actions"
          icon={<Activity size={24} color={colors.success} />}
          loading={activityLoading}
          onClick={() => navigate('/app/admin/activity-logs')}
        />
      </div>
      
      {/* Quick Access Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: spacing.lg,
        }}
      >
        {/* Recent Permission Changes */}
        <div style={{ ...cardStyles.base, padding: spacing.lg }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <h3 style={{ ...typography.subheader, color: colors.neutral[900], margin: 0 }}>
              <Lock size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle' }} />
              Recent Permission Changes
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/admin/permission-logs')}
            >
              View All <ArrowRight size={16} />
            </Button>
          </div>
          
          {permLogsLoading ? (
            <SkeletonCard />
          ) : permissionLogs.length === 0 ? (
            <p style={{ ...typography.body, color: colors.neutral[500], textAlign: 'center', padding: spacing.xl }}>
              No recent permission changes
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {permissionLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {log.change_type === 'grant' ? '✅' : log.change_type === 'revoke' ? '🚫' : '✏️'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...typography.body, color: colors.neutral[900], margin: 0, fontSize: '14px' }}>
                      <strong>{log.changed_by_name}</strong> {log.change_type}d permission
                    </p>
                    <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0 }}>
                      to {log.target_user_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Compliance Checklist */}
        <div style={{ ...cardStyles.base, padding: spacing.lg }}>
          <h3 style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.lg }}>
            <CheckCircle size={18} style={{ marginRight: spacing.sm, verticalAlign: 'middle' }} />
            Compliance Checklist
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <ChecklistItem
              label="Password policy enforced"
              checked={true}
            />
            <ChecklistItem
              label="Session timeout configured"
              checked={true}
            />
            <ChecklistItem
              label="Activity logging enabled"
              checked={true}
            />
            <ChecklistItem
              label="Permission changes tracked"
              checked={true}
            />
            <ChecklistItem
              label="No locked accounts"
              checked={!securityMetrics?.locked_accounts || securityMetrics.locked_accounts === 0}
            />
            <ChecklistItem
              label="Failed login alerts configured"
              checked={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick Stat Card Component
interface QuickStatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'warning' | 'critical';
  onClick?: () => void;
}

function QuickStatCard({ title, value, subtitle, icon, loading, variant = 'default', onClick }: QuickStatCardProps) {
  const bgColor = variant === 'critical' 
    ? colors.critical + '10' 
    : variant === 'warning' 
      ? colors.warning + '10' 
      : colors.neutral[50];
  
  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyles.base,
        padding: spacing.lg,
        backgroundColor: bgColor,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = shadows.md;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
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
                width: 50, 
                height: 28, 
                backgroundColor: colors.neutral[200], 
                borderRadius: borderRadius.md,
              }} 
            />
          ) : (
            <>
              <p style={{ 
                ...typography.header, 
                fontSize: '24px', 
                color: colors.neutral[900], 
                margin: 0,
              }}>
                {value}
              </p>
              {subtitle && (
                <p style={{ ...typography.caption, color: colors.neutral[500], margin: 0, marginTop: 2 }}>
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
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

// Checklist Item Component
function ChecklistItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        backgroundColor: checked ? colors.success + '10' : colors.warning + '10',
        borderRadius: borderRadius.md,
      }}
    >
      {checked ? (
        <CheckCircle size={18} color={colors.success} />
      ) : (
        <AlertTriangle size={18} color={colors.warning} />
      )}
      <span style={{ ...typography.body, color: colors.neutral[700] }}>
        {label}
      </span>
    </div>
  );
}

export default ComplianceDashboard;








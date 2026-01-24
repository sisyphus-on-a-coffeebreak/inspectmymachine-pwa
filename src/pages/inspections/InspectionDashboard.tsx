import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspectionDashboard } from '../../lib/queries';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { StatsGrid, ActionGrid, WideGrid } from '../../components/ui/ResponsiveGrid';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useAuth } from '../../providers/useAuth';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { LineChart, BarChart, PieChart } from '../../components/ui/charts';
import { SkeletonCard, SkeletonLoader } from '../../components/ui/SkeletonLoader';

interface DashboardStats {
  total_today: number;
  total_week: number;
  total_month: number;
  pending: number;
  completed: number;
  approved: number;
  rejected: number;
  pass_rate: number;
  avg_duration: number;
  critical_issues: number;
}

interface RecentInspection {
  id: string;
  vehicle_registration: string;
  vehicle_make: string;
  vehicle_model: string;
  inspector_name: string;
  status: string;
  overall_rating: number;
  pass_fail: string;
  created_at: string;
  has_critical_issues: boolean;
}

export const InspectionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use React Query for inspection dashboard data
  const { data: dashboardData, isLoading: loading, error: queryError, refetch } = useInspectionDashboard();
  
  const stats = dashboardData?.stats as DashboardStats | null;
  const recentInspections = (dashboardData?.recent_inspections || []) as RecentInspection[];
  const dailyTrends = (dashboardData?.daily_trends || []) as Array<{ date: string; count: number }>;
  const vehicleTypeBreakdown = (dashboardData?.vehicle_type_breakdown || []) as Array<{ vehicle_type: string; count: number }>;
  const error = queryError ? (queryError instanceof Error ? queryError : new Error('Failed to load inspection dashboard')) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.status.normal;
      case 'pending': return colors.status.warning;
      case 'rejected': return colors.status.critical;
      case 'approved': return colors.status.normal;
      default: return colors.neutral[400];
    }
  };

  const getPassFailColor = (passFail: string) => {
    switch (passFail) {
      case 'pass': return colors.status.normal;
      case 'fail': return colors.status.critical;
      case 'conditional': return colors.status.warning;
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: spacing.xl }}>
        <PageHeader
          title="Vehicle Inspections"
          subtitle="Comprehensive vehicle inspection and reporting system"
          icon="🔍"
        />
        <div style={{ marginBottom: spacing.xl }}>
          <WideGrid gap="lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={`stats-${i}`} />
            ))}
          </WideGrid>
        </div>
        <SkeletonLoader variant="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <NetworkError
          error={error}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: spacing.xl,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: colors.neutral[50],
        minHeight: '100vh'
      }}>
      {/* Mock Data Notice - Removed, using React Query now */}
      {false && (
        <div style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.status.warning + '20',
          border: `1px solid ${colors.status.warning}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <div style={{ ...typography.label, color: colors.status.warning, marginBottom: spacing.xs }}>
              🚧 Development Mode
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[700], marginBottom: spacing.sm }}>
              Laravel backend not configured. Showing mock inspection data for demonstration.
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://laravel.com/docs', '_blank')}
              >
                📚 Setup Laravel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://github.com/laravel/laravel', '_blank')}
              >
                🔧 Backend Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Vehicle Inspections"
        subtitle="Comprehensive vehicle inspection and reporting system"
        icon="🔍"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Inspections' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            icon="⬅️"
          >
            Back
          </Button>
          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <Button
              variant="secondary"
              onClick={() => navigate('/app/inspections/studio')}
              icon="🎨"
            >
              Studio
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => navigate('/app/inspections/create')}
            icon="➕"
          >
            Start Inspection
          </Button>
        </div>
        }
      />

      {/* Policy Links */}
      <PolicyLinks
        title="Inspection Standards & Compliance"
        links={[
          {
            label: 'Inspection Standards',
            url: '/policies/inspection-standards',
            external: false,
            icon: '📐'
          },
          {
            label: 'Critical Issue Definitions',
            url: '/policies/critical-issues',
            external: false,
            icon: '⚠️'
          },
          {
            label: 'Regulatory Compliance',
            url: '/policies/regulatory-compliance',
            external: false,
            icon: '⚖️'
          }
        ]}
        variant="compact"
      />

      {/* Stats Grid */}
      <div style={{ marginBottom: spacing.xl }}>
        <StatsGrid gap="lg">
          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.primary}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-primary" />
              📊 Today's Inspections
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.primary,
              fontWeight: 700
            }}>
              {stats?.total_today || 0}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.normal}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-normal" />
              ✅ Pass Rate
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              {stats?.pass_rate ? `${Math.round(stats.pass_rate)}%` : '0%'}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.warning}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-warning" />
              ⏳ Pending
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              {stats?.pending || 0}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: `2px solid ${colors.status.critical}`
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-critical" />
              ⚠️ Critical Issues
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.critical,
              fontWeight: 700
            }}>
              {stats?.critical_issues || 0}
            </div>
          </div>
        </StatsGrid>
      </div>

      {/* Charts Section */}
      {(dailyTrends.length > 0 || vehicleTypeBreakdown.length > 0) && (
        <CardGrid gap="lg" style={{ marginBottom: spacing.xl }}>
          {/* Daily Trends Chart */}
          {dailyTrends.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: spacing.xl,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h3 style={{
                ...typography.subheader,
                marginBottom: spacing.lg,
                color: colors.neutral[900]
              }}>
                📈 Daily Inspection Trends
              </h3>
              <LineChart
                data={dailyTrends.map(trend => ({
                  date: trend.date,
                  count: trend.count
                }))}
                dataKeys={[{
                  key: 'count',
                  name: 'Inspections',
                  color: colors.primary,
                  strokeWidth: 2
                }]}
                height={250}
                tooltipFormatter={(value) => [`${value} inspections`, '']}
              />
            </div>
          )}

          {/* Vehicle Type Breakdown */}
          {vehicleTypeBreakdown.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: spacing.xl,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <h3 style={{
                ...typography.subheader,
                marginBottom: spacing.lg,
                color: colors.neutral[900]
              }}>
                🚗 Vehicle Type Breakdown
              </h3>
              <PieChart
                data={vehicleTypeBreakdown.map((item, index) => ({
                  name: item.vehicle_type || 'Unknown',
                  value: item.count,
                  color: [colors.primary, colors.success[500], colors.warning[500], colors.error[500]][index % 4]
                }))}
                height={250}
                tooltipFormatter={(value) => [`${value} inspections`, '']}
              />
            </div>
          )}
        </CardGrid>
      )}

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          🚀 Quick Actions
        </h3>
        
        <ActionGrid gap="md">
          <div
            onClick={() => navigate('/app/inspections/create')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.primary}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🔍</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Start New Inspection
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Begin vehicle inspection
            </div>
          </div>

          <div
            onClick={() => navigate('/app/inspections/completed')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📋</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              View All Inspections
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Browse completed inspections
            </div>
          </div>

          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <div
              onClick={() => navigate('/app/inspections/studio')}
              style={{
                backgroundColor: 'white',
                padding: spacing.lg,
                cursor: 'pointer',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
                border: `2px solid ${colors.status.warning}`,
                borderRadius: '12px',
                position: 'relative' as const
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🎨</div>
              <div style={{ 
                ...typography.subheader,
                fontSize: '16px',
                color: colors.neutral[900],
                marginBottom: spacing.xs
              }}>
                Inspection Studio
              </div>
              <div style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600]
              }}>
                Create and manage templates
              </div>
            </div>
          )}

          <div
            onClick={() => navigate('/app/inspections/reports')}
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '12px',
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
            <div style={{ 
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Reports & Analytics
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              View inspection analytics
            </div>
          </div>
        </ActionGrid>
      </div>

      {/* Recent Inspections */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <h3 style={{ 
            ...typography.subheader,
            margin: 0,
            color: colors.neutral[900]
          }}>
            📋 Recent Inspections
          </h3>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/inspections/completed')}
            icon="👁️"
          >
            View All
          </Button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {recentInspections.map((inspection) => (
            <div
              key={inspection.id}
              onClick={() => navigate(`/app/inspections/${inspection.id}`)}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <div>
                  <h4 style={{ 
                    ...typography.subheader,
                    marginBottom: spacing.xs,
                    color: colors.neutral[900]
                  }}>
                    {inspection.vehicle_make} {inspection.vehicle_model}
                  </h4>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    marginBottom: spacing.xs
                  }}>
                    {inspection.vehicle_registration} • {inspection.inspector_name}
                  </p>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[500],
                    fontSize: '12px'
                  }}>
                    {new Date(inspection.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: spacing.xs
                }}>
                  <div style={{ 
                    ...typography.subheader,
                    color: colors.neutral[900],
                    fontWeight: 700
                  }}>
                    {inspection.overall_rating}/10
                  </div>
                  <div style={{ display: 'flex', gap: spacing.xs }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getStatusColor(inspection.status),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {inspection.status}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: getPassFailColor(inspection.pass_fail),
                      color: 'white',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}>
                      {inspection.pass_fail}
                    </span>
                  </div>
                  {inspection.has_critical_issues && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: colors.status.critical,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      ⚠️ Critical Issues
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentInspections.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No Recent Inspections"
            description="Start your first vehicle inspection to see it appear here."
            action={{
              label: "Start Inspection",
              onClick: () => navigate('/app/inspections/create'),
              icon: "➕"
            }}
          />
        )}
      </div>
    </div>
    </PullToRefreshWrapper>
  );
};

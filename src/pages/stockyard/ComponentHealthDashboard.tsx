import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { AnomalyAlert } from '@/components/ui/AnomalyAlert';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { 
  Activity, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Package, 
  Battery, 
  Wrench, 
  Car,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Shield,
  Wrench as WrenchIcon
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { useAlerts } from '@/lib/queries';

interface HealthDashboardData {
  summary: {
    total_components: number;
    healthy_components: number;
    warning_components: number;
    critical_components: number;
    warranty_expiring_count: number;
    overdue_maintenance_count: number;
    upcoming_maintenance_count: number;
  };
  warranty_expiring: Array<{
    component_type: string;
    component_id: string;
    component_name: string;
    warranty_expires_at: string;
    days_until_expiry: number;
    current_vehicle: {
      id: string;
      registration_number: string;
    } | null;
  }>;
  overdue_maintenance: Array<{
    id: string;
    component_type: string;
    component_id: string;
    component_name: string;
    title: string;
    next_due_date: string;
    days_overdue: number;
    performed_by: {
      id: string;
      name: string;
    } | null;
  }>;
  upcoming_maintenance: Array<{
    id: string;
    component_type: string;
    component_id: string;
    component_name: string;
    title: string;
    next_due_date: string;
    days_until_due: number;
    performed_by: {
      id: string;
      name: string;
    } | null;
  }>;
  component_health: Array<{
    component_type: string;
    component_id: string;
    component_name: string;
    health_score: number;
    status: string;
    current_vehicle: {
      id: string;
      registration_number: string;
    } | null;
  }>;
}

const typeConfig = {
  battery: { icon: Battery, label: 'Battery', color: colors.primary },
  tyre: { icon: Package, label: 'Tyre', color: colors.warning[500] },
  spare_part: { icon: Wrench, label: 'Spare Part', color: colors.success[500] },
};

const getHealthColor = (score: number) => {
  if (score >= 70) return colors.success[500];
  if (score >= 50) return colors.warning[500];
  return colors.error[500];
};

const getHealthLabel = (score: number) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Critical';
};

export const ComponentHealthDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState<'overview' | 'warranty' | 'maintenance' | 'health'>('overview');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['components', 'health-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/components/health-dashboard');
      return response.data;
    },
  });

  // Fetch component alerts
  const { data: alertsData } = useAlerts(
    {
      module: 'stockyard',
      status: 'new,acknowledged',
      per_page: 10,
    }
  );
  
  const componentAlerts = alertsData?.data || [];

  const dashboardData = data?.data as HealthDashboardData | undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <NetworkError
          error={error instanceof Error ? error : new Error('Failed to load health dashboard')}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/app/stockyard/components')}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: spacing.lg }}>
      <PageHeader
        title="Component Health Dashboard"
        subtitle="Monitor component health, warranties, and maintenance schedules"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/stockyard/components/cost-analysis')}
            >
              <DollarSign size={16} style={{ marginRight: spacing.xs }} />
              Cost Analysis
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/stockyard/components')}
            >
              Back to Components
            </Button>
          </>
        }
      />

      {/* Component Anomaly Alerts */}
      {componentAlerts.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          {componentAlerts.slice(0, 3).map((alert: any) => (
            <AnomalyAlert
              key={alert.id}
              title={alert.title}
              description={alert.description}
              severity={alert.severity}
              actions={[
                {
                  label: 'View All Alerts',
                  onClick: () => navigate('/app/alerts'),
                  variant: 'primary' as const,
                },
              ]}
              style={{ marginBottom: spacing.md }}
            />
          ))}
          {componentAlerts.length > 3 && (
            <Button
              variant="secondary"
              onClick={() => navigate('/app/alerts?module=stockyard')}
              style={{ marginTop: spacing.sm }}
            >
              View All {componentAlerts.length} Component Alerts
            </Button>
          )}
        </div>
      )}

      {/* Alerts */}
      {dashboardData && (
        <>
          {dashboardData.summary.warranty_expiring_count > 0 && (
            <AnomalyAlert
              title={`${dashboardData.summary.warranty_expiring_count} Component${dashboardData.summary.warranty_expiring_count !== 1 ? 's' : ''} with Warranty Expiring Soon`}
              description="Some components have warranties expiring within the next 30 days."
              severity="warning"
              actions={[
                {
                  label: 'View Details',
                  onClick: () => setSelectedView('warranty'),
                  variant: 'primary',
                },
              ]}
              style={{ marginBottom: spacing.lg }}
            />
          )}

          {dashboardData.summary.overdue_maintenance_count > 0 && (
            <AnomalyAlert
              title={`${dashboardData.summary.overdue_maintenance_count} Overdue Maintenance Task${dashboardData.summary.overdue_maintenance_count !== 1 ? 's' : ''}`}
              description="Some components have maintenance that is past due."
              severity="critical"
              actions={[
                {
                  label: 'View Details',
                  onClick: () => setSelectedView('maintenance'),
                  variant: 'primary',
                },
              ]}
              style={{ marginBottom: spacing.lg }}
            />
          )}
        </>
      )}

      {/* Summary Statistics */}
      {dashboardData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md, marginBottom: spacing.lg }}>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <Package size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Total Components</div>
            <div style={{ ...typography.h3, color: colors.primary }}>
              {dashboardData.summary.total_components}
            </div>
          </div>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <CheckCircle size={32} color={colors.success[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Healthy</div>
            <div style={{ ...typography.h3, color: colors.success[500] }}>
              {dashboardData.summary.healthy_components}
            </div>
          </div>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <AlertTriangle size={32} color={colors.warning[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Warning</div>
            <div style={{ ...typography.h3, color: colors.warning[500] }}>
              {dashboardData.summary.warning_components}
            </div>
          </div>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <AlertTriangle size={32} color={colors.error[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Critical</div>
            <div style={{ ...typography.h3, color: colors.error[500] }}>
              {dashboardData.summary.critical_components}
            </div>
          </div>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <Shield size={32} color={colors.warning[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Warranty Expiring</div>
            <div style={{ ...typography.h3, color: colors.warning[500] }}>
              {dashboardData.summary.warranty_expiring_count}
            </div>
          </div>
          <div style={{ ...cardStyles.card, textAlign: 'center' }}>
            <Clock size={32} color={colors.error[500]} style={{ marginBottom: spacing.sm }} />
            <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Overdue Maintenance</div>
            <div style={{ ...typography.h3, color: colors.error[500] }}>
              {dashboardData.summary.overdue_maintenance_count}
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg, borderBottom: `2px solid ${colors.neutral[200]}` }}>
        {(['overview', 'warranty', 'maintenance', 'health'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            style={{
              padding: `${spacing.sm}px ${spacing.md}px`,
              border: 'none',
              background: 'transparent',
              borderBottom: selectedView === view ? `2px solid ${colors.primary}` : '2px solid transparent',
              color: selectedView === view ? colors.primary : colors.neutral[600],
              ...typography.body,
              fontWeight: selectedView === view ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && dashboardData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Warranty Expiring (Top 5) */}
          {dashboardData.warranty_expiring.length > 0 && (
            <div style={{ ...cardStyles.card }}>
              <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Shield size={20} color={colors.warning[500]} />
                Warranty Expiring Soon (Top 5)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {dashboardData.warranty_expiring.slice(0, 5).map((item) => {
                  const config = typeConfig[item.component_type as keyof typeof typeConfig];
                  const Icon = config?.icon || Package;
                  return (
                    <div
                      key={`${item.component_type}-${item.component_id}`}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Icon size={20} color={config?.color || colors.neutral[500]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {config?.label || item.component_type}
                            {item.current_vehicle && ` • ${item.current_vehicle.registration_number}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.body, fontWeight: 600, color: colors.warning[600] }}>
                          {item.days_until_expiry} day{item.days_until_expiry !== 1 ? 's' : ''}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {formatDate(item.warranty_expires_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {dashboardData.warranty_expiring.length > 5 && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedView('warranty')}
                  style={{ marginTop: spacing.md }}
                >
                  View All ({dashboardData.warranty_expiring.length})
                </Button>
              )}
            </div>
          )}

          {/* Overdue Maintenance (Top 5) */}
          {dashboardData.overdue_maintenance.length > 0 && (
            <div style={{ ...cardStyles.card }}>
              <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Clock size={20} color={colors.error[500]} />
                Overdue Maintenance (Top 5)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {dashboardData.overdue_maintenance.slice(0, 5).map((item) => {
                  const config = typeConfig[item.component_type as keyof typeof typeConfig];
                  const Icon = config?.icon || Package;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Icon size={20} color={config?.color || colors.neutral[500]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.body, fontWeight: 600, color: colors.error[600] }}>
                          {item.days_overdue} day{item.days_overdue !== 1 ? 's' : ''} overdue
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          Due: {formatDate(item.next_due_date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {dashboardData.overdue_maintenance.length > 5 && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedView('maintenance')}
                  style={{ marginTop: spacing.md }}
                >
                  View All ({dashboardData.overdue_maintenance.length})
                </Button>
              )}
            </div>
          )}

          {/* Upcoming Maintenance */}
          {dashboardData.upcoming_maintenance.length > 0 && (
            <div style={{ ...cardStyles.card }}>
              <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Calendar size={20} color={colors.primary} />
                Upcoming Maintenance (Next 30 Days)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {dashboardData.upcoming_maintenance.slice(0, 10).map((item) => {
                  const config = typeConfig[item.component_type as keyof typeof typeConfig];
                  const Icon = config?.icon || Package;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Icon size={20} color={config?.color || colors.neutral[500]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...typography.body, fontWeight: 600, color: colors.primary }}>
                          In {item.days_until_due} day{item.days_until_due !== 1 ? 's' : ''}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {formatDate(item.next_due_date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warranty View */}
      {selectedView === 'warranty' && dashboardData && (
        <div style={{ ...cardStyles.card }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Warranty Expiring Components</h3>
          {dashboardData.warranty_expiring.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {dashboardData.warranty_expiring.map((item) => {
                const config = typeConfig[item.component_type as keyof typeof typeConfig];
                const Icon = config?.icon || Package;
                return (
                  <div
                    key={`${item.component_type}-${item.component_id}`}
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      borderRadius: borderRadius.md,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                      <Icon size={20} color={config?.color || colors.neutral[500]} />
                      <div>
                        <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {config?.label || item.component_type}
                          {item.current_vehicle && ` • ${item.current_vehicle.registration_number}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: spacing.md }}>
                      <div style={{ ...typography.body, fontWeight: 600, color: colors.warning[600] }}>
                        {item.days_until_expiry} day{item.days_until_expiry !== 1 ? 's' : ''}
                      </div>
                      <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                        {formatDate(item.warranty_expires_at)}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/app/stockyard/components/${item.component_type}/${item.component_id}`)}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Shield size={48} />}
              title="No Warranty Expiring"
              description="No components have warranties expiring in the next 30 days."
            />
          )}
        </div>
      )}

      {/* Maintenance View */}
      {selectedView === 'maintenance' && dashboardData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Overdue */}
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Clock size={20} color={colors.error[500]} />
              Overdue Maintenance
            </h3>
            {dashboardData.overdue_maintenance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {dashboardData.overdue_maintenance.map((item) => {
                  const config = typeConfig[item.component_type as keyof typeof typeConfig];
                  const Icon = config?.icon || Package;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Icon size={20} color={config?.color || colors.neutral[500]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: spacing.md }}>
                        <div style={{ ...typography.body, fontWeight: 600, color: colors.error[600] }}>
                          {item.days_overdue} day{item.days_overdue !== 1 ? 's' : ''} overdue
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          Due: {formatDate(item.next_due_date)}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/app/stockyard/components/${item.component_type}/${item.component_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle size={48} />}
                title="No Overdue Maintenance"
                description="All maintenance tasks are up to date."
              />
            )}
          </div>

          {/* Upcoming */}
          <div style={{ ...cardStyles.card }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Calendar size={20} color={colors.primary} />
              Upcoming Maintenance (Next 30 Days)
            </h3>
            {dashboardData.upcoming_maintenance.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {dashboardData.upcoming_maintenance.map((item) => {
                  const config = typeConfig[item.component_type as keyof typeof typeConfig];
                  const Icon = config?.icon || Package;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: spacing.md,
                        border: `1px solid ${colors.neutral[200]}`,
                        borderRadius: borderRadius.md,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                        <Icon size={20} color={config?.color || colors.neutral[500]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            {item.title}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: spacing.md }}>
                        <div style={{ ...typography.body, fontWeight: 600, color: colors.primary }}>
                          In {item.days_until_due} day{item.days_until_due !== 1 ? 's' : ''}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {formatDate(item.next_due_date)}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/app/stockyard/components/${item.component_type}/${item.component_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar size={48} />}
                title="No Upcoming Maintenance"
                description="No maintenance scheduled for the next 30 days."
              />
            )}
          </div>
        </div>
      )}

      {/* Health Scores View */}
      {selectedView === 'health' && dashboardData && (
        <div style={{ ...cardStyles.card }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Activity size={20} color={colors.primary} />
            Component Health Scores
          </h3>
          {dashboardData.component_health.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {dashboardData.component_health.map((item) => {
                const config = typeConfig[item.component_type as keyof typeof typeConfig];
                const Icon = config?.icon || Package;
                const healthColor = getHealthColor(item.health_score);
                const healthLabel = getHealthLabel(item.health_score);
                return (
                  <div
                    key={`${item.component_type}-${item.component_id}`}
                    style={{
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      borderRadius: borderRadius.md,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                      <Icon size={20} color={config?.color || colors.neutral[500]} />
                      <div>
                        <div style={{ ...typography.body, fontWeight: 600 }}>{item.component_name}</div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {config?.label || item.component_type}
                          {item.current_vehicle && ` • ${item.current_vehicle.registration_number}`}
                          {` • ${item.status}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <div style={{ textAlign: 'right', marginRight: spacing.md }}>
                        <div style={{ ...typography.h4, color: healthColor }}>
                          {item.health_score}
                        </div>
                        <div style={{ ...typography.caption, color: healthColor, fontWeight: 600 }}>
                          {healthLabel}
                        </div>
                      </div>
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          border: `4px solid ${colors.neutral[200]}`,
                          borderTopColor: healthColor,
                          borderRightColor: healthColor,
                          transform: `rotate(${(item.health_score / 100) * 360 - 90}deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <div style={{ transform: `rotate(${90 - (item.health_score / 100) * 360}deg)`, ...typography.caption, fontWeight: 600 }}>
                          {item.health_score}%
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/app/stockyard/components/${item.component_type}/${item.component_id}`)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Activity size={48} />}
              title="No Components"
              description="No components found in the system."
            />
          )}
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../providers/ToastProvider';
import {
  useAlerts,
  useAlertStatistics,
  useAcknowledgeAlert,
  useResolveAlert,
  useDismissAlert,
  useBulkAcknowledgeAlerts,
  useBulkResolveAlerts,
  useBulkDismissAlerts,
} from '../../lib/queries';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { StatsGrid } from '../../components/ui/ResponsiveGrid';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  CheckCheck,
  X,
  Filter,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';

interface Alert {
  id: string;
  type: 'anomaly' | 'reminder' | 'escalation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  module: 'gate_pass' | 'expense' | 'inspection' | 'stockyard';
  title: string;
  description: string;
  item_type?: string;
  item_id?: string;
  assigned_to?: string;
  assigned_user?: { id: string; name: string };
  status: 'new' | 'acknowledged' | 'resolved' | 'dismissed';
  resolved_at?: string;
  resolved_by?: string;
  resolved_by_user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

const severityConfig = {
  info: { color: colors.primary, icon: Info, label: 'Info' },
  warning: { color: colors.warning[500], icon: AlertTriangle, label: 'Warning' },
  error: { color: colors.error[500], icon: AlertCircle, label: 'Error' },
  critical: { color: colors.error[600], icon: XCircle, label: 'Critical' },
};

const statusConfig = {
  new: { color: colors.primary, label: 'New' },
  acknowledged: { color: colors.warning[500], label: 'Acknowledged' },
  resolved: { color: colors.success[500], label: 'Resolved' },
  dismissed: { color: colors.neutral[500], label: 'Dismissed' },
};

const moduleLabels: Record<string, string> = {
  gate_pass: 'Gate Pass',
  expense: 'Expense',
  inspection: 'Inspection',
  stockyard: 'Stockyard',
};

export const AlertDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filters, setFilters] = useState<{
    status?: string;
    severity?: string;
    module?: string;
    type?: string;
  }>({});
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);

  const { data: alertsData, isLoading, error, refetch } = useAlerts(
    { ...filters, page: currentPage, per_page: perPage }
  );
  const { data: stats, refetch: refetchStats } = useAlertStatistics();

  const alerts = alertsData?.data || [];
  const totalItems = alertsData?.total || 0;

  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();
  const dismissMutation = useDismissAlert();
  const bulkAcknowledgeMutation = useBulkAcknowledgeAlerts();
  const bulkResolveMutation = useBulkResolveAlerts();
  const bulkDismissMutation = useBulkDismissAlerts();

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[key as keyof typeof newFilters] = value;
      } else {
        delete newFilters[key as keyof typeof newFilters];
      }
      return newFilters;
    });
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.item_type && alert.item_id) {
      const modulePath = alert.module === 'gate_pass' ? 'gatepass' : alert.module;
      navigate(`/app/${modulePath}/${alert.item_id}`);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      showToast({
        title: 'Success',
        description: 'Alert acknowledged',
        variant: 'success',
      });
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'error',
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveMutation.mutateAsync(alertId);
      showToast({
        title: 'Success',
        description: 'Alert resolved',
        variant: 'success',
      });
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to resolve alert',
        variant: 'error',
      });
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await dismissMutation.mutateAsync(alertId);
      showToast({
        title: 'Success',
        description: 'Alert dismissed',
        variant: 'success',
      });
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to dismiss alert',
        variant: 'error',
      });
    }
  };

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.length === 0) return;
    try {
      await bulkAcknowledgeMutation.mutateAsync(selectedAlerts);
      showToast({
        title: 'Success',
        description: `${selectedAlerts.length} alert(s) acknowledged`,
        variant: 'success',
      });
      setSelectedAlerts([]);
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to acknowledge alerts',
        variant: 'error',
      });
    }
  };

  const handleBulkResolve = async () => {
    if (selectedAlerts.length === 0) return;
    try {
      await bulkResolveMutation.mutateAsync(selectedAlerts);
      showToast({
        title: 'Success',
        description: `${selectedAlerts.length} alert(s) resolved`,
        variant: 'success',
      });
      setSelectedAlerts([]);
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to resolve alerts',
        variant: 'error',
      });
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedAlerts.length === 0) return;
    try {
      await bulkDismissMutation.mutateAsync(selectedAlerts);
      showToast({
        title: 'Success',
        description: `${selectedAlerts.length} alert(s) dismissed`,
        variant: 'success',
      });
      setSelectedAlerts([]);
      refetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to dismiss alerts',
        variant: 'error',
      });
    }
  };

  const toggleSelectAlert = (alertId: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(alertId)
        ? prev.filter((id) => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleRefresh = async () => {
    await refetch();
    await refetchStats();
  };

  const toggleSelectAll = () => {
    if (selectedAlerts.length === alerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(alerts.map((a: Alert) => a.id));
    }
  };

  if (error) {
    return (
      <div style={{ padding: spacing.lg }}>
        <PageHeader
          title="Alert Dashboard"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Alerts' },
          ]}
        />
        <NetworkError error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={refetch}>
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Alert Dashboard"
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Alerts' },
        ]}
        actions={
          <Button
            onClick={() => {
              refetch();
              refetchStats();
            }}
            variant="secondary"
            icon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        }
      />

      {/* Statistics */}
      {stats && (
        <StatsGrid
          gap="md"
          style={{
            marginTop: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <StatCard
            title="Total Alerts"
            value={stats.total || 0}
            icon={<AlertTriangle size={24} />}
            color={colors.neutral[600]}
          />
          <StatCard
            title="New"
            value={stats.new || 0}
            icon={<AlertCircle size={24} />}
            color={colors.primary}
          />
          <StatCard
            title="Acknowledged"
            value={stats.acknowledged || 0}
            icon={<Eye size={24} />}
            color={colors.warning[500]}
          />
          <StatCard
            title="Critical"
            value={stats.critical || 0}
            icon={<XCircle size={24} />}
            color={colors.error[600]}
          />
        </StatsGrid>
      )}

      {/* Filters */}
      <div style={{ marginBottom: spacing.lg }}>
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: '', label: 'All Statuses' },
                { value: 'new', label: 'New' },
                { value: 'acknowledged', label: 'Acknowledged' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' },
              ],
            },
            {
              key: 'severity',
              label: 'Severity',
              options: [
                { value: '', label: 'All Severities' },
                { value: 'info', label: 'Info' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
                { value: 'critical', label: 'Critical' },
              ],
            },
            {
              key: 'module',
              label: 'Module',
              options: [
                { value: '', label: 'All Modules' },
                { value: 'gate_pass', label: 'Gate Pass' },
                { value: 'expense', label: 'Expense' },
                { value: 'inspection', label: 'Inspection' },
                { value: 'stockyard', label: 'Stockyard' },
              ],
            },
          ]}
          values={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div
          style={{
            ...cardStyles.base,
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: spacing.md,
          }}
        >
          <div style={{ ...typography.body, fontWeight: 600 }}>
            {selectedAlerts.length} alert(s) selected
          </div>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button
              onClick={handleBulkAcknowledge}
              variant="secondary"
              size="sm"
              icon={<CheckCheck size={16} />}
            >
              Acknowledge All
            </Button>
            <Button
              onClick={handleBulkResolve}
              variant="secondary"
              size="sm"
              icon={<CheckCircle size={16} />}
            >
              Resolve All
            </Button>
            <Button
              onClick={handleBulkDismiss}
              variant="secondary"
              size="sm"
              icon={<X size={16} />}
            >
              Dismiss All
            </Button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <SkeletonLoader count={5} />
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No Alerts Found"
          description="There are no alerts matching your filters."
          action={
            <Button
              onClick={() => {
                setFilters({});
                setCurrentPage(1);
              }}
              variant="primary"
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {alerts.map((alert: Alert) => {
            const severityInfo = severityConfig[alert.severity];
            const SeverityIcon = severityInfo.icon;
            const statusInfo = statusConfig[alert.status];

            return (
              <div
                key={alert.id}
                style={{
                  ...cardStyles.base,
                  cursor: alert.item_id ? 'pointer' : 'default',
                  borderLeft: `4px solid ${severityInfo.color}`,
                }}
                onClick={() => handleAlertClick(alert)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: spacing.md,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAlerts.includes(alert.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectAlert(alert.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '4px' }}
                  />
                  <SeverityIcon
                    size={24}
                    style={{ color: severityInfo.color, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        marginBottom: spacing.xs,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          ...typography.subheader,
                          fontSize: '16px',
                          margin: 0,
                        }}
                      >
                        {alert.title}
                      </h3>
                      <Badge
                        label={severityInfo.label}
                        variant={alert.severity === 'critical' ? 'error' : alert.severity}
                      />
                      <Badge label={statusInfo.label} variant="secondary" />
                      <Badge
                        label={moduleLabels[alert.module] || alert.module}
                        variant="secondary"
                      />
                    </div>
                    <p
                      style={{
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.sm,
                      }}
                    >
                      {alert.description}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.md,
                        flexWrap: 'wrap',
                        fontSize: '12px',
                        color: colors.neutral[500],
                      }}
                    >
                      <span>
                        Created: {new Date(alert.created_at).toLocaleString()}
                      </span>
                      {alert.assigned_user && (
                        <span>Assigned to: {alert.assigned_user.name}</span>
                      )}
                      {alert.resolved_by_user && (
                        <span>
                          Resolved by: {alert.resolved_by_user.name} on{' '}
                          {new Date(alert.resolved_at!).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: spacing.sm,
                      flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {alert.status === 'new' && (
                      <Button
                        onClick={() => handleAcknowledge(alert.id)}
                        variant="secondary"
                        size="sm"
                        icon={<CheckCheck size={14} />}
                      >
                        Acknowledge
                      </Button>
                    )}
                    {alert.status !== 'resolved' && alert.status !== 'dismissed' && (
                      <>
                        <Button
                          onClick={() => handleResolve(alert.id)}
                          variant="secondary"
                          size="sm"
                          icon={<CheckCircle size={14} />}
                        >
                          Resolve
                        </Button>
                        <Button
                          onClick={() => handleDismiss(alert.id)}
                          variant="secondary"
                          size="sm"
                          icon={<X size={14} />}
                        >
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalItems > perPage && (
        <div style={{ marginTop: spacing.lg }}>
          <Pagination
            currentPage={currentPage}
            totalPages={alertsData?.last_page || 1}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={perPage}
          />
        </div>
      )}
    </div>
    </PullToRefreshWrapper>
  );
};

export default AlertDashboard;




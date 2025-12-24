/**
 * Stockyard Alerts Dashboard
 * 
 * Centralized alert management for stockyard operations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useStockyardAlerts, useAcknowledgeStockyardAlert } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { WideGrid } from '../../components/ui/ResponsiveGrid';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  XCircle,
  Car,
  Package,
  Calendar,
  DollarSign,
  FileText,
  ListChecks,
} from 'lucide-react';
import type { StockyardAlert } from '../../lib/stockyard';
import { useQueryClient } from '@tanstack/react-query';

const alertTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  warranty_expiring: {
    label: 'Warranty Expiring',
    icon: Calendar,
    color: colors.warning[600],
  },
  overdue_maintenance: {
    label: 'Overdue Maintenance',
    icon: Clock,
    color: colors.error[600],
  },
  anomalous_spend: {
    label: 'Anomalous Spend',
    icon: DollarSign,
    color: colors.error[600],
  },
  days_in_yard: {
    label: 'Days in Yard',
    icon: Car,
    color: colors.warning[600],
  },
  missing_document: {
    label: 'Missing Document',
    icon: FileText,
    color: colors.error[600],
  },
  checklist_blocked: {
    label: 'Checklist Blocked',
    icon: ListChecks,
    color: colors.error[600],
  },
};

const severityConfig = {
  info: { color: colors.primary, bgColor: colors.primary + '15', label: 'Info' },
  warning: { color: colors.warning[600], bgColor: colors.warning[50], label: 'Warning' },
  critical: { color: colors.error[600], bgColor: colors.error[50], label: 'Critical' },
};

export const StockyardAlertsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<'all' | 'acknowledged' | 'unacknowledged'>('unacknowledged');

  const { data: alerts, isLoading, isError, error, refetch } = useStockyardAlerts({
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    acknowledged: acknowledgedFilter === 'acknowledged' ? true : acknowledgedFilter === 'unacknowledged' ? false : undefined,
  });

  const acknowledgeMutation = useAcknowledgeStockyardAlert({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Alert acknowledged',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to acknowledge alert',
        variant: 'error',
      });
    },
  });

  const handleAcknowledge = async (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  const handleAlertClick = (alert: StockyardAlert) => {
    if (alert.vehicle_id) {
      navigate(`/app/stockyard?vehicle=${alert.vehicle_id}`);
    } else if (alert.stockyard_request_id) {
      navigate(`/app/stockyard/${alert.stockyard_request_id}`);
    } else if (alert.component_id) {
      // Navigate to component - need to know type from metadata
      const componentType = (alert.metadata as any)?.component_type || 'battery';
      navigate(`/app/stockyard/components/${componentType}/${alert.component_id}`);
    }
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

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Stockyard Alerts" subtitle="Manage and monitor stockyard alerts" icon={<Bell size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Stockyard Alerts" subtitle="Manage and monitor stockyard alerts" icon={<Bell size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const alertsList = alerts || [];
  const unacknowledgedCount = alertsList.filter((a) => !a.acknowledged).length;
  const criticalCount = alertsList.filter((a) => a.severity === 'critical' && !a.acknowledged).length;

  // Get unique alert types
  const alertTypes = Array.from(new Set(alertsList.map((a) => a.type)));

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Stockyard Alerts"
        subtitle="Manage and monitor stockyard alerts"
        icon={<Bell size={24} />}
      />

      {/* Alert Summary */}
      <WideGrid gap="md" style={{ marginBottom: spacing.lg }}>
        <div style={{ ...cardStyles.card, textAlign: 'center', borderLeft: `4px solid ${colors.primary}` }}>
          <div style={{ ...typography.header, fontSize: '2rem', marginBottom: spacing.xs }}>
            {alertsList.length}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Total Alerts</div>
        </div>
        <div
          style={{
            ...cardStyles.card,
            textAlign: 'center',
            borderLeft: `4px solid ${colors.warning[600]}`,
          }}
        >
          <div style={{ ...typography.header, fontSize: '2rem', color: colors.warning[600], marginBottom: spacing.xs }}>
            {unacknowledgedCount}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Unacknowledged</div>
        </div>
        <div
          style={{
            ...cardStyles.card,
            textAlign: 'center',
            borderLeft: `4px solid ${colors.error[600]}`,
          }}
        >
          <div style={{ ...typography.header, fontSize: '2rem', color: colors.error[600], marginBottom: spacing.xs }}>
            {criticalCount}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Critical</div>
        </div>
      </WideGrid>

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Filter size={18} color={colors.neutral[600]} />
            <span style={{ ...typography.body, fontWeight: 600 }}>Filters:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          >
            <option value="all">All Types</option>
            {alertTypes.map((type) => {
              const config = alertTypeConfig[type] || { label: type, icon: AlertTriangle, color: colors.neutral[600] };
              return (
                <option key={type} value={type}>
                  {config.label}
                </option>
              );
            })}
          </select>
          <select
            value={acknowledgedFilter}
            onChange={(e) => setAcknowledgedFilter(e.target.value as any)}
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          >
            <option value="all">All Alerts</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {alertsList.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="No Alerts"
          description="No alerts match the current filters"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {alertsList.map((alert) => {
            const typeConfig = alertTypeConfig[alert.type] || {
              label: alert.type,
              icon: AlertTriangle,
              color: colors.neutral[600],
            };
            const TypeIcon = typeConfig.icon;
            const severity = severityConfig[alert.severity];

            return (
              <div
                key={alert.id}
                style={{
                  ...cardStyles.card,
                  borderLeft: `4px solid ${severity.color}`,
                  backgroundColor: alert.acknowledged ? colors.neutral[50] : severity.bgColor,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleAlertClick(alert)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <TypeIcon size={20} color={typeConfig.color} />
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: severity.bgColor,
                          color: severity.color,
                          borderRadius: borderRadius.md,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {severity.label.toUpperCase()}
                      </span>
                      <span
                        style={{
                          padding: '4px 12px',
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700],
                          borderRadius: borderRadius.md,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {typeConfig.label}
                      </span>
                      {alert.acknowledged && (
                        <span
                          style={{
                            padding: '4px 12px',
                            backgroundColor: colors.success[50],
                            color: colors.success[600],
                            borderRadius: borderRadius.md,
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <div style={{ ...typography.body, marginBottom: spacing.xs }}>{alert.message}</div>
                    {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                      <div
                        style={{
                          marginTop: spacing.sm,
                          padding: spacing.sm,
                          backgroundColor: 'white',
                          borderRadius: borderRadius.sm,
                          ...typography.caption,
                          color: colors.neutral[700],
                        }}
                      >
                        {Object.entries(alert.metadata).map(([key, value]) => (
                          <div key={key} style={{ marginBottom: spacing.xs }}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                      Created: {formatDate(alert.created_at)}
                      {alert.acknowledged_at && ` • Acknowledged: ${formatDate(alert.acknowledged_at)}`}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <div style={{ marginLeft: spacing.md }}>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(alert.id);
                        }}
                      >
                        <CheckCircle2 size={14} style={{ marginRight: spacing.xs }} />
                        Acknowledge
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


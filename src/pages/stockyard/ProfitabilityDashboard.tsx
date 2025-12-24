/**
 * Profitability & Market Intelligence Layer
 * 
 * Margin forecasting, repair vs liquidate decision workflows, and KPI dashboards
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useProfitabilityForecast, useDaysSinceEntry } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Car,
  BarChart3,
} from 'lucide-react';
import type { ProfitabilityForecast } from '../../lib/stockyard';

export const ProfitabilityDashboard: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicleId || '');

  const { data: forecast, isLoading, isError, error, refetch } = useProfitabilityForecast(
    selectedVehicleId,
    { enabled: !!selectedVehicleId }
  );
  const { data: daysSinceEntryData } = useDaysSinceEntry();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'repair':
        return colors.warning[600];
      case 'liquidate':
        return colors.error[600];
      case 'hold':
        return colors.success[600];
      default:
        return colors.neutral[600];
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'repair':
        return Wrench;
      case 'liquidate':
        return XCircle;
      case 'hold':
        return CheckCircle2;
      default:
        return AlertTriangle;
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Profitability Dashboard"
          subtitle="Margin forecasting and decision support"
          icon={<BarChart3 size={24} />}
        />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Profitability Dashboard"
          subtitle="Margin forecasting and decision support"
          icon={<BarChart3 size={24} />}
        />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!forecast) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Profitability Dashboard"
          subtitle="Margin forecasting and decision support"
          icon={<BarChart3 size={24} />}
        />
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="No Forecast Available"
          description="Select a vehicle to view profitability forecast"
        />
      </div>
    );
  }

  const RecommendationIcon = getRecommendationIcon(forecast.recommendation);
  const recommendationColor = getRecommendationColor(forecast.recommendation);

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back
        </Button>
        <PageHeader
          title="Profitability Dashboard"
          subtitle="Margin forecasting and decision support"
          icon={<BarChart3 size={24} />}
        />
      </div>

      {/* Recommendation Card */}
      <div
        style={{
          ...cardStyles.card,
          marginBottom: spacing.lg,
          border: `3px solid ${recommendationColor}`,
          backgroundColor: recommendationColor + '10',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: recommendationColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RecommendationIcon size={28} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.header, fontSize: '20px', marginBottom: spacing.xs }}>
              Recommendation: {forecast.recommendation.toUpperCase()}
            </div>
            <div style={{ ...typography.body, color: colors.neutral[700] }}>{forecast.reasoning}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <CardGrid gap="md" style={{ marginBottom: spacing.lg }}>
        <MetricCard
          label="Expected Sale Price"
          value={formatCurrency(forecast.expected_sale_price)}
          icon={DollarSign}
          color={colors.success[600]}
        />
        <MetricCard
          label="Total Maintenance Cost"
          value={formatCurrency(forecast.total_maintenance_cost)}
          icon={Wrench}
          color={colors.error[600]}
        />
        <MetricCard
          label="Holding Cost"
          value={formatCurrency(forecast.holding_cost)}
          icon={Calendar}
          color={colors.warning[600]}
        />
        <MetricCard
          label="Days in Yard"
          value={`${forecast.days_in_yard} days`}
          icon={Car}
          color={colors.primary}
        />
      </CardGrid>

      {/* Profitability Analysis */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>
          Profitability Analysis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {/* Estimated Margin */}
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: forecast.estimated_margin >= 0 ? colors.success[50] : colors.error[50],
              borderRadius: borderRadius.md,
              border: `2px solid ${forecast.estimated_margin >= 0 ? colors.success[300] : colors.error[300]}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Estimated Margin
                </div>
                <div
                  style={{
                    ...typography.header,
                    fontSize: '32px',
                    color: forecast.estimated_margin >= 0 ? colors.success[700] : colors.error[700],
                  }}
                >
                  {formatCurrency(forecast.estimated_margin)}
                </div>
                <div
                  style={{
                    ...typography.bodySmall,
                    color: forecast.estimated_margin >= 0 ? colors.success[700] : colors.error[700],
                    marginTop: spacing.xs,
                  }}
                >
                  {forecast.margin_percentage >= 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <TrendingUp size={14} />
                      {forecast.margin_percentage.toFixed(1)}% margin
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <TrendingDown size={14} />
                      {Math.abs(forecast.margin_percentage).toFixed(1)}% loss
                    </span>
                  )}
                </div>
              </div>
              {forecast.estimated_margin >= 0 ? (
                <TrendingUp size={48} color={colors.success[600]} />
              ) : (
                <TrendingDown size={48} color={colors.error[600]} />
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.md }}>Cost Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <CostBreakdownItem
                label="Expected Sale Price"
                value={forecast.expected_sale_price}
                formatCurrency={formatCurrency}
                color={colors.success[600]}
              />
              <CostBreakdownItem
                label="Maintenance Cost"
                value={-forecast.total_maintenance_cost}
                formatCurrency={formatCurrency}
                color={colors.error[600]}
              />
              <CostBreakdownItem
                label="Holding Cost"
                value={-forecast.holding_cost}
                formatCurrency={formatCurrency}
                color={colors.warning[600]}
              />
              <div
                style={{
                  padding: spacing.md,
                  borderTop: `2px solid ${colors.neutral[300]}`,
                  marginTop: spacing.sm,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...typography.body, fontWeight: 600 }}>Net Margin</span>
                  <span
                    style={{
                      ...typography.body,
                      fontWeight: 600,
                      color: forecast.estimated_margin >= 0 ? colors.success[700] : colors.error[700],
                    }}
                  >
                    {formatCurrency(forecast.estimated_margin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Workflow Actions */}
      <div style={{ ...cardStyles.card }}>
        <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>
          Decision Workflow
        </div>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
          {forecast.recommendation === 'repair' && (
            <>
              <Button variant="primary">
                <Wrench size={16} style={{ marginRight: spacing.xs }} />
                Create Repair Task
              </Button>
              <Button variant="secondary">
                <BarChart3 size={16} style={{ marginRight: spacing.xs }} />
                Review Repair Estimate
              </Button>
            </>
          )}
          {forecast.recommendation === 'liquidate' && (
            <>
              <Button variant="primary" style={{ backgroundColor: colors.error[600] }}>
                <XCircle size={16} style={{ marginRight: spacing.xs }} />
                Initiate Liquidation
              </Button>
              <Button variant="secondary">
                <DollarSign size={16} style={{ marginRight: spacing.xs }} />
                Update Sale Price
              </Button>
            </>
          )}
          {forecast.recommendation === 'hold' && (
            <>
              <Button variant="primary">
                <Calendar size={16} style={{ marginRight: spacing.xs }} />
                Schedule Review
              </Button>
              <Button variant="secondary">
                <BarChart3 size={16} style={{ marginRight: spacing.xs }} />
                Monitor Market
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color }) => {
  return (
    <div style={{ ...cardStyles.card, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <Icon size={20} color={color} />
        <span style={{ ...typography.label, color: colors.neutral[600] }}>{label}</span>
      </div>
      <div style={{ ...typography.header, fontSize: '24px', color: color }}>{value}</div>
    </div>
  );
};

interface CostBreakdownItemProps {
  label: string;
  value: number;
  formatCurrency: (amount: number) => string;
  color: string;
}

const CostBreakdownItem: React.FC<CostBreakdownItemProps> = ({ label, value, formatCurrency, color }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm }}>
      <span style={{ ...typography.body, color: colors.neutral[700] }}>{label}</span>
      <span style={{ ...typography.body, fontWeight: 600, color: color }}>
        {value >= 0 ? '+' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  );
};



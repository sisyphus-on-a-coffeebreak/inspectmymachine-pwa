import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { DollarSign, TrendingUp, Package, Battery, Wrench, Car, BarChart3, Calendar } from 'lucide-react';
import { useComponentCostAnalysis } from '@/lib/queries';

interface CostAnalysisData {
  total_cost: number;
  cost_by_type: Array<{
    component_type: string;
    total_cost: number;
    maintenance_count: number;
  }>;
  cost_per_component: Array<{
    component_type: string;
    component_id: string;
    component_name: string;
    total_cost: number;
    maintenance_count: number;
  }>;
  cost_per_vehicle: Array<{
    vehicle_id: string;
    vehicle_name: string;
    total_cost: number;
    maintenance_count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total_cost: number;
    maintenance_count: number;
  }>;
}

const typeConfig = {
  battery: { icon: Battery, label: 'Battery', color: colors.primary },
  tyre: { icon: Package, label: 'Tyre', color: colors.warning[500] },
  spare_part: { icon: Wrench, label: 'Spare Part', color: colors.success[500] },
};

export const ComponentCostAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [componentType, setComponentType] = useState<'battery' | 'tyre' | 'spare_part' | ''>('');

  const { data, isLoading, isError, error, refetch } = useComponentCostAnalysis(
    {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      component_type: componentType || undefined,
    },
    {
      enabled: true,
    }
  );

  const costData = data?.data as CostAnalysisData | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const maxCost = useMemo(() => {
    if (!costData?.monthly_trend || costData.monthly_trend.length === 0) return 0;
    return Math.max(...costData.monthly_trend.map((t) => t.total_cost));
  }, [costData]);

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
          error={error instanceof Error ? error : new Error('Failed to load cost analysis')}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/app/stockyard/components')}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: spacing.lg }}>
      <PageHeader
        title="Component Maintenance Cost Analysis"
        subtitle="Track and analyze maintenance costs for batteries, tyres, and spare parts"
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/stockyard/components')}
          >
            Back to Components
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs, color: colors.neutral[600] }}>
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: typography.body.fontSize,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs, color: colors.neutral[600] }}>
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: typography.body.fontSize,
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs, color: colors.neutral[600] }}>
              Component Type
            </label>
            <select
              value={componentType}
              onChange={(e) => setComponentType(e.target.value as any)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: typography.body.fontSize,
              }}
            >
              <option value="">All Types</option>
              <option value="battery">Battery</option>
              <option value="tyre">Tyre</option>
              <option value="spare_part">Spare Part</option>
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setComponentType('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.md, marginBottom: spacing.lg }}>
        <div style={{ ...cardStyles.card, textAlign: 'center' }}>
          <DollarSign size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
          <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>Total Maintenance Cost</div>
          <div style={{ ...typography.h3, color: colors.primary }}>
            {costData ? formatCurrency(costData.total_cost) : '₹0'}
          </div>
        </div>
        {costData?.cost_by_type.map((type) => {
          const config = typeConfig[type.component_type as keyof typeof typeConfig];
          const Icon = config?.icon || Package;
          return (
            <div key={type.component_type} style={{ ...cardStyles.card, textAlign: 'center' }}>
              <Icon size={32} color={config?.color || colors.neutral[500]} style={{ marginBottom: spacing.sm }} />
              <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                {config?.label || type.component_type} Cost
              </div>
              <div style={{ ...typography.h3, color: config?.color || colors.neutral[700] }}>
                {formatCurrency(type.total_cost)}
              </div>
              <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                {type.maintenance_count} maintenance record{type.maintenance_count !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Trend Chart */}
      {costData?.monthly_trend && costData.monthly_trend.length > 0 && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <BarChart3 size={20} color={colors.primary} />
            Monthly Cost Trend
          </h3>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'flex-end', minHeight: '200px', padding: spacing.md }}>
            {costData.monthly_trend.map((trend) => {
              const height = maxCost > 0 ? (trend.total_cost / maxCost) * 100 : 0;
              return (
                <div key={trend.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      backgroundColor: colors.primary,
                      height: `${height}%`,
                      minHeight: '20px',
                      borderRadius: `${borderRadius.sm}px ${borderRadius.sm}px 0 0`,
                      marginBottom: spacing.xs,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      padding: spacing.xs,
                    }}
                  >
                    <span style={{ ...typography.caption, color: 'white', fontWeight: 600 }}>
                      {formatCurrency(trend.total_cost)}
                    </span>
                  </div>
                  <div style={{ ...typography.caption, color: colors.neutral[600], textAlign: 'center', fontSize: '11px' }}>
                    {formatMonth(trend.month)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cost Per Component */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Package size={20} color={colors.primary} />
          Top Components by Cost
        </h3>
        {costData?.cost_per_component && costData.cost_per_component.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {costData.cost_per_component.map((component, idx) => {
              const config = typeConfig[component.component_type as keyof typeof typeConfig];
              const Icon = config?.icon || Package;
              return (
                <div
                  key={component.component_id}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: idx < 3 ? colors.neutral[50] : 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                    <div style={{ ...typography.body, fontWeight: 600, color: colors.neutral[400], minWidth: '30px' }}>
                      #{idx + 1}
                    </div>
                    <Icon size={20} color={config?.color || colors.neutral[500]} />
                    <div>
                      <div style={{ ...typography.body, fontWeight: 600 }}>
                        {component.component_name}
                      </div>
                      <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                        {config?.label || component.component_type} • {component.maintenance_count} maintenance{component.maintenance_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ ...typography.h4, color: colors.primary }}>
                    {formatCurrency(component.total_cost)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Package size={48} />}
            title="No Component Costs"
            description="No maintenance costs recorded for components in the selected period."
          />
        )}
      </div>

      {/* Cost Per Vehicle */}
      <div style={{ ...cardStyles.card }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Car size={20} color={colors.primary} />
          Top Vehicles by Component Maintenance Cost
        </h3>
        {costData?.cost_per_vehicle && costData.cost_per_vehicle.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {costData.cost_per_vehicle.map((vehicle, idx) => (
              <div
                key={vehicle.vehicle_id}
                style={{
                  padding: spacing.md,
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: idx < 3 ? colors.neutral[50] : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                  <div style={{ ...typography.body, fontWeight: 600, color: colors.neutral[400], minWidth: '30px' }}>
                    #{idx + 1}
                  </div>
                  <Car size={20} color={colors.primary} />
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600 }}>
                      {vehicle.vehicle_name}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {vehicle.maintenance_count} maintenance record{vehicle.maintenance_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div style={{ ...typography.h4, color: colors.primary }}>
                  {formatCurrency(vehicle.total_cost)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Car size={48} />}
            title="No Vehicle Costs"
            description="No maintenance costs recorded for vehicles in the selected period."
          />
        )}
      </div>
    </div>
  );
};



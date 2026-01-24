/**
 * Stats Widget
 * 
 * Displays quick statistics cards with drill-down capability
 */

import React from 'react';
import type { WidgetProps } from '@/types/widgets';
import { StatCard } from '../../ui/StatCard';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { colors, spacing } from '@/lib/theme';
import { StatsGrid } from '../../ui/ResponsiveGrid';

export const StatsWidget: React.FC<WidgetProps> = ({ config, data }) => {
  const stats = data?.stats;

  if (!stats) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.neutral[600] }}>
        Loading stats...
      </div>
    );
  }

  // Generate drill-down URLs
  const getDrillDownUrl = (statType: string): string | undefined => {
    switch (statType) {
      case 'completed_today':
        // Navigate to approvals with completed filter
        return '/app/approvals?status=approved&date=today';
      case 'pending_tasks':
        // Navigate to unified approvals
        return '/app/approvals';
      case 'urgent_items':
        // Navigate to approvals with urgent filter
        return '/app/approvals?priority=urgent';
      case 'efficiency':
        // Navigate to reports/analytics
        return '/app/reports';
      default:
        return undefined;
    }
  };

  return (
    <StatsGrid gap="md">
      <StatCard
        label="Completed Today"
        value={stats?.overall?.completed_today ?? 0}
        icon={<CheckCircle size={20} />}
        color={colors.success[500]}
        href={getDrillDownUrl('completed_today')}
        description="Click to view completed items"
      />
      <StatCard
        label="Pending Tasks"
        value={stats?.overall?.pending_tasks ?? 0}
        icon={<Clock size={20} />}
        color={colors.warning[500]}
        href={getDrillDownUrl('pending_tasks')}
        description="Click to view pending approvals"
      />
      <StatCard
        label="Urgent Items"
        value={stats?.overall?.urgent_items ?? 0}
        icon={<AlertCircle size={20} />}
        color={colors.error[500]}
        href={getDrillDownUrl('urgent_items')}
        description="Click to view urgent items"
      />
      <StatCard
        label="Efficiency"
        value={`${stats?.overall?.efficiency?.toFixed(0) ?? 0}%`}
        icon={<TrendingUp size={20} />}
        color={colors.primary}
        href={getDrillDownUrl('efficiency')}
        description="Click to view analytics"
      />
    </StatsGrid>
  );
};


/**
 * Stats Widget
 * 
 * Displays quick statistics cards
 */

import React from 'react';
import type { WidgetProps } from '../../../types/widgets';
import { StatCard } from '../../ui/StatCard';
import { CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { colors, spacing } from '../../../lib/theme';

export const StatsWidget: React.FC<WidgetProps> = ({ config, data }) => {
  const stats = data?.stats;

  if (!stats) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.neutral[600] }}>
        Loading stats...
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
      gap: spacing.md 
    }}>
      <StatCard
        label="Completed Today"
        value={stats?.overall?.completed_today ?? 0}
        icon={<CheckCircle size={20} />}
        color={colors.success[500]}
      />
      <StatCard
        label="Pending Tasks"
        value={stats?.overall?.pending_tasks ?? 0}
        icon={<Clock size={20} />}
        color={colors.warning[500]}
      />
      <StatCard
        label="Urgent Items"
        value={stats?.overall?.urgent_items ?? 0}
        icon={<AlertCircle size={20} />}
        color={colors.error[500]}
      />
      <StatCard
        label="Efficiency"
        value={`${stats?.overall?.efficiency?.toFixed(0) ?? 0}%`}
        icon={<TrendingUp size={20} />}
        color={colors.primary}
      />
    </div>
  );
};


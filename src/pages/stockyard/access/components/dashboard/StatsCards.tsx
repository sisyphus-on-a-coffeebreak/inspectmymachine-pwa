/**
 * Stats Cards Component
 * Displays statistics cards for gate pass dashboard
 */

import React from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { StatsGrid } from '@/components/ui/ResponsiveGrid';
import { colors } from '@/lib/theme';
import type { GatePassStats } from '../../gatePassTypes';

interface StatsCardsProps {
  stats: GatePassStats;
  loading: boolean;
  onStatClick?: (filter: { status?: string; type?: string }) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  loading,
  onStatClick,
}) => {
  return (
    <StatsGrid gap="lg">
      <StatCard
        label="Visitors Inside"
        value={stats.visitors_inside}
        icon={<span>👥</span>}
        color={colors.success || '#10B981'}
        onClick={() => onStatClick?.({ status: 'inside', type: 'visitor' })}
        loading={loading}
      />
      <StatCard
        label="Vehicles Out"
        value={stats.vehicles_out}
        icon={<span>🚗</span>}
        color={colors.brand || '#EB8B00'}
        onClick={() => onStatClick?.({ status: 'inside', type: 'vehicle' })}
        loading={loading}
      />
      <StatCard
        label="Expected Today"
        value={stats.expected_today}
        icon={<span>⏳</span>}
        color={colors.primary}
        onClick={() => onStatClick?.({ status: 'pending' })}
        loading={loading}
      />
      <StatCard
        label="Expiring Soon"
        value={stats.expiring_soon || 0}
        icon={<span>⏰</span>}
        color={colors.status?.warning || '#F59E0B'}
        onClick={() => onStatClick?.({ status: 'active' })}
        loading={loading}
      />
    </StatsGrid>
  );
};



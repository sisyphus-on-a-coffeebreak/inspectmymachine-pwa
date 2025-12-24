/**
 * StaffDashboardContent Component
 * 
 * Dashboard content for Clerk/Office Staff role
 * Focuses on creating passes and viewing status
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionGrid, StatsGrid } from '../../../../components/ui/ResponsiveGrid';
import { StatCard } from '../../../../components/ui/StatCard';
import { colors, spacing, cardStyles, typography } from '../../../../lib/theme';
import { PassListSection } from './PassListSection';

interface StaffDashboardContentProps {
  onCreateVisitor: () => void;
  onCreateOutbound: () => void;
  onCreateInbound: () => void;
  stats: {
    visitors_inside: number;
    vehicles_out: number;
    expected_today: number;
    expiring_soon: number;
  };
  loading?: boolean;
}

export const StaffDashboardContent: React.FC<StaffDashboardContentProps> = ({
  onCreateVisitor,
  onCreateOutbound,
  onCreateInbound,
  stats,
  loading = false,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl,
    }}>
      {/* Quick Create Actions */}
      <div>
        <h2 style={{
          ...typography.subheader,
          marginBottom: spacing.md,
          color: colors.neutral[900],
        }}>
          Quick Create
        </h2>
        <ActionGrid gap="lg">
          {/* Create Visitor Pass */}
          <div
            onClick={onCreateVisitor}
            style={{
              ...cardStyles.base,
              padding: spacing.xl,
              cursor: 'pointer',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.primary[500]}`,
            }}
            className="card-hover touch-feedback"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>👥</div>
            <div style={{ ...typography.subheader, fontSize: '20px', marginBottom: spacing.sm }}>
              Create Visitor Pass
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              For clients & inspections
            </div>
          </div>

          {/* Create Vehicle Outbound */}
          <div
            onClick={onCreateOutbound}
            style={{
              ...cardStyles.base,
              padding: spacing.xl,
              cursor: 'pointer',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.brand}`,
            }}
            className="card-hover touch-feedback"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 139, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🚛</div>
            <div style={{ ...typography.subheader, fontSize: '20px', marginBottom: spacing.sm }}>
              Vehicle Going Out
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              RTO, sales, test drives
            </div>
          </div>

          {/* Create Vehicle Inbound */}
          <div
            onClick={onCreateInbound}
            style={{
              ...cardStyles.base,
              padding: spacing.xl,
              cursor: 'pointer',
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.success[500]}`,
            }}
            className="card-hover touch-feedback"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🚗</div>
            <div style={{ ...typography.subheader, fontSize: '20px', marginBottom: spacing.sm }}>
              Vehicle Coming In
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              Service, delivery, return
            </div>
          </div>
        </ActionGrid>
      </div>

      {/* Statistics */}
      <StatsGrid gap="lg">
        <StatCard
          label="Visitors Inside"
          value={stats.visitors_inside}
          icon={<span>👥</span>}
          color={colors.success[500]}
          loading={loading}
        />
        <StatCard
          label="Vehicles Out"
          value={stats.vehicles_out}
          icon={<span>🚗</span>}
          color={colors.brand}
          loading={loading}
        />
        <StatCard
          label="Expected Today"
          value={stats.expected_today}
          icon={<span>⏳</span>}
          color={colors.primary[500]}
          loading={loading}
        />
        <StatCard
          label="Expiring Soon"
          value={stats.expiring_soon}
          icon={<span>⏰</span>}
          color={colors.warning[500]}
          loading={loading}
        />
      </StatsGrid>

      {/* Pass List with Filters */}
      <PassListSection />
    </div>
  );
};








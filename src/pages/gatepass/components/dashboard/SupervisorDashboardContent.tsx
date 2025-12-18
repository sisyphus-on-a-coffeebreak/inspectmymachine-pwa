/**
 * SupervisorDashboardContent Component
 * 
 * Dashboard content for Supervisor role
 * Focuses on approvals and oversight
 */

import React from 'react';
import { PendingApprovalsBadge } from './PendingApprovalsBadge';
import { StaffDashboardContent } from './StaffDashboardContent';
import { spacing } from '../../../../lib/theme';

interface SupervisorDashboardContentProps {
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

export const SupervisorDashboardContent: React.FC<SupervisorDashboardContentProps> = ({
  onCreateVisitor,
  onCreateOutbound,
  onCreateInbound,
  stats,
  loading,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl,
    }}>
      {/* Pending Approvals - Prominent */}
      <PendingApprovalsBadge />

      {/* Rest of dashboard (similar to staff but with approval focus) */}
      <StaffDashboardContent
        onCreateVisitor={onCreateVisitor}
        onCreateOutbound={onCreateOutbound}
        onCreateInbound={onCreateInbound}
        stats={stats}
        loading={loading}
      />
    </div>
  );
};







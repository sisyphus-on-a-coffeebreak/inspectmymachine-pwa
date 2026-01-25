/**
 * GuardDashboardContent Component
 * 
 * Dashboard content specifically for Guard role
 * Focuses on validation and entry/exit actions
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses } from '@/hooks/useGatePasses';
import type { GatePass, GatePassFilters } from '../../gatePassTypes';
import { colors, spacing } from '@/lib/theme';
import { QuickScanButton } from './QuickScanButton';
import { ExpectedArrivalsList } from './ExpectedArrivalsList';
import { InsideNowList } from './InsideNowList';
import { useRecordEntry, useRecordExit } from '@/hooks/useGatePasses';

interface GuardDashboardContentProps {
  onViewAllInside?: () => void;
}

export const GuardDashboardContent: React.FC<GuardDashboardContentProps> = ({
  onViewAllInside,
}) => {
  const navigate = useNavigate();
  const recordEntry = useRecordEntry();
  const recordExit = useRecordExit();

  // Fetch expected arrivals (passes valid today, status pending or active, not yet entered)
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const expectedFilters: GatePassFilters = useMemo(() => ({
    status: ['pending', 'active'],
    valid_from: todayStart.toISOString(),
    valid_to: todayEnd.toISOString(),
    per_page: 10,
    page: 1,
  }), []);

  const { data: expectedData, isLoading: expectedLoading } = useGatePasses(expectedFilters);

  // Fetch inside passes
  const insideFilters: GatePassFilters = useMemo(() => ({
    status: ['inside'],
    per_page: 10,
    page: 1,
  }), []);

  const { data: insideData, isLoading: insideLoading, refetch: refetchInside } = useGatePasses(insideFilters);

  const expectedPasses = (expectedData?.data || []).filter((pass: GatePass) => {
    // Only show passes that haven't been entered yet
    return pass.status !== 'inside' && !pass.entry_time;
  });

  const insidePasses = insideData?.data || [];

  const handleMarkEntry = async (passId: string) => {
    try {
      // Note: guard_id, gate_id, location should be added here
      // For now, backend will use authenticated user as guard_id
      await recordEntry.mutateAsync({ id: passId });
      // Refetch both lists after a short delay
      setTimeout(() => {
        refetchInside();
      }, 500);
    } catch (error) {
      // Hook should handle via onError, but log for debugging
      console.error('Failed to record entry:', error);
      // Hooks verified to have onError handlers that show toast notifications
    }
  };

  const handleMarkExit = async (passId: string) => {
    try {
      // Note: guard_id, gate_id, location should be added here
      // For now, backend will use authenticated user as guard_id
      await recordExit.mutateAsync({ id: passId });
      refetchInside();
    } catch (error) {
      // Hook should handle via onError, but log for debugging
      console.error('Failed to record exit:', error);
      // Hooks verified to have onError handlers that show toast notifications
    }
  };

  const handleViewAllInside = () => {
    navigate('/app/gate-pass?status=inside');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl,
    }}>
      {/* Primary Action: Scan Button */}
      <QuickScanButton />

      {/* Expected Arrivals */}
      <ExpectedArrivalsList
        passes={expectedPasses}
        onMarkEntry={handleMarkEntry}
        loading={expectedLoading}
      />

      {/* Inside Now */}
      <InsideNowList
        passes={insidePasses}
        onMarkExit={handleMarkExit}
        loading={insideLoading}
        onViewAll={handleViewAllInside}
      />
    </div>
  );
};


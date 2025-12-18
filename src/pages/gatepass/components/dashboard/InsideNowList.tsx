/**
 * InsideNowList Component
 * 
 * Shows passes currently inside the facility
 * Used in Guard dashboard
 */

import React from 'react';
import { Users, ArrowLeft, Clock } from 'lucide-react';
import { colors, spacing, typography, borderRadius, cardStyles } from '../../../../lib/theme';
import { Button } from '../../../../components/ui/button';
import type { GatePass } from '../../gatePassTypes';
import { getPassDisplayName } from '../../gatePassTypes';

interface InsideNowListProps {
  passes: GatePass[];
  onMarkExit: (passId: string) => void;
  loading?: boolean;
  onViewAll?: () => void;
}

export const InsideNowList: React.FC<InsideNowListProps> = ({
  passes,
  onMarkExit,
  loading = false,
  onViewAll,
}) => {
  const getTimeInside = (pass: GatePass): string | null => {
    if (pass.status !== 'inside' || !pass.entry_time) {
      return null;
    }
    const entryTime = new Date(pass.entry_time);
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  if (loading) {
    return (
      <div style={{ ...cardStyles.base, padding: spacing.lg }}>
        <div style={{ ...typography.subheader, marginBottom: spacing.md }}>
          Inside Now
        </div>
        <div style={{ color: colors.neutral[500] }}>Loading...</div>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div style={{ ...cardStyles.base, padding: spacing.lg }}>
        <div style={{ ...typography.subheader, marginBottom: spacing.md }}>
          Inside Now (0)
        </div>
        <div style={{ 
          color: colors.neutral[500], 
          textAlign: 'center', 
          padding: spacing.xl,
          ...typography.bodySmall 
        }}>
          No one is currently inside
        </div>
      </div>
    );
  }

  const displayedPasses = passes.slice(0, 5);
  const hasMore = passes.length > 5;

  return (
    <div style={{ ...cardStyles.base, padding: spacing.lg }}>
      <div style={{ 
        ...typography.subheader, 
        marginBottom: spacing.md,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Users size={20} color={colors.success[500]} />
          Inside Now ({passes.length})
        </div>
        {hasMore && onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
          >
            View All →
          </Button>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {displayedPasses.map((pass) => {
          const timeInside = getTimeInside(pass);

          return (
            <div
              key={pass.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.md,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                  {getPassDisplayName(pass)}
                </div>
                {timeInside && (
                  <div style={{ 
                    ...typography.bodySmall, 
                    color: colors.neutral[600],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}>
                    <Clock size={14} />
                    {timeInside} inside
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onMarkExit(pass.id)}
                icon={<ArrowLeft size={16} />}
              >
                Exit
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};







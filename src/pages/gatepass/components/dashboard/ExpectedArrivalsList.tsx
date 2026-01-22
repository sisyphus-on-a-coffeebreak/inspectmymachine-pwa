/**
 * ExpectedArrivalsList Component
 * 
 * Shows passes expected today that haven't been entered yet
 * Used in Guard dashboard
 */

import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { colors, spacing, typography, borderRadius, cardStyles } from '../../../../lib/theme';
import { Button } from '../../../../components/ui/button';
import type { GatePass } from '../../gatePassTypes';
import { getPassDisplayName } from '../../gatePassTypes';

interface ExpectedArrivalsListProps {
  passes: GatePass[];
  onMarkEntry: (passId: string) => void;
  loading?: boolean;
}

export const ExpectedArrivalsList: React.FC<ExpectedArrivalsListProps> = ({
  passes,
  onMarkEntry,
  loading = false,
}) => {
  if (loading) {
    return (
      <div style={{ ...cardStyles.base, padding: spacing.lg }}>
        <div style={{ ...typography.subheader, marginBottom: spacing.md }}>
          Expected Today
        </div>
        <div style={{ color: colors.neutral[500] }}>Loading...</div>
      </div>
    );
  }

  if (passes.length === 0) {
    return (
      <div style={{ ...cardStyles.base, padding: spacing.lg }}>
        <div style={{ ...typography.subheader, marginBottom: spacing.md }}>
          Expected Today (0)
        </div>
        <div style={{ 
          color: colors.neutral[500], 
          textAlign: 'center', 
          padding: spacing.xl,
          ...typography.bodySmall 
        }}>
          No passes expected today
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cardStyles.base, padding: spacing.lg }}>
      <div style={{ 
        ...typography.subheader, 
        marginBottom: spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        <Clock size={20} color={colors.primary[500]} />
        Expected Today ({passes.length})
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {passes.map((pass) => {
          const validFrom = pass.valid_from ? new Date(pass.valid_from) : null;
          const timeStr = validFrom 
            ? validFrom.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : 'N/A';

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
                <div style={{ 
                  ...typography.bodySmall, 
                  color: colors.neutral[600],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}>
                  <Clock size={14} />
                  Due {timeStr}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onMarkEntry(pass.id)}
                icon={<ArrowRight size={16} />}
              >
                Entry
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};













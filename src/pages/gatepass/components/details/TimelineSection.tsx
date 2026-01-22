/**
 * Timeline Section Component
 * Displays validation history and timeline
 */

import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { colors, typography, spacing, borderRadius, cardStyles } from '@/lib/theme';
import type { GatePass } from '../../gatePassTypes';

interface TimelineSectionProps {
  pass: GatePass;
  formatDateTime: (date: string | null) => string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  pass,
  formatDateTime,
}) => {
  if (!pass.validations || pass.validations.length === 0) {
    return null;
  }

  return (
    <div style={{
      ...cardStyles.base,
      padding: spacing.xl,
      marginTop: spacing.lg,
    }}>
      <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
        Timeline & History
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {pass.validations.map((validation) => (
          <div
            key={validation.id}
            style={{
              display: 'flex',
              gap: spacing.md,
              padding: spacing.md,
              borderLeft: `3px solid ${
                validation.action === 'entry' ? colors.success[500] :
                validation.action === 'exit' ? colors.brand :
                colors.neutral[300]
              }`,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.md,
            }}
          >
            <div style={{ flexShrink: 0 }}>
              {validation.action === 'entry' ? (
                <CheckCircle size={20} color={colors.success[500]} />
              ) : validation.action === 'exit' ? (
                <XCircle size={20} color={colors.brand} />
              ) : (
                <Clock size={20} color={colors.neutral[500]} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                {validation.action === 'entry' ? 'Entry Recorded' :
                 validation.action === 'exit' ? 'Exit Recorded' :
                 'Validation'}
              </div>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                {formatDateTime(validation.created_at)}
              </div>
              {validation.validator && (
                <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                  By: {validation.validator.name}
                </div>
              )}
              {validation.notes && (
                <div style={{
                  marginTop: spacing.xs,
                  padding: spacing.xs,
                  backgroundColor: 'white',
                  borderRadius: borderRadius.sm,
                  ...typography.bodySmall,
                }}>
                  {validation.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


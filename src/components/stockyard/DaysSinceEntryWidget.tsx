/**
 * Days Since Entry Widget
 * 
 * Displays days since vehicle entered the yard with alerts
 */

import React from 'react';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { Calendar, AlertTriangle } from 'lucide-react';

interface DaysSinceEntryWidgetProps {
  daysSinceEntry: number;
  vehicleRegistration?: string;
  showAlert?: boolean;
  alertThreshold?: number;
}

export const DaysSinceEntryWidget: React.FC<DaysSinceEntryWidgetProps> = ({
  daysSinceEntry,
  vehicleRegistration,
  showAlert = true,
  alertThreshold = 30,
}) => {
  const isOverThreshold = daysSinceEntry >= alertThreshold;
  const isWarning = daysSinceEntry >= alertThreshold * 0.7;

  const getColor = () => {
    if (isOverThreshold) return colors.error[600];
    if (isWarning) return colors.warning[600];
    return colors.success[600];
  };

  const getBgColor = () => {
    if (isOverThreshold) return colors.error[50];
    if (isWarning) return colors.warning[50];
    return colors.success[50];
  };

  return (
    <div
      style={{
        ...cardStyles.card,
        borderLeft: `4px solid ${getColor()}`,
        backgroundColor: getBgColor(),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: getColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Calendar size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Days in Yard
          </div>
          <div style={{ ...typography.header, fontSize: '24px', color: getColor(), marginBottom: spacing.xs }}>
            {daysSinceEntry} {daysSinceEntry === 1 ? 'day' : 'days'}
          </div>
          {vehicleRegistration && (
            <div style={{ ...typography.caption, color: colors.neutral[600] }}>
              {vehicleRegistration}
            </div>
          )}
        </div>
        {showAlert && isOverThreshold && (
          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.error[100],
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <AlertTriangle size={18} color={colors.error[600]} />
            <span style={{ ...typography.bodySmall, color: colors.error[700], fontWeight: 600 }}>
              Over {alertThreshold} days
            </span>
          </div>
        )}
        {showAlert && isWarning && !isOverThreshold && (
          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.warning[100],
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <AlertTriangle size={18} color={colors.warning[600]} />
            <span style={{ ...typography.bodySmall, color: colors.warning[700], fontWeight: 600 }}>
              Approaching threshold
            </span>
          </div>
        )}
      </div>
    </div>
  );
};



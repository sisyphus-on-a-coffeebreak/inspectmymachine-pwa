/**
 * Advance Utilization Bar Component
 * 
 * Visual progress bar showing advance utilization (used vs. remaining)
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Tooltip } from './Tooltip';

export interface AdvanceUtilizationBarProps {
  amount: number;
  used: number;
  remaining: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  showWarning?: boolean;
}

export const AdvanceUtilizationBar: React.FC<AdvanceUtilizationBarProps> = ({
  amount,
  used,
  remaining,
  showLabels = true,
  showPercentage = true,
  size = 'medium',
  showWarning = true,
}) => {
  const utilization = amount > 0 ? Math.round((used / amount) * 100) : 0;
  
  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return colors.status.error;
    if (percentage >= 70) return colors.status.warning;
    return colors.status.normal;
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return 'Critical';
    if (percentage >= 70) return 'High';
    return 'Normal';
  };

  const utilizationColor = getUtilizationColor(utilization);
  const status = getUtilizationStatus(utilization);
  const height = size === 'small' ? '6px' : size === 'large' ? '12px' : '8px';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={{ width: '100%' }}>
      {showLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            Utilization: {utilization}%
            {showWarning && utilization >= 70 && (
              <span style={{ 
                marginLeft: spacing.xs,
                color: utilization >= 90 ? colors.status.error : colors.status.warning,
                fontWeight: 600,
              }}>
                ({status})
              </span>
            )}
          </div>
          {showPercentage && (
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              {formatCurrency(used)} / {formatCurrency(amount)}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height,
          backgroundColor: colors.neutral[200],
          borderRadius: borderRadius.sm,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${utilization}%`,
            height: '100%',
            backgroundColor: utilizationColor,
            transition: 'width 0.3s ease, background-color 0.3s ease',
            borderRadius: borderRadius.sm,
            position: 'relative',
          }}
        >
          {/* Gradient overlay for visual depth */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.1))`,
            }}
          />
        </div>
      </div>

      {showLabels && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
          <div style={{ ...typography.bodySmall, color: colors.neutral[500], fontSize: '11px' }}>
            Used: {formatCurrency(used)}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.status.normal, fontSize: '11px', fontWeight: 600 }}>
            Remaining: {formatCurrency(remaining)}
          </div>
        </div>
      )}
    </div>
  );
};



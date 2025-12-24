/**
 * PassCardSkeleton Component
 * 
 * Loading skeleton that matches PassCard layout
 * Shows animated shimmer effect during data fetch
 */

import React from 'react';
import { colors, spacing, cardStyles, borderRadius } from '../../lib/theme';

export interface PassCardSkeletonProps {
  count?: number;
  compact?: boolean;
}

export const PassCardSkeleton: React.FC<PassCardSkeletonProps> = ({ 
  count = 1,
  compact = false 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="pass-card-skeleton"
          style={{
            ...cardStyles.base,
            padding: compact ? spacing.md : spacing.lg,
            borderLeft: `4px solid ${colors.neutral[200]}`,
            animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
          }}
        >
          {/* Header Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: compact ? spacing.xs : spacing.sm,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              flex: 1,
            }}>
              {/* Icon Circle */}
              <div style={{
                width: compact ? 32 : 40,
                height: compact ? 32 : 40,
                borderRadius: borderRadius.full,
                backgroundColor: colors.neutral[200],
                flexShrink: 0,
              }} />
              {/* Name and Pass Number */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  height: compact ? 14 : 16,
                  width: '70%',
                  backgroundColor: colors.neutral[200],
                  borderRadius: borderRadius.sm,
                  marginBottom: 4,
                }} />
                <div style={{
                  height: compact ? 11 : 12,
                  width: '50%',
                  backgroundColor: colors.neutral[200],
                  borderRadius: borderRadius.sm,
                }} />
              </div>
            </div>
            {/* Badge */}
            <div style={{
              width: 60,
              height: compact ? 20 : 24,
              backgroundColor: colors.neutral[200],
              borderRadius: borderRadius.md,
            }} />
          </div>

          {/* Purpose (if not compact) */}
          {!compact && (
            <div style={{
              height: 14,
              width: '40%',
              backgroundColor: colors.neutral[200],
              borderRadius: borderRadius.sm,
              marginBottom: spacing.xs,
            }} />
          )}

          {/* Context Info (if not compact) */}
          {!compact && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              marginTop: spacing.xs,
            }}>
              <div style={{
                width: 12,
                height: 12,
                backgroundColor: colors.neutral[200],
                borderRadius: borderRadius.sm,
              }} />
              <div style={{
                height: 12,
                width: '60%',
                backgroundColor: colors.neutral[200],
                borderRadius: borderRadius.sm,
              }} />
            </div>
          )}

          {/* Valid Until (if not compact) */}
          {!compact && (
            <div style={{
              marginTop: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}>
              <div style={{
                width: 12,
                height: 12,
                backgroundColor: colors.neutral[200],
                borderRadius: borderRadius.sm,
              }} />
              <div style={{
                height: 12,
                width: '50%',
                backgroundColor: colors.neutral[200],
                borderRadius: borderRadius.sm,
              }} />
            </div>
          )}
        </div>
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }
        .pass-card-skeleton > * {
          animation: skeleton-shimmer 1.5s ease-in-out infinite;
        }
        .pass-card-skeleton > *:nth-child(1) {
          animation-delay: 0s;
        }
        .pass-card-skeleton > *:nth-child(2) {
          animation-delay: 0.1s;
        }
        .pass-card-skeleton > *:nth-child(3) {
          animation-delay: 0.2s;
        }
        .pass-card-skeleton > *:nth-child(4) {
          animation-delay: 0.3s;
        }
      `}</style>
    </>
  );
};








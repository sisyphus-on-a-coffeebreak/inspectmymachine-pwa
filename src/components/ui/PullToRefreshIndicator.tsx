import { Loader2 } from 'lucide-react';
import { colors, spacing, typography } from '../../lib/theme';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  threshold,
  isRefreshing,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const shouldShow = pullDistance > 0 || isRefreshing;

  if (!shouldShow) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        zIndex: 1000,
        transition: 'transform 0.3s ease',
        transform: `translateX(-50%) translateY(${Math.max(0, pullDistance - 60)}px)`,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${colors.neutral[300]}`,
          borderTopColor: colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${progress * 360}deg)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s',
        }}
      >
        {isRefreshing ? (
          <Loader2
            style={{
              width: '24px',
              height: '24px',
              color: colors.primary,
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <Loader2
            style={{
              width: '24px',
              height: '24px',
              color: colors.primary,
            }}
          />
        )}
      </div>
      <div
        style={{
          ...typography.bodySmall,
          color: colors.neutral[600],
          textAlign: 'center',
        }}
      >
        {isRefreshing
          ? 'Refreshing...'
          : pullDistance >= threshold
          ? 'Release to refresh'
          : 'Pull to refresh'}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


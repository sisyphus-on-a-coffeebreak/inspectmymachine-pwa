/**
 * Cache Indicator Component
 * 
 * Shows when dashboard data was last updated
 */

import React from 'react';
import { colors, spacing, typography } from '@/lib/theme';
import { Clock } from 'lucide-react';

interface CacheIndicatorProps {
  cacheAge: number | null;
  onRefresh?: () => void;
}

export const CacheIndicator: React.FC<CacheIndicatorProps> = ({ cacheAge, onRefresh }) => {
  if (cacheAge === null) {
    return null;
  }

  const getAgeText = (seconds: number): string => {
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        ...typography.caption,
        color: colors.neutral[600],
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: colors.neutral[50],
        borderRadius: '8px',
        cursor: onRefresh ? 'pointer' : 'default',
      }}
      onClick={onRefresh}
      title={onRefresh ? 'Click to refresh' : undefined}
    >
      <Clock size={14} />
      <span>Last updated: {getAgeText(cacheAge)}</span>
    </div>
  );
};


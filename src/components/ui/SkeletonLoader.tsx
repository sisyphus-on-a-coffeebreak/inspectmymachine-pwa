import React from 'react';
import { colors, spacing } from '../../lib/theme';

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
  animation?: 'pulse' | 'wave' | 'none';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  style = {},
  animation = 'pulse'
}) => {
  const animationStyle = {
    pulse: {
      animation: 'skeleton-pulse 1.5s ease-in-out infinite'
    },
    wave: {
      animation: 'skeleton-wave 1.5s ease-in-out infinite'
    },
    none: {}
  };

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        backgroundColor: colors.neutral[200],
        borderRadius,
        ...animationStyle[animation],
        ...style
      }}
    />
  );
};

// Skeleton components for common patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`skeleton-card ${className}`}
    style={{
      padding: spacing.lg,
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}
  >
    <SkeletonLoader height="24px" width="60%" style={{ marginBottom: spacing.sm }} />
    <SkeletonLoader height="16px" width="100%" style={{ marginBottom: spacing.xs }} />
    <SkeletonLoader height="16px" width="80%" style={{ marginBottom: spacing.md }} />
    <SkeletonLoader height="32px" width="40%" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`skeleton-table ${className}`}>
    {/* Header */}
    <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLoader key={i} height="20px" width="100%" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.sm }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader key={colIndex} height="16px" width="100%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className = '' 
}) => (
  <div className={`skeleton-list ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: spacing.md, 
        marginBottom: spacing.md,
        padding: spacing.sm,
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <SkeletonLoader width="40px" height="40px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <SkeletonLoader height="16px" width="70%" style={{ marginBottom: spacing.xs }} />
          <SkeletonLoader height="14px" width="50%" />
        </div>
        <SkeletonLoader width="60px" height="24px" borderRadius="12px" />
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ cards?: number; className?: string }> = ({ 
  cards = 4, 
  className = '' 
}) => (
  <div 
    className={`skeleton-stats ${className}`}
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: spacing.lg
    }}
  >
    {Array.from({ length: cards }).map((_, i) => (
      <div key={i} style={{
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <SkeletonLoader height="16px" width="60%" style={{ marginBottom: spacing.sm }} />
        <SkeletonLoader height="32px" width="40%" style={{ marginBottom: spacing.sm }} />
        <SkeletonLoader height="12px" width="80%" />
      </div>
    ))}
  </div>
);

export default SkeletonLoader;



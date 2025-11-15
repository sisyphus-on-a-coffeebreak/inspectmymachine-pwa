/**
 * SkeletonLoader Component
 * 
 * Loading placeholders that match content structure for better perceived performance
 * Includes variants for cards, tables, and custom content
 */

import React from 'react';
import { colors, spacing, borderRadius, cardStyles } from '../../lib/theme';

export interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'text' | 'custom';
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Skeleton Card - For card-based layouts
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`skeleton-card ${className}`}
    style={{
      ...cardStyles.base,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}
  >
    <div style={{
      height: '20px',
      width: '60%',
      backgroundColor: colors.neutral[200],
      borderRadius: borderRadius.sm,
      marginBottom: spacing.md,
    }} />
    <div style={{
      height: '32px',
      width: '40%',
      backgroundColor: colors.neutral[200],
      borderRadius: borderRadius.sm,
      marginBottom: spacing.sm,
    }} />
    <div style={{
      height: '16px',
      width: '80%',
      backgroundColor: colors.neutral[200],
      borderRadius: borderRadius.sm,
    }} />
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

/**
 * Skeleton Table - For table/list layouts
 */
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
  <div style={{ ...cardStyles.base }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: spacing.md,
          padding: spacing.md,
          borderBottom: i < rows - 1 ? `1px solid ${colors.neutral[200]}` : 'none',
        }}
      >
        {Array.from({ length: columns }).map((_, j) => (
          <div
            key={j}
            style={{
              height: '20px',
              backgroundColor: colors.neutral[200],
              borderRadius: borderRadius.sm,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${(i * columns + j) * 0.1}s`,
            }}
          />
        ))}
      </div>
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

/**
 * Skeleton Text - For text content
 */
export const SkeletonText: React.FC<{ lines?: number; width?: string }> = ({ lines = 3, width = '100%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          height: '16px',
          width: i === lines - 1 ? '60%' : width,
          backgroundColor: colors.neutral[200],
          borderRadius: borderRadius.sm,
          animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`,
        }}
      />
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

/**
 * Generic Skeleton Loader
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  rows = 3,
  columns = 4,
  className = '',
}) => {
  switch (variant) {
    case 'card':
      return <SkeletonCard className={className} />;
    case 'table':
      return <SkeletonTable rows={rows} columns={columns} />;
    case 'text':
      return <SkeletonText lines={rows} />;
    default:
      return <SkeletonCard className={className} />;
  }
};

export default SkeletonLoader;

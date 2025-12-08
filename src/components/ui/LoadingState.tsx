/**
 * LoadingState Component
 * 
 * Provides accessible loading states with proper ARIA attributes
 */

import React from 'react';
import { colors, spacing, typography } from '../../lib/theme';
import { SkeletonLoader } from './SkeletonLoader';

export interface LoadingStateProps {
  message?: string;
  icon?: string;
  variant?: 'spinner' | 'skeleton' | 'minimal';
  fullScreen?: boolean;
  ariaLabel?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  icon = '⏳',
  variant = 'spinner',
  fullScreen = false,
  ariaLabel,
}) => {
  const containerStyle: React.CSSProperties = {
    padding: fullScreen ? spacing.xl : spacing.lg,
    textAlign: 'center',
    ...(fullScreen && {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }),
  };

  if (variant === 'skeleton') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={ariaLabel || message}
        style={containerStyle}
      >
        <SkeletonLoader variant="page" />
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={ariaLabel || message}
        style={{
          padding: spacing.sm,
          fontSize: '14px',
          color: colors.neutral[600],
        }}
      >
        {message}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel || message}
      style={containerStyle}
    >
      <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>{icon}</div>
      <div style={{ ...typography.body, color: colors.neutral[600] }}>{message}</div>
    </div>
  );
};




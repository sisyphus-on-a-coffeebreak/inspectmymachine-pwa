/**
 * Badge Component
 * 
 * Consistent status indicators and labels across the application
 * Supports different variants and sizes
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  default: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    borderColor: colors.primary + '40',
  },
  success: {
    backgroundColor: colors.success[100],
    color: colors.success[700],
    borderColor: colors.success[300],
  },
  warning: {
    backgroundColor: colors.warning[100],
    color: colors.warning[700],
    borderColor: colors.warning[300],
  },
  error: {
    backgroundColor: colors.error[100],
    color: colors.error[700],
    borderColor: colors.error[300],
  },
  info: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    borderColor: colors.primary + '40',
  },
  neutral: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[700],
    borderColor: colors.neutral[300],
  },
};

const sizeStyles = {
  sm: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: '11px',
    lineHeight: '16px',
  },
  md: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: '12px',
    lineHeight: '18px',
  },
  lg: {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: '14px',
    lineHeight: '20px',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <span
      className={`badge badge-${variant} badge-${size} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dot ? spacing.xs : 0,
        ...variantStyle,
        ...sizeStyle,
        border: `1px solid ${variantStyle.borderColor}`,
        borderRadius: borderRadius.full,
        fontWeight: 600,
        fontFamily: typography.body.fontFamily,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: variantStyle.color,
            display: 'inline-block',
          }}
        />
      )}
      {children}
    </span>
  );
};

/**
 * Status Badge - Pre-configured for common statuses
 */
export const StatusBadge: React.FC<{
  status: 'active' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'error', label: 'Rejected' },
    completed: { variant: 'success', label: 'Completed' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
  };

  const config = statusMap[status.toLowerCase()] || { variant: 'neutral' as const, label: status };

  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
};

export default Badge;


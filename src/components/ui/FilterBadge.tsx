/**
 * FilterBadge Component
 * 
 * Reusable component for displaying active filter badges with remove functionality
 * Used in pages that have custom filter implementations
 */

import React from 'react';
import { X } from 'lucide-react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

export interface FilterBadgeProps {
  label: string;
  value: string;
  onRemove: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

export const FilterBadge: React.FC<FilterBadgeProps> = ({
  label,
  value,
  onRemove,
  variant = 'default',
}) => {
  const variantStyles = {
    default: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
      color: colors.primary,
    },
    primary: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
      color: colors.primary,
    },
    secondary: {
      backgroundColor: colors.neutral[100],
      borderColor: colors.neutral[300],
      color: colors.neutral[700],
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: style.backgroundColor,
        border: `1px solid ${style.borderColor}`,
        borderRadius: borderRadius.md,
        fontSize: '13px',
        fontFamily: typography.body.fontFamily,
        color: style.color,
      }}
    >
      <span style={{ fontWeight: 500 }}>{label}: {value}</span>
      <button
        onClick={onRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          color: style.color,
          transition: 'all 0.2s ease',
          minWidth: '32px',
          minHeight: '32px',
          width: '32px',
          height: '32px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = style.borderColor;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = style.color;
        }}
        aria-label={`Remove ${label} filter`}
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * FilterBadges Container Component
 * Displays multiple filter badges in a row
 */
export interface FilterBadgesProps {
  filters: Array<{
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  variant?: 'default' | 'primary' | 'secondary';
  onClearAll?: () => void;
}

export const FilterBadges: React.FC<FilterBadgesProps> = ({
  filters,
  variant = 'default',
  onClearAll,
}) => {
  if (filters.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.sm,
        flexWrap: 'wrap',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTop: `1px solid ${colors.neutral[200]}`,
        marginTop: spacing.sm,
      }}
    >
      {filters.map((filter, index) => (
        <FilterBadge
          key={index}
          label={filter.label}
          value={filter.value}
          onRemove={filter.onRemove}
          variant={variant}
        />
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: colors.neutral[100],
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '13px',
            fontFamily: typography.body.fontFamily,
            color: colors.neutral[700],
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.neutral[200];
            e.currentTarget.style.borderColor = colors.neutral[400];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.neutral[100];
            e.currentTarget.style.borderColor = colors.neutral[300];
          }}
        >
          <X size={14} />
          Clear All
        </button>
      )}
    </div>
  );
};


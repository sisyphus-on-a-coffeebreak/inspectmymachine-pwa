/**
 * Segmented Control Component
 * 
 * A segmented control for selecting from a set of options, commonly used for categorical ratings.
 * Replaces numeric sliders when options have meaningful labels (e.g., "Good / Fair / Poor").
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { useMobileViewport } from '../../lib/mobileUtils';

interface SegmentedControlOption {
  value: string | number;
  label: string;
  description?: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  size = 'md',
  orientation = 'horizontal',
  fullWidth = false,
}) => {
  const isMobile = useMobileViewport();
  const sizeStyles = {
    sm: { padding: spacing.xs, fontSize: typography.bodySmall.fontSize },
    md: { padding: spacing.sm, fontSize: typography.body.fontSize },
    lg: { padding: spacing.md, fontSize: typography.subheader.fontSize },
  };

  const currentSize = sizeStyles[size];
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: spacing.xs,
        width: fullWidth ? '100%' : 'auto',
        backgroundColor: colors.neutral[100],
        padding: spacing.xs,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.neutral[300]}`,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'default',
        ...(isMobile && orientation === 'horizontal' && {
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }),
      }}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value;
        return (
          <button
            key={index}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            style={{
              flex: fullWidth ? 1 : '0 1 auto',
              padding: currentSize.padding,
              fontSize: currentSize.fontSize,
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? colors.primary : colors.neutral[700],
              backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
              border: isSelected ? `2px solid ${colors.primary}` : `2px solid transparent`,
              borderRadius: borderRadius.sm,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
              whiteSpace: isMobile && orientation === 'horizontal' ? 'nowrap' : 'normal',
              minWidth: isMobile && orientation === 'horizontal' ? 'max-content' : undefined,
              ...typography.body,
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isSelected) {
                e.currentTarget.style.backgroundColor = colors.neutral[200];
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            title={option.description}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};






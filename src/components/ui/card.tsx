/**
 * Card Component (Design System)
 * 
 * Standardized card component using design system tokens.
 * Replaces inline card implementations for consistency.
 * 
 * NOTE: This is the new design system Card component.
 * The old card.tsx (lowercase) uses Tailwind and should be migrated.
 */

import React from 'react';
import { cardStyles, spacing, responsiveSpacing, colors } from '../../lib/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'bordered' | 'interactive';
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

// Responsive padding using clamp() - scales from mobile to desktop
const paddingMap = {
  sm: responsiveSpacing.padding.sm,  // clamp(12px, 3vw, 16px)
  md: responsiveSpacing.padding.md,  // clamp(16px, 4vw, 24px)
  lg: responsiveSpacing.padding.lg,  // clamp(24px, 5vw, 32px)
  xl: responsiveSpacing.padding.xl,  // clamp(32px, 6vw, 48px)
  none: '0',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'base',
  padding = 'lg',
  onClick,
  className = '',
  style = {},
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}) => {
  const baseStyle = variant === 'elevated' 
    ? cardStyles.elevated 
    : variant === 'bordered'
    ? cardStyles.bordered
    : variant === 'interactive'
    ? cardStyles.interactive
    : cardStyles.base;

  const cardStyle: React.CSSProperties = {
    ...baseStyle,
    padding: paddingMap[padding],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant === 'interactive' && !onClick) return;
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = cardStyles.hover.boxShadow;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant === 'interactive' && !onClick) return;
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = baseStyle.boxShadow;
    }
  };

  const role = onClick ? 'button' : undefined;
  const tabIndex = onClick ? 0 : undefined;

  return (
    <div
      role={role}
      tabIndex={tabIndex}
      style={cardStyle}
      className={`card ${variant === 'interactive' ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </div>
  );
};

// Card sub-components for structured layouts
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <div
    style={{
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.neutral[200]}`,
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <div style={style} className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => (
  <div
    style={{
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTop: `1px solid ${colors.neutral[200]}`,
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);

export default Card;

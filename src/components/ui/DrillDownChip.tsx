/**
 * DrillDownChip Component
 * 
 * Quick navigation chips for related items
 * Allows users to quickly navigate to related resources
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { ChevronRight, ExternalLink } from 'lucide-react';

export interface DrillDownChipProps {
  label: string;
  value?: string | number;
  href: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  external?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  default: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[700],
    borderColor: colors.neutral[300],
    hoverBackground: colors.neutral[200],
  },
  primary: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    borderColor: colors.primary + '40',
    hoverBackground: colors.primary + '30',
  },
  success: {
    backgroundColor: colors.success[100],
    color: colors.success[700],
    borderColor: colors.success[300],
    hoverBackground: colors.success[200],
  },
  warning: {
    backgroundColor: colors.warning[100],
    color: colors.warning[700],
    borderColor: colors.warning[300],
    hoverBackground: colors.warning[200],
  },
};

export const DrillDownChip: React.FC<DrillDownChipProps> = ({
  label,
  value,
  href,
  icon,
  variant = 'default',
  external = false,
  onClick,
}) => {
  const navigate = useNavigate();
  const style = variantStyles[variant];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (external) {
      window.open(href, '_blank');
    } else {
      navigate(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: style.backgroundColor,
        color: style.color,
        border: `1px solid ${style.borderColor}`,
        borderRadius: borderRadius.full,
        fontSize: '12px',
        fontFamily: typography.body.fontFamily,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = style.hoverBackground;
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = style.backgroundColor;
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `2px solid ${colors.primary}`;
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
      }}
      tabIndex={0}
      role="button"
      aria-label={`${label}${value ? `: ${value}` : ''}. Click to view details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{label}</span>
      {value !== undefined && (
        <span style={{ fontWeight: 600 }}>{value}</span>
      )}
      {external ? (
        <ExternalLink size={12} />
      ) : (
        <ChevronRight size={12} />
      )}
    </div>
  );
};

/**
 * DrillDownChipGroup - Container for multiple chips
 */
export const DrillDownChipGroup: React.FC<{
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ children, title, className = '' }) => (
  <div className={`drill-down-chip-group ${className}`} style={{ marginTop: spacing.md }}>
    {title && (
      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
        {title}
      </div>
    )}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
      {children}
    </div>
  </div>
);

export default DrillDownChip;


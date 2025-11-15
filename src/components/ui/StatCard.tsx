/**
 * StatCard Component
 * 
 * Interactive stat card with drill-down capability
 * Converts static stat displays into clickable navigation elements
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '../../lib/theme';
import { ChevronRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  onClick?: () => void;
  href?: string;
  trend?: string;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  onClick,
  href,
  trend,
  icon,
  color = colors.primary,
  description,
  loading = false,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (loading) return;
    if (href) {
      navigate(href);
    } else if (onClick) {
      onClick();
    }
  };

  const isClickable = !!(onClick || href) && !loading;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={`stat-card ${className}`}
      style={{
        ...cardStyles.base,
        borderLeft: `4px solid ${color}`,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        padding: spacing.lg,
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = shadows.md;
          e.currentTarget.style.borderLeftWidth = '6px';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = shadows.sm;
          e.currentTarget.style.borderLeftWidth = '4px';
        }
      }}
      onMouseDown={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
      onMouseUp={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onFocus={(e) => {
        if (isClickable) {
          e.currentTarget.style.outline = `2px solid ${color}`;
          e.currentTarget.style.outlineOffset = '2px';
        }
      }}
      onBlur={(e) => {
        if (isClickable) {
          e.currentTarget.style.outline = 'none';
        }
      }}
      tabIndex={isClickable ? 0 : -1}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${label}: ${value}. ${description || 'Click to view details'}` : `${label}: ${value}`}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <div style={{ ...typography.label, color: colors.neutral[600], display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
          {label}
        </div>
        {isClickable && (
          <ChevronRight
            size={16}
            style={{
              color: colors.neutral[400],
              transition: 'all 0.2s ease',
            }}
            className="stat-card-chevron"
          />
        )}
      </div>

      <div style={{ ...typography.header, color: color, margin: 0, fontSize: '32px', fontWeight: 700 }}>
        {loading ? (
          <div
            style={{
              width: '60px',
              height: '32px',
              backgroundColor: colors.neutral[200],
              borderRadius: borderRadius.sm,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ) : (
          value
        )}
      </div>

      {trend && !loading && (
        <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
          {trend}
        </div>
      )}

      {description && !loading && (
        <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
          {description}
        </div>
      )}

      <style>{`
        .stat-card:hover .stat-card-chevron {
          transform: translateX(4px);
          color: ${color};
        }
        .stat-card:focus-visible {
          outline: 2px solid ${color};
          outline-offset: 2px;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};


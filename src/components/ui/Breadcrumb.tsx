import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing } from '../../lib/theme';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  const navigate = useNavigate();

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav 
      className={`breadcrumb ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.lg,
        padding: spacing.sm,
        backgroundColor: colors.neutral[50],
        borderRadius: '8px',
        border: `1px solid ${colors.neutral[200]}`
      }}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span 
              style={{ 
                color: colors.neutral[400], 
                fontSize: '14px',
                margin: `0 ${spacing.xs}`
              }}
            >
              ›
            </span>
          )}
          <div
            onClick={() => handleItemClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              cursor: item.path ? 'pointer' : 'default',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              color: item.path ? colors.primary : colors.neutral[600],
              ...typography.bodySmall,
              fontWeight: item.path ? 500 : 400
            }}
            onMouseEnter={(e) => {
              if (item.path) {
                e.currentTarget.style.backgroundColor = colors.primary + '10';
                e.currentTarget.style.color = colors.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (item.path) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.primary;
              }
            }}
          >
            {item.icon && (
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
            )}
            <span>{item.label}</span>
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;

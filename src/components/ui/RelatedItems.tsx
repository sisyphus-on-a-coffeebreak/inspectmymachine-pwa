/**
 * Related Items Panel Component
 * 
 * Displays related items for detail pages (e.g., Vehicle History, Recent Inspections, Previous Passes)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Link2, ChevronRight, ExternalLink } from 'lucide-react';

export interface RelatedItem {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  type?: string;
  icon?: React.ReactNode;
  external?: boolean;
  metadata?: Record<string, any>;
}

export interface RelatedItemsProps {
  title: string;
  items: RelatedItem[];
  emptyMessage?: string;
  variant?: 'default' | 'compact';
  maxItems?: number;
  className?: string;
}

export const RelatedItems: React.FC<RelatedItemsProps> = ({
  title,
  items,
  emptyMessage = 'No related items found',
  variant = 'default',
  maxItems = 5,
  className = '',
}) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <div
        className={`related-items ${className}`}
        style={{
          ...cardStyles.base,
          padding: variant === 'compact' ? spacing.md : spacing.lg,
        }}
      >
        <h3
          style={{
            ...typography.subheader,
            fontSize: variant === 'compact' ? '14px' : '16px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Link2 size={18} color={colors.primary} />
          {title}
        </h3>
        <p
          style={{
            ...typography.bodySmall,
            color: colors.neutral[500],
            margin: 0,
            textAlign: 'center',
            padding: spacing.md,
          }}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  const displayItems = items.slice(0, maxItems);

  return (
    <div
      className={`related-items ${className}`}
      style={{
        ...cardStyles.base,
        padding: variant === 'compact' ? spacing.md : spacing.lg,
      }}
    >
      <h3
        style={{
          ...typography.subheader,
          fontSize: variant === 'compact' ? '14px' : '16px',
          color: colors.neutral[900],
          margin: 0,
          marginBottom: spacing.md,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Link2 size={18} color={colors.primary} />
        {title}
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}
      >
        {displayItems.map((item) => {
          const content = (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'white',
                border: `1px solid ${colors.neutral[200]}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[50];
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (item.external) {
                    window.open(item.path, '_blank');
                  } else {
                    navigate(item.path);
                  }
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View ${item.title}`}
            >
              {item.icon && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    fontSize: '18px',
                  }}
                >
                  {item.icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: variant === 'compact' ? '12px' : '14px',
                    fontWeight: 600,
                    color: colors.neutral[900],
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </div>
                {item.subtitle && (
                  <div
                    style={{
                      ...typography.bodySmall,
                      fontSize: '11px',
                      color: colors.neutral[600],
                      margin: 0,
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.subtitle}
                  </div>
                )}
                {item.type && (
                  <div
                    style={{
                      ...typography.bodySmall,
                      fontSize: '10px',
                      color: colors.neutral[500],
                      margin: 0,
                      marginTop: '2px',
                    }}
                  >
                    {item.type}
                  </div>
                )}
              </div>
              {item.external ? (
                <ExternalLink size={14} color={colors.neutral[400]} />
              ) : (
                <ChevronRight size={14} color={colors.neutral[400]} />
              )}
            </div>
          );

          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={`${item.title} (opens in new tab)`}
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
            >
              {content}
            </div>
          );
        })}
      </div>

      {items.length > maxItems && (
        <div
          style={{
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.neutral[200]}`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              ...typography.bodySmall,
              fontSize: '11px',
              color: colors.neutral[500],
              margin: 0,
            }}
          >
            +{items.length - maxItems} more item{items.length - maxItems > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default RelatedItems;


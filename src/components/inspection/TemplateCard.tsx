/**
 * Template Card Component
 * 
 * Displays an inspection template as a card.
 * Supports two variants:
 * - compact: For recent templates section (smaller, horizontal)
 * - full: For all templates list (larger, vertical)
 */

import React from 'react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../ui/button';
import { FileText, Clock } from 'lucide-react';
import type { InspectionTemplate } from '@/types/inspection';

interface TemplateCardProps {
  template: InspectionTemplate & { questionCount?: number; category?: string };
  variant: 'compact' | 'full';
  lastUsed?: Date;
  onClick: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  variant,
  lastUsed,
  onClick,
}) => {
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (variant === 'compact') {
    return (
      <div
        style={{
          ...cardStyles.base,
          cursor: 'pointer',
          border: `2px solid ${colors.primary}`,
          backgroundColor: colors.primary + '05',
          transition: 'all 0.2s',
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}30`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.sm }}>
          <div style={{ flex: 1 }}>
            <h4
              style={{
                ...typography.subheader,
                fontSize: '16px',
                marginBottom: spacing.xs,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {template.name || 'Unnamed Template'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
              <FileText size={14} color={colors.neutral[500]} />
              <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {template.questionCount || 0} questions
              </span>
            </div>
            {lastUsed && (
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                Used {formatRelativeTime(lastUsed)}
              </div>
            )}
          </div>
          <FileText size={24} color={colors.primary} />
        </div>
        <Button variant="primary" size="sm" style={{ width: '100%' }}>
          Use Again
        </Button>
      </div>
    );
  }

  // Full variant
  return (
      <div
        style={{
          ...cardStyles.base,
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: `2px solid ${colors.neutral[200]}`,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.neutral[200];
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.sm }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              ...typography.header,
              fontSize: '18px',
              marginBottom: spacing.xs,
            }}
          >
            {template.name || 'Unnamed Template'}
          </h3>
          {template.category && (
            <span
              style={{
                ...typography.caption,
                color: colors.primary,
                backgroundColor: colors.primary + '15',
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: borderRadius.sm,
                display: 'inline-block',
                marginBottom: spacing.xs,
              }}
            >
              {template.category}
            </span>
          )}
        </div>
        <FileText size={24} color={colors.primary} />
      </div>

      {template.description && (
        <p
          style={{
            ...typography.bodySmall,
            color: colors.neutral[600],
            marginBottom: spacing.md,
          }}
        >
          {template.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <FileText size={16} color={colors.neutral[500]} />
          <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            {template.questionCount || 0} questions
          </span>
        </div>
        {lastUsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <Clock size={16} color={colors.neutral[500]} />
            <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              Last used: {formatRelativeTime(lastUsed)}
            </span>
          </div>
        )}
      </div>

      <Button variant="primary" style={{ width: '100%' }}>
        Use Template
      </Button>
    </div>
  );
};





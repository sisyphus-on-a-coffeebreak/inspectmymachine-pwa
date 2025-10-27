import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './button';
import { Breadcrumb } from './Breadcrumb';
import type { BreadcrumbItem } from './Breadcrumb';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onBack?: () => void;
  backPath?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
  onBack,
  backPath,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div 
      className={`page-header ${className}`}
      style={{
        marginBottom: spacing.xl,
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}

      {/* Header Content */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: spacing.lg
      }}>
        <div style={{ flex: 1 }}>
          {/* Back Button */}
          <div style={{ marginBottom: spacing.md }}>
            <Button
              variant="secondary"
              onClick={handleBack}
              icon="⬅️"
              size="sm"
            >
              Back
            </Button>
          </div>

          {/* Title and Subtitle */}
          <div>
            <h1 style={{
              ...typography.header,
              fontSize: '28px',
              color: colors.neutral[900],
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              {icon && <span style={{ fontSize: '24px' }}>{icon}</span>}
              {title}
            </h1>
            {subtitle && (
              <p style={{
                ...typography.body,
                color: colors.neutral[600],
                marginTop: spacing.xs,
                marginBottom: 0
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

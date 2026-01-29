import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, responsiveSpacing, shadows } from '../../lib/theme';
import { Button } from './button';
import { Breadcrumb } from './Breadcrumb';
import type { BreadcrumbItem } from './Breadcrumb';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode; // Allow ReactNode to support complex subtitles
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
      className={`page-header page-header-responsive ${className}`}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
        boxShadow: shadows.md,
        border: `1px solid ${colors.neutral[200]}`,
        boxSizing: 'border-box',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}

      {/* Header Content */}
      <div className="page-header-content">
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
              fontSize: 'clamp(20px, 5vw, 28px)',
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
              <div style={{
                ...typography.body,
                color: colors.neutral[600],
                marginTop: spacing.xs,
                marginBottom: 0
              }}>
                {subtitle}
              </div>
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

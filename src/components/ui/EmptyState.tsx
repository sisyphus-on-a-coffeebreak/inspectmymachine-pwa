import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    icon?: string;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}) => {
  return (
    <div
      className={className}
      style={{
        padding: spacing.xl,
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        fontFamily: typography.body.fontFamily,
        margin: spacing.lg
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: spacing.lg }}>
        {icon}
      </div>
      
      <h3 style={{ 
        ...typography.header,
        fontSize: '24px',
        color: colors.neutral[800],
        marginBottom: spacing.sm
      }}>
        {title}
      </h3>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[600],
        maxWidth: '400px',
        margin: '0 auto',
        marginBottom: spacing.xl
      }}>
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap' }}>
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              icon={action.icon}
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'secondary'}
              onClick={secondaryAction.onClick}
              icon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = false,
  variant = 'error',
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: colors.status.warning + '10',
          borderColor: colors.status.warning,
          iconColor: colors.status.warning,
          icon: '⚠️'
        };
      case 'info':
        return {
          backgroundColor: colors.primary + '10',
          borderColor: colors.primary,
          iconColor: colors.primary,
          icon: 'ℹ️'
        };
      default:
        return {
          backgroundColor: colors.status.critical + '10',
          borderColor: colors.status.critical,
          iconColor: colors.status.critical,
          icon: '❌'
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className={className}
      style={{
        padding: spacing.lg,
        backgroundColor: variantStyles.backgroundColor,
        border: `2px solid ${variantStyles.borderColor}`,
        borderRadius: '12px',
        textAlign: 'center',
        fontFamily: typography.body.fontFamily,
        margin: spacing.md
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>
        {variantStyles.icon}
      </div>
      
      <h3 style={{ 
        ...typography.subheader, 
        color: variantStyles.iconColor,
        marginBottom: spacing.sm
      }}>
        {title}
      </h3>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[700],
        marginBottom: spacing.lg
      }}>
        {message}
      </p>
      
      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
        {showRetry && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon="🔄"
          >
            Try Again
          </Button>
        )}
        
        {showDismiss && onDismiss && (
          <Button
            variant="secondary"
            onClick={onDismiss}
            icon="✕"
          >
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
};



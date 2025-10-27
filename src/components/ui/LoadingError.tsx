import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './Button';

interface LoadingErrorProps {
  resource: string;
  error?: any;
  onRetry?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export const LoadingError: React.FC<LoadingErrorProps> = ({
  resource,
  error,
  onRetry,
  onRefresh,
  className = ''
}) => {
  const getErrorMessage = () => {
    if (!error) {
      return 'An unknown error occurred.';
    }
    
    // Handle different error types safely
    if (typeof error === 'object' && error !== null) {
      if (error?.response?.status === 404) {
        return `No ${resource.toLowerCase()} found.`;
      }
      
      if (error?.response?.status === 403) {
        return `You don't have permission to view ${resource.toLowerCase()}.`;
      }
      
      if (error?.code === 'ERR_NETWORK') {
        return `Unable to load ${resource.toLowerCase()}. Please check your connection.`;
      }
      
      if (error?.response?.status === 419) {
        return `Session expired. Please refresh the page and try again.`;
      }
    }
    
    return `Failed to load ${resource.toLowerCase()}. Please try again.`;
  };

  return (
    <div
      className={className}
      style={{
        padding: spacing.xl,
        backgroundColor: colors.neutral[50],
        border: `1px solid ${colors.neutral[300]}`,
        borderRadius: '12px',
        textAlign: 'center',
        fontFamily: typography.body.fontFamily,
        margin: spacing.lg
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: spacing.lg }}>
        📄
      </div>
      
      <h3 style={{ 
        ...typography.subheader,
        color: colors.neutral[800],
        marginBottom: spacing.sm
      }}>
        Unable to Load {resource}
      </h3>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[600],
        marginBottom: spacing.xl
      }}>
        {getErrorMessage()}
      </p>
      
      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon="🔄"
          >
            Retry
          </Button>
        )}
        
        {onRefresh && (
          <Button
            variant="secondary"
            onClick={onRefresh}
            icon="🔄"
          >
            Refresh Page
          </Button>
        )}
      </div>
    </div>
  );
};


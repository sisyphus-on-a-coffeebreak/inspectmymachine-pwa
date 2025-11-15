import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './button';
import { getUserFriendlyError } from '../../lib/errorHandling';

interface NetworkErrorProps {
  error?: unknown;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
  context?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  error,
  onRetry,
  onGoBack,
  className = '',
  context
}) => {
  const friendlyError = getUserFriendlyError(error, context);

  return (
    <div
      className={className}
      style={{
        padding: spacing.xl,
        backgroundColor: colors.status.critical + '10',
        border: `2px solid ${colors.status.critical}`,
        borderRadius: '16px',
        textAlign: 'center',
        fontFamily: typography.body.fontFamily,
        margin: spacing.lg
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>
        🌐
      </div>
      
      <h2 style={{ 
        ...typography.header,
        fontSize: '24px',
        color: friendlyError.severity === 'error' ? colors.error[600] 
          : friendlyError.severity === 'warning' ? colors.warning[600]
          : colors.primary,
        marginBottom: spacing.sm
      }}>
        {friendlyError.title}
      </h2>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[700],
        maxWidth: '500px',
        margin: '0 auto',
        marginBottom: spacing.xl
      }}>
        {friendlyError.message}
      </p>
      
      {error && error.response && (
        <details style={{ 
          marginBottom: spacing.lg,
          textAlign: 'left',
          backgroundColor: colors.neutral[100],
          padding: spacing.md,
          borderRadius: '8px',
          border: `1px solid ${colors.neutral[300]}`
        }}>
          <summary style={{ 
            cursor: 'pointer', 
            fontWeight: 600,
            color: colors.neutral[800],
            marginBottom: spacing.sm
          }}>
            Technical Details
          </summary>
          <div style={{ 
            fontSize: '12px', 
            color: colors.neutral[600],
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflow: 'auto'
          }}>
            {JSON.stringify({
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: error.config?.url,
              method: error.config?.method?.toUpperCase(),
              timestamp: new Date().toISOString()
            }, null, 2)}
          </div>
        </details>
      )}
      
      <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap' }}>
        {onRetry && friendlyError.showRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon="🔄"
          >
            Try Again
          </Button>
        )}
        
        {onGoBack && friendlyError.showGoBack && (
          <Button
            variant="secondary"
            onClick={onGoBack}
            icon="⬅️"
          >
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};

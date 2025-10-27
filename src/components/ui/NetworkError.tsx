import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from './button';

interface NetworkErrorProps {
  error?: any;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  error,
  onRetry,
  onGoBack,
  className = ''
}) => {
  const getErrorMessage = () => {
    if (!error) return 'Unable to connect to the server.';
    
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          return 'Your session has expired. Please log in again.';
        case 403:
          return 'You don\'t have permission to access this resource.';
        case 404:
          return 'The requested resource was not found.';
        case 422:
          return 'The data you provided is invalid. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again later.';
        default:
          return `Server error (${status}). Please try again.`;
      }
    }
    
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your internet connection.';
    }
    
    if (error.code === 'ERR_TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    
    return 'Something went wrong. Please try again.';
  };

  const getErrorTitle = () => {
    if (!error) return 'Connection Error';
    
    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) {
        return 'Request Error';
      } else if (status >= 500) {
        return 'Server Error';
      }
    }
    
    if (error.code === 'ERR_NETWORK') {
      return 'Network Error';
    }
    
    return 'Error';
  };

  const shouldShowGoBack = () => {
    if (!error) return true;
    
    if (error.response) {
      const status = error.response.status;
      return status === 404 || status === 403;
    }
    
    return error.code === 'ERR_NETWORK';
  };

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
        color: colors.status.critical,
        marginBottom: spacing.sm
      }}>
        {getErrorTitle()}
      </h2>
      
      <p style={{ 
        ...typography.body, 
        color: colors.neutral[700],
        maxWidth: '500px',
        margin: '0 auto',
        marginBottom: spacing.xl
      }}>
        {getErrorMessage()}
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
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon="🔄"
          >
            Try Again
          </Button>
        )}
        
        {onGoBack && shouldShowGoBack() && (
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

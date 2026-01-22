/**
 * Gate Pass Error Boundary
 * 
 * Specialized error boundary for the Gate Pass module
 * Catches React errors and displays a user-friendly fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, cardStyles } from '@/lib/theme';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GatePassErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Log error using logger
    try {
      logger.error('GatePassErrorBoundary caught an error', error, 'GatePassErrorBoundary');
      if (errorInfo?.componentStack) {
        logger.error('GatePassErrorBoundary component stack', new Error(errorInfo.componentStack), 'GatePassErrorBoundary');
      }
    } catch (logError) {
      // Fallback if logger itself fails
      try {
        console.error('GatePassErrorBoundary caught an error:', error?.message || String(error));
        if (errorInfo?.componentStack) {
          console.error('Component stack:', errorInfo.componentStack);
        }
      } catch {
        // Last resort - silent fail to prevent infinite error loops
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            backgroundColor: colors.neutral[50],
          }}
        >
          <div
            style={{
              ...cardStyles.base,
              maxWidth: '600px',
              textAlign: 'center',
              padding: spacing.xl,
            }}
          >
            <AlertTriangle
              size={64}
              style={{
                color: colors.error[500],
                marginBottom: spacing.lg,
              }}
            />
            <h2
              style={{
                ...typography.header,
                fontSize: '24px',
                color: colors.error[700],
                marginBottom: spacing.md,
              }}
            >
              Gate Pass Error
            </h2>
            <p
              style={{
                ...typography.body,
                color: colors.neutral[600],
                marginBottom: spacing.lg,
              }}
            >
              Something went wrong in the Gate Pass module. Please try refreshing the page or go back to the dashboard.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginBottom: spacing.lg,
                  padding: spacing.md,
                  backgroundColor: colors.neutral[100],
                  borderRadius: borderRadius.md,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: colors.neutral[700],
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', marginBottom: spacing.sm }}>
                  Error Details (Development Only)
                </summary>
                <div style={{ marginTop: spacing.sm }}>
                  <strong>Error:</strong>{' '}
                  {(() => {
                    try {
                      if (this.state.error instanceof Error) {
                        return this.state.error.message || this.state.error.name || 'Unknown error';
                      }
                      if (typeof this.state.error === 'string') {
                        return this.state.error;
                      }
                      return String(this.state.error);
                    } catch {
                      return 'Error details unavailable';
                    }
                  })()}
                  {this.state.errorInfo && (
                    <div style={{ marginTop: spacing.sm }}>
                      <strong>Component Stack:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', marginTop: spacing.xs }}>
                        {this.state.errorInfo.componentStack || 'No stack trace available'}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            <div
              style={{
                display: 'flex',
                gap: spacing.md,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="primary"
                onClick={this.handleReset}
                icon={<RefreshCw size={16} />}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  window.location.href = '/app/gate-pass';
                }}
                icon={<Home size={16} />}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component with navigation support
export const GatePassErrorBoundaryWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <GatePassErrorBoundary
      onReset={() => {
        // Optionally navigate back on reset
        navigate('/app/gate-pass');
      }}
    >
      {children}
    </GatePassErrorBoundary>
  );
};

export default GatePassErrorBoundary;


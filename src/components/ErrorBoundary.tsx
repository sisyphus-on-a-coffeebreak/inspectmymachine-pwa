/**
 * ErrorBoundary Component
 * 
 * Catches React errors and displays a fallback UI
 * Prevents entire app from crashing on component errors
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../lib/theme';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
    // Log error to error reporting service (e.g., Sentry)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
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
              Something went wrong
            </h2>
            <p
              style={{
                ...typography.body,
                color: colors.neutral[600],
                marginBottom: spacing.lg,
              }}
            >
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
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
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <div style={{ marginTop: spacing.sm }}>
                      <strong>Component Stack:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', marginTop: spacing.xs }}>
                        {this.state.errorInfo.componentStack}
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
                  window.location.href = '/dashboard';
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

export default ErrorBoundary;

/**
 * SessionTimeout Component
 * 
 * Session timeout warning with auto-refresh option
 * Warns users before session expires
 */

import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

export interface SessionTimeoutProps {
  warningTime?: number; // seconds before expiry to show warning
  onRefresh?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const SessionTimeout: React.FC<SessionTimeoutProps> = ({
  warningTime = 300, // 5 minutes default
  onRefresh,
  onDismiss,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Check session expiry from localStorage or API
    const checkSession = () => {
      // Try to get session expiry from token or API
      // For now, we'll use a mock implementation
      // In production, this should check the actual session expiry
      const sessionExpiry = localStorage.getItem('session_expiry');
      
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry, 10);
        const now = Date.now();
        const remaining = Math.floor((expiryTime - now) / 1000);

        if (remaining > 0 && remaining <= warningTime) {
          setTimeRemaining(remaining);
          setIsVisible(true);
        } else if (remaining <= 0) {
          // Session expired - redirect to login
          window.location.href = '/login?expired=true';
        } else {
          setIsVisible(false);
        }
      }
    };

    const interval = setInterval(checkSession, 1000);
    checkSession();

    return () => clearInterval(interval);
  }, [warningTime, dismissed]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Default: refresh the page
      window.location.reload();
    }
    setIsVisible(false);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || dismissed || timeRemaining === null) {
    return null;
  }

  return (
    <div
      className={`session-timeout ${className}`}
      style={{
        position: 'fixed',
        bottom: spacing.xl,
        right: spacing.xl,
        zIndex: 10000,
        maxWidth: '400px',
        ...cardStyles.base,
        backgroundColor: colors.warning[50],
        border: `2px solid ${colors.warning[500]}`,
        padding: spacing.md,
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideInUp 0.3s ease-out',
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
        <AlertTriangle size={24} color={colors.warning[700]} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              ...typography.subheader,
              fontSize: '14px',
              fontWeight: 600,
              color: colors.warning[900],
              marginBottom: spacing.xs,
            }}
          >
            Session Expiring Soon
          </div>
          <div
            style={{
              ...typography.bodySmall,
              fontSize: '12px',
              color: colors.warning[700],
              marginBottom: spacing.sm,
            }}
          >
            Your session will expire in{' '}
            <strong style={{ fontSize: '16px', color: colors.warning[900] }}>
              {formatTime(timeRemaining)}
            </strong>
            . Refresh to continue.
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              onClick={handleRefresh}
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.warning[500],
                color: 'white',
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '12px',
                fontFamily: typography.body.fontFamily,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.warning[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.warning[500];
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${colors.primary}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <RefreshCw size={14} />
              Refresh Session
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: spacing.xs,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                color: colors.warning[700],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.warning[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Dismiss warning"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SessionTimeout;


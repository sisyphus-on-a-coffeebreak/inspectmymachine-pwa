/**
 * AnomalyAlert Component
 * 
 * Alert banners for anomalies and critical issues
 * Supports different severity levels and actions
 */

import React from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { AlertTriangle, X, CheckCircle, Info, AlertCircle } from 'lucide-react';

export type AnomalySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AnomalyAlertProps {
  title: string;
  description?: string;
  severity: AnomalySeverity;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  dismissible?: boolean;
  className?: string;
}

const severityConfig = {
  info: {
    icon: Info,
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    textColor: colors.primary,
    iconColor: colors.primary,
  },
  warning: {
    icon: AlertTriangle,
    backgroundColor: colors.warning[100],
    borderColor: colors.warning[500],
    textColor: colors.warning[700],
    iconColor: colors.warning[500],
  },
  error: {
    icon: AlertCircle,
    backgroundColor: colors.error[100],
    borderColor: colors.error[500],
    textColor: colors.error[700],
    iconColor: colors.error[500],
  },
  critical: {
    icon: AlertTriangle,
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
    textColor: colors.error[900],
    iconColor: colors.error[500],
  },
};

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({
  title,
  description,
  severity,
  onDismiss,
  actions = [],
  dismissible = true,
  className = '',
}) => {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={`anomaly-alert anomaly-alert-${severity} ${className}`}
      style={{
        ...cardStyles.base,
        backgroundColor: config.backgroundColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        marginBottom: spacing.md,
      }}
      role="alert"
      aria-live={severity === 'critical' ? 'assertive' : 'polite'}
    >
      <Icon
        size={20}
        style={{
          color: config.iconColor,
          flexShrink: 0,
          marginTop: '2px',
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...typography.subheader,
            fontSize: '14px',
            fontWeight: 600,
            color: config.textColor,
            marginBottom: description ? spacing.xs : 0,
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              ...typography.bodySmall,
              fontSize: '12px',
              color: config.textColor,
              opacity: 0.9,
            }}
          >
            {description}
          </div>
        )}
        {actions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              marginTop: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor:
                    action.variant === 'primary'
                      ? config.borderColor
                      : 'transparent',
                  color:
                    action.variant === 'primary'
                      ? 'white'
                      : config.textColor,
                  border: `1px solid ${config.borderColor}`,
                  borderRadius: borderRadius.sm,
                  fontSize: '12px',
                  fontFamily: typography.body.fontFamily,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${colors.primary}`;
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            color: config.textColor,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/**
 * AnomalyAlertBanner - Full-width banner variant
 */
export const AnomalyAlertBanner: React.FC<AnomalyAlertProps> = (props) => (
  <AnomalyAlert
    {...props}
    className={`${props.className || ''} anomaly-alert-banner`}
  />
);

export default AnomalyAlert;


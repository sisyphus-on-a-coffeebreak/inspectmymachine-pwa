/**
 * Status Card Component
 * 
 * Displays API health, data freshness, and system status indicators
 * Used across modules to show telemetry and alert users to issues
 */

import React from 'react';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import { AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './button';
import { logger } from '@/lib/logger';

export type StatusLevel = 'healthy' | 'warning' | 'error' | 'offline' | 'stale';

export interface StatusCardProps {
  title: string;
  status: StatusLevel;
  message?: string;
  lastUpdated?: Date | number | string;
  onRefresh?: () => void | Promise<void>;
  refreshLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const statusConfig: Record<StatusLevel, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  healthy: {
    icon: <CheckCircle2 size={20} />,
    color: colors.success[500],
    bgColor: hexToRgba(colors.success[500], 0.1),
    borderColor: hexToRgba(colors.success[500], 0.3),
    textColor: colors.success[500],
  },
  warning: {
    icon: <AlertCircle size={20} />,
    color: colors.warning[500],
    bgColor: hexToRgba(colors.warning[500], 0.1),
    borderColor: hexToRgba(colors.warning[500], 0.3),
    textColor: colors.warning[500],
  },
  error: {
    icon: <XCircle size={20} />,
    color: colors.error[500],
    bgColor: hexToRgba(colors.error[500], 0.1),
    borderColor: hexToRgba(colors.error[500], 0.3),
    textColor: colors.error[500],
  },
  offline: {
    icon: <WifiOff size={20} />,
    color: colors.neutral[500],
    bgColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    textColor: colors.neutral[700],
  },
  stale: {
    icon: <Clock size={20} />,
    color: colors.warning[500],
    bgColor: hexToRgba(colors.warning[500], 0.1),
    borderColor: hexToRgba(colors.warning[500], 0.3),
    textColor: colors.warning[500],
  },
};

function formatLastUpdated(lastUpdated: Date | number | string): string {
  const date = typeof lastUpdated === 'string' 
    ? new Date(lastUpdated) 
    : typeof lastUpdated === 'number' 
    ? new Date(lastUpdated) 
    : lastUpdated;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function StatusCard({
  title,
  status,
  message,
  lastUpdated,
  onRefresh,
  refreshLabel = 'Refresh',
  children,
  className = '',
}: StatusCardProps) {
  const config = statusConfig[status] || statusConfig.healthy; // Fallback to healthy if invalid status
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    try {
      setRefreshing(true);
      await onRefresh();
    } catch (error) {
      logger.error('Refresh failed', error, 'StatusCard');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div
      className={className}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        boxShadow: shadows.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: message || lastUpdated || children ? spacing.sm : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div style={{ color: config.color, display: 'flex', alignItems: 'center' }}>
            {config.icon}
          </div>
          <h3
            style={{
              ...typography.body,
              fontWeight: 600,
              color: config.textColor,
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            icon={<RefreshCw size={16} />}
          >
            {refreshLabel}
          </Button>
        )}
      </div>
      {message && (
        <p
          style={{
            ...typography.bodySmall,
            color: config.textColor,
            margin: `0 0 ${lastUpdated || children ? spacing.xs : 0} 0`,
          }}
        >
          {message}
        </p>
      )}
      {lastUpdated && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginTop: spacing.xs,
          }}
        >
          <Clock size={14} style={{ color: config.textColor, opacity: 0.7 }} />
          <span
            style={{
              ...typography.bodySmall,
              color: config.textColor,
              opacity: 0.7,
            }}
          >
            Updated {formatLastUpdated(lastUpdated)}
          </span>
        </div>
      )}
      {children && (
        <div style={{ marginTop: spacing.sm }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to track API endpoint health
 */
export function useApiHealth(endpoint: string, options?: {
  interval?: number;
  onStatusChange?: (status: StatusLevel) => void;
}) {
  const [status, setStatus] = React.useState<StatusLevel>('healthy');
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const checkHealth = React.useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus('healthy');
        setError(null);
      } else if (response.status >= 500) {
        setStatus('error');
        setError(`Server error: ${response.status}`);
      } else if (response.status === 404) {
        setStatus('warning');
        setError('Endpoint not found');
      } else {
        setStatus('warning');
        setError(`Unexpected status: ${response.status}`);
      }
      setLastChecked(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('error');
        setError('Request timeout');
      } else if (!navigator.onLine) {
        setStatus('offline');
        setError('No internet connection');
      } else {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
      setLastChecked(new Date());
    }
  }, [endpoint]);

  React.useEffect(() => {
    checkHealth();
    const interval = options?.interval || 30000; // Default 30s
    const timer = setInterval(checkHealth, interval);
    return () => clearInterval(timer);
  }, [checkHealth, options?.interval]);

  React.useEffect(() => {
    if (options?.onStatusChange) {
      options.onStatusChange(status);
    }
  }, [status, options]);

  return { status, lastChecked, error, checkHealth };
}


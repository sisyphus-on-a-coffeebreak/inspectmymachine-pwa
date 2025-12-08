/**
 * Real-time Indicator Component
 * 
 * Shows connection status and last update time for real-time dashboard
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, typography } from '../../lib/theme';

export interface RealtimeIndicatorProps {
  isConnected: boolean;
  isConnecting: boolean;
  lastUpdate: Date | null;
  onReconnect?: () => void;
  compact?: boolean;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  isConnecting,
  lastUpdate,
  onReconnect,
  compact = false,
}) => {
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: '12px',
        backgroundColor: isConnected ? colors.success[50] : colors.neutral[100],
        border: `1px solid ${isConnected ? colors.success[200] : colors.neutral[300]}`,
      }}>
        {isConnecting ? (
          <RefreshCw 
            size={12} 
            style={{ 
              color: colors.warning[500],
              animation: 'spin 1s linear infinite',
            }} 
          />
        ) : isConnected ? (
          <Wifi size={12} style={{ color: colors.success[500] }} />
        ) : (
          <WifiOff size={12} style={{ color: colors.neutral[500] }} />
        )}
        <span style={{
          fontSize: '11px',
          color: isConnected ? colors.success[700] : colors.neutral[600],
          fontWeight: 500,
        }}>
          {isConnecting ? 'Connecting...' : isConnected ? 'Live' : 'Offline'}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      backgroundColor: isConnected ? colors.success[50] : colors.neutral[50],
      borderRadius: '8px',
      border: `1px solid ${isConnected ? colors.success[200] : colors.neutral[200]}`,
    }}>
      {isConnecting ? (
        <>
          <RefreshCw 
            size={16} 
            style={{ 
              color: colors.warning[500],
              animation: 'spin 1s linear infinite',
            }} 
          />
          <span style={{ ...typography.bodySmall, color: colors.warning[700] }}>
            Connecting to real-time updates...
          </span>
        </>
      ) : isConnected ? (
        <>
          <Wifi size={16} style={{ color: colors.success[500] }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ ...typography.bodySmall, color: colors.success[700], fontWeight: 600 }}>
              Live Updates Active
            </span>
            {lastUpdate && (
              <span style={{ ...typography.bodySmall, fontSize: '11px', color: colors.neutral[600] }}>
                Last update: {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <WifiOff size={16} style={{ color: colors.neutral[500] }} />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
              Real-time updates unavailable
            </span>
            <span style={{ ...typography.bodySmall, fontSize: '11px', color: colors.neutral[600] }}>
              Using polling mode
            </span>
          </div>
          {onReconnect && (
            <button
              onClick={onReconnect}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Reconnect
            </button>
          )}
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RealtimeIndicator;
export { RealtimeIndicator };

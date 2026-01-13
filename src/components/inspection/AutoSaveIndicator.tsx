/**
 * Auto-Save Indicator Component
 * 
 * Shows the status of auto-save functionality:
 * - idle: Nothing shown
 * - saving: "💾 Saving..." with spinner
 * - saved: "💾 Saved X seconds/minutes ago" (updates live)
 * - error: "⚠️ Save failed. [Retry]" with retry button
 */

import React, { useEffect, useState } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Save, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  onRetry?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  onRetry,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago text every second
  useEffect(() => {
    if (status !== 'saved' || !lastSaved) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);

      if (diffSecs < 10) {
        setTimeAgo('just now');
      } else if (diffSecs < 60) {
        setTimeAgo(`${diffSecs} seconds ago`);
      } else if (diffMins === 1) {
        setTimeAgo('1 minute ago');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`);
      } else {
        setTimeAgo(lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [status, lastSaved]);

  if (status === 'idle') {
    return null;
  }

  if (status === 'saving') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          ...typography.bodySmall,
          color: colors.neutral[600],
        }}
      >
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Saving...</span>
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (status === 'saved') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          ...typography.bodySmall,
          color: colors.success,
        }}
      >
        <Save size={14} />
        <span>Auto-saved {timeAgo}</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          ...typography.bodySmall,
          color: colors.error,
        }}
      >
        <AlertCircle size={14} />
        <span>Save failed.</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: '12px',
            }}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  return null;
};










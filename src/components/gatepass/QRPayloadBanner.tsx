/**
 * QR Payload Banner
 * 
 * Displays a banner when legacy gate passes are missing QR payloads.
 * Provides retry/regenerate actions to fix the issue.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { AlertTriangle, RefreshCw, QrCode } from 'lucide-react';

export interface QRPayloadBannerProps {
  passId: string | number;
  passType: 'visitor' | 'vehicle';
  passNumber?: string;
  onRegenerate: () => Promise<void>;
  onRetry?: () => Promise<void>;
  className?: string;
}

export function QRPayloadBanner({
  passId,
  passType,
  passNumber,
  onRegenerate,
  onRetry,
  className = '',
}: QRPayloadBannerProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      await onRegenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate QR payload');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    try {
      setLoading(true);
      setError(null);
      await onRetry();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry');
    } finally {
      setLoading(false);
    }
  };

  const displayPassNumber = passNumber || `${passType === 'visitor' ? 'VP' : 'VM'}${String(passId).substring(0, 8).toUpperCase()}`;

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.warning[50],
        border: `1px solid ${colors.warning[200]}`,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
      }}
    >
      <AlertTriangle size={20} style={{ color: colors.warning[600], flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4
          style={{
            ...typography.body,
            fontWeight: 600,
            color: colors.warning[700],
            margin: `0 0 ${spacing.xs} 0`,
          }}
        >
          Missing QR Payload
        </h4>
        <p
          style={{
            ...typography.bodySmall,
            color: colors.warning[600],
            margin: `0 0 ${spacing.sm} 0`,
          }}
        >
          Gate Pass {displayPassNumber} is missing a verifiable QR payload. This may prevent QR code scanning and validation.
        </p>
        {error && (
          <p
            style={{
              ...typography.bodySmall,
              color: colors.error[600],
              margin: `0 0 ${spacing.sm} 0`,
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRegenerate}
            loading={loading}
            icon={<QrCode size={16} />}
          >
            Regenerate QR Payload
          </Button>
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              loading={loading}
              icon={<RefreshCw size={16} />}
            >
              Retry Sync
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


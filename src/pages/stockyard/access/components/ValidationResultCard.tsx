import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import type { GatePass } from '../gatePassTypes';
import { getPassDisplayName, getStatusLabel, getStatusColor, isExpired } from '../gatePassTypes';
import { colors, spacing, responsiveSpacing, typography, borderRadius } from '@/lib/theme';

/**
 * Map status color string to Badge variant
 */
function mapStatusColorToBadgeVariant(color: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const colorMap: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    green: 'success',
    yellow: 'warning',
    red: 'error',
    blue: 'info',
    gray: 'neutral',
  };
  return colorMap[color] || 'neutral';
}

interface ValidationResultCardProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  pass: GatePass | null;
  suggestedAction: 'entry' | 'exit' | null;
  errorMessage: string | null;
  onActionConfirm: (action: 'entry' | 'exit') => void;
  actionPending: boolean;
  onClear: () => void;
}

export const ValidationResultCard: React.FC<ValidationResultCardProps> = ({
  status,
  pass,
  suggestedAction,
  errorMessage,
  onActionConfirm,
  actionPending,
  onClear,
}) => {
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [loadingBorderColor, setLoadingBorderColor] = useState(colors.neutral[300]);

  // Flash animation on status change
  useEffect(() => {
    if (status === 'success') {
      setFlashColor(colors.success);
      setTimeout(() => setFlashColor(null), 300);
    } else if (status === 'error') {
      setFlashColor(colors.error);
      setTimeout(() => setFlashColor(null), 300);
    }
  }, [status]);

  // Pulse animation for loading state
  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setLoadingBorderColor(prev => 
          prev === colors.neutral[300] ? colors.primary[500] : colors.neutral[300]
        );
      }, 750);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Calculate time inside
  const getTimeInside = (pass: GatePass): string | null => {
    if (pass.status !== 'inside' || !pass.entry_time) {
      return null;
    }
    
    const entryTime = new Date(pass.entry_time);
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  // Format date/time
  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format valid until
  const formatValidUntil = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  // Empty state
  if (status === 'idle') {
    return (
      <div
        style={{
          padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
          backgroundColor: colors.neutral[50],
          border: `2px dashed ${colors.neutral[300]}`,
          borderRadius: borderRadius.lg,
          textAlign: 'center',
          color: colors.neutral[600],
        }}
      >
        <AlertCircle size={48} style={{ marginBottom: spacing.md, opacity: 0.5 }} />
        <div style={{ ...typography.body, fontWeight: 500 }}>
          Scan a QR code to begin
        </div>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div
        style={{
          padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
          backgroundColor: 'white',
          border: `2px solid ${loadingBorderColor}`,
          borderRadius: borderRadius.lg,
          textAlign: 'center',
          transition: 'border-color 0.75s ease-in-out',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>⏳</div>
        <div style={{ ...typography.body, fontWeight: 600, color: colors.neutral[700] }}>
          Validating...
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div
        style={{
          padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
          backgroundColor: 'white',
          border: `2px solid ${flashColor || colors.error}`,
          borderRadius: borderRadius.lg,
          transition: 'border-color 0.3s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
          <XCircle size={32} color={colors.error} />
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.subheader, color: colors.error, marginBottom: spacing.xs }}>
              Invalid Pass
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              {errorMessage || 'Pass not found or expired'}
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={onClear}
          style={{ width: '100%' }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Success state
  if (status === 'success' && pass) {
    const timeInside = getTimeInside(pass);

    return (
      <div
        style={{
          padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
          backgroundColor: 'white',
          border: `2px solid ${flashColor || colors.neutral[200]}`,
          borderRadius: borderRadius.lg,
          transition: 'border-color 0.3s',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.subheader, fontSize: 'clamp(18px, 4.5vw, 20px)', marginBottom: spacing.xs, color: colors.neutral[900] }}>
              {getPassDisplayName(pass)}
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.sm }}>
              {pass.pass_number}
            </div>
            <Badge
              variant={mapStatusColorToBadgeVariant(getStatusColor(pass.status))}
              size="md"
            >
              {getStatusLabel(pass.status)}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div style={{
          display: 'grid',
          gap: spacing.md,
          paddingTop: spacing.md,
          borderTop: `1px solid ${colors.neutral[200]}`,
          marginBottom: spacing.lg,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Purpose:</span>
            <span style={{ ...typography.body, fontWeight: 600, textTransform: 'capitalize' }}>
              {pass.purpose.replace('_', ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Valid until:</span>
            <span style={{ ...typography.body, fontWeight: 600 }}>
              {formatValidUntil(pass.valid_to)}
            </span>
          </div>
          {timeInside && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Time inside:</span>
              <span style={{ ...typography.body, fontWeight: 600, color: colors.primary[600] }}>
                <Clock size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
                {timeInside}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {suggestedAction ? (
          <Button
            variant="primary"
            onClick={() => onActionConfirm(suggestedAction)}
            disabled={actionPending}
            size="lg"
            style={{
              width: '100%',
              minHeight: '56px',
              fontSize: 'clamp(16px, 4vw, 18px)', // Responsive: 16px mobile, 18px desktop
              fontWeight: 700,
              backgroundColor: suggestedAction === 'entry' ? colors.success : colors.primary[600],
              marginBottom: spacing.md,
            }}
          >
            {actionPending ? 'Processing...' : (
              suggestedAction === 'entry' ? '✅ Confirm Entry' : '✅ Confirm Exit'
            )}
          </Button>
        ) : (
          <div style={{
            backgroundColor: colors.neutral[100],
            padding: spacing.md,
            borderRadius: borderRadius.md,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}>
            <div style={{ ...typography.body, color: colors.neutral[700] }}>
              {isExpired(pass) 
                ? 'This pass has expired'
                : 'No action available for this pass'}
            </div>
          </div>
        )}

        {/* Clear Button */}
        <Button
          variant="secondary"
          onClick={onClear}
          style={{ width: '100%' }}
        >
          Clear & Scan Another
        </Button>
      </div>
    );
  }

  return null;
};


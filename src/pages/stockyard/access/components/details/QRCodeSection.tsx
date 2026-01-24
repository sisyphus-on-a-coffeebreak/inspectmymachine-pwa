/**
 * QR Code Section Component
 * Displays QR code and access code for a gate pass
 */

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { colors, typography, spacing, borderRadius, cardStyles } from '@/lib/theme';
import type { GatePass } from '../../gatePassTypes';

interface QRCodeSectionProps {
  pass: GatePass;
  qrCodeDataUrl: string | null;
  qrLoading: boolean;
  statusTheme: string;
  onEnlarge: () => void;
}

export const QRCodeSection: React.FC<QRCodeSectionProps> = ({
  pass,
  qrCodeDataUrl,
  qrLoading,
  statusTheme,
  onEnlarge,
}) => {
  return (
    <div style={{
      ...cardStyles.base,
      padding: spacing.xl,
      marginTop: spacing.lg,
      textAlign: 'center',
      borderTop: `4px solid ${statusTheme}`,
    }}>
      <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
        QR Code
      </h2>
      
      {qrLoading ? (
        <div style={{ padding: spacing.xl }}>
          <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>⏳</div>
          <div style={{ color: colors.neutral[600] }}>Generating QR code...</div>
        </div>
      ) : qrCodeDataUrl ? (
        <div>
          <div
            onClick={onEnlarge}
            style={{
              display: 'inline-block',
              cursor: 'pointer',
              padding: spacing.md,
              backgroundColor: 'white',
              borderRadius: borderRadius.md,
              border: `2px solid ${colors.neutral[200]}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.borderColor = statusTheme;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = colors.neutral[200];
            }}
          >
            <img
              src={qrCodeDataUrl}
              alt="QR Code"
              style={{
                width: '200px',
                height: '200px',
                display: 'block',
              }}
            />
            <div style={{
              marginTop: spacing.sm,
              fontSize: '0.75rem',
              color: colors.neutral[600],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
            }}>
              <Maximize2 size={12} />
              Tap to enlarge
            </div>
          </div>
          
          <div style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
            display: 'inline-block',
          }}>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Access Code
            </div>
            <div style={{ ...typography.subheader, fontFamily: 'monospace', letterSpacing: '2px' }}>
              {pass.access_code}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: spacing.xl, color: colors.neutral[600] }}>
          QR code not available
        </div>
      )}
    </div>
  );
};



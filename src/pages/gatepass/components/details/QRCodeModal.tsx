/**
 * QR Code Modal Component
 * Full-screen modal for viewing QR code
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import type { GatePass } from '../../gatePassTypes';

interface QRCodeModalProps {
  pass: GatePass;
  qrCodeDataUrl: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  pass,
  qrCodeDataUrl,
  onClose,
}) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        cursor: 'pointer',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: spacing.xl,
          borderRadius: borderRadius.xl,
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        <img
          src={qrCodeDataUrl}
          alt="QR Code"
          style={{
            width: '300px',
            height: '300px',
            maxWidth: '100%',
          }}
        />
        <div style={{ marginTop: spacing.md, ...typography.body, fontWeight: 600 }}>
          Pass #{pass.pass_number}
        </div>
        <div style={{ marginTop: spacing.xs, ...typography.bodySmall, color: colors.neutral[600], fontFamily: 'monospace', letterSpacing: '2px' }}>
          {pass.access_code}
        </div>
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};


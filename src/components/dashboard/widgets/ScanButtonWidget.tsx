/**
 * Scan Button Widget
 * 
 * Large scan button for guards to quickly access QR scanning
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography } from '../../../lib/theme';
import { QrCode } from 'lucide-react';

export function ScanButtonWidget() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/app/gate-pass/scan')}
      style={{
        width: '100%',
        padding: spacing.xl * 2,
        backgroundColor: colors.primary,
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
    >
      <QrCode size={64} />
      <span style={{ ...typography.header, fontSize: '24px', fontWeight: 700 }}>
        Scan Pass
      </span>
      <span style={{ ...typography.body, fontSize: '14px', opacity: 0.9 }}>
        Tap to scan QR code
      </span>
    </button>
  );
}



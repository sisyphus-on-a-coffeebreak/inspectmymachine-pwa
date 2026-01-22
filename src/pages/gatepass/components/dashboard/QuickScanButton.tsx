/**
 * QuickScanButton Component
 * 
 * Large, prominent button for guards to scan passes
 * Used in Guard dashboard
 */

import React from 'react';
import { QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, borderRadius } from '../../../../lib/theme';
import { Button } from '../../../../components/ui/button';

export const QuickScanButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={() => navigate('/app/gate-pass/quick-validation')}
      icon={<QrCode size={32} />}
      style={{
        width: '100%',
        minHeight: '120px',
        fontSize: '24px',
        fontWeight: 700,
        backgroundColor: colors.primary[500],
        border: `3px solid ${colors.primary[600]}`,
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.xl,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 99, 235, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 99, 235, 0.3)';
      }}
    >
      <QrCode size={48} />
      <span>📷 SCAN PASS</span>
    </Button>
  );
};













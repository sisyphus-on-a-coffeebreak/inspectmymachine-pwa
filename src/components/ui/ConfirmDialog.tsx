import React, { useState } from 'react';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'critical' | 'warning';
  requireTyping?: boolean;
  confirmationText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  confirmVariant = 'critical',
  requireTyping = false,
  confirmationText = 'DELETE',
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsLoading(false);
      setTypedText('');
    }
  };

  const canConfirm = requireTyping ? typedText === confirmationText : true;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borderRadius.full,
              backgroundColor: confirmVariant === 'critical' ? colors.error[50] : colors.warning[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle
              size={24}
              color={confirmVariant === 'critical' ? colors.error[500] : colors.warning[500]}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ ...typography.subheader, margin: 0, marginBottom: spacing.xs }}>{title}</h3>
            <p style={{ ...typography.body, color: colors.neutral[600], margin: 0 }}>{description}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
              color: colors.neutral[500],
            }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Confirmation Input */}
        {requireTyping && (
          <div style={{ marginBottom: spacing.lg }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.sm }}>
              Type <strong>{confirmationText}</strong> to confirm:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={confirmationText}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '16px',
              }}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant === 'critical' ? 'critical' : 'warning'}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

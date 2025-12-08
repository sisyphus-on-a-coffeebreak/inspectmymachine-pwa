/**
 * ConfirmDialog Component
 * 
 * A simple confirmation dialog for destructive actions
 * Replaces window.confirm with a more accessible, styled alternative
 */

import React from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';
import { colors, spacing } from '../../lib/theme';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        padding: spacing.md,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: spacing.md,
        }}>
          {variant === 'destructive' && (
            <div style={{
              flexShrink: 0,
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: colors.error[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle size={24} color={colors.error[500]} />
            </div>
          )}
          <p style={{
            margin: 0,
            color: colors.neutral[700],
            lineHeight: 1.5,
            fontSize: '14px',
          }}>
            {message}
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: spacing.md,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'critical' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};


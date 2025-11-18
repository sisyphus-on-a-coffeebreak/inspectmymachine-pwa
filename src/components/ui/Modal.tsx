import React, { useEffect } from 'react';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import { Button } from './button';
import { X } from 'lucide-react';

export interface ModalProps {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const sizeMap = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '600px' },
  lg: { maxWidth: '800px' },
  xl: { maxWidth: '1200px' },
  full: { maxWidth: '95vw' },
};

/**
 * Reusable Modal component for dialogs, confirmations, and forms
 * Replaces window.confirm and window.alert with accessible, styled UI
 */
export function Modal({
  title,
  children,
  onClose,
  size = 'md',
  footer,
  className = '',
}: ModalProps) {
  const showCloseButton = true;
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={className}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: borderRadius.lg,
          boxShadow: shadows.lg,
          width: '100%',
          ...sizeMap[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${colors.neutral[200]}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.lg,
              borderBottom: `1px solid ${colors.neutral[200]}`,
            }}
          >
            {title && (
              <h2 id="modal-title" style={{ ...typography.heading, margin: 0 }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing.sm,
                  borderRadius: borderRadius.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.neutral[600],
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.neutral[100];
                  e.currentTarget.style.color = colors.neutral[900];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.neutral[600];
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.lg,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: spacing.lg,
              borderTop: `1px solid ${colors.neutral[200]}`,
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmation Modal - Replaces window.confirm
 */
export interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'warning' | 'critical';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      // Confirm action failed
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const confirmVariant = variant === 'critical' ? 'critical' : variant === 'warning' ? 'warning' : 'primary';

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ ...typography.body, color: colors.neutral[700], margin: 0 }}>
        {message}
      </p>
    </Modal>
  );
}

/**
 * Hook to use confirmation modals
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = React.useState<{
    show: boolean;
    props: Omit<ConfirmModalProps, 'onConfirm' | 'onCancel' | 'onClose'>;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = React.useCallback(
    (props: Omit<ConfirmModalProps, 'onConfirm' | 'onCancel' | 'onClose'>): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          show: true,
          props,
          resolve,
        });
      });
    },
    [],
  );

  const handleConfirm = React.useCallback(async () => {
    if (!confirmState) return;
    confirmState.resolve(true);
    await confirmState.props.onConfirm?.();
    setConfirmState(null);
  }, [confirmState]);

  const handleCancel = React.useCallback(() => {
    if (!confirmState) return;
    confirmState.resolve(false);
    confirmState.props.onCancel?.();
    setConfirmState(null);
  }, [confirmState]);

  const handleClose = React.useCallback(() => {
    if (!confirmState) return;
    confirmState.resolve(false);
    setConfirmState(null);
  }, [confirmState]);

  const ConfirmComponent = confirmState ? (
    <ConfirmModal
      {...confirmState.props}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  ) : null;

  return { confirm, ConfirmComponent };
}


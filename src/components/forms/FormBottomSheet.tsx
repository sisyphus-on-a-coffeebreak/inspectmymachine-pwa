/**
 * Form Bottom Sheet Component
 * 
 * Wrapper for forms that can be displayed in a bottom sheet (mobile) or modal (desktop)
 * Supports auto-save and smart defaults
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomSheet } from '../ui/BottomSheet';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { X } from 'lucide-react';

export interface FormBottomSheetProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  showCloseButton?: boolean;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}

export const FormBottomSheet: React.FC<FormBottomSheetProps> = ({
  title,
  subtitle,
  isOpen,
  onClose,
  children,
  footer,
  maxHeight = '90vh',
  showCloseButton = true,
  onSave,
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  hasUnsavedChanges = false,
}) => {
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };

  return (
    <>
      <BottomSheet
        title={title}
        isOpen={isOpen}
        onClose={handleClose}
      >
        {subtitle && (
          <p
            style={{
              fontSize: '14px',
              color: colors.neutral[600],
              margin: `0 0 ${spacing.md} 0`,
              padding: `0 ${spacing.lg}`,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Form Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.lg,
            maxHeight: maxHeight,
          }}
        >
          {children}
        </div>

        {/* Footer with Actions */}
        {(onSave || onCancel || footer) && (
          <div
            style={{
              padding: spacing.lg,
              borderTop: `1px solid ${colors.neutral[200]}`,
              backgroundColor: colors.neutral[50],
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            {footer || (
              <>
                {onCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    style={{
                      padding: `${spacing.sm} ${spacing.lg}`,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      background: 'white',
                      color: colors.neutral[700],
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    {cancelLabel}
                  </button>
                )}
                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    style={{
                      padding: `${spacing.sm} ${spacing.lg}`,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      background: colors.primary,
                      color: 'white',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    {isLoading ? 'Saving...' : saveLabel}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <BottomSheet
          title="Unsaved Changes"
          isOpen={showUnsavedWarning}
          onClose={() => setShowUnsavedWarning(false)}
        >
          <div style={{ padding: spacing.lg }}>
            <p style={{ marginBottom: spacing.lg, color: colors.neutral[700] }}>
              You have unsaved changes. Are you sure you want to close?
            </p>
            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUnsavedWarning(false)}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  background: 'white',
                  color: colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmClose}
                style={{
                  padding: `${spacing.sm} ${spacing.lg}`,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  background: colors.error[500],
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
};





/**
 * Form Wrapper Component
 * 
 * Wraps forms to support both full-page and bottom-sheet display modes
 * Automatically switches based on viewport and query parameters
 */

import React from 'react';
import { useFormDisplayMode } from '../../hooks/useFormDisplayMode';
import { FormBottomSheet } from './FormBottomSheet';
import { colors, spacing } from '../../lib/theme';

export interface FormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  preferBottomSheet?: boolean;
  defaultMode?: 'fullpage' | 'bottomsheet';
}

export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  subtitle,
  children,
  footer,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  isLoading,
  hasUnsavedChanges,
  preferBottomSheet = true,
  defaultMode = 'fullpage',
}) => {
  const { mode, isBottomSheet, isFullPage, closeBottomSheet } = useFormDisplayMode({
    defaultMode,
    preferBottomSheet,
  });

  // Full page mode - render as regular page
  if (isFullPage) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: spacing.xl,
        minHeight: '100dvh',
        backgroundColor: colors.neutral[50],
      }}>
        {children}
      </div>
    );
  }

  // Bottom sheet mode
  return (
    <FormBottomSheet
      title={title}
      subtitle={subtitle}
      isOpen={isBottomSheet}
      onClose={closeBottomSheet}
      footer={footer}
      onSave={onSave}
      onCancel={onCancel}
      saveLabel={saveLabel}
      cancelLabel={cancelLabel}
      isLoading={isLoading}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      {children}
    </FormBottomSheet>
  );
};





/**
 * Form Wrapper Component
 * 
 * Wraps forms to support both full-page and bottom-sheet display modes
 * Automatically switches based on viewport and query parameters
 */

import React from 'react';
import { useFormDisplayMode } from '../../hooks/useFormDisplayMode';
import { FormBottomSheet } from './FormBottomSheet';
import { colors, spacing, responsiveSpacing } from '../../lib/theme';

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
        width: '100%',
        maxWidth: '800px', // CSS handles responsive max-width via PageContainer
        margin: '0 auto',
        padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
        minHeight: '100dvh',
        backgroundColor: colors.neutral[50],
        boxSizing: 'border-box',
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





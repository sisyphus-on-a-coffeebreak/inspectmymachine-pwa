/**
 * Enhanced Form Field Component
 * 
 * Provides real-time validation feedback with visual indicators and contextual help
 */

import React from 'react';
import { Input } from './input';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  isValid?: boolean;
  helperText?: string;
  helpText?: string; // Contextual help with examples
  helpExamples?: string[]; // Example values
  children?: React.ReactNode;
  showValidationIcon?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  touched = false,
  isValid,
  helperText,
  helpText,
  helpExamples,
  children,
  showValidationIcon = true,
}) => {
  const showError = touched && error;
  const showValid = touched && !error && isValid !== false;
  const showHelper = !showError && helperText;
  const hasHelp = helpText || helpExamples;

  return (
    <div style={{ marginBottom: spacing.md }}>
      <label
        style={{
          ...typography.label,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          marginBottom: spacing.xs,
          color: showError ? colors.error[600] : colors.neutral[700],
        }}
      >
        <span>{label}</span>
        {required && <span style={{ color: colors.error[500] }}>*</span>}
        {hasHelp && (
          <Tooltip
            content={
              <div style={{ maxWidth: '250px' }}>
                {helpText && <div style={{ marginBottom: helpExamples ? spacing.xs : 0 }}>{helpText}</div>}
                {helpExamples && helpExamples.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '4px', opacity: 0.8 }}>
                      Examples:
                    </div>
                    {helpExamples.map((example, idx) => (
                      <div key={idx} style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.9 }}>
                        • {example}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <HelpCircle
              size={14}
              style={{
                color: colors.neutral[500],
                cursor: 'help',
                flexShrink: 0,
              }}
            />
          </Tooltip>
        )}
      </label>
      
      <div style={{ position: 'relative' }}>
        {children}
        
        {/* Validation Icon */}
        {showValidationIcon && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            {showError && (
              <XCircle size={18} color={colors.error[500]} style={{ display: 'block' }} />
            )}
            {showValid && (
              <CheckCircle2 size={18} color={colors.success[500]} style={{ display: 'block' }} />
            )}
            {!touched && required && (
              <AlertCircle size={18} color={colors.neutral[400]} style={{ display: 'block', opacity: 0.5 }} />
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <div
          style={{
            color: colors.error[600],
            fontSize: '0.75rem',
            marginTop: spacing.xs,
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.xs,
          }}
        >
          <XCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {showHelper && (
        <div
          style={{
            color: colors.neutral[600],
            fontSize: '0.75rem',
            marginTop: spacing.xs,
            display: 'flex',
            alignItems: 'flex-start',
            gap: spacing.xs,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.6 }} />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

export interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  touched?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  error,
  touched = false,
  helperText,
  disabled = false,
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      touched={touched}
      helperText={helperText}
      showValidationIcon={false}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        style={{
          width: '100%',
          padding: spacing.sm,
          border: `1px solid ${error && touched ? colors.error[500] : colors.neutral[300]}`,
          borderRadius: borderRadius.md,
          fontSize: '0.875rem',
          fontFamily: 'inherit',
          backgroundColor: disabled ? colors.neutral[50] : 'white',
          color: colors.neutral[700],
          resize: 'vertical',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = colors.primary;
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error && touched ? colors.error[500] : colors.neutral[300];
        }}
      />
    </FormField>
  );
};

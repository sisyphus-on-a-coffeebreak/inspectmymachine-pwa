/**
 * MaskedInput Component
 * 
 * Standalone input component with masking support
 * Can be used directly in forms without FormField wrapper
 */

import React from 'react';
import { useInputMask } from '../../hooks/useInputMask';
import { colors, spacing, borderRadius } from '../../lib/theme';

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  mask: 'phone' | 'phone-international' | 'id' | string;
  value: string;
  onChange: (value: string, unmaskedValue: string) => void;
  label?: string;
  error?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  label,
  error,
  className = '',
  style,
  ...props
}) => {
  const maskProps = useInputMask({
    mask,
    value,
    onChange,
    placeholder: props.placeholder,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    border: `1px solid ${error ? colors.critical : colors.neutral[300]}`,
    borderRadius: borderRadius.md,
    fontSize: '16px',
    color: colors.neutral[900],
    backgroundColor: props.disabled ? colors.neutral[100] : 'white',
    transition: 'border-color 0.2s ease',
    ...style,
  };

  return (
    <div style={{ marginBottom: spacing.md }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: spacing.xs,
          color: colors.neutral[700],
        }}>
          {label}
          {props.required && <span style={{ color: colors.critical }}> *</span>}
        </label>
      )}
      <input
        {...props}
        value={maskProps.value}
        onChange={maskProps.onChange}
        placeholder={maskProps.placeholder}
        style={inputStyle}
        className={className}
        aria-invalid={!!error}
        aria-describedby={error ? `${label}-error` : undefined}
      />
      {error && (
        <div
          id={label ? `${label}-error` : undefined}
          style={{
            color: colors.critical,
            fontSize: '12px',
            marginTop: spacing.xs,
          }}
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
};





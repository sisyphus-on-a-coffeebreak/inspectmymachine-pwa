import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius, formStyles } from '../../lib/theme';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  success?: string;
  disabled?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  success,
  disabled = false,
  hint,
  icon,
  className = ''
}) => {
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    ...formStyles.input,
    paddingLeft: icon ? '48px' : spacing.md,
    borderColor: error ? colors.critical : success ? colors.success : focused ? colors.primary : colors.neutral[300],
    backgroundColor: disabled ? colors.neutral[100] : 'white',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'all 0.2s ease'
  };

  const containerStyle = {
    position: 'relative' as const,
    width: '100%',
    marginBottom: spacing.md
  };

  const labelStyle = {
    ...formStyles.label,
    color: error ? colors.critical : colors.neutral[700],
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs
  };

  const iconStyle = {
    position: 'absolute' as const,
    left: spacing.md,
    top: '50%',
    transform: 'translateY(-50%)',
    color: focused ? colors.primary : colors.neutral[500],
    fontSize: '18px',
    zIndex: 1
  };

  const errorStyle = {
    ...formStyles.error,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs
  };

  const successStyle = {
    ...formStyles.success,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs
  };

  const hintStyle = {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    fontSize: '12px'
  };

  return (
    <div style={containerStyle} className={className}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: colors.critical }}>*</span>}
      </label>
      
      <div style={{ position: 'relative' }}>
        {icon && <div style={iconStyle}>{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          style={inputStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={error ? 'form-error' : success ? 'form-success' : ''}
          aria-invalid={!!error}
          aria-describedby={error ? `${label}-error` : hint ? `${label}-hint` : undefined}
        />
      </div>

      {error && (
        <div id={`${label}-error`} style={errorStyle} role="alert">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {success && !error && (
        <div id={`${label}-success`} style={successStyle}>
          <span>✅</span>
          {success}
        </div>
      )}

      {hint && !error && !success && (
        <div id={`${label}-hint`} style={hintStyle}>
          {hint}
        </div>
      )}
    </div>
  );
};

// Specialized form fields
export const PhoneField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="tel" 
    icon="📱"
    placeholder="+91-XXXXX-XXXXX"
  />
);

export const EmailField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="email" 
    icon="✉️"
    placeholder="user@company.com"
  />
);

export const DateField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="date" 
    icon="📅"
  />
);

export const TimeField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="time" 
    icon="🕐"
  />
);

// Textarea field
interface TextareaFieldProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  rows = 3,
  resize = 'vertical',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  const textareaStyle = {
    ...formStyles.input,
    minHeight: `${rows * 24}px`,
    resize,
    fontFamily: 'inherit',
    lineHeight: 1.5
  };

  return (
    <FormField
      {...props}
      type="text"
      // @ts-ignore - Custom textarea handling
      render={(inputProps) => (
        <textarea
          {...inputProps}
          style={textareaStyle}
          rows={rows}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
    />
  );
};

export default FormField;

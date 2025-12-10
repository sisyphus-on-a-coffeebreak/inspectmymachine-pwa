import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Phone, Mail, Calendar, Clock } from 'lucide-react';
import { colors, typography, spacing, borderRadius, formStyles } from '../../lib/theme';
import { useInputMask } from '../../hooks/useInputMask';
import { getAutocompleteForField, type AutocompleteValue } from '../../lib/autocomplete-utils';
import { validateField, type ValidationRule, debounceValidation } from '../../lib/form-validation';
import { InputWithHistory } from './InputWithHistory';
import { VoiceInputButton } from './VoiceInputButton';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string; // External error (from form validation)
  success?: string;
  disabled?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  mask?: 'phone' | 'phone-international' | 'id' | string; // Input masking
  name?: string; // Field name for autocomplete detection
  autocomplete?: AutocompleteValue | 'off'; // Explicit autocomplete value
  validationRules?: ValidationRule[]; // Real-time validation rules
  validateOnChange?: boolean; // Validate as user types (default: true)
  validateOnBlur?: boolean; // Validate on blur (default: true)
  enableHistory?: boolean; // Enable input history suggestions (default: false)
  historyStorageKey?: string; // Storage key for history (required if enableHistory is true)
  enableVoiceInput?: boolean; // Enable voice input button (default: false)
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error: externalError,
  success,
  disabled = false,
  hint,
  icon,
  className = '',
  mask,
  name,
  autocomplete,
  validationRules = [],
  validateOnChange = true,
  validateOnBlur = true,
  enableHistory = false,
  historyStorageKey,
  enableVoiceInput = false, // Enable voice input button
}) => {
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>();
  const [hasBlurred, setHasBlurred] = useState(false);
  
  // Determine autocomplete value
  const autocompleteValue = autocomplete !== undefined 
    ? autocomplete 
    : getAutocompleteForField({ type, label, name, autocomplete });

  // Build validation rules
  const allRules: ValidationRule[] = [
    ...(required ? [{ type: 'required' as const }] : []),
    ...validationRules,
  ];

  // Real-time validation function
  const performValidation = useCallback((val: string, shouldValidate: boolean) => {
    if (!shouldValidate || allRules.length === 0) {
      setInternalError(undefined);
      return;
    }

    const result = validateField(val, allRules, !hasBlurred && validateOnBlur);
    setInternalError(result.isValid ? undefined : result.error);
  }, [allRules, hasBlurred, validateOnBlur]);

  // Debounced validation for onChange
  const debouncedValidation = useCallback(
    debounceValidation((val: string) => {
      if (validateOnChange && hasBlurred) {
        performValidation(val, true);
      }
    }, 300),
    [validateOnChange, hasBlurred, performValidation]
  );

  // Validate on value change (if validateOnChange is enabled and field has been blurred)
  useEffect(() => {
    if (validateOnChange && hasBlurred && allRules.length > 0) {
      debouncedValidation(value);
    }
  }, [value, validateOnChange, hasBlurred, debouncedValidation, allRules.length]);

  // Use external error if provided, otherwise use internal validation error
  const error = externalError || internalError;
  
  // Use input mask if provided
  const maskProps = mask ? useInputMask({
    mask,
    value,
    onChange: (masked, unmasked) => {
      // Pass the masked value to onChange for display, but store unmasked internally
      onChange(masked);
    },
    placeholder,
  }) : null;

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
    marginBottom: spacing.lg
  };

  const labelStyle = {
    ...formStyles.label,
    color: error ? colors.critical : colors.neutral[700],
    marginBottom: spacing.xs,
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
    fontSize: '24px',
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
    color: colors.neutral[600], // Improved contrast (7:1 ratio) for accessibility
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
        {enableVoiceInput && type === 'text' && (
          <div style={{
            position: 'absolute',
            right: spacing.sm,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
          }}>
            <VoiceInputButton
              onTranscript={(transcript) => {
                onChange(transcript);
              }}
              size="sm"
              variant="ghost"
            />
          </div>
        )}
        {enableHistory && historyStorageKey && !mask ? (
          <InputWithHistory
            type={type}
            value={value}
            onChange={(newValue) => {
              onChange(newValue);
            }}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            name={name}
            historyOptions={{
              storageKey: historyStorageKey,
              maxItems: 10,
              minLength: 2,
            }}
            onSelectSuggestion={(selectedValue) => {
              onChange(selectedValue);
            }}
            style={{
              ...inputStyle,
              paddingLeft: icon ? '48px' : spacing.md,
              paddingRight: enableVoiceInput ? '56px' : inputStyle.paddingRight, // 44px button + 12px gap
            }}
            className={error ? 'form-error' : success ? 'form-success' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${label}-error` : hint ? `${label}-hint` : undefined}
          />
        ) : (
          <input
            type={type}
            value={maskProps ? maskProps.value : value}
            onChange={maskProps ? maskProps.onChange : (e) => onChange(e.target.value)}
            placeholder={maskProps ? maskProps.placeholder : placeholder}
            required={required}
            disabled={disabled}
            name={name}
            autoComplete={autocompleteValue}
            style={{
              ...inputStyle,
              paddingRight: enableVoiceInput ? '56px' : inputStyle.paddingRight, // 44px button + 12px gap
              // Ensure native date/time pickers work on mobile
              ...(type === 'date' || type === 'time' || type === 'datetime-local' ? {
                touchAction: 'manipulation',
                WebkitAppearance: 'none',
              } : {}),
            }}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              setHasBlurred(true);
              if (validateOnBlur && allRules.length > 0) {
                performValidation(e.target.value, true);
              }
            }}
            className={error ? 'form-error' : success ? 'form-success' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${label}-error` : hint ? `${label}-hint` : undefined}
          />
        )}
      </div>

      {error && (
        <div id={`${label}-error`} style={errorStyle} role="alert" aria-live="polite">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div id={`${label}-success`} style={successStyle} aria-live="polite">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{success}</span>
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
export const PhoneField: React.FC<Omit<FormFieldProps, 'type' | 'mask' | 'validationRules'>> = (props) => (
  <FormField 
    {...props} 
    type="tel" 
    mask="phone"
    icon={<Phone size={24} aria-hidden="true" />}
    validationRules={[
      { type: 'phone', message: 'Please enter a valid 10-digit phone number' },
      ...(props.required ? [] : []), // Required is already handled by FormField
    ]}
  />
);

export const EmailField: React.FC<Omit<FormFieldProps, 'type' | 'validationRules'>> = (props) => (
  <FormField 
    {...props} 
    type="email" 
    icon={<Mail size={24} aria-hidden="true" />}
    placeholder="user@company.com"
    validationRules={[
      { type: 'email', message: 'Please enter a valid email address' },
    ]}
  />
);

export const IDField: React.FC<Omit<FormFieldProps, 'type' | 'mask'>> = (props) => (
  <FormField 
    {...props} 
    type="text" 
    mask="id"
    placeholder="XXX-XXX-XXXX"
  />
);

export const EmailFieldAlt: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="email" 
    icon={<Mail size={18} aria-hidden="true" />}
    placeholder="user@company.com"
  />
);

export const DateField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="date" 
    icon={<Calendar size={24} aria-hidden="true" />}
  />
);

export const TimeField: React.FC<Omit<FormFieldProps, 'type'>> = (props) => (
  <FormField 
    {...props} 
    type="time" 
    icon={<Clock size={24} aria-hidden="true" />}
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

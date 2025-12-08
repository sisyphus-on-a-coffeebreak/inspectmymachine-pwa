/**
 * Form Validation Utilities
 * 
 * Provides validation functions for common form field types
 * Used for real-time validation feedback
 */

export type ValidationRule = 
  | { type: 'required'; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'phone'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; value: RegExp | string; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'custom'; validator: (value: string) => string | null };

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a value against a single rule
 */
function validateRule(value: string, rule: ValidationRule): string | null {
  const trimmedValue = value.trim();

  switch (rule.type) {
    case 'required':
      if (!trimmedValue) {
        return rule.message || 'This field is required';
      }
      break;

    case 'email':
      if (trimmedValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
        return rule.message || 'Please enter a valid email address';
      }
      break;

    case 'phone':
      const cleanPhone = trimmedValue.replace(/\D/g, '');
      if (trimmedValue && cleanPhone.length !== 10) {
        return rule.message || 'Phone number must be 10 digits';
      }
      if (trimmedValue && cleanPhone.length === 10) {
        const phoneNumber = parseInt(cleanPhone, 10);
        if (phoneNumber < 6000000000 || phoneNumber > 9999999999) {
          return rule.message || 'Please enter a valid phone number';
        }
      }
      break;

    case 'minLength':
      if (trimmedValue && trimmedValue.length < rule.value) {
        return rule.message || `Must be at least ${rule.value} characters`;
      }
      break;

    case 'maxLength':
      if (trimmedValue && trimmedValue.length > rule.value) {
        return rule.message || `Must be at most ${rule.value} characters`;
      }
      break;

    case 'pattern':
      const regex = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value;
      if (trimmedValue && !regex.test(trimmedValue)) {
        return rule.message || 'Invalid format';
      }
      break;

    case 'min':
      const numValue = parseFloat(trimmedValue);
      if (trimmedValue && (!isNaN(numValue) && numValue < rule.value)) {
        return rule.message || `Value must be at least ${rule.value}`;
      }
      break;

    case 'max':
      const maxValue = parseFloat(trimmedValue);
      if (trimmedValue && (!isNaN(maxValue) && maxValue > rule.value)) {
        return rule.message || `Value must be at most ${rule.value}`;
      }
      break;

    case 'custom':
      return rule.validator(trimmedValue);
  }

  return null;
}

/**
 * Validate a value against multiple rules
 * Returns the first error found, or null if all validations pass
 */
export function validateField(
  value: string,
  rules: ValidationRule[],
  validateOnBlur = false
): ValidationResult {
  // If validateOnBlur is true and value is empty, don't validate yet
  if (validateOnBlur && !value.trim()) {
    return { isValid: true };
  }

  for (const rule of rules) {
    const error = validateRule(value, rule);
    if (error) {
      return { isValid: false, error };
    }
  }

  return { isValid: true };
}

/**
 * Get validation rules for common field types
 */
export function getValidationRulesForType(
  type: string,
  required = false,
  label = ''
): ValidationRule[] {
  const rules: ValidationRule[] = [];

  if (required) {
    rules.push({ type: 'required' });
  }

  switch (type) {
    case 'email':
      rules.push({ type: 'email' });
      break;

    case 'tel':
      rules.push({ type: 'phone' });
      break;

    case 'password':
      rules.push({ type: 'minLength', value: 8, message: 'Password must be at least 8 characters' });
      break;

    case 'number':
      // Number validation is handled by input type
      break;
  }

  return rules;
}

/**
 * Debounce validation to avoid too frequent updates
 */
export function debounceValidation<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}





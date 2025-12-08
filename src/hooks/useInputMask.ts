/**
 * useInputMask Hook
 * 
 * Provides input masking functionality for phone numbers, ID numbers, and other formatted inputs
 * Lightweight alternative to react-input-mask
 */

import { useState, useCallback, useEffect } from 'react';

export type MaskType = 'phone' | 'phone-international' | 'id' | 'custom';

export interface UseInputMaskOptions {
  mask: MaskType | string; // 'phone', 'phone-international', 'id', or custom pattern like 'XXX-XXX-XXXX'
  value?: string;
  onChange?: (value: string, unmaskedValue: string) => void;
  placeholder?: string;
}

/**
 * Phone number mask: (XXX) XXX-XXXX or XXX-XXX-XXXX
 */
function applyPhoneMask(value: string, international = false): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (international) {
    // International format: +XX XXX XXX XXXX
    if (digits.length <= 2) return digits ? `+${digits}` : '';
    if (digits.length <= 5) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    if (digits.length <= 12) return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 12)}`;
  }
  
  // Indian format: (XXX) XXX-XXXX or XXX-XXX-XXXX (10 digits)
  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * ID number mask: XXX-XXX-XXXX or similar
 */
function applyIDMask(value: string): string {
  // Remove all non-alphanumeric
  const alphanumeric = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  if (alphanumeric.length === 0) return '';
  if (alphanumeric.length <= 3) return alphanumeric;
  if (alphanumeric.length <= 6) return `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3)}`;
  if (alphanumeric.length <= 10) return `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 6)}-${alphanumeric.slice(6, 10)}`;
  return `${alphanumeric.slice(0, 3)}-${alphanumeric.slice(3, 6)}-${alphanumeric.slice(6, 10)}`;
}

/**
 * Custom mask pattern: X = letter/digit, 9 = digit, A = letter
 * Example: 'XXX-999-XXXX' or '99-99-9999'
 */
function applyCustomMask(value: string, pattern: string): string {
  const chars = value.split('');
  let result = '';
  let charIndex = 0;
  
  for (let i = 0; i < pattern.length && charIndex < chars.length; i++) {
    const patternChar = pattern[i];
    const inputChar = chars[charIndex];
    
    if (patternChar === 'X') {
      // Accept any alphanumeric
      if (/[A-Za-z0-9]/.test(inputChar)) {
        result += inputChar.toUpperCase();
        charIndex++;
      } else {
        // Skip invalid character
        charIndex++;
        i--; // Stay on current pattern position
      }
    } else if (patternChar === '9') {
      // Accept only digits
      if (/\d/.test(inputChar)) {
        result += inputChar;
        charIndex++;
      } else {
        charIndex++;
        i--;
      }
    } else if (patternChar === 'A') {
      // Accept only letters
      if (/[A-Za-z]/.test(inputChar)) {
        result += inputChar.toUpperCase();
        charIndex++;
      } else {
        charIndex++;
        i--;
      }
    } else {
      // Literal character (dash, space, etc.)
      result += patternChar;
    }
  }
  
  return result;
}

export function useInputMask({ mask, value: initialValue = '', onChange, placeholder }: UseInputMaskOptions) {
  const [maskedValue, setMaskedValue] = useState(initialValue);
  const [unmaskedValue, setUnmaskedValue] = useState('');

  // Extract unmasked value from masked value
  const getUnmaskedValue = useCallback((masked: string): string => {
    if (mask === 'phone' || mask === 'phone-international') {
      return masked.replace(/\D/g, '');
    } else if (mask === 'id') {
      return masked.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    } else if (typeof mask === 'string') {
      // Custom pattern
      return masked.replace(/[^A-Za-z0-9]/g, '');
    }
    return masked;
  }, [mask]);

  // Apply mask to value
  const applyMask = useCallback((unmasked: string): string => {
    if (mask === 'phone') {
      return applyPhoneMask(unmasked, false);
    } else if (mask === 'phone-international') {
      return applyPhoneMask(unmasked, true);
    } else if (mask === 'id') {
      return applyIDMask(unmasked);
    } else if (typeof mask === 'string') {
      return applyCustomMask(unmasked, mask);
    }
    return unmasked;
  }, [mask]);

  // Update when initial value changes (but only if it's different from current masked value)
  useEffect(() => {
    const unmasked = getUnmaskedValue(initialValue);
    const masked = applyMask(unmasked);
    if (masked !== maskedValue) {
      setMaskedValue(masked);
      setUnmaskedValue(unmasked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]); // Only depend on initialValue to avoid infinite loops

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const unmasked = getUnmaskedValue(inputValue);
    const masked = applyMask(unmasked);
    
    setMaskedValue(masked);
    setUnmaskedValue(unmasked);
    
    if (onChange) {
      onChange(masked, unmasked);
    }
  }, [applyMask, getUnmaskedValue, onChange]);

  // Get placeholder based on mask type
  const getPlaceholder = useCallback((): string => {
    if (placeholder) return placeholder;
    
    if (mask === 'phone') {
      return '(XXX) XXX-XXXX';
    } else if (mask === 'phone-international') {
      return '+XX XXX XXX XXXX';
    } else if (mask === 'id') {
      return 'XXX-XXX-XXXX';
    } else if (typeof mask === 'string') {
      return mask;
    }
    return '';
  }, [mask, placeholder]);

  return {
    value: maskedValue,
    unmaskedValue,
    onChange: handleChange,
    placeholder: getPlaceholder(),
  };
}


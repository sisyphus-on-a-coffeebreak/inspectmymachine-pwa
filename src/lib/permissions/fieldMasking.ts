/**
 * Field Masking
 * 
 * Applies data masking rules to sensitive fields based on user permissions.
 * Supports multiple masking strategies: full, partial, hash, redact.
 */

import type { DataMaskingRule, MaskType } from './types';
import type { User } from '../users';
import { hasCapability } from './evaluator';

/**
 * Mask a field value based on mask type
 * @param value - The value to mask
 * @param maskType - The type of masking to apply
 * @returns The masked value
 */
export function maskField(value: any, maskType: MaskType): any {
  if (value == null || value === '') {
    return value;
  }
  
  const strValue = String(value);
  
  switch (maskType) {
    case 'none':
      // No masking
      return value;
      
    case 'full':
      // Completely mask the value
      return '****';
      
    case 'partial':
      // Show first and last character, mask middle
      if (strValue.length <= 3) {
        return '***';
      }
      const first = strValue.substring(0, 1);
      const last = strValue.substring(strValue.length - 1);
      const middleLength = Math.min(strValue.length - 2, 8);
      const middle = '*'.repeat(middleLength);
      return `${first}${middle}${last}`;
      
    case 'hash':
      // Show hash representation
      return `#${simpleHash(strValue)}`;
      
    case 'redact':
      // Show redaction message
      return '[REDACTED]';
      
    default:
      console.warn(`Unknown mask type: ${maskType}`);
      return value;
  }
}

/**
 * Apply masking rules to an object
 * @param data - The data object to mask
 * @param rules - Array of masking rules to apply
 * @param user - The user viewing the data
 * @returns The masked data object
 */
export function applyDataMasking(
  data: any,
  rules: DataMaskingRule[],
  user: User
): any {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }
  
  if (!rules || rules.length === 0) {
    return data;
  }
  
  const masked = { ...data };
  
  for (const rule of rules) {
    // Skip if field doesn't exist in data
    if (masked[rule.field] === undefined) {
      continue;
    }
    
    // Check if user should see unmasked value
    let shouldMask = true;
    
    // Check role-based visibility
    if (rule.visible_to_roles && rule.visible_to_roles.includes(user.role)) {
      shouldMask = false;
    }
    
    // Check capability-based visibility
    if (rule.visible_with_capability && shouldMask) {
      const hasCap = hasCapability(
        user,
        rule.visible_with_capability.module,
        rule.visible_with_capability.action
      );
      if (hasCap) {
        shouldMask = false;
      }
    }
    
    // Apply masking if needed
    if (shouldMask) {
      masked[rule.field] = maskField(masked[rule.field], rule.mask_type);
    }
  }
  
  return masked;
}

/**
 * Apply masking to array of objects
 * @param data - Array of data objects to mask
 * @param rules - Array of masking rules to apply
 * @param user - The user viewing the data
 * @returns Array of masked data objects
 */
export function applyDataMaskingBulk(
  data: any[],
  rules: DataMaskingRule[],
  user: User
): any[] {
  if (!Array.isArray(data)) {
    return data;
  }
  
  return data.map(item => applyDataMasking(item, rules, user));
}

/**
 * Get list of fields that should be masked for a user
 * @param rules - Array of masking rules
 * @param user - The user to check
 * @returns Array of field names that should be masked
 */
export function getMaskedFields(
  rules: DataMaskingRule[],
  user: User
): string[] {
  if (!rules || rules.length === 0) {
    return [];
  }
  
  return rules
    .filter(rule => {
      // Check if user has visibility exception
      if (rule.visible_to_roles && rule.visible_to_roles.includes(user.role)) {
        return false; // Don't mask
      }
      
      if (rule.visible_with_capability) {
        const hasCap = hasCapability(
          user,
          rule.visible_with_capability.module,
          rule.visible_with_capability.action
        );
        if (hasCap) {
          return false; // Don't mask
        }
      }
      
      return true; // Should mask
    })
    .map(rule => rule.field);
}

/**
 * Simple hash function for generating hash representations
 * @param str - String to hash
 * @returns 8-character hexadecimal hash
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8).padStart(8, '0');
}










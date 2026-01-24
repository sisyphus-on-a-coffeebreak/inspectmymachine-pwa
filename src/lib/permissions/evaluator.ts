/**
 * Permission Evaluator
 * 
 * Main permission checking engine that evaluates enhanced capabilities
 * with all granularity layers: scope, fields, conditions, time, and context.
 */

import type { User } from '../users';
import type {
  CapabilityModule,
  CapabilityAction,
  EnhancedCapability,
  PermissionCheckContext,
  PermissionCheckResult,
  TimeBasedPermission,
  ContextualRestriction
} from './types';
import { evaluateConditionalRule } from './conditionEvaluator';
import { evaluateRecordScope } from './scopeEvaluator';

/**
 * Check if user has a basic capability (backward compatible)
 * @param user - The user to check
 * @param module - The module to check
 * @param action - The action to check
 * @param context - Optional context for granular checks
 * @returns true if user has the capability
 */
export function hasCapability(
  user: User | null,
  module: CapabilityModule,
  action: CapabilityAction,
  context?: PermissionCheckContext
): boolean {
  const result = checkPermission(user, module, action, context);
  return result.allowed;
}

/**
 * Detailed permission check with full granularity support
 * @param user - The user to check
 * @param module - The module to check
 * @param action - The action to check
 * @param context - Optional context for granular checks
 * @returns Detailed permission check result
 */
export function checkPermission(
  user: User | null,
  module: CapabilityModule,
  action: CapabilityAction,
  context?: PermissionCheckContext
): PermissionCheckResult {
  // No user = no access
  if (!user) {
    return { 
      allowed: false, 
      reason: 'User not authenticated',
      missing_permissions: [`${module}.${action}`]
    };
  }
  
  // Super admin bypass: Check if user is super admin first
  // Super admin has all access regardless of capabilities
  if (user.role === 'super_admin') {
    return { allowed: true };
  }
  
  // Check capabilities for all other users
  
  // Check if user has enhanced capabilities
  const enhancedCaps = user.capabilities?.enhanced_capabilities;
  
  if (enhancedCaps && enhancedCaps.length > 0) {
    // Find matching enhanced capability
    // For stockyard module, we need to check function scope if provided in context
    const matchingCap = enhancedCaps.find(cap => {
      if (cap.module !== module || cap.action !== action) return false;
      
      // For stockyard with function scope, check if scope matches
      if (module === 'stockyard' && cap.scope?.type === 'function' && context?.stockyardFunction) {
        return cap.scope.value === context.stockyardFunction;
      }
      
      // For stockyard with function scope but no context function, skip (will check basic capabilities)
      if (module === 'stockyard' && cap.scope?.type === 'function' && !context?.stockyardFunction) {
        return false;
      }
      
      // For other cases, match normally
      return true;
    });
    
    if (matchingCap) {
      return evaluateEnhancedCapability(user, matchingCap, context);
    }
  }
  
  // Fall back to basic capability check (from users.capabilities JSON)
  const hasBasicCapability = user.capabilities?.[module]?.includes(action);
  
  if (hasBasicCapability) {
    // Basic capability exists - return allowed
    // Note: Basic capabilities don't have granular restrictions
    return { allowed: true };
  }
  
  // No permission found - deny access
  // Role-based fallback has been removed - users must have explicit capabilities
  return {
    allowed: false,
    reason: `User does not have ${action} permission for ${module}`,
    missing_permissions: [`${module}.${action}`]
  };
}

/**
 * Evaluate enhanced capability with all granularity layers
 * @param user - The user requesting access
 * @param capability - The enhanced capability to evaluate
 * @param context - Optional context for the check
 * @returns Permission check result
 */
function evaluateEnhancedCapability(
  user: User,
  capability: EnhancedCapability,
  context?: PermissionCheckContext
): PermissionCheckResult {
  // 1. Check if permission has expired
  if (capability.expires_at) {
    const expiryDate = new Date(capability.expires_at);
    const now = context?.timestamp || new Date();
    if (now > expiryDate) {
      return {
        allowed: false,
        reason: 'Permission has expired',
        failed_conditions: [`Expired on ${expiryDate.toISOString()}`]
      };
    }
  }
  
  // 2. Check time-based restrictions
  if (capability.time_restrictions) {
    const timeCheck = checkTimeRestrictions(
      capability.time_restrictions,
      context?.timestamp || new Date()
    );
    if (!timeCheck.allowed) {
      return {
        allowed: false,
        reason: 'Access not allowed at this time',
        failed_conditions: timeCheck.reasons
      };
    }
  }
  
  // 3. Check contextual restrictions
  if (capability.context_restrictions) {
    const contextCheck = checkContextRestrictions(
      capability.context_restrictions,
      context
    );
    if (!contextCheck.allowed) {
      return contextCheck;
    }
  }
  
  // 4. Check record-level scope
  if (capability.scope && context?.record) {
    const hasScope = evaluateRecordScope(user, capability.scope, context.record);
    if (!hasScope) {
      return {
        allowed: false,
        reason: 'Access denied by record scope rules',
        failed_conditions: [`Scope: ${capability.scope.type}`]
      };
    }
  }
  
  // 5. Check field-level permissions
  if (capability.field_permissions && context?.field) {
    const fieldAllowed = checkFieldPermission(
      capability.field_permissions,
      context.field,
      capability.action
    );
    if (!fieldAllowed) {
      return {
        allowed: false,
        reason: `Field '${context.field}' is not accessible`,
        failed_conditions: [`Field: ${context.field}`]
      };
    }
  }
  
  // 6. Check conditional rules
  if (capability.conditions && context?.record) {
    const conditionResult = evaluateConditionalRule(
      capability.conditions,
      context.record
    );
    if (!conditionResult.allowed) {
      return {
        allowed: false,
        reason: capability.conditions.error_message || 'Conditions not met',
        failed_conditions: conditionResult.failedConditions
      };
    }
  }
  
  // All checks passed
  return { allowed: true };
}

/**
 * Check time-based restrictions
 * @param restrictions - Time restriction configuration
 * @param timestamp - Current timestamp
 * @returns Object with allowed status and reasons
 */
function checkTimeRestrictions(
  restrictions: TimeBasedPermission,
  timestamp: Date
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check date range
  if (restrictions.valid_from) {
    const validFrom = new Date(restrictions.valid_from);
    if (timestamp < validFrom) {
      reasons.push(`Not valid until ${validFrom.toISOString()}`);
    }
  }
  
  if (restrictions.valid_until) {
    const validUntil = new Date(restrictions.valid_until);
    if (timestamp > validUntil) {
      reasons.push(`Expired on ${validUntil.toISOString()}`);
    }
  }
  
  // Check day of week
  if (restrictions.days_of_week && restrictions.days_of_week.length > 0) {
    const dayOfWeek = timestamp.getDay();
    if (!restrictions.days_of_week.includes(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const allowedDays = restrictions.days_of_week
        .map(d => dayNames[d])
        .join(', ');
      reasons.push(`Only allowed on: ${allowedDays}`);
    }
  }
  
  // Check time of day
  if (restrictions.time_of_day) {
    const timeStr = timestamp.toTimeString().substring(0, 5); // HH:MM
    const { start, end } = restrictions.time_of_day;
    
    if (timeStr < start || timeStr > end) {
      reasons.push(`Only allowed between ${start} - ${end}`);
    }
  }
  
  return {
    allowed: reasons.length === 0,
    reasons
  };
}

/**
 * Check contextual restrictions
 * @param restrictions - Contextual restriction configuration
 * @param context - Permission check context
 * @returns Permission check result
 */
function checkContextRestrictions(
  restrictions: ContextualRestriction,
  context?: PermissionCheckContext
): PermissionCheckResult {
  // Check MFA requirement
  if (restrictions.require_mfa && !context?.mfa_verified) {
    return {
      allowed: false,
      reason: 'Multi-factor authentication required for this action'
    };
  }
  
  // Check IP whitelist
  if (restrictions.ip_whitelist && restrictions.ip_whitelist.length > 0 && context?.ip_address) {
    const ipAllowed = restrictions.ip_whitelist.some((allowed: string) =>
      matchIP(context.ip_address!, allowed)
    );
    if (!ipAllowed) {
      return {
        allowed: false,
        reason: 'Access not allowed from this IP address'
      };
    }
  }
  
  // Check device type
  if (restrictions.device_types && restrictions.device_types.length > 0 && context?.device_type) {
    if (!restrictions.device_types.includes(context.device_type)) {
      return {
        allowed: false,
        reason: `Access not allowed from ${context.device_type} devices`
      };
    }
  }
  
  // Check location requirement
  if (restrictions.location_required && restrictions.location_required !== 'any' && context?.location) {
    if (restrictions.location_required !== context.location) {
      return {
        allowed: false,
        reason: `Access requires ${restrictions.location_required} location`
      };
    }
  }
  
  // Check approval requirement
  if (restrictions.require_approval && !context?.approved_by) {
    return {
      allowed: false,
      reason: 'This action requires approval',
      requires_approval: true,
      approval_from: restrictions.approval_from_role
    };
  }
  
  // Check reason requirement
  if (restrictions.require_reason && !context?.reason) {
    return {
      allowed: false,
      reason: 'Justification required for this action'
    };
  }
  
  // Check dual control requirement
  if (restrictions.dual_control) {
    // This would require additional context about a second user
    // For now, we'll just check if it's configured
    // Full implementation would require backend support
    if (!context?.approved_by) {
      return {
        allowed: false,
        reason: 'This action requires dual control (two users)'
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Check field-level permission
 * @param fieldPermissions - Array of field permission rules
 * @param field - Field name to check
 * @param action - Action being performed
 * @returns true if field is accessible
 */
function checkFieldPermission(
  fieldPermissions: Array<{ module: CapabilityModule; action: 'read' | 'update'; mode: 'whitelist' | 'blacklist'; fields: string[] }> | undefined,
  field: string | undefined,
  action: CapabilityAction
): boolean {
  if (!fieldPermissions || !field) {
    return true; // No restrictions if no field permissions or no field specified
  }
  
  // Find relevant field permission (matching action)
  const relevantPermission = fieldPermissions.find(
    fp => fp.action === action || 
          (action === 'read' && fp.action === 'read') ||
          (action === 'update' && fp.action === 'update')
  );
  
  if (!relevantPermission) {
    // No field restriction for this action
    return true;
  }
  
  if (relevantPermission.mode === 'whitelist') {
    // Field must be in the whitelist
    return relevantPermission.fields.includes(field);
  } else {
    // Field must NOT be in the blacklist
    return !relevantPermission.fields.includes(field);
  }
}

/**
 * Simple IP matching (supports basic CIDR notation)
 * @param ip - IP address to check
 * @param pattern - IP pattern or CIDR notation
 * @returns true if IP matches pattern
 */
function matchIP(ip: string, pattern: string): boolean {
  if (!ip || !pattern) return false;
  
  // Exact match
  if (pattern === ip) return true;
  
  // Basic CIDR check (for production, use a proper CIDR library)
  if (pattern.includes('/')) {
    const [network, prefixLength] = pattern.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    // For /24, /16, /8, do simple prefix matching
    if (prefix === 24) {
      const networkPrefix = network.split('.').slice(0, 3).join('.');
      return ip.startsWith(networkPrefix);
    } else if (prefix === 16) {
      const networkPrefix = network.split('.').slice(0, 2).join('.');
      return ip.startsWith(networkPrefix);
    } else if (prefix === 8) {
      const networkPrefix = network.split('.')[0];
      return ip.startsWith(networkPrefix);
    }
    
    // For other prefix lengths, would need proper CIDR calculation
    // For now, just do prefix matching
    return ip.startsWith(network.split('/')[0]);
  }
  
  return false;
}

/**
 * Batch permission check (for optimization)
 * @param user - The user to check
 * @param checks - Array of permission checks to perform
 * @returns Object mapping permission keys to check results
 */
export function checkPermissions(
  user: User | null,
  checks: Array<{
    module: CapabilityModule;
    action: CapabilityAction;
    context?: PermissionCheckContext;
  }>
): Record<string, PermissionCheckResult> {
  const results: Record<string, PermissionCheckResult> = {};
  
  for (const check of checks) {
    const key = `${check.module}.${check.action}`;
    results[key] = checkPermission(user, check.module, check.action, check.context);
  }
  
  return results;
}

/**
 * Check role-based capability (backward compatibility helper)
 * Uses shared role capabilities to avoid duplication
 */
// hasRoleCapability is now imported from roleCapabilities.ts






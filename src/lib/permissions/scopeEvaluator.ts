/**
 * Scope Evaluator
 * 
 * Evaluates record-level scope rules to determine if a user has access
 * to a specific record based on ownership, assignment, yard, department, etc.
 */

import type { RecordScopeRule, PermissionScope, StockyardFunction } from './types';
import type { User } from '../users';

/**
 * Check if user has access to record based on scope
 * @param user - The user requesting access
 * @param scope - The scope rule to evaluate
 * @param record - The record being accessed
 * @returns true if user has access, false otherwise
 */
export function evaluateRecordScope(
  user: User,
  scope: RecordScopeRule,
  record: any
): boolean {
  if (!record) return false;
  
  switch (scope.type) {
    case 'all':
      // No restrictions - access to all records
      return true;
      
    case 'own_only':
      // Only records created by or owned by the user
      return record.created_by === user.id || 
             record.user_id === user.id ||
             record.owner_id === user.id;
      
    case 'yard_only':
      // Only records in user's yard
      if (!user.yard_id) {
        // User has no yard assigned - deny access
        return false;
      }
      return record.yard_id === user.yard_id;
      
    case 'department_only':
      // Only records in user's department
      const userDeptId = (user as any).department_id;
      if (!userDeptId) {
        // User has no department - deny access
        return false;
      }
      return record.department_id === userDeptId;
      
    case 'assigned_only':
      // Only records assigned to the user
      return record.assigned_to === user.id || 
             record.assigned_user_id === user.id ||
             (Array.isArray(record.assigned_users) && record.assigned_users.includes(user.id)) ||
             (Array.isArray(record.assigned_to) && record.assigned_to.includes(user.id));
      
    case 'function':
      // Function-based scope (for stockyard: access_control, inventory, movements)
      // This is used for navigation/permission gates, not record-level checks
      // The actual function check happens at component level via hasStockyardCapability
      // At scope level, we always return true - the function check is handled separately
      return true;
      
    case 'custom':
      // Custom filter expression
      if (!scope.custom_filter) {
        return false;
      }
      return evaluateCustomFilter(scope.custom_filter, user, record);
      
    default:
      console.warn(`Unknown scope type: ${(scope as any).type}`);
      return false;
  }
}

/**
 * Evaluate custom filter expression
 * 
 * Format examples:
 * - "user.id == record.created_by"
 * - "user.role in ['admin', 'supervisor']"
 * - "record.status == 'pending'"
 * 
 * WARNING: This is a basic implementation. For production, consider using
 * a safe expression parser library instead of eval.
 * 
 * @param filter - The filter expression string
 * @param user - The user object
 * @param record - The record object
 * @returns true if filter matches, false otherwise
 */
function evaluateCustomFilter(filter: string, user: User, record: any): boolean {
  if (!filter || typeof filter !== 'string') {
    return false;
  }
  
  try {
    // Basic pattern matching for common cases
    // This avoids using eval() for security reasons
    
    // Pattern: user.id == record.created_by
    if (filter.includes('user.id == record.created_by')) {
      return user.id === record.created_by;
    }
    
    // Pattern: user.id == record.user_id
    if (filter.includes('user.id == record.user_id')) {
      return user.id === record.user_id;
    }
    
    // Pattern: user.role == 'admin'
    const roleMatch = filter.match(/user\.role\s*==\s*['"]([^'"]+)['"]/);
    if (roleMatch) {
      return user.role === roleMatch[1];
    }
    
    // Pattern: record.status == 'pending'
    const statusMatch = filter.match(/record\.status\s*==\s*['"]([^'"]+)['"]/);
    if (statusMatch) {
      return record.status === statusMatch[1];
    }
    
    // Pattern: user.yard_id == record.yard_id
    if (filter.includes('user.yard_id == record.yard_id')) {
      return user.yard_id === record.yard_id;
    }
    
    // For more complex expressions, you would need a proper expression parser
    // Consider using libraries like:
    // - expr-eval (https://github.com/silentmatt/expr-eval)
    // - jsep (https://github.com/EricSmekens/jsep)
    
    console.warn(`Custom filter pattern not recognized: ${filter}`);
    return false;
  } catch (error) {
    console.error('Error evaluating custom filter:', error);
    return false;
  }
}








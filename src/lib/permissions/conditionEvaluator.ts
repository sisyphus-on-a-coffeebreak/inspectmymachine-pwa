/**
 * Condition Evaluator
 * 
 * Evaluates conditional rules against records to determine if permissions
 * should be granted based on record data.
 */

import type { PermissionCondition, ConditionalRule, ConditionOperator } from './types';

/**
 * Get nested value from object using dot notation
 * @param obj - Object to traverse
 * @param path - Dot-separated path (e.g., "user.id" or "amount")
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  return path.split('.').reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, obj);
}

/**
 * Evaluate a single condition against a record
 * @param condition - The condition to evaluate
 * @param record - The record to check against
 * @returns true if condition passes, false otherwise
 */
export function evaluateCondition(
  condition: PermissionCondition,
  record: any
): boolean {
  if (!record) return false;
  
  const fieldValue = getNestedValue(record, condition.field);
  const conditionValue = condition.value;
  
  switch (condition.operator) {
    case '==':
      return fieldValue == conditionValue;
      
    case '!=':
      return fieldValue != conditionValue;
      
    case '>':
      return Number(fieldValue) > Number(conditionValue);
      
    case '<':
      return Number(fieldValue) < Number(conditionValue);
      
    case '>=':
      return Number(fieldValue) >= Number(conditionValue);
      
    case '<=':
      return Number(fieldValue) <= Number(conditionValue);
      
    case 'in':
      if (!Array.isArray(conditionValue)) return false;
      return conditionValue.includes(fieldValue);
      
    case 'not_in':
      if (!Array.isArray(conditionValue)) return true;
      return !conditionValue.includes(fieldValue);
      
    case 'contains':
      if (fieldValue == null) return false;
      return String(fieldValue).includes(String(conditionValue));
      
    case 'starts_with':
      if (fieldValue == null) return false;
      return String(fieldValue).startsWith(String(conditionValue));
      
    default:
      console.warn(`Unknown condition operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluate conditional rule (multiple conditions with AND/OR logic)
 * @param rule - The conditional rule to evaluate
 * @param record - The record to check against
 * @returns Object with allowed status and list of failed conditions
 */
export function evaluateConditionalRule(
  rule: ConditionalRule,
  record: any
): { allowed: boolean; failedConditions: string[] } {
  if (!rule.conditions || rule.conditions.length === 0) {
    return { allowed: true, failedConditions: [] };
  }
  
  const results = rule.conditions.map(condition => ({
    condition,
    result: evaluateCondition(condition, record)
  }));
  
  let allowed: boolean;
  if (rule.combine_with === 'AND') {
    // All conditions must pass
    allowed = results.every(r => r.result);
  } else {
    // At least one condition must pass
    allowed = results.some(r => r.result);
  }
  
  const failedConditions = results
    .filter(r => !r.result)
    .map(r => {
      const { field, operator, value } = r.condition;
      return `${field} ${operator} ${JSON.stringify(value)}`;
    });
  
  return { allowed, failedConditions };
}







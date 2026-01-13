/**
 * Enhanced Permission System - Type Definitions
 * 
 * This module defines the comprehensive type system for granular permissions
 * supporting 5 levels of granularity:
 * 1. Field-level permissions
 * 2. Record-level permissions (scope)
 * 3. Conditional permissions
 * 4. Time-based permissions
 * 5. Contextual permissions
 */

// ========================================
// BASIC TYPES
// ========================================

/**
 * Actions that can be performed on modules
 */
export type CapabilityAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export';

/**
 * Modules in the system
 */
export type CapabilityModule = 'gate_pass' | 'inspection' | 'expense' | 'user_management' | 'reports';

// ========================================
// 1. FIELD-LEVEL PERMISSIONS
// ========================================

/**
 * Field-level permission configuration
 * Controls which specific fields can be accessed within a module
 */
export interface FieldPermission {
  /** Module this field permission applies to */
  module: CapabilityModule;
  /** Action type (read or update) */
  action: 'read' | 'update';
  /** Whether fields list is a whitelist (include) or blacklist (exclude) */
  mode: 'whitelist' | 'blacklist';
  /** List of field names */
  fields: string[];
}

// ========================================
// 2. RECORD-LEVEL PERMISSIONS (Scope)
// ========================================

/**
 * Scope types that define which records a user can access
 */
export type PermissionScope = 
  | 'all' // Access all records
  | 'own_only' // Only records created by user
  | 'yard_only' // Only records in user's yard
  | 'department_only' // Only records in user's department
  | 'assigned_only' // Only records assigned to user
  | 'custom'; // Custom filter function

/**
 * Record scope rule configuration
 */
export interface RecordScopeRule {
  /** Type of scope restriction */
  type: PermissionScope;
  /** Custom filter expression (for 'custom' type) */
  custom_filter?: string; // Serialized filter expression
}

// ========================================
// 3. CONDITIONAL PERMISSIONS
// ========================================

/**
 * Operators for condition evaluation
 */
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'contains' | 'starts_with';

/**
 * Single condition to check against a record
 */
export interface PermissionCondition {
  /** Field path to check (supports dot notation, e.g., 'amount', 'status', 'created_by.id') */
  field: string;
  /** Comparison operator */
  operator: ConditionOperator;
  /** Value to compare against */
  value: any;
}

/**
 * Conditional rule with multiple conditions
 */
export interface ConditionalRule {
  /** Array of conditions to evaluate */
  conditions: PermissionCondition[];
  /** How to combine conditions (AND = all must pass, OR = at least one must pass) */
  combine_with: 'AND' | 'OR';
  /** Custom error message when condition fails */
  error_message?: string;
}

// ========================================
// 4. TIME-BASED PERMISSIONS
// ========================================

/**
 * Time-based restrictions for permissions
 */
export interface TimeBasedPermission {
  /** Permission becomes valid from this datetime (ISO format) */
  valid_from?: string;
  /** Permission expires at this datetime (ISO format) */
  valid_until?: string;
  /** Days of week when permission is valid (0=Sunday, 1=Monday, etc.) */
  days_of_week?: number[];
  /** Time of day restrictions */
  time_of_day?: {
    /** Start time in HH:MM format (e.g., "09:00") */
    start: string;
    /** End time in HH:MM format (e.g., "17:00") */
    end: string;
  };
  /** Timezone for time calculations (e.g., "Asia/Kolkata") */
  timezone?: string;
  /** Automatically revoke permission when expired */
  auto_revoke?: boolean;
}

// ========================================
// 5. CONTEXTUAL PERMISSIONS
// ========================================

/**
 * Contextual restrictions that must be met for permission to be granted
 */
export interface ContextualRestriction {
  /** Require multi-factor authentication for this action */
  require_mfa?: boolean;
  /** Require approval from another user */
  require_approval?: boolean;
  /** Roles that can provide approval */
  approval_from_role?: string[];
  /** Allowed IP addresses (supports CIDR notation) */
  ip_whitelist?: string[];
  /** Allowed device types */
  device_types?: ('mobile' | 'desktop' | 'tablet')[];
  /** Location requirement */
  location_required?: 'on_site' | 'remote' | 'any';
  /** Require user to provide justification/reason */
  require_reason?: boolean;
  /** Require two users simultaneously (dual control) */
  dual_control?: boolean;
}

// ========================================
// ENHANCED CAPABILITY DEFINITION
// ========================================

/**
 * Enhanced capability with full granularity support
 */
export interface EnhancedCapability {
  /** Module this capability applies to */
  module: CapabilityModule;
  /** Action this capability allows */
  action: CapabilityAction;
  
  // Granularity layers
  /** Record-level scope restrictions */
  scope?: RecordScopeRule;
  /** Field-level access controls */
  field_permissions?: FieldPermission[];
  /** Conditional rules that must be met */
  conditions?: ConditionalRule;
  /** Time-based restrictions */
  time_restrictions?: TimeBasedPermission;
  /** Additional contextual requirements */
  context_restrictions?: ContextualRestriction;
  
  // Metadata
  /** User ID who granted this capability */
  granted_by?: number;
  /** Timestamp when capability was granted */
  granted_at?: string;
  /** Reason/justification for granting this capability */
  reason?: string;
  /** Auto-revoke date (ISO format) */
  expires_at?: string;
}

// ========================================
// ENHANCED USER CAPABILITIES
// ========================================

/**
 * Enhanced user capabilities structure
 * Maintains backward compatibility with basic capabilities
 */
export interface EnhancedUserCapabilities {
  // Basic module capabilities (backward compatible)
  gate_pass?: CapabilityAction[];
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
  
  // Enhanced granular capabilities
  enhanced_capabilities?: EnhancedCapability[];
}

// ========================================
// PERMISSION CHECK CONTEXT
// ========================================

/**
 * Context information for permission checks
 */
export interface PermissionCheckContext {
  // Record context
  /** The actual record being accessed */
  record?: any;
  /** Record ID (if record object not available) */
  record_id?: string | number;
  
  // Field context
  /** Specific field being accessed */
  field?: string;
  /** Multiple fields being accessed */
  fields?: string[];
  
  // Time context
  /** When the action is being performed */
  timestamp?: Date;
  
  // User context
  /** IP address of the request */
  ip_address?: string;
  /** Type of device making the request */
  device_type?: 'mobile' | 'desktop' | 'tablet';
  /** Location context */
  location?: 'on_site' | 'remote';
  /** Whether MFA has been verified */
  mfa_verified?: boolean;
  
  // Action context
  /** User-provided justification for the action */
  reason?: string;
  /** User ID who pre-approved this action */
  approved_by?: number;
  
  // Advanced options
  /** Force granular permission checks even for super_admin */
  enforceGranular?: boolean;
}

// ========================================
// PERMISSION CHECK RESULT
// ========================================

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  /** Whether the permission is granted */
  allowed: boolean;
  /** Human-readable reason for denial */
  reason?: string;
  /** List of missing permissions */
  missing_permissions?: string[];
  /** List of failed conditions */
  failed_conditions?: string[];
  /** Whether approval is required */
  requires_approval?: boolean;
  /** Roles that can provide approval */
  approval_from?: string[];
  /** Fields that should be masked in the response */
  masked_fields?: string[];
}

// ========================================
// DATA MASKING
// ========================================

/**
 * Types of data masking
 */
export type MaskType = 'full' | 'partial' | 'hash' | 'redact' | 'none';

/**
 * Data masking rule
 */
export interface DataMaskingRule {
  /** Module this masking rule applies to */
  module: CapabilityModule;
  /** Field name to mask */
  field: string;
  /** Type of masking to apply */
  mask_type: MaskType;
  /** Show unmasked if user has this capability */
  visible_with_capability?: {
    module: CapabilityModule;
    action: CapabilityAction;
  };
  /** Or visible to specific roles */
  visible_to_roles?: string[];
}

// ========================================
// PERMISSION TEMPLATE
// ========================================

/**
 * Permission template for quick assignment
 */
export interface PermissionTemplate {
  /** Template ID */
  id: number;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Icon identifier */
  icon?: string;
  /** Capabilities included in this template */
  capabilities: EnhancedUserCapabilities;
  /** Roles this template is recommended for */
  recommended_for_roles?: string[];
  /** Whether this is a system template (cannot be deleted) */
  is_system_template: boolean;
  /** User who created this template */
  created_by: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}






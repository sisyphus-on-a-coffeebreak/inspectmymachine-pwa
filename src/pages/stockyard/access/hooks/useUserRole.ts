/**
 * useUserRole Hook
 * 
 * Provides role-based utilities for gate pass dashboard
 * Wraps useAuth() with capability-based helpers
 * Single source of truth: derives all permissions from lib/users.ts hasCapability()
 */

import { useMemo } from 'react';
import { useAuth } from '@/providers/useAuth';
import { hasCapability } from '@/lib/users';
import type { User } from '@/providers/authTypes';

/**
 * GatePassRole - Role type for gate pass operations
 * 
 * ⚠️ MIGRATION: Changed from hard-coded union to `string` to support custom roles.
 * Role is now just a display name - use capabilities for permission checks.
 * 
 * @deprecated This type is kept for backward compatibility but should be replaced with `string`.
 * After migration, all role types should be `string` to support custom roles from API.
 */
export type GatePassRole = string; // Allow any string for custom roles

export interface RolePermissions {
  canCreatePasses: boolean;
  canApprovePasses: boolean;
  canValidatePasses: boolean;
  canViewReports: boolean;
  canBulkOperations: boolean;
  canManageTemplates: boolean;
}

/**
 * Get role-based permissions for gate pass operations
 * Derives all permissions from hasCapability() - single source of truth
 */
function getRolePermissions(user: User | null): RolePermissions {
  if (!user) {
    // Default to most restrictive
    return {
      canCreatePasses: false,
      canApprovePasses: false,
      canValidatePasses: false,
      canViewReports: false,
      canBulkOperations: false,
      canManageTemplates: false,
    };
  }

  const approveCheck = hasCapability(user, 'gate_pass', 'approve');

  return {
    canCreatePasses: hasCapability(user, 'gate_pass', 'create'),
    canApprovePasses: approveCheck,
    canValidatePasses: hasCapability(user, 'gate_pass', 'validate'),
    canViewReports: hasCapability(user, 'reports', 'read'),
    canBulkOperations: hasCapability(user, 'gate_pass', 'delete'), // Admins can bulk delete
    canManageTemplates: hasCapability(user, 'gate_pass', 'update'), // Admins can manage templates
  };
}

export function useUserRole() {
  const { user } = useAuth();

  const role = useMemo(() => {
    // Role is just a display name - can be any string (including custom roles)
    return (user?.role || 'clerk') as GatePassRole;
  }, [user?.role]);

  const permissions = useMemo(() => {
    return getRolePermissions(user);
  }, [user]);

  // Convenience flags for backward compatibility
  // ⚠️ MIGRATION NOTE: These are derived from role string for backward compatibility.
  // After migration, these should be derived from capabilities instead.
  // For now, we keep role-based checks but document that capabilities are preferred.
  const isGuard = role === 'guard';
  const isClerk = role === 'clerk';
  const isSupervisor = role === 'supervisor';
  const isYardIncharge = role === 'yard_incharge';
  const isExecutive = role === 'executive';
  // isAdmin: Check via capabilities (preferred) or role (fallback)
  const isAdmin = hasCapability(user, 'user_management', 'read') || hasCapability(user, 'reports', 'read') || role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin'; // Super admin is special - identified by role

  return {
    user,
    role,
    permissions,
    isGuard,
    isClerk,
    isSupervisor,
    isYardIncharge,
    isExecutive,
    isAdmin,
    isSuperAdmin,
  };
}

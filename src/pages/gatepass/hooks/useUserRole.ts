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

export type GatePassRole = 'clerk' | 'guard' | 'supervisor' | 'admin' | 'super_admin' | 'inspector' | 'executive' | 'yard_incharge';

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

  // DEBUG: Log capability checks (remove after debugging)
  const approveCheck = hasCapability(user, 'gate_pass', 'approve');
  console.log('=== useUserRole DEBUG ===');
  console.log('User role:', user.role);
  console.log('User capabilities:', user.capabilities);
  console.log('hasCapability(gate_pass, approve):', approveCheck);
  console.log('=========================');

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
    return (user?.role || 'clerk') as GatePassRole;
  }, [user?.role]);

  const permissions = useMemo(() => {
    return getRolePermissions(user);
  }, [user]);

  // Convenience flags for backward compatibility
  const isGuard = role === 'guard';
  const isClerk = role === 'clerk';
  const isSupervisor = role === 'supervisor';
  const isYardIncharge = role === 'yard_incharge';
  const isExecutive = role === 'executive';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

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

/**
 * useUserRole Hook
 * 
 * Provides role-based utilities for gate pass dashboard
 * Wraps useAuth() with role-specific helpers
 */

import { useMemo } from 'react';
import { useAuth } from '@/providers/useAuth';
import type { User } from '@/providers/authTypes';

export type GatePassRole = 'clerk' | 'guard' | 'supervisor' | 'admin' | 'super_admin' | 'inspector';

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
 */
function getRolePermissions(role: GatePassRole | undefined): RolePermissions {
  if (!role) {
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

  const permissions: Record<GatePassRole, RolePermissions> = {
    clerk: {
      canCreatePasses: true,
      canApprovePasses: false,
      canValidatePasses: false,
      canViewReports: false,
      canBulkOperations: false,
      canManageTemplates: false,
    },
    guard: {
      canCreatePasses: false,
      canApprovePasses: false,
      canValidatePasses: true,
      canViewReports: false,
      canBulkOperations: false,
      canManageTemplates: false,
    },
    supervisor: {
      canCreatePasses: false,
      canApprovePasses: true,
      canValidatePasses: true,
      canViewReports: true,
      canBulkOperations: false,
      canManageTemplates: false,
    },
    admin: {
      canCreatePasses: true,
      canApprovePasses: true,
      canValidatePasses: true,
      canViewReports: true,
      canBulkOperations: true,
      canManageTemplates: true,
    },
    super_admin: {
      canCreatePasses: true,
      canApprovePasses: true,
      canValidatePasses: true,
      canViewReports: true,
      canBulkOperations: true,
      canManageTemplates: true,
    },
    inspector: {
      canCreatePasses: false,
      canApprovePasses: false,
      canValidatePasses: false,
      canViewReports: false,
      canBulkOperations: false,
      canManageTemplates: false,
    },
  };

  return permissions[role];
}

export function useUserRole() {
  const { user } = useAuth();

  const role = useMemo(() => {
    return (user?.role || 'clerk') as GatePassRole;
  }, [user?.role]);

  const permissions = useMemo(() => {
    return getRolePermissions(role);
  }, [role]);

  const isGuard = role === 'guard';
  const isClerk = role === 'clerk';
  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';

  return {
    user,
    role,
    permissions,
    isGuard,
    isClerk,
    isSupervisor,
    isAdmin,
    isSuperAdmin,
  };
}





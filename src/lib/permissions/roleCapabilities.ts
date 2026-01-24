/**
 * Role Capabilities - Single Source of Truth
 * 
 * This file contains all role capability definitions to avoid duplication
 * across users.ts and evaluator.ts
 * 
 * For custom roles, capabilities are fetched from the API
 */

import type { User } from '../users';
import type { CapabilityModule, CapabilityAction, UserCapabilities, StockyardFunction } from '../users';
import type { EnhancedCapability } from './types';
import { apiClient } from '../apiClient';

// Cache for role capabilities fetched from API
const roleCapabilitiesCache = new Map<string, UserCapabilities>();

/**
 * Get role capabilities as UserCapabilities format (for users.ts)
 */
/**
 * Helper to create enhanced capabilities for stockyard functions
 */
function createStockyardCapabilities(
  functions: StockyardFunction[],
  actions: CapabilityAction[]
): EnhancedCapability[] {
  return functions.flatMap(func =>
    actions.map(action => ({
      module: 'stockyard' as CapabilityModule,
      action,
      scope: { type: 'function' as const, value: func },
    }))
  );
}

export function getRoleCapabilities(): Record<User['role'], UserCapabilities> {
  return {
    super_admin: {
      // Basic capabilities (for backward compat during transition)
      stockyard: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
      inspection: ['create', 'read', 'update', 'delete', 'approve', 'review'],
      expense: ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
      user_management: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export'],
      // Enhanced capabilities (preferred, long-term)
      enhanced_capabilities: [
        // Access control (all actions)
        ...createStockyardCapabilities(['access_control'], ['create', 'read', 'update', 'delete', 'approve', 'validate']),
        // Inventory (all actions except validate)
        ...createStockyardCapabilities(['inventory'], ['create', 'read', 'update', 'delete', 'approve']),
        // Movements (all actions except validate)
        ...createStockyardCapabilities(['movements'], ['create', 'read', 'update', 'delete', 'approve']),
      ],
    },
    admin: {
      stockyard: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
      inspection: ['create', 'read', 'update', 'delete', 'approve', 'review'],
      expense: ['create', 'read', 'update', 'delete', 'approve', 'reassign'],
      user_management: ['read', 'update'],
      reports: ['read', 'export'],
      enhanced_capabilities: [
        ...createStockyardCapabilities(['access_control'], ['create', 'read', 'update', 'delete', 'approve', 'validate']),
        ...createStockyardCapabilities(['inventory'], ['create', 'read', 'update', 'delete', 'approve']),
        ...createStockyardCapabilities(['movements'], ['create', 'read', 'update', 'delete', 'approve']),
      ],
    },
    yard_incharge: {
      // Basic capabilities (mapped from old gate_pass)
      stockyard: ['create', 'read', 'approve', 'validate'],
      inspection: ['read', 'approve', 'review'],
      expense: ['read'],
      user_management: [],
      reports: ['read'],
      enhanced_capabilities: [
        // Access control (full access)
        ...createStockyardCapabilities(['access_control'], ['create', 'read', 'approve', 'validate']),
        // Inventory (read only)
        ...createStockyardCapabilities(['inventory'], ['read']),
        // Movements (create, read, approve)
        ...createStockyardCapabilities(['movements'], ['create', 'read', 'approve']),
      ],
    },
    supervisor: {
      stockyard: ['read', 'approve', 'validate'],
      inspection: ['read', 'approve', 'review'],
      expense: ['read', 'approve'],
      user_management: [],
      reports: ['read'],
      enhanced_capabilities: [
        // Access control (read, approve, validate)
        ...createStockyardCapabilities(['access_control'], ['read', 'approve', 'validate']),
      ],
    },
    executive: {
      stockyard: ['create', 'read', 'validate'],
      inspection: ['read'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
      enhanced_capabilities: [
        // Access control (create, read, validate)
        ...createStockyardCapabilities(['access_control'], ['create', 'read', 'validate']),
      ],
    },
    inspector: {
      stockyard: ['read'],
      inspection: ['create', 'read', 'update'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
      enhanced_capabilities: [
        // Access control (read only)
        ...createStockyardCapabilities(['access_control'], ['read']),
      ],
    },
    guard: {
      stockyard: ['read', 'validate'],
      inspection: ['read'],
      expense: ['read'],
      user_management: [],
      reports: [],
      enhanced_capabilities: [
        // Access control (read, validate only)
        ...createStockyardCapabilities(['access_control'], ['read', 'validate']),
      ],
    },
    clerk: {
      stockyard: ['create', 'read'],
      inspection: ['read'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
      enhanced_capabilities: [
        // Access control (create, read only)
        ...createStockyardCapabilities(['access_control'], ['create', 'read']),
      ],
    },
  };
}

/**
 * Get role capabilities as Record format (for evaluator.ts)
 */
export function getRoleCapabilitiesRecord(): Record<User['role'], Record<CapabilityModule, CapabilityAction[]>> {
  const capabilities = getRoleCapabilities();
  const result: Partial<Record<User['role'], Record<CapabilityModule, CapabilityAction[]>>> = {};
  
  for (const [role, caps] of Object.entries(capabilities) as [User['role'], UserCapabilities][]) {
    result[role] = caps as Record<CapabilityModule, CapabilityAction[]>;
  }
  
  return result as Record<User['role'], Record<CapabilityModule, CapabilityAction[]>>;
}

/**
 * Fetch role capabilities from API (for custom roles)
 */
async function fetchRoleCapabilitiesFromAPI(roleName: string): Promise<UserCapabilities | null> {
  try {
    // Check cache first
    if (roleCapabilitiesCache.has(roleName)) {
      return roleCapabilitiesCache.get(roleName)!;
    }

    // Fetch from API
    const response = await apiClient.get(`/v1/roles`);
    const roles = (response.data || []) as Array<{ name: string; capabilities: UserCapabilities }>;
    const role = roles.find((r) => r.name === roleName);
    
    if (role && role.capabilities) {
      // Convert API format to UserCapabilities format
      const capabilities: UserCapabilities = role.capabilities;
      roleCapabilitiesCache.set(roleName, capabilities);
      return capabilities;
    }
    
    return null;
  } catch {
    // API might not be available or role doesn't exist
    return null;
  }
}

/**
 * Check if role has capability (shared helper)
 * For custom roles, fetches from API if not in hardcoded list
 */
export function hasRoleCapability(
  role: User['role'],
  module: CapabilityModule,
  action: CapabilityAction
): boolean {
  const roleCapabilities = getRoleCapabilities();
  
  // Check hardcoded roles first
  if (roleCapabilities[role]) {
    const capabilities = roleCapabilities[role];
    return capabilities[module]?.includes(action) ?? false;
  }
  
  // For custom roles, try to fetch from API (synchronous fallback)
  // Note: This is a synchronous function, so we can't await here
  // The actual API fetch should happen in hydrateUserPermissions
  // For now, return false for unknown roles
  return false;
}

/**
 * Check if role has capability (async version for custom roles)
 */
export async function hasRoleCapabilityAsync(
  role: string, // Allow any string for custom roles
  module: CapabilityModule,
  action: CapabilityAction
): Promise<boolean> {
  const roleCapabilities = getRoleCapabilities();
  
  // Check hardcoded roles first
  if (role in roleCapabilities) {
    const capabilities = roleCapabilities[role as User['role']];
    return capabilities[module]?.includes(action) ?? false;
  }
  
  // For custom roles, fetch from API
  const capabilities = await fetchRoleCapabilitiesFromAPI(role);
  if (capabilities) {
    return capabilities[module]?.includes(action) ?? false;
  }
  
  return false;
}


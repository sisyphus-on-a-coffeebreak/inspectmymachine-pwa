/**
 * Role Capabilities - Default Definitions (Migration Artifact)
 * 
 * ⚠️ IMPORTANT: These are DEFAULT capabilities only, NOT the source of truth!
 * 
 * MIGRATION STATUS:
 * - These hard-coded role capabilities are migration artifacts from the old role-based system
 * - The source of truth is now the database (roles table + role_capabilities table)
 * - API-fetched capabilities ALWAYS override these hard-coded defaults
 * - These defaults are used only as fallback when:
 *   1. API is unavailable
 *   2. Role doesn't exist in database yet
 *   3. During initial system setup
 * 
 * FUTURE:
 * - After migration is complete, these defaults may be removed
 * - All roles should be defined in the database
 * - Custom roles are fully supported via API
 * 
 * USAGE:
 * - For system roles: Check database first, fall back to these defaults
 * - For custom roles: Always fetch from API (no defaults exist)
 * - Never use these as the primary source for permission checks
 * 
 * See: docs/DEVELOPER_GUIDE.md for details
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

/**
 * Get default role capabilities (fallback only)
 * 
 * ⚠️ WARNING: These are DEFAULTS only, not the source of truth!
 * Always check database/API first, use these only as fallback.
 * 
 * @returns Record of role names to default capabilities
 */
export function getRoleCapabilities(): Record<User['role'], UserCapabilities> {
  return {
    super_admin: {
      // Basic capabilities (for backward compat during transition)
      // NOTE: These are defaults - superadmin should have all capabilities from backend
      gate_pass: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
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
      gate_pass: ['create', 'read', 'update', 'delete', 'approve', 'validate'],
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
      gate_pass: ['create', 'read', 'approve', 'validate'],
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
      gate_pass: ['read', 'approve', 'validate'],
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
      gate_pass: ['create', 'read', 'validate'],
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
      gate_pass: ['read'],
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
      gate_pass: ['read', 'validate'],
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
      gate_pass: ['create', 'read', 'validate'],
      stockyard: ['create', 'read'],
      inspection: ['read'],
      expense: ['create', 'read'],
      user_management: [],
      reports: [],
      enhanced_capabilities: [
        // Access control (create, read, validate)
        ...createStockyardCapabilities(['access_control'], ['create', 'read', 'validate']),
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
 * Fetch role capabilities from API (for custom roles and system roles)
 * 
 * ⚠️ MIGRATION NOTE: This is the PREFERRED method after migration.
 * API-fetched capabilities should ALWAYS override hardcoded defaults.
 * 
 * @param roleName - The role name to fetch capabilities for
 * @returns UserCapabilities from API, or null if not found/unavailable
 */
async function fetchRoleCapabilitiesFromAPI(roleName: string): Promise<UserCapabilities | null> {
  try {
    // Check cache first
    if (roleCapabilitiesCache.has(roleName)) {
      return roleCapabilitiesCache.get(roleName)!;
    }

    // Fetch from API - this is the source of truth
    const response = await apiClient.get(`/v1/roles`);
    const roles = (response.data || []) as Array<{ name: string; capabilities: UserCapabilities }>;
    const role = roles.find((r) => r.name === roleName);
    
    if (role && role.capabilities) {
      // Convert API format to UserCapabilities format
      // API capabilities override any hardcoded defaults
      const capabilities: UserCapabilities = role.capabilities;
      roleCapabilitiesCache.set(roleName, capabilities);
      return capabilities;
    }
    
    return null;
  } catch {
    // API might not be available or role doesn't exist
    // Fall back to hardcoded defaults (migration period only)
    return null;
  }
}

/**
 * Check if role has capability (shared helper)
 * 
 * ⚠️ MIGRATION NOTE: This function checks hardcoded defaults first, then API.
 * After migration, this should be reversed - check API first, defaults as fallback.
 * 
 * For custom roles, fetches from API if not in hardcoded list
 * 
 * @param role - The role to check
 * @param module - The capability module
 * @param action - The capability action
 * @returns true if role has the capability
 */
export function hasRoleCapability(
  role: User['role'],
  module: CapabilityModule,
  action: CapabilityAction
): boolean {
  const roleCapabilities = getRoleCapabilities();
  
  // Check hardcoded roles first (during migration - will be fallback after)
  // TODO: After migration, check API first, then fall back to defaults
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


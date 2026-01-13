/**
 * PermissionGate - Conditionally render UI elements based on user permissions
 * 
 * This component provides a declarative way to show/hide UI elements
 * based on the current user's capabilities. Unlike RequireCapability,
 * this doesn't redirect - it just hides the content.
 * 
 * @example
 * ```tsx
 * // Single permission check
 * <PermissionGate module="user_management" action="create">
 *   <Button onClick={openCreateUserModal}>Create User</Button>
 * </PermissionGate>
 * 
 * // With fallback
 * <PermissionGate 
 *   module="expense" 
 *   action="approve"
 *   fallback={<span>You cannot approve expenses</span>}
 * >
 *   <Button onClick={approveExpense}>Approve</Button>
 * </PermissionGate>
 * 
 * // With disabled fallback (shows button but disabled)
 * <PermissionGate 
 *   module="gate_pass" 
 *   action="delete"
 *   showDisabled
 * >
 *   <Button onClick={deletePass}>Delete Pass</Button>
 * </PermissionGate>
 * ```
 */

import type { ReactNode, ReactElement } from 'react';
import { cloneElement, isValidElement } from 'react';
import { useAuth } from '../../providers/useAuth';
import { hasCapability } from '../../lib/users';
import type { CapabilityModule, CapabilityAction } from '../../lib/users';

interface PermissionGateProps {
  /** The module to check permission for */
  module: CapabilityModule;
  /** The action to check permission for */
  action: CapabilityAction;
  /** Content to render when user has permission */
  children: ReactNode;
  /** Optional content to render when user lacks permission */
  fallback?: ReactNode;
  /** If true, renders children with disabled state instead of hiding */
  showDisabled?: boolean;
  /** Optional tooltip for disabled state */
  disabledTooltip?: string;
}

export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
  showDisabled = false,
  disabledTooltip = 'You do not have permission to perform this action',
}: PermissionGateProps) {
  const { user } = useAuth();
  
  const hasPermission = hasCapability(user, module, action);
  
  if (hasPermission) {
    return <>{children}</>;
  }
  
  // If showDisabled is true, try to render children with disabled state
  if (showDisabled && isValidElement(children)) {
    // Clone the element and add disabled prop
    const disabledElement = cloneElement(children as ReactElement<Record<string, unknown>>, {
      disabled: true,
      title: disabledTooltip,
      'aria-disabled': true,
    });
    
    return disabledElement;
  }
  
  return <>{fallback}</>;
}

/**
 * Hook to check if current user has a specific capability
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canCreate = useHasCapability('user_management', 'create');
 *   const canDelete = useHasCapability('user_management', 'delete');
 *   
 *   return (
 *     <div>
 *       {canCreate && <Button>Create User</Button>}
 *       {canDelete && <Button variant="danger">Delete User</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasCapability(module: CapabilityModule, action: CapabilityAction): boolean {
  const { user } = useAuth();
  return hasCapability(user, module, action);
}

/**
 * Hook to get multiple capability checks at once
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const permissions = useCapabilities({
 *     canCreate: ['user_management', 'create'],
 *     canDelete: ['user_management', 'delete'],
 *     canApprove: ['expense', 'approve'],
 *   });
 *   
 *   return (
 *     <div>
 *       {permissions.canCreate && <Button>Create</Button>}
 *       {permissions.canDelete && <Button>Delete</Button>}
 *       {permissions.canApprove && <Button>Approve</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCapabilities<T extends Record<string, [CapabilityModule, CapabilityAction]>>(
  capabilityMap: T
): Record<keyof T, boolean> {
  const { user } = useAuth();
  
  const result = {} as Record<keyof T, boolean>;
  
  for (const key in capabilityMap) {
    const [module, action] = capabilityMap[key];
    result[key] = hasCapability(user, module, action);
  }
  
  return result;
}

export default PermissionGate;


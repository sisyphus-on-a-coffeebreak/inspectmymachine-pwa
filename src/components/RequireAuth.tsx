import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { hasCapability, type CapabilityModule, type CapabilityAction } from "../lib/users";

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * @deprecated Use RequireCapability instead. Role-based checks are being migrated to capability-based system.
 * 
 * This component is kept for backward compatibility during migration but will be removed.
 * 
 * Migration guide:
 * - Replace `RequireRole roles={["admin"]}` with `RequireCapability module="reports" action="read"`
 * - Map each role array to appropriate capability checks
 * - See docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md for details
 * 
 * @example
 * // ❌ OLD (deprecated)
 * <RequireRole roles={["super_admin", "admin"]}>
 *   <MyComponent />
 * </RequireRole>
 * 
 * // ✅ NEW (preferred)
 * <RequireCapability module="reports" action="read">
 *   <MyComponent />
 * </RequireCapability>
 */
type Role = string; // Allow any string for custom roles (not just hardcoded union)

export function RequireRole({ children, roles }: { children: ReactNode; roles: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show deprecation warning in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'RequireRole is deprecated. Use RequireCapability instead. ' +
      'See docs/ROLE_TO_CAPABILITY_MIGRATION_PLAN.md for migration guide.'
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is in the allowed roles array
  // Note: This is role-based check (deprecated) - should use capabilities instead
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * RequireCapability - Check if user has specific capability
 */
export function RequireCapability({ 
  children, 
  module, 
  action 
}: { 
  children: ReactNode; 
  module: CapabilityModule; 
  action: CapabilityAction;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasCapability(user, module, action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
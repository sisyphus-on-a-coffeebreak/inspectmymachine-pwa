import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { getRoleQuickActions, QuickAction } from '../components/ui/QuickActionsPanel';
import { useAuth } from '../providers/useAuth';

export interface QuickActionsContext {
  pendingApprovals?: number;
  urgentItems?: number;
  activePasses?: number;
}

/**
 * Hook to get capability-based quick actions with context awareness
 * 
 * ⚠️ MIGRATION: Now uses capability checks instead of role checks.
 * Actions are determined by user capabilities, not role string.
 */
export function useRoleQuickActions(context?: QuickActionsContext): QuickAction[] {
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMemo(() => {
    // Pass user object for capability checks (preferred)
    // Role is kept for backward compatibility
    return getRoleQuickActions(user?.role || '', navigate, context, user);
  }, [user, navigate, context]);
}



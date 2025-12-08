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
 * Hook to get role-based quick actions with context awareness
 */
export function useRoleQuickActions(context?: QuickActionsContext): QuickAction[] {
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMemo(() => {
    return getRoleQuickActions(user?.role || '', navigate, context);
  }, [user?.role, navigate, context]);
}



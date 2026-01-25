/**
 * QuickActionsPanel Component
 * 
 * Role-specific quick actions panel for common tasks
 * Displays contextual actions based on user role
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { ActionGrid, CompactGrid } from './ResponsiveGrid';
import { hasCapability } from '../../lib/users';
import { 
  Plus, 
  Search, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  QrCode, 
  DollarSign, 
  Warehouse,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Package,
  ClipboardList,
  TrendingUp,
  Bell
} from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
  description?: string;
}

export interface QuickActionsPanelProps {
  title?: string;
  actions: QuickAction[];
  columns?: number;
  className?: string;
  compact?: boolean;
  contextData?: {
    pendingApprovals?: number;
    urgentItems?: number;
    activePasses?: number;
  };
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  title = 'Quick Actions',
  actions,
  columns = 3,
  className = '',
  compact = false,
  contextData,
}) => {
  const GridComponent = compact ? CompactGrid : ActionGrid;
  
  return (
    <div
      className={`quick-actions-panel ${className}`}
      style={{
        ...cardStyles.base,
        padding: spacing.lg,
      }}
    >
      {title && (
        <h3
          style={{
            ...typography.subheader,
            fontSize: '18px',
            color: colors.neutral[900],
            marginBottom: spacing.md,
            marginTop: 0,
          }}
        >
          {title}
        </h3>
      )}
      <GridComponent
        gap={compact ? 'sm' : 'md'}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: compact ? spacing.md : spacing.lg,
              backgroundColor: 'white',
              border: `2px solid ${action.color || colors.primary}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: compact ? '100px' : '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 16px ${(action.color || colors.primary)}30`;
              e.currentTarget.style.borderColor = action.color || colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = action.color || colors.primary;
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${colors.primary}`;
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
            aria-label={action.label}
          >
            <div
              style={{
                fontSize: '2rem',
                marginBottom: spacing.sm,
                color: action.color || colors.primary,
              }}
            >
              {action.icon}
            </div>
            <div
              style={{
                ...typography.body,
                fontWeight: 600,
                color: colors.neutral[900],
                marginBottom: action.description ? spacing.xs : 0,
              }}
            >
              {action.label}
            </div>
            {action.description && (
              <div
                style={{
                  ...typography.bodySmall,
                  fontSize: '11px',
                  color: colors.neutral[600],
                }}
              >
                {action.description}
              </div>
            )}
          </button>
        ))}
      </GridComponent>
      <style>{`
        /* Mobile optimizations */
        @media (max-width: 767px) {
          .quick-actions-panel button {
            min-height: 100px !important;
            padding: 12px !important;
          }
          
          .quick-actions-panel button > div:first-child {
            font-size: 1.5rem !important;
            margin-bottom: 8px !important;
          }
          
          .quick-actions-panel button > div:nth-child(2) {
            font-size: 13px !important;
          }
          
          .quick-actions-panel button > div:nth-child(3) {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Capability-based quick actions factory
 * 
 * ⚠️ MIGRATION: This function now uses capability checks instead of role checks.
 * Role parameter is kept for backward compatibility but capabilities are checked.
 * 
 * @param role - User role (deprecated, kept for backward compatibility)
 * @param navigate - Navigation function
 * @param contextData - Optional context data
 * @param user - User object (optional, preferred for capability checks)
 */
export const getRoleQuickActions = (
  role: string,
  navigate: ReturnType<typeof useNavigate>,
  contextData?: {
    pendingApprovals?: number;
    urgentItems?: number;
    activePasses?: number;
  },
  user?: { role?: string } | null
): QuickAction[] => {
  const baseActions: QuickAction[] = [];

  // Super Admin & Admin - Full access (check via capabilities)
  // Check if user has user_management.read (admin capability) or reports.read
  const isAdmin = user && (hasCapability(user, 'user_management', 'read') || hasCapability(user, 'reports', 'read'));
  if (isAdmin || role === 'super_admin' || role === 'admin') {
    baseActions.push(
      {
        id: 'create-pass',
        label: 'Create Pass',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/create?type=visitor'),
        color: colors.primary,
        description: 'Visitor or vehicle',
      },
      {
        id: 'start-inspection',
        label: 'Start Inspection',
        icon: <FileText size={24} />,
        onClick: () => navigate('/app/inspections/create'),
        color: colors.success[500],
        description: 'New inspection',
      },
      {
        id: 'approve-expenses',
        label: 'Approve Expenses',
        icon: <CheckCircle size={24} />,
        onClick: () => navigate('/app/approvals?tab=expense'),
        color: contextData?.pendingApprovals ? colors.warning[500] : colors.success[500],
        description: contextData?.pendingApprovals 
          ? `${contextData.pendingApprovals} pending` 
          : 'Review pending',
      },
      {
        id: 'scan-qr',
        label: 'Quick Validation',
        icon: <QrCode size={24} />,
        onClick: () => navigate('/app/gate-pass/scan'),
        color: colors.warning[500],
        description: 'Validate pass',
      },
      {
        id: 'manage-users',
        label: 'Manage Users',
        icon: <Users size={24} />,
        onClick: () => navigate('/app/admin/users'),
        color: colors.neutral[600],
        description: 'User management',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: <BarChart3 size={24} />,
        onClick: () => navigate('/app/gate-pass/reports'),
        color: colors.primary,
        description: 'View analytics',
      }
    );
  }

  // Supervisor - Management access (check via capabilities)
  const isSupervisor = user && hasCapability(user, 'gate_pass', 'approve');
  if (isSupervisor || role === 'supervisor') {
    baseActions.push(
      {
        id: 'create-pass',
        label: 'Create Pass',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/create?type=visitor'),
        color: colors.primary,
        description: 'Visitor or vehicle',
      },
      {
        id: 'approve-expenses',
        label: 'Approve Expenses',
        icon: <CheckCircle size={24} />,
        onClick: () => navigate('/app/approvals?tab=expense'),
        color: contextData?.pendingApprovals ? colors.warning[500] : colors.success[500],
        description: contextData?.pendingApprovals 
          ? `${contextData.pendingApprovals} pending` 
          : 'Review pending',
      },
      {
        id: 'scan-qr',
        label: 'Scan QR',
        icon: <QrCode size={24} />,
        onClick: () => navigate('/app/gate-pass/scan'),
        color: colors.warning[500],
        description: 'Validate pass',
      },
      {
        id: 'view-alerts',
        label: 'View Alerts',
        icon: <Bell size={24} />,
        onClick: () => navigate('/app/alerts'),
        color: contextData?.urgentItems ? colors.error[500] : colors.warning[500],
        description: contextData?.urgentItems 
          ? `${contextData.urgentItems} urgent` 
          : 'System alerts',
      }
    );
  }

  // Guard - Entry/Exit focus (check via capabilities)
  const isGuard = user && hasCapability(user, 'gate_pass', 'validate');
  if (isGuard || role === 'guard') {
    baseActions.push(
      {
        id: 'quick-validation',
        label: 'Quick Validation',
        icon: <QrCode size={24} />,
        onClick: () => navigate('/app/gate-pass/scan'),
        color: colors.primary,
        description: 'Scan QR code',
      },
      {
        id: 'register-entry',
        label: 'Register Entry',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/guard-register'),
        color: colors.success[500],
        description: 'Manual entry',
      },
      {
        id: 'view-active',
        label: 'Active Passes',
        icon: <ClipboardList size={24} />,
        onClick: () => navigate('/app/gate-pass?filter=active'),
        color: colors.primary,
        description: contextData?.activePasses 
          ? `${contextData.activePasses} active` 
          : 'View all',
      }
    );
  }

  // Inspector - Inspection focus (check via capabilities)
  const isInspector = user && hasCapability(user, 'inspection', 'create');
  if (isInspector || role === 'inspector') {
    baseActions.push(
      {
        id: 'start-inspection',
        label: 'Start Inspection',
        icon: <FileText size={24} />,
        onClick: () => navigate('/app/inspections/create'),
        color: colors.primary,
        description: 'New inspection',
      },
      {
        id: 'view-pending',
        label: 'Pending Inspections',
        icon: <AlertCircle size={24} />,
        onClick: () => navigate('/app/inspections?filter=pending'),
        color: colors.warning[500],
        description: 'View pending',
      },
      {
        id: 'inspection-reports',
        label: 'Reports',
        icon: <BarChart3 size={24} />,
        onClick: () => navigate('/app/inspections/reports'),
        color: colors.primary,
        description: 'View analytics',
      }
    );
  }

  // Clerk - Administrative tasks (check via capabilities)
  const isClerk = user && hasCapability(user, 'gate_pass', 'create');
  if (isClerk || role === 'clerk') {
    baseActions.push(
      {
        id: 'create-pass',
        label: 'Create Pass',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/create?type=visitor'),
        color: colors.primary,
        description: 'Visitor or vehicle',
      },
      {
        id: 'view-passes',
        label: 'View Passes',
        icon: <ClipboardList size={24} />,
        onClick: () => navigate('/app/gate-pass'),
        color: colors.primary,
        description: 'All passes',
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: <Calendar size={24} />,
        onClick: () => navigate('/app/gate-pass/calendar'),
        color: colors.success[500],
        description: 'Schedule view',
      }
    );
  }

  // Common actions for all roles
  baseActions.push(
    {
      id: 'create-expense',
      label: 'Create Expense',
      icon: <DollarSign size={24} />,
      onClick: () => navigate('/app/expenses/create'),
      color: colors.success[500],
      description: 'Add expense',
    }
  );

  // Stockyard access for relevant roles (check via capabilities)
  const hasStockyardAccess = user && hasCapability(user, 'stockyard', 'read');
  if (hasStockyardAccess || role === 'super_admin' || role === 'admin' || role === 'supervisor' || role === 'clerk') {
    baseActions.push(
      {
        id: 'stockyard',
        label: 'Stockyard',
        icon: <Warehouse size={24} />,
        onClick: () => navigate('/app/stockyard'),
        color: colors.warning[500],
        description: 'Manage stockyard',
      }
    );
  }

  // Deduplicate actions by ID (keep first occurrence)
  const seenIds = new Set<string>();
  const uniqueActions = baseActions.filter(action => {
    if (seenIds.has(action.id)) {
      return false;
    }
    seenIds.add(action.id);
    return true;
  });

  return uniqueActions;
};

export default QuickActionsPanel;


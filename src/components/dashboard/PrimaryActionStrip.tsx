/**
 * Primary Action Strip Component
 * 
 * Role-optimized primary actions displayed prominently at the top of the dashboard
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import {
  QrCode,
  Plus,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  ClipboardList,
  Wallet,
  Warehouse,
  Users,
  AlertTriangle,
  Clock,
  History,
} from 'lucide-react';

interface PrimaryAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  route: string;
  variant: 'primary' | 'secondary' | 'success' | 'warning';
  badge?: number | null;
}

interface PrimaryActionStripProps {
  role?: string;
  stats?: {
    pendingApprovals?: number;
    urgentItems?: number;
    activePasses?: number;
  };
}

export const PrimaryActionStrip: React.FC<PrimaryActionStripProps> = ({ role, stats }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRoleActions = (): PrimaryAction[] => {
    switch (role) {
      case 'guard':
        return [
          {
            id: 'scan',
            label: 'Scan Pass',
            icon: QrCode,
            route: '/app/gate-pass/scan',
            variant: 'primary',
          },
          {
            id: 'expected',
            label: 'Expected',
            icon: Clock,
            route: '/app/gate-pass?filter=expected',
            variant: 'secondary',
          },
          {
            id: 'inside',
            label: 'Inside Now',
            icon: Users,
            route: '/app/gate-pass?filter=inside',
            variant: 'secondary',
            badge: stats?.activePasses || null,
          },
        ];

      case 'inspector':
        return [
          {
            id: 'new-inspection',
            label: 'New Inspection',
            icon: Plus,
            route: '/app/inspections/create',
            variant: 'primary',
          },
          {
            id: 'my-inspections',
            label: 'My Inspections',
            icon: FileText,
            route: '/app/inspections?filter=mine',
            variant: 'secondary',
          },
          {
            id: 'completed',
            label: 'Completed',
            icon: CheckCircle,
            route: '/app/inspections/completed',
            variant: 'secondary',
          },
        ];

      case 'clerk':
        return [
          {
            id: 'create-visitor-pass',
            label: 'Visitor Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=visitor',
            variant: 'primary',
          },
          {
            id: 'create-vehicle-pass',
            label: 'Vehicle Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=vehicle_inbound',
            variant: 'primary',
          },
          {
            id: 'create-expense',
            label: 'Create Expense',
            icon: Wallet,
            route: '/app/expenses/create',
            variant: 'secondary',
          },
          {
            id: 'gate-passes',
            label: 'Gate Passes',
            icon: ClipboardList,
            route: '/app/stockyard/access',
            variant: 'secondary',
          },
        ];

      case 'supervisor':
      case 'yard_incharge':
        return [
          {
            id: 'approvals',
            label: 'Approvals',
            icon: CheckCircle,
            route: '/app/approvals',
            variant: 'primary',
            badge: stats?.pendingApprovals || null,
          },
          {
            id: 'alerts',
            label: 'Alerts',
            icon: AlertTriangle,
            route: '/app/alerts',
            variant: 'warning',
            badge: stats?.urgentItems || null,
          },
          {
            id: 'gate-passes',
            label: 'Gate Passes',
            icon: ClipboardList,
            route: '/app/gate-pass',
            variant: 'secondary',
          },
        ];

      case 'executive':
        return [
          {
            id: 'create-visitor-pass',
            label: 'Visitor Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=visitor',
            variant: 'primary',
          },
          {
            id: 'create-vehicle-pass',
            label: 'Vehicle Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=vehicle_inbound',
            variant: 'primary',
          },
          {
            id: 'expenses',
            label: 'Expenses',
            icon: Wallet,
            route: '/app/expenses',
            variant: 'secondary',
          },
          {
            id: 'gate-passes',
            label: 'Gate Passes',
            icon: ClipboardList,
            route: '/app/stockyard/access',
            variant: 'secondary',
          },
        ];

      case 'admin':
      case 'super_admin':
        return [
          {
            id: 'approvals',
            label: 'Approvals',
            icon: CheckCircle,
            route: '/app/approvals',
            variant: 'primary',
            badge: stats?.pendingApprovals || null,
          },
          {
            id: 'create-visitor-pass',
            label: 'Visitor Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=visitor',
            variant: 'success',
          },
          {
            id: 'create-vehicle-pass',
            label: 'Vehicle Pass',
            icon: Plus,
            route: '/app/stockyard/access/create?type=vehicle_inbound',
            variant: 'success',
          },
          {
            id: 'bulk-create',
            label: 'Bulk Create',
            icon: FileSpreadsheet,
            route: '/app/stockyard/access/bulk',
            variant: 'warning',
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: Warehouse,
            route: '/app/expenses/analytics',
            variant: 'secondary',
          },
          {
            id: 'users',
            label: 'Users',
            icon: Users,
            route: '/app/admin/users',
            variant: 'secondary',
          },
        ];

      default:
        return [];
    }
  };

  const actions = getRoleActions();

  if (actions.length === 0) {
    return null;
  }

  const getVariantStyles = (variant: PrimaryAction['variant']) => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
          color: 'white',
          border: `1px solid ${colors.primary}`,
        };
      case 'success':
        return {
          background: `linear-gradient(135deg, ${colors.success[500]} 0%, ${colors.success[600]} 100%)`,
          color: 'white',
          border: `1px solid ${colors.success[500]}`,
        };
      case 'warning':
        return {
          background: `linear-gradient(135deg, ${colors.warning[500]} 0%, ${colors.warning[600]} 100%)`,
          color: 'white',
          border: `1px solid ${colors.warning[500]}`,
        };
      default:
        return {
          background: 'white',
          color: colors.neutral[700],
          border: `1px solid ${colors.neutral[300]}`,
        };
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.md,
        marginBottom: spacing.xl,
        flexWrap: 'wrap',
      }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const variantStyles = getVariantStyles(action.variant);

        return (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            style={{
              flex: '1 1 auto',
              minWidth: '140px',
              maxWidth: action.variant === 'primary' ? '220px' : '180px',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              border: variantStyles.border,
              background: variantStyles.background,
              color: variantStyles.color,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              position: 'relative',
              boxShadow: action.variant === 'primary' ? shadows.md : 'none',
              transition: 'all 0.2s ease',
              fontWeight: 600,
              fontSize: '14px',
            }}
            onMouseEnter={(e) => {
              if (window.matchMedia('(hover: hover)').matches) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.lg;
              }
            }}
            onMouseLeave={(e) => {
              if (window.matchMedia('(hover: hover)').matches) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = action.variant === 'primary' ? shadows.md : 'none';
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onTouchEnd={(e) => {
              setTimeout(() => {
                e.currentTarget.style.transform = 'scale(1)';
              }, 150);
            }}
          >
            <Icon size={24} />
            <span>{action.label}</span>
            {action.badge !== null && action.badge !== undefined && action.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: colors.error[500],
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: `2px solid ${variantStyles.background.includes('gradient') ? 'transparent' : 'white'}`,
                }}
              >
                {action.badge > 9 ? '9+' : action.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};



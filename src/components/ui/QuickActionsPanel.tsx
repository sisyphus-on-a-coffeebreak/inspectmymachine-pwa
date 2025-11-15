/**
 * QuickActionsPanel Component
 * 
 * Role-specific quick actions panel for common tasks
 * Displays contextual actions based on user role
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Plus, Search, FileText, CheckCircle, AlertCircle, QrCode } from 'lucide-react';

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
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  title = 'Quick Actions',
  actions,
  columns = 3,
  className = '',
}) => {
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: spacing.md,
        }}
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
              padding: spacing.lg,
              backgroundColor: 'white',
              border: `2px solid ${action.color || colors.primary}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              minHeight: '120px',
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
      </div>
    </div>
  );
};

/**
 * Role-based quick actions factory
 */
export const getRoleQuickActions = (
  role: string,
  navigate: ReturnType<typeof useNavigate>
): QuickAction[] => {
  const baseActions: QuickAction[] = [];

  // Common actions for all roles
  if (role === 'super_admin' || role === 'admin' || role === 'supervisor') {
    baseActions.push(
      {
        id: 'create-pass',
        label: 'Create Pass',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/create-visitor'),
        color: colors.primary,
        description: 'Visitor or vehicle',
      },
      {
        id: 'approve-expenses',
        label: 'Approve Expenses',
        icon: <CheckCircle size={24} />,
        onClick: () => navigate('/app/expenses/approval'),
        color: colors.success[500],
        description: 'Review pending',
      }
    );
  }

  if (role === 'super_admin' || role === 'admin') {
    baseActions.push(
      {
        id: 'start-inspection',
        label: 'Start Inspection',
        icon: <FileText size={24} />,
        onClick: () => navigate('/app/inspections/new'),
        color: colors.primary,
        description: 'New inspection',
      },
      {
        id: 'scan-qr',
        label: 'Scan QR',
        icon: <QrCode size={24} />,
        onClick: () => navigate('/app/gate-pass/validation'),
        color: colors.warning[500],
        description: 'Validate pass',
      }
    );
  }

  if (role === 'guard') {
    baseActions.push(
      {
        id: 'scan-qr',
        label: 'Scan QR',
        icon: <QrCode size={24} />,
        onClick: () => navigate('/app/gate-pass/validation'),
        color: colors.primary,
        description: 'Validate pass',
      },
      {
        id: 'register-entry',
        label: 'Register Entry',
        icon: <Plus size={24} />,
        onClick: () => navigate('/app/gate-pass/guard-register'),
        color: colors.success[500],
        description: 'Manual entry',
      }
    );
  }

  if (role === 'inspector') {
    baseActions.push(
      {
        id: 'start-inspection',
        label: 'Start Inspection',
        icon: <FileText size={24} />,
        onClick: () => navigate('/app/inspections/new'),
        color: colors.primary,
        description: 'New inspection',
      },
      {
        id: 'view-pending',
        label: 'View Pending',
        icon: <AlertCircle size={24} />,
        onClick: () => navigate('/app/inspections?filter=pending'),
        color: colors.warning[500],
        description: 'Pending items',
      }
    );
  }

  // Common actions
  baseActions.push(
    {
      id: 'create-expense',
      label: 'Create Expense',
      icon: <Plus size={24} />,
      onClick: () => navigate('/app/expenses/create'),
      color: colors.success[500],
      description: 'Add expense',
    }
  );

  return baseActions;
};

export default QuickActionsPanel;


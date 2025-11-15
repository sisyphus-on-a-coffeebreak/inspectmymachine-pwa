/**
 * ContextualGuidance Component
 * 
 * Role-based contextual guidance widgets
 * Shows relevant information based on user role and current context
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Clock, CheckCircle, AlertCircle, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { DrillDownChip, DrillDownChipGroup } from './DrillDownChip';

export interface GuidanceItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  count?: number;
}

export interface ContextualGuidanceProps {
  title: string;
  items: GuidanceItem[];
  variant?: 'default' | 'compact';
  className?: string;
}

export const ContextualGuidance: React.FC<ContextualGuidanceProps> = ({
  title,
  items,
  variant = 'default',
  className = '',
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`contextual-guidance ${className}`}
      style={{
        ...cardStyles.base,
        padding: variant === 'compact' ? spacing.md : spacing.lg,
      }}
    >
      <h3
        style={{
          ...typography.subheader,
          fontSize: variant === 'compact' ? '16px' : '18px',
          color: colors.neutral[900],
          marginBottom: spacing.md,
          marginTop: 0,
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: variant === 'compact' ? spacing.sm : spacing.md,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={item.action?.onClick}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.md,
              padding: variant === 'compact' ? spacing.sm : spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[200]}`,
              cursor: item.action ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (item.action) {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (item.action) {
                e.currentTarget.style.backgroundColor = colors.neutral[50];
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
            onFocus={(e) => {
              if (item.action) {
                e.currentTarget.style.outline = `2px solid ${colors.primary}`;
                e.currentTarget.style.outlineOffset = '2px';
              }
            }}
            onBlur={(e) => {
              if (item.action) {
                e.currentTarget.style.outline = 'none';
              }
            }}
            tabIndex={item.action ? 0 : -1}
            role={item.action ? 'button' : undefined}
            aria-label={item.action ? `${item.title}: ${item.description}. ${item.action.label}` : item.title}
            onKeyDown={(e) => {
              if (item.action && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                item.action.onClick();
              }
            }}
          >
            <div
              style={{
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  ...typography.body,
                  fontWeight: 600,
                  color: colors.neutral[900],
                  marginBottom: spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {item.title}
                {item.count !== undefined && (
                  <span
                    style={{
                      backgroundColor: item.color + '20',
                      color: item.color,
                      padding: `2px ${spacing.xs}`,
                      borderRadius: borderRadius.sm,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </div>
              <div
                style={{
                  ...typography.bodySmall,
                  color: colors.neutral[600],
                  marginBottom: item.action ? spacing.xs : 0,
                }}
              >
                {item.description}
              </div>
              {item.action && (
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: '12px',
                    color: item.color,
                    fontWeight: 600,
                    marginTop: spacing.xs,
                  }}
                >
                  → {item.action.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Role-based guidance factory
 */
export const getRoleGuidance = (
  role: string,
  navigate: ReturnType<typeof useNavigate>,
  stats?: {
    pendingApprovals?: number;
    pendingTasks?: number;
    recentActivity?: number;
    todaySchedule?: number;
  }
): GuidanceItem[] => {
  const items: GuidanceItem[] = [];

  // Pending Approvals (for supervisors/admins)
  if ((role === 'super_admin' || role === 'admin' || role === 'supervisor') && stats?.pendingApprovals) {
    items.push({
      id: 'pending-approvals',
      title: 'Your Pending Approvals',
      description: `${stats.pendingApprovals} item${stats.pendingApprovals > 1 ? 's' : ''} waiting for your review`,
      icon: <CheckCircle size={20} />,
      color: colors.warning[500],
      count: stats.pendingApprovals,
      action: {
        label: 'Review Now',
        onClick: () => navigate('/app/expenses/approval?filter=pending'),
      },
    });
  }

  // Today's Schedule (for all roles)
  if (stats?.todaySchedule) {
    items.push({
      id: 'today-schedule',
      title: "Today's Schedule",
      description: `${stats.todaySchedule} item${stats.todaySchedule > 1 ? 's' : ''} scheduled for today`,
      icon: <Clock size={20} />,
      color: colors.primary,
      count: stats.todaySchedule,
      action: {
        label: 'View Schedule',
        onClick: () => navigate('/app/gate-pass/calendar'),
      },
    });
  }

  // Recent Activity
  if (stats?.recentActivity) {
    items.push({
      id: 'recent-activity',
      title: 'Recent Activity',
      description: `${stats.recentActivity} new item${stats.recentActivity > 1 ? 's' : ''} in the last 24 hours`,
      icon: <TrendingUp size={20} />,
      color: colors.success[500],
      count: stats.recentActivity,
      action: {
        label: 'View Activity',
        onClick: () => navigate('/dashboard'),
      },
    });
  }

  // Pending Tasks (for inspectors)
  if (role === 'inspector' && stats?.pendingTasks) {
    items.push({
      id: 'pending-tasks',
      title: 'Pending Inspections',
      description: `${stats.pendingTasks} inspection${stats.pendingTasks > 1 ? 's' : ''} waiting to be completed`,
      icon: <FileText size={20} />,
      color: colors.warning[500],
      count: stats.pendingTasks,
      action: {
        label: 'Start Inspection',
        onClick: () => navigate('/app/inspections/new'),
      },
    });
  }

  // Urgent Items (for all roles)
  if (stats?.pendingApprovals && stats.pendingApprovals > 5) {
    items.push({
      id: 'urgent-items',
      title: 'Urgent Attention Required',
      description: 'Multiple items require immediate attention',
      icon: <AlertCircle size={20} />,
      color: colors.error[500],
      action: {
        label: 'View Urgent Items',
        onClick: () => navigate('/dashboard?filter=urgent'),
      },
    });
  }

  return items;
};

export default ContextualGuidance;


/**
 * Action Cards Component
 * Displays clickable action cards for various gate pass operations
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '@/lib/theme';
import { ActionGrid } from '@/components/ui/ResponsiveGrid';

interface ActionCard {
  icon: string;
  title: string;
  description: string;
  path: string;
  borderColor: string;
  hoverShadowColor: string;
}

const ACTION_CARDS: ActionCard[] = [
  {
    icon: '👥',
    title: 'Create Visitor Pass',
    description: 'For clients & inspections',
    path: '/app/gate-pass/create?type=visitor',
    borderColor: colors.primary,
    hoverShadowColor: 'rgba(37, 99, 235, 0.15)',
  },
  {
    icon: '🚛',
    title: 'Vehicle Going Out',
    description: 'RTO, sale, test drive',
    path: '/app/gate-pass/create?type=outbound',
    borderColor: colors.brand,
    hoverShadowColor: 'rgba(235, 139, 0, 0.15)',
  },
  {
    icon: '🚗',
    title: 'Vehicle Coming In',
    description: 'New vehicle arriving',
    path: '/app/gate-pass/create?type=inbound',
    borderColor: colors.success,
    hoverShadowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: '📊',
    title: 'View Guard Register',
    description: "Today's activity log",
    path: '/app/gate-pass/guard-register',
    borderColor: colors.success,
    hoverShadowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: '📈',
    title: 'Reports & Analytics',
    description: 'Comprehensive reporting and analytics',
    path: '/app/gate-pass/reports',
    borderColor: colors.primary,
    hoverShadowColor: 'rgba(59, 130, 246, 0.15)',
  },
  {
    icon: '📋',
    title: 'Pass Templates',
    description: 'Saved templates for common passes',
    path: '/app/gate-pass/templates',
    borderColor: colors.status.warning,
    hoverShadowColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    icon: '👥',
    title: 'Visitor Management',
    description: 'Manage visitor database and history',
    path: '/app/gate-pass/visitors',
    borderColor: colors.status.normal,
    hoverShadowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: '📅',
    title: 'Calendar View',
    description: 'Calendar view of all gate passes',
    path: '/app/gate-pass/calendar',
    borderColor: colors.status.error,
    hoverShadowColor: 'rgba(239, 68, 68, 0.15)',
  },
  {
    icon: '🚀',
    title: 'Quick Validation',
    description: 'Fast QR scanning for guards',
    path: '/app/gate-pass/quick-validation',
    borderColor: colors.brand,
    hoverShadowColor: 'rgba(235, 139, 0, 0.15)',
  },
  {
    icon: '🛡️',
    title: 'Full Validation',
    description: 'Detailed validation with notes',
    path: '/app/gate-pass/validation',
    borderColor: colors.primary,
    hoverShadowColor: 'rgba(37, 99, 235, 0.15)',
  },
  {
    icon: '✅',
    title: 'Pass Approval',
    description: 'Multi-level approval workflow',
    path: '/app/gate-pass/approval',
    borderColor: colors.status.success,
    hoverShadowColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    icon: '🔄',
    title: 'Bulk Operations',
    description: 'Bulk create, update, and export',
    path: '/app/gate-pass/bulk',
    borderColor: colors.status.normal,
    hoverShadowColor: 'rgba(16, 185, 129, 0.15)',
  },
];

export const ActionCards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ActionGrid gap="lg">
      {ACTION_CARDS.map((card) => (
        <div
          key={card.path}
          onClick={() => navigate(card.path)}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${card.borderColor}`,
            position: 'relative' as const,
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = `0 8px 25px ${card.hoverShadowColor}`;
            e.currentTarget.style.borderColor = card.borderColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = card.borderColor;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            {card.icon}
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            {card.title}
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            {card.description}
          </div>
        </div>
      ))}
    </ActionGrid>
  );
};


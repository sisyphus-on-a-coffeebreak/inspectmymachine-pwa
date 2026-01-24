/**
 * Today's Activity Widget
 * 
 * Shows summary of today's activity across modules with drill-down
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats } from '@/lib/queries';
import { colors, spacing, typography } from '@/lib/theme';
import { Activity } from 'lucide-react';
import { getDrillDownUrl } from '@/lib/utils/drillDown';

export function TodaysActivityWidget() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ color: colors.neutral[400] }}>Loading activity...</div>
      </div>
    );
  }

  const activities = [
    {
      label: 'Gate Passes',
      value: stats?.gate_pass?.completed_today || 0,
      color: colors.primary,
      url: getDrillDownUrl('gate_pass_completed_today'),
    },
    {
      label: 'Inspections',
      value: stats?.inspection?.completed_today || 0,
      color: colors.success[500],
      url: getDrillDownUrl('inspection_completed_today'),
    },
    {
      label: 'Expenses',
      value: stats?.expense?.pending_approval || 0,
      color: colors.warning[500],
      url: getDrillDownUrl('expense_pending_approval'),
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Activity size={24} color={colors.primary} />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: colors.neutral[900],
            margin: 0,
          }}
        >
          Today's Activity
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {activities.map((activity) => (
          <div
            key={activity.label}
            onClick={() => activity.url && navigate(activity.url)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.sm,
              backgroundColor: colors.neutral[50],
              borderRadius: '8px',
              cursor: activity.url ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activity.url && window.matchMedia('(hover: hover)').matches) {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
                e.currentTarget.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activity.url && window.matchMedia('(hover: hover)').matches) {
                e.currentTarget.style.backgroundColor = colors.neutral[50];
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
            title={activity.url ? `Click to view ${activity.label}` : undefined}
          >
            <span style={{ color: colors.neutral[700] }}>{activity.label}</span>
            <span
              style={{
                fontWeight: 600,
                fontSize: '18px',
                color: activity.color,
              }}
            >
              {activity.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}














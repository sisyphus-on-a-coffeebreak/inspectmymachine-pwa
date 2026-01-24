/**
 * Kanban Widget
 * 
 * Displays task board (completed, pending, urgent)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '@/types/widgets';
import { colors, spacing, typography } from '@/lib/theme';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const KanbanWidget: React.FC<WidgetProps> = ({ config, data }) => {
  const navigate = useNavigate();
  const kanban = data?.kanban;

  if (!kanban) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.neutral[600] }}>
        No kanban data available
      </div>
    );
  }

  const columns = [
    {
      title: 'Completed Today',
      items: kanban.completed_today || [],
      icon: <CheckCircle size={20} color={colors.status.normal} />,
      color: colors.status.normal,
    },
    {
      title: 'Pending Tasks',
      items: kanban.pending_tasks || [],
      icon: <Clock size={20} color={colors.status.warning} />,
      color: colors.status.warning,
    },
    {
      title: 'Urgent Items',
      items: kanban.urgent_items || [],
      icon: <AlertCircle size={20} color={colors.status.critical} />,
      color: colors.status.critical,
    },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: `repeat(${columns.length}, 1fr)`, 
      gap: spacing.md 
    }}>
      {columns.map((column) => (
        <div
          key={column.title}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: spacing.md,
            border: `1px solid ${column.color}20`,
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: spacing.sm, 
            marginBottom: spacing.md 
          }}>
            {column.icon}
            <h4 style={{ 
              ...typography.subheader,
              fontSize: '14px',
              color: colors.neutral[900],
              margin: 0,
            }}>
              {column.title}
            </h4>
            <span style={{
              padding: '2px 8px',
              background: `${column.color}20`,
              borderRadius: '12px',
              fontSize: '12px',
              color: column.color,
              fontWeight: 600,
            }}>
              {column.items.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {column.items.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                onClick={() => item.url && navigate(item.url)}
                style={{
                  padding: spacing.sm,
                  background: colors.neutral[50],
                  borderRadius: '8px',
                  cursor: item.url ? 'pointer' : 'default',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ color: colors.neutral[600], fontSize: '11px' }}>
                    {item.subtitle}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


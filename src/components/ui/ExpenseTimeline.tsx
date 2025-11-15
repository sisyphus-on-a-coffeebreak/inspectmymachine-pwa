/**
 * Expense Timeline Component
 * 
 * Displays approval history and status changes for an expense
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { CheckCircle2, Clock, XCircle, User, FileText, Calendar } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'updated' | 'comment';
  timestamp: string | Date;
  actor?: {
    name: string;
    role?: string;
  };
  comment?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ExpenseTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const eventConfig = {
  created: {
    icon: FileText,
    color: colors.primary,
    label: 'Created',
  },
  submitted: {
    icon: Clock,
    color: colors.warning[500],
    label: 'Submitted',
  },
  approved: {
    icon: CheckCircle2,
    color: colors.success[500],
    label: 'Approved',
  },
  rejected: {
    icon: XCircle,
    color: colors.error[500],
    label: 'Rejected',
  },
  updated: {
    icon: FileText,
    color: colors.neutral[500],
    label: 'Updated',
  },
  comment: {
    icon: User,
    color: colors.neutral[600],
    label: 'Comment',
  },
};

export const ExpenseTimeline: React.FC<ExpenseTimelineProps> = ({
  events,
  className = '',
}) => {
  if (!events || events.length === 0) {
    return (
      <div
        className={`expense-timeline ${className}`}
        style={{
          padding: spacing.lg,
          backgroundColor: colors.neutral[50],
          borderRadius: borderRadius.md,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📅</div>
        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
          No timeline events available
        </div>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA; // Descending order
  });

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div
      className={`expense-timeline ${className}`}
      style={{
        position: 'relative',
        paddingLeft: spacing.xl,
      }}
    >
      {/* Timeline line */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: colors.neutral[200],
        }}
      />

      {sortedEvents.map((event, index) => {
        const config = eventConfig[event.type] || eventConfig.updated;
        const Icon = config.icon;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div
            key={event.id}
            style={{
              position: 'relative',
              marginBottom: isLast ? 0 : spacing.lg,
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: '-28px',
                top: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: `3px solid ${config.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Icon size={10} color={config.color} />
            </div>

            {/* Event content */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                border: `1px solid ${colors.neutral[200]}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: event.comment || event.actor ? spacing.xs : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <div
                    style={{
                      padding: '4px 8px',
                      backgroundColor: config.color + '20',
                      borderRadius: borderRadius.sm,
                      color: config.color,
                      ...typography.label,
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {config.label}
                  </div>
                  {event.status && (
                    <div
                      style={{
                        padding: '4px 8px',
                        backgroundColor: colors.neutral[100],
                        borderRadius: borderRadius.sm,
                        color: colors.neutral[700],
                        ...typography.label,
                        fontSize: '11px',
                      }}
                    >
                      {event.status}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: '11px',
                    color: colors.neutral[500],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <Calendar size={12} />
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>

              {event.actor && (
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: '12px',
                    color: colors.neutral[600],
                    marginBottom: event.comment ? spacing.xs : 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <User size={12} />
                  {event.actor.name}
                  {event.actor.role && (
                    <span style={{ color: colors.neutral[500] }}>
                      ({event.actor.role})
                    </span>
                  )}
                </div>
              )}

              {event.comment && (
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: '12px',
                    color: colors.neutral[700],
                    padding: spacing.sm,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.sm,
                    marginTop: spacing.xs,
                    fontStyle: 'italic',
                  }}
                >
                  "{event.comment}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseTimeline;


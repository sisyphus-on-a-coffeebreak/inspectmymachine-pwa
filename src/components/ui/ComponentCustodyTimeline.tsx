/**
 * Component Custody Timeline Component
 * 
 * Displays custody history for a component (install, remove, transfer events)
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Package, ArrowRight, User, CheckCircle2, Clock, Car } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface CustodyHistoryEvent {
  id: string;
  transfer_type: 'install' | 'remove' | 'transfer';
  from_vehicle?: {
    id: string;
    registration_number: string;
  } | null;
  to_vehicle?: {
    id: string;
    registration_number: string;
  } | null;
  transferred_by?: {
    id: string;
    name: string;
  } | null;
  approved_by?: {
    id: string;
    name: string;
  } | null;
  reason?: string | null;
  transferred_at: string | Date;
  created_at?: string | Date;
}

export interface ComponentCustodyTimelineProps {
  events: CustodyHistoryEvent[];
  className?: string;
}

const eventConfig = {
  install: {
    icon: Package,
    color: colors.success[500],
    label: 'Installed',
    bgColor: colors.success[50],
  },
  remove: {
    icon: Package,
    color: colors.error[500],
    label: 'Removed',
    bgColor: colors.error[50],
  },
  transfer: {
    icon: ArrowRight,
    color: colors.primary,
    label: 'Transferred',
    bgColor: colors.primary + '10',
  },
};

export const ComponentCustodyTimeline: React.FC<ComponentCustodyTimelineProps> = ({
  events,
  className = '',
}) => {
  if (!events || events.length === 0) {
    return (
      <div
        className={`component-custody-timeline ${className}`}
        style={{
          padding: spacing.lg,
          backgroundColor: colors.neutral[50],
          borderRadius: borderRadius.md,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📦</div>
        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
          No custody history available
        </div>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = new Date(a.transferred_at).getTime();
    const timeB = new Date(b.transferred_at).getTime();
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
      className={`component-custody-timeline ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      {sortedEvents.map((event, index) => {
        const config = eventConfig[event.transfer_type] || eventConfig.transfer;
        const Icon = config.icon;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div
            key={event.id}
            style={{
              position: 'relative',
              paddingLeft: spacing.xl + spacing.sm,
            }}
          >
            {/* Timeline line */}
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '40px',
                  bottom: '-16px',
                  width: '2px',
                  backgroundColor: colors.neutral[200],
                }}
              />
            )}

            {/* Icon */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: config.bgColor,
                border: `2px solid ${config.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Icon size={18} color={config.color} />
            </div>

            {/* Event content */}
            <div
              style={{
                backgroundColor: 'white',
                border: `1px solid ${colors.neutral[200]}`,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <span style={{ ...typography.body, fontWeight: 600, color: config.color }}>
                      {config.label}
                    </span>
                    {event.approved_by && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <CheckCircle2 size={14} color={colors.success[500]} />
                        <span style={{ ...typography.caption, color: colors.success[600] }}>
                          Approved
                        </span>
                      </div>
                    )}
                    {!event.approved_by && event.transfer_type === 'transfer' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Clock size={14} color={colors.warning[500]} />
                        <span style={{ ...typography.caption, color: colors.warning[600] }}>
                          Pending Approval
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Vehicle information */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.xs }}>
                    {event.from_vehicle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Car size={14} color={colors.neutral[500]} />
                        <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                          From: <strong>{event.from_vehicle.registration_number}</strong>
                        </span>
                      </div>
                    )}
                    {event.to_vehicle && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Car size={14} color={colors.primary} />
                        <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                          To: <strong>{event.to_vehicle.registration_number}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  {event.reason && (
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
                      {event.reason}
                    </div>
                  )}

                  {/* Actor information */}
                  {event.transferred_by && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
                      <User size={14} color={colors.neutral[500]} />
                      <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                        by {event.transferred_by.name}
                      </span>
                      {event.approved_by && event.approved_by.id !== event.transferred_by.id && (
                        <>
                          <span style={{ ...typography.caption, color: colors.neutral[400] }}>•</span>
                          <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                            approved by {event.approved_by.name}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ textAlign: 'right', marginLeft: spacing.md }}>
                  <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                    {formatTimestamp(event.transferred_at)}
                  </div>
                  <div style={{ ...typography.caption, color: colors.neutral[400], marginTop: spacing.xs }}>
                    {formatDistanceToNow(new Date(event.transferred_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};






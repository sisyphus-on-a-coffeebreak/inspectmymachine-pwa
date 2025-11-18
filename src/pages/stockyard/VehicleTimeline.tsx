/**
 * Vehicle Timeline View
 * 
 * Cross-module timeline showing all events for a vehicle (gate entries, inspections, expenses, components, documents)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useVehicleTimeline } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import {
  ArrowLeft,
  LogIn,
  LogOut,
  FileText,
  DollarSign,
  Package,
  Upload,
  CheckCircle2,
  Calendar,
  Filter,
  Car,
} from 'lucide-react';
import type { VehicleTimelineEvent } from '../../lib/stockyard';

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  gate_entry: {
    icon: LogIn,
    color: colors.success[600],
    bgColor: colors.success[50],
    label: 'Gate Entry',
  },
  gate_exit: {
    icon: LogOut,
    color: colors.warning[600],
    bgColor: colors.warning[50],
    label: 'Gate Exit',
  },
  inspection: {
    icon: FileText,
    color: colors.primary,
    bgColor: colors.primary + '15',
    label: 'Inspection',
  },
  expense: {
    icon: DollarSign,
    color: colors.error[600],
    bgColor: colors.error[50],
    label: 'Expense',
  },
  component_install: {
    icon: Package,
    color: colors.success[600],
    bgColor: colors.success[50],
    label: 'Component Installed',
  },
  component_remove: {
    icon: Package,
    color: colors.warning[600],
    bgColor: colors.warning[50],
    label: 'Component Removed',
  },
  document_upload: {
    icon: Upload,
    color: colors.primary,
    bgColor: colors.primary + '15',
    label: 'Document Uploaded',
  },
  checklist_complete: {
    icon: CheckCircle2,
    color: colors.success[600],
    bgColor: colors.success[50],
    label: 'Checklist Completed',
  },
};

export const VehicleTimeline: React.FC = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: events, isLoading, isError, error, refetch } = useVehicleTimeline(
    vehicleId || '',
    {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      event_types: eventTypeFilter !== 'all' ? [eventTypeFilter] : undefined,
    }
  );

  const handleEventClick = (event: VehicleTimelineEvent) => {
    if (event.stockyard_request_id) {
      navigate(`/app/stockyard/${event.stockyard_request_id}`);
    } else if (event.inspection_id) {
      navigate(`/app/inspections/${event.inspection_id}`);
    } else if (event.expense_id) {
      navigate(`/app/expenses/${event.expense_id}`);
    } else if (event.component_id) {
      // Navigate to component details - need to know type
      navigate(`/app/stockyard/components/${event.metadata?.component_type || 'battery'}/${event.component_id}`);
    } else if (event.document_id) {
      // Show document modal or navigate
      showToast({
        title: 'Document',
        description: 'Document details view coming soon',
        variant: 'info',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Vehicle Timeline" subtitle="Complete event history" icon={<Calendar size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Vehicle Timeline" subtitle="Complete event history" icon={<Calendar size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const timelineEvents = events || [];
  const eventTypes = Array.from(new Set(timelineEvents.map((e) => e.event_type)));

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back
        </Button>
        <PageHeader
          title="Vehicle Timeline"
          subtitle={`Complete event history for vehicle ${vehicleId?.substring(0, 8)}...`}
          icon={<Calendar size={24} />}
        />
      </div>

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Filter size={18} color={colors.neutral[600]} />
            <span style={{ ...typography.body, fontWeight: 600 }}>Filters:</span>
          </div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          >
            <option value="all">All Event Types</option>
            {eventTypes.map((type) => {
              const config = eventConfig[type] || eventConfig.gate_entry;
              return (
                <option key={type} value={type}>
                  {config.label}
                </option>
              );
            })}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From Date"
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To Date"
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          />
          {(dateFrom || dateTo || eventTypeFilter !== 'all') && (
            <Button
              variant="secondary"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setEventTypeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timelineEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar size={48} />}
          title="No Timeline Events"
          description="No events found for this vehicle"
        />
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Timeline line */}
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: 0,
              bottom: 0,
              width: '2px',
              backgroundColor: colors.neutral[200],
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {timelineEvents
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((event, index) => {
                const config = eventConfig[event.event_type] || eventConfig.gate_entry;
                const Icon = config.icon;
                const isLast = index === timelineEvents.length - 1;

                return (
                  <div
                    key={event.id}
                    style={{
                      position: 'relative',
                      paddingLeft: spacing.xl + spacing.sm,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Timeline dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: config.bgColor,
                        border: `3px solid ${config.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                      }}
                    >
                      <Icon size={18} color={config.color} />
                    </div>

                    {/* Event card */}
                    <div
                      style={{
                        ...cardStyles.card,
                        borderLeft: `4px solid ${config.color}`,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                            <span
                              style={{
                                padding: '4px 12px',
                                backgroundColor: config.bgColor,
                                color: config.color,
                                borderRadius: borderRadius.md,
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {config.label}
                            </span>
                          </div>
                          <div style={{ ...typography.body, marginBottom: spacing.xs }}>
                            {event.description}
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div
                              style={{
                                marginTop: spacing.sm,
                                padding: spacing.sm,
                                backgroundColor: colors.neutral[50],
                                borderRadius: borderRadius.sm,
                                ...typography.caption,
                                color: colors.neutral[700],
                              }}
                            >
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <div key={key} style={{ marginBottom: spacing.xs }}>
                                  <strong>{key}:</strong> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: spacing.md }}>
                          <div style={{ ...typography.bodySmall, fontWeight: 600, color: colors.neutral[700] }}>
                            {formatRelativeTime(event.timestamp)}
                          </div>
                          <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                            {formatDate(event.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};



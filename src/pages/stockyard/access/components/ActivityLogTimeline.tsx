/**
 * Activity Log Timeline Component
 * 
 * Displays chronological timeline of all guard activities
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, MapPin, Eye, Edit, LogOut, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import type { GatePass } from '../gatePassTypes';
import { isVisitorPass, isVehiclePass, getPassTypeLabel } from '../gatePassTypes';

export interface ActivityLogEntry {
  id: string;
  pass_id: string;
  pass?: GatePass;
  activity_type: 'entry' | 'exit' | 'return' | 'pending';
  timestamp: string;
  guard_name?: string;
  guard_id?: number;
  gate_name?: string;
  gate_id?: string;
  location?: { lat: number; lng: number };
  notes?: string;
  duration?: string; // For completed entries (entry + exit)
  status: 'active' | 'completed' | 'pending' | 'overdue' | 'cancelled';
}

export interface ActivityLogTimelineProps {
  activities: ActivityLogEntry[];
  onViewDetails?: (passId: string) => void;
  onEditNotes?: (passId: string) => void;
  onMarkExit?: (passId: string) => void;
  onPrint?: (passId: string) => void;
  showActions?: boolean;
}

export const ActivityLogTimeline: React.FC<ActivityLogTimelineProps> = ({
  activities,
  onViewDetails,
  onEditNotes,
  onMarkExit,
  onPrint,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getStatusColor = (status: ActivityLogEntry['status']) => {
    switch (status) {
      case 'active':
        return colors.success[500];
      case 'completed':
        return colors.primary[500];
      case 'pending':
        return colors.warning[500];
      case 'overdue':
        return colors.error[500];
      case 'cancelled':
        return colors.neutral[400];
      default:
        return colors.neutral[400];
    }
  };

  const getStatusIcon = (status: ActivityLogEntry['status']) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '🔵';
      case 'pending':
        return '🟡';
      case 'overdue':
        return '🔴';
      case 'cancelled':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const getActivityIcon = (type: ActivityLogEntry['activity_type']) => {
    switch (type) {
      case 'entry':
        return '✓';
      case 'exit':
        return '→';
      case 'return':
        return '↩';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityLabel = (activity: ActivityLogEntry) => {
    const pass = activity.pass;
    if (!pass) return 'Unknown';

    if (isVisitorPass(pass)) {
      return pass.visitor_name || 'Visitor';
    } else if (isVehiclePass(pass)) {
      return pass.vehicle?.registration_number || 'Vehicle';
    }
    return 'Unknown';
  };

  const getActivitySubtitle = (activity: ActivityLogEntry) => {
    const pass = activity.pass;
    if (!pass) return '';

    if (isVisitorPass(pass)) {
      return `Pass #${pass.pass_number} | ${getPassTypeLabel(pass.pass_type)}`;
    } else if (isVehiclePass(pass)) {
      return `Pass #${pass.pass_number} | ${getPassTypeLabel(pass.pass_type)}`;
    }
    return '';
  };

  // Sort activities by timestamp (newest first)
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activities]);

  if (sortedActivities.length === 0) {
    return (
      <div style={{
        padding: spacing.xxl,
        textAlign: 'center',
        color: colors.neutral[600],
      }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>📋</div>
        <div style={{ ...typography.body, marginBottom: spacing.xs }}>
          No activities found
        </div>
        <div style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
          Activities will appear here as they occur
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {sortedActivities.map((activity) => {
        const isExpanded = expandedIds.has(activity.id);
        const pass = activity.pass;
        const canMarkExit = activity.status === 'active' && activity.activity_type === 'entry';

        return (
          <div
            key={activity.id}
            style={{
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {/* Main Activity Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: spacing.md,
                cursor: 'pointer',
              }}
              onClick={() => toggleExpand(activity.id)}
            >
              {/* Time Column */}
              <div style={{
                minWidth: '60px',
                textAlign: 'center',
                paddingTop: spacing.xs,
              }}>
                <div style={{
                  ...typography.bodySmall,
                  fontWeight: 600,
                  color: colors.neutral[700],
                }}>
                  {formatTime(activity.timestamp)}
                </div>
              </div>

              {/* Activity Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(activity.status) + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '14px',
              }}>
                {getActivityIcon(activity.activity_type)}
              </div>

              {/* Activity Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  marginBottom: spacing.xs,
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    ...typography.body,
                    fontWeight: 600,
                    color: colors.neutral[900],
                  }}>
                    {activity.activity_type === 'entry' ? 'Entry' : 
                     activity.activity_type === 'exit' ? 'Exit' : 
                     activity.activity_type === 'return' ? 'Return' : 'Pending'} - {getActivityLabel(activity)}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: `${spacing.xs / 2}px ${spacing.xs}px`,
                    borderRadius: borderRadius.sm,
                    backgroundColor: getStatusColor(activity.status) + '20',
                    color: getStatusColor(activity.status),
                    fontWeight: 600,
                  }}>
                    {getStatusIcon(activity.status)} {activity.status.toUpperCase()}
                  </span>
                </div>
                <div style={{
                  ...typography.bodySmall,
                  color: colors.neutral[600],
                  marginBottom: spacing.xs,
                }}>
                  {getActivitySubtitle(activity)}
                </div>
                {activity.guard_name && (
                  <div style={{
                    ...typography.bodySmall,
                    color: colors.neutral[500],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}>
                    <User size={12} />
                    Guard: {activity.guard_name}
                    {activity.gate_name && (
                      <>
                        <span style={{ margin: `0 ${spacing.xs}px` }}>•</span>
                        <MapPin size={12} />
                        {activity.gate_name}
                      </>
                    )}
                  </div>
                )}
                {activity.duration && (
                  <div style={{
                    ...typography.bodySmall,
                    color: colors.neutral[500],
                    marginTop: spacing.xs,
                  }}>
                    ⏱️ Duration: {activity.duration}
                  </div>
                )}
              </div>

              {/* Expand/Collapse Icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(activity.id);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.neutral[500],
                }}
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div style={{
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTop: `1px solid ${colors.neutral[200]}`,
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.md,
                  marginBottom: spacing.md,
                }}>
                  <div>
                    <div style={{
                      ...typography.bodySmall,
                      color: colors.neutral[500],
                      marginBottom: spacing.xs / 2,
                    }}>
                      Timestamp
                    </div>
                    <div style={{ ...typography.body, color: colors.neutral[900] }}>
                      {formatDateTime(activity.timestamp)}
                    </div>
                  </div>
                  {activity.guard_name && (
                    <div>
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.neutral[500],
                        marginBottom: spacing.xs / 2,
                      }}>
                        Guard
                      </div>
                      <div style={{ ...typography.body, color: colors.neutral[900] }}>
                        {activity.guard_name}
                      </div>
                    </div>
                  )}
                  {activity.gate_name && (
                    <div>
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.neutral[500],
                        marginBottom: spacing.xs / 2,
                      }}>
                        Gate
                      </div>
                      <div style={{ ...typography.body, color: colors.neutral[900] }}>
                        {activity.gate_name}
                      </div>
                    </div>
                  )}
                  {activity.location && (
                    <div>
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.neutral[500],
                        marginBottom: spacing.xs / 2,
                      }}>
                        Location
                      </div>
                      <div style={{ ...typography.body, color: colors.neutral[900] }}>
                        {activity.location.lat.toFixed(6)}, {activity.location.lng.toFixed(6)}
                      </div>
                    </div>
                  )}
                </div>

                {activity.notes && (
                  <div style={{ marginBottom: spacing.md }}>
                    <div style={{
                      ...typography.bodySmall,
                      color: colors.neutral[500],
                      marginBottom: spacing.xs / 2,
                    }}>
                      Notes
                    </div>
                    <div style={{
                      ...typography.body,
                      color: colors.neutral[700],
                      padding: spacing.sm,
                      backgroundColor: colors.neutral[50],
                      borderRadius: borderRadius.md,
                    }}>
                      {activity.notes}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {showActions && (
                  <div style={{
                    display: 'flex',
                    gap: spacing.sm,
                    flexWrap: 'wrap',
                  }}>
                    {onViewDetails && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(activity.pass_id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs}px ${spacing.sm}px`,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.md,
                          backgroundColor: 'white',
                          color: colors.neutral[700],
                          cursor: 'pointer',
                          ...typography.bodySmall,
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </button>
                    )}
                    {onEditNotes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditNotes(activity.pass_id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs}px ${spacing.sm}px`,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.md,
                          backgroundColor: 'white',
                          color: colors.neutral[700],
                          cursor: 'pointer',
                          ...typography.bodySmall,
                        }}
                      >
                        <Edit size={14} />
                        Edit Notes
                      </button>
                    )}
                    {canMarkExit && onMarkExit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkExit(activity.pass_id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs}px ${spacing.sm}px`,
                          border: 'none',
                          borderRadius: borderRadius.md,
                          backgroundColor: colors.error[500],
                          color: 'white',
                          cursor: 'pointer',
                          ...typography.bodySmall,
                          fontWeight: 600,
                        }}
                      >
                        <LogOut size={14} />
                        Mark Exit
                      </button>
                    )}
                    {onPrint && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrint(activity.pass_id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs}px ${spacing.sm}px`,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.md,
                          backgroundColor: 'white',
                          color: colors.neutral[700],
                          cursor: 'pointer',
                          ...typography.bodySmall,
                        }}
                      >
                        <FileText size={14} />
                        Print
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};


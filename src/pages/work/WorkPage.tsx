/**
 * Unified Work Page
 * 
 * Aggregates all work items from across modules:
 * - Pending: Items requiring action (approvals, tasks)
 * - Today: Items scheduled for today
 * - Mine: Items assigned to or created by the user
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useWorkItems, type WorkItem, type WorkFilters } from '../../lib/workAggregation';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Filter,
  Search,
  ArrowRight,
  FileText,
  DollarSign,
  ClipboardList,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { useMobileViewport, getResponsivePageContainerStyles } from '../../lib/mobileUtils';

type TabType = 'pending' | 'today' | 'mine';

export const WorkPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<WorkFilters['priority']>('all');

  // Build filters based on active tab
  const filters: WorkFilters = useMemo(() => {
    const baseFilters: WorkFilters = {
      search: searchQuery || undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    };

    switch (activeTab) {
      case 'pending':
        return {
          ...baseFilters,
          status: 'pending',
        };
      case 'today':
        return {
          ...baseFilters,
          dateRange: {
            start: new Date(new Date().setHours(0, 0, 0, 0)),
            end: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        };
      case 'mine':
        return {
          ...baseFilters,
          assignedTo: 'me',
        };
      default:
        return baseFilters;
    }
  }, [activeTab, searchQuery, priorityFilter]);

  const { items, isLoading, counts } = useWorkItems(filters);

  const getItemIcon = (type: WorkItem['type']) => {
    switch (type) {
      case 'approval_gate_pass':
      case 'activity_gate_pass':
        return ClipboardList;
      case 'approval_expense':
      case 'activity_expense':
        return DollarSign;
      case 'approval_transfer':
        return Warehouse;
      case 'activity_inspection':
      case 'task_inspection':
        return FileText;
      case 'task_maintenance':
        return Wrench;
      default:
        return AlertCircle;
    }
  };

  const getPriorityColor = (priority: WorkItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return colors.error[500];
      case 'high':
        return colors.warning[500];
      case 'medium':
        return colors.primary;
      case 'low':
        return colors.neutral[500];
    }
  };

  const getStatusColor = (status: WorkItem['status']) => {
    switch (status) {
      case 'completed':
        return colors.success[500];
      case 'in_progress':
        return colors.primary;
      case 'overdue':
        return colors.error[500];
      case 'pending':
        return colors.warning[500];
    }
  };

  const tabs: Array<{ id: TabType; label: string; count: number; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'pending', label: 'Pending', count: counts.pending, icon: AlertCircle },
    { id: 'today', label: "Today's", count: counts.today, icon: Clock },
    { id: 'mine', label: 'Mine', count: counts.mine, icon: User },
  ];

  return (
    <div style={{ 
      ...getResponsivePageContainerStyles({ desktopMaxWidth: '1400px' }),
      padding: isMobile ? spacing.lg : spacing.xl,
    }}>
      {/* Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <h1 style={{ ...typography.header, fontSize: '28px', marginBottom: spacing.sm }}>
          My Work
        </h1>
        <p style={{ ...typography.body, color: colors.neutral[600] }}>
          All your tasks, approvals, and activities in one place
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          borderBottom: `2px solid ${colors.neutral[200]}`,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${colors.primary}` : '3px solid transparent',
                color: isActive ? colors.primary : colors.neutral[600],
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                fontWeight: isActive ? 600 : 400,
                fontSize: '16px',
                transition: 'all 0.2s',
                position: 'relative',
                bottom: '-2px',
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.neutral[300],
                    color: isActive ? 'white' : colors.neutral[700],
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    minWidth: '24px',
                    textAlign: 'center',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 300px',
            minWidth: '250px',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[400],
            }}
          />
          <input
            type="text"
            placeholder="Search work items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md} ${spacing.sm} ${spacing.xl + spacing.md}px`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.neutral[300];
            }}
          />
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as WorkFilters['priority'])}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Work Items List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[500] }}>
          Loading work items...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.xxl,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <AlertCircle size={48} color={colors.neutral[400]} style={{ marginBottom: spacing.md }} />
          <h3 style={{ ...typography.subheader, color: colors.neutral[700], marginBottom: spacing.sm }}>
            No work items found
          </h3>
          <p style={{ ...typography.body, color: colors.neutral[600] }}>
            {activeTab === 'pending' && "You're all caught up! No pending items."}
            {activeTab === 'today' && "No items scheduled for today."}
            {activeTab === 'mine' && "No items assigned to you."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {items.map((item) => {
            const Icon = getItemIcon(item.type);
            const priorityColor = getPriorityColor(item.priority);
            const statusColor = getStatusColor(item.status);

            return (
              <div
                key={item.id}
                onClick={() => navigate(item.route)}
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.lg,
                  padding: spacing.lg,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: shadows.sm,
                }}
                onMouseEnter={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = shadows.md;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = shadows.sm;
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
              >
                <div style={{ display: 'flex', gap: spacing.md, alignItems: 'flex-start' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: borderRadius.md,
                      backgroundColor: `${priorityColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} color={priorityColor} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.xs }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            ...typography.subheader,
                            fontSize: '16px',
                            marginBottom: spacing.xs,
                            color: colors.neutral[900],
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{
                            ...typography.bodySmall,
                            color: colors.neutral[600],
                            marginBottom: spacing.xs,
                          }}
                        >
                          {item.subtitle}
                        </p>
                        {item.description && (
                          <p
                            style={{
                              ...typography.bodySmall,
                              color: colors.neutral[500],
                              fontSize: '13px',
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight size={20} color={colors.neutral[400]} style={{ flexShrink: 0, marginTop: spacing.xs }} />
                    </div>

                    {/* Metadata */}
                    <div
                      style={{
                        display: 'flex',
                        gap: spacing.md,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        marginTop: spacing.sm,
                      }}
                    >
                      {/* Priority Badge */}
                      <span
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: `${priorityColor}15`,
                          color: priorityColor,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.priority}
                      </span>

                      {/* Status Badge */}
                      <span
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: `${statusColor}15`,
                          color: statusColor,
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        {item.status.replace('_', ' ')}
                      </span>

                      {/* Created By */}
                      {item.createdBy && (
                        <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                          By {item.createdBy.name}
                        </span>
                      )}

                      {/* Due Date */}
                      {item.dueDate && (
                        <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                          Due {item.dueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};




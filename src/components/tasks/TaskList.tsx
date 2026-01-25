/**
 * Task List Component
 * 
 * Displays a list of tasks with filtering and sorting
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useTasks, UseTasksOptions } from '../../hooks/useTasks';
import type { Task, TaskStatus, TaskPriority } from '../../lib/workflow/types';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'critical': return colors.error[500];
    case 'high': return colors.warning[500];
    case 'medium': return colors.info[500];
    case 'low': return colors.success[500];
    default: return colors.neutral[500];
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'pending': return colors.warning[500];
    case 'in_progress': return colors.info[500];
    case 'completed': return colors.success[500];
    case 'cancelled': return colors.neutral[500];
    case 'overdue': return colors.error[500];
    default: return colors.neutral[500];
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle size={16} />;
    case 'cancelled': return <XCircle size={16} />;
    case 'overdue': return <AlertCircle size={16} />;
    case 'in_progress': return <Clock size={16} />;
    default: return <Briefcase size={16} />;
  }
};

interface TaskListProps {
  filters?: UseTasksOptions;
  showFilters?: boolean;
  onTaskClick?: (task: Task) => void;
  emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  filters = {},
  showFilters = true,
  onTaskClick,
  emptyMessage = 'No tasks found',
}) => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  const { data: tasks = [], isLoading } = useTasks({
    ...filters,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
  });

  const handleTaskClick = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      navigate(`/app/tasks/${task.id}`);
    }
  };

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            marginBottom: spacing.lg,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <Filter size={18} color={colors.neutral[600]} />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </Select>
          </div>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {[...Array(5)].map((_, i) => (
            <SkeletonLoader key={i} variant="card" style={{ height: '120px' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={48} color={colors.neutral[500]} />}
          title={emptyMessage}
          description="Tasks will appear here when they are created."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {tasks.map((task) => (
            <Card
              key={task.id}
              onClick={() => handleTaskClick(task)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: shadows.xl,
                },
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                {/* Status Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: borderRadius.md,
                    backgroundColor: getStatusColor(task.status) + '15',
                    color: getStatusColor(task.status),
                    flexShrink: 0,
                  }}
                >
                  {getStatusIcon(task.status)}
                </div>

                {/* Task Content */}
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <h3 style={{ ...typography.subheader, fontSize: '16px', margin: 0, flexGrow: 1 }}>
                      {task.title}
                    </h3>
                    <ChevronRight size={18} color={colors.neutral[500]} />
                  </div>

                  {task.description && (
                    <p
                      style={{
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        margin: `0 0 ${spacing.xs} 0`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {task.description}
                    </p>
                  )}

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs }}>
                    <span
                      style={{
                        backgroundColor: getPriorityColor(task.priority) + '15',
                        color: getPriorityColor(task.priority),
                        padding: '4px 8px',
                        borderRadius: borderRadius.full,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    <span
                      style={{
                        backgroundColor: getStatusColor(task.status) + '15',
                        color: getStatusColor(task.status),
                        padding: '4px 8px',
                        borderRadius: borderRadius.full,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                    </span>
                    {task.assignedTo && (
                      <span
                        style={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700],
                          padding: '4px 8px',
                          borderRadius: borderRadius.full,
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        Assigned: {task.assignedTo.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span
                        style={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[700],
                          padding: '4px 8px',
                          borderRadius: borderRadius.full,
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};





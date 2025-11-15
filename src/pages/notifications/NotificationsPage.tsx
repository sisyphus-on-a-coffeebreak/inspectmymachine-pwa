import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Bell, CheckCheck, Trash2, Filter, X } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from '@/lib/queries';
import { useToast } from '@/providers/ToastProvider';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

const typeConfig: Record<string, { color: string; label: string }> = {
  alert: { color: colors.error[500], label: 'Alert' },
  approval_request: { color: colors.warning[500], label: 'Approval Request' },
  reminder: { color: colors.primary, label: 'Reminder' },
  escalation: { color: colors.error[600], label: 'Escalation' },
  info: { color: colors.primary, label: 'Info' },
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);

  const { data: notificationsData, isLoading, isError, error, refetch } = useNotifications({
    read: filter === 'all' ? undefined : filter === 'unread' ? 'false' : 'true',
    type: typeFilter || undefined,
    page: currentPage,
    per_page: perPage,
  });

  const notifications = notificationsData?.data || [];
  const totalItems = notificationsData?.total || 0;
  const lastPage = notificationsData?.last_page || 1;

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id);
      } catch (error) {
        // Silent fail
      }
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsReadMutation.mutateAsync(id);
      showToast({
        title: 'Success',
        description: 'Notification marked as read',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'error',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      showToast({
        title: 'Success',
        description: 'All notifications marked as read',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteMutation.mutateAsync(id);
        showToast({
          title: 'Success',
          description: 'Notification deleted',
          variant: 'success',
        });
      } catch (error) {
        showToast({
          title: 'Error',
          description: 'Failed to delete notification',
          variant: 'error',
        });
      }
    }
  };

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Notifications"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Notifications' },
          ]}
        />
        <NetworkError error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Notifications"
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Notifications' },
        ]}
        actions={
          filter === 'unread' && totalItems > 0 ? (
            <Button
              onClick={handleMarkAllAsRead}
              variant="secondary"
              icon={<CheckCheck size={18} />}
            >
              Mark All Read
            </Button>
          ) : null
        }
      />

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
            <Filter size={18} color={colors.neutral[600]} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[300]}`,
              fontSize: typography.body.fontSize,
              fontFamily: typography.body.fontFamily,
              cursor: 'pointer',
            }}
          >
            <option value="">All Types</option>
            {Object.entries(typeConfig).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>

          {typeFilter && (
            <button
              onClick={() => setTypeFilter('')}
              style={{
                padding: `${spacing.xs}px ${spacing.sm}px`,
                background: colors.neutral[100],
                border: 'none',
                borderRadius: borderRadius.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                fontSize: '12px',
                color: colors.neutral[700],
              }}
            >
              Clear type filter
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title={filter === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
          description={
            filter === 'unread'
              ? 'You\'re all caught up! No unread notifications.'
              : 'You don\'t have any notifications yet.'
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gap: spacing.md }}>
            {notifications.map((notification: Notification) => {
              const typeInfo = typeConfig[notification.type] || typeConfig.info;
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    ...cardStyles.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: `4px solid ${typeInfo.color}`,
                    background: notification.read ? 'white' : colors.primary + '05',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = cardStyles.card.boxShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <span
                          style={{
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            background: typeInfo.color + '20',
                            color: typeInfo.color,
                            borderRadius: borderRadius.sm,
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {typeInfo.label}
                        </span>
                        {!notification.read && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: colors.primary,
                            }}
                          />
                        )}
                      </div>
                      <h3
                        style={{
                          ...typography.subheader,
                          margin: 0,
                          marginBottom: spacing.xs,
                          fontWeight: notification.read ? 500 : 700,
                          color: colors.neutral[900],
                        }}
                      >
                        {notification.title}
                      </h3>
                      <p
                        style={{
                          ...typography.body,
                          margin: 0,
                          marginBottom: spacing.sm,
                          color: colors.neutral[600],
                        }}
                      >
                        {notification.message}
                      </p>
                      <div
                        style={{
                          ...typography.caption,
                          color: colors.neutral[500],
                        }}
                      >
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        {notification.read_at && (
                          <> • Read {formatDistanceToNow(new Date(notification.read_at), { addSuffix: true })}</>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.xs }}>
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          style={{
                            padding: spacing.xs,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: borderRadius.sm,
                            color: colors.neutral[600],
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.neutral[100];
                            e.currentTarget.style.color = colors.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = colors.neutral[600];
                          }}
                          title="Mark as read"
                        >
                          <CheckCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        style={{
                          padding: spacing.xs,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: borderRadius.sm,
                          color: colors.neutral[600],
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.error[50];
                          e.currentTarget.style.color = colors.error[600];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = colors.neutral[600];
                        }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="secondary"
              >
                Previous
              </Button>
              <span style={{ ...typography.body, color: colors.neutral[600] }}>
                Page {currentPage} of {lastPage} ({totalItems} total)
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { useUnreadNotificationCount, useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/lib/queries';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: notificationsData } = useNotifications(
    { read: 'false', per_page: 10 },
    { enabled: isOpen }
  );
  
  const notifications = notificationsData?.data || [];
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  const handleViewAll = () => {
    navigate('/app/notifications');
    setIsOpen(false);
  };

  const typeColors: Record<string, string> = {
    alert: colors.error[500],
    approval_request: colors.warning[500],
    reminder: colors.primary,
    escalation: colors.error[600],
    info: colors.primary,
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: spacing.sm,
          borderRadius: borderRadius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.neutral[700],
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.neutral[100];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: colors.error[500],
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              border: `2px solid white`,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: spacing.xs,
            width: '360px',
            maxHeight: '500px',
            background: 'white',
            borderRadius: borderRadius.lg,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: `1px solid ${colors.neutral[200]}`,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: spacing.md,
              borderBottom: `1px solid ${colors.neutral[200]}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ ...typography.subheader, margin: 0 }}>Notifications</h3>
            <div style={{ display: 'flex', gap: spacing.xs }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: spacing.xs,
                    borderRadius: borderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    color: colors.neutral[600],
                    fontSize: '12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.neutral[100];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing.xs,
                  borderRadius: borderRadius.sm,
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.neutral[600],
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '400px',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: spacing.xl,
                  textAlign: 'center',
                  color: colors.neutral[500],
                }}
              >
                <Bell size={32} style={{ marginBottom: spacing.sm, opacity: 0.5 }} />
                <p style={{ ...typography.body, margin: 0 }}>No unread notifications</p>
              </div>
            ) : (
              notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: spacing.md,
                    borderBottom: `1px solid ${colors.neutral[100]}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: notification.read ? 'white' : colors.primary + '08',
                    borderLeft: `3px solid ${typeColors[notification.type] || colors.primary}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notification.read ? 'white' : colors.primary + '08';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          ...typography.label,
                          fontWeight: notification.read ? 500 : 700,
                          color: colors.neutral[900],
                          marginBottom: spacing.xs,
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          ...typography.body,
                          fontSize: '13px',
                          color: colors.neutral[600],
                          marginBottom: spacing.xs,
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          ...typography.caption,
                          color: colors.neutral[500],
                        }}
                      >
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    {!notification.read && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: colors.primary,
                          flexShrink: 0,
                          marginTop: spacing.xs,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: spacing.sm,
                borderTop: `1px solid ${colors.neutral[200]}`,
                textAlign: 'center',
              }}
            >
              <button
                onClick={handleViewAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.primary,
                  ...typography.body,
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  borderRadius: borderRadius.sm,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primary + '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};



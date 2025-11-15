/**
 * Recently Viewed Panel Component
 * 
 * Displays the last 5 viewed items in the sidebar
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getRecentlyViewed, 
  removeRecentlyViewed, 
  clearRecentlyViewed,
  getItemIcon,
  formatRelativeTime,
  type RecentlyViewedItem 
} from '../../lib/recentlyViewed';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Clock, X, Trash2 } from 'lucide-react';

export const RecentlyViewed: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    // Load items on mount
    setItems(getRecentlyViewed());

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'voms_recently_viewed') {
        setItems(getRecentlyViewed());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Refresh items when location changes
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(getRecentlyViewed());
    }, 1000); // Update every second for relative time

    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (item: RecentlyViewedItem) => {
    navigate(item.path);
  };

  const handleRemoveItem = (e: React.MouseEvent, item: RecentlyViewedItem) => {
    e.stopPropagation();
    removeRecentlyViewed(item.id, item.type);
    setItems(getRecentlyViewed());
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all recently viewed items?')) {
      clearRecentlyViewed();
      setItems([]);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: spacing.xl,
        padding: spacing.md,
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <Clock size={16} color={colors.neutral[600]} />
          <h3
            style={{
              ...typography.subheader,
              fontSize: '14px',
              color: colors.neutral[900],
              margin: 0,
              fontWeight: 600,
            }}
          >
            Recently Viewed
          </h3>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              color: colors.neutral[500],
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[200];
              e.currentTarget.style.color = colors.status.critical;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.neutral[500];
            }}
            aria-label="Clear all recently viewed items"
            title="Clear all"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() => handleItemClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.sm,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral[200]}`,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[100];
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = colors.neutral[200];
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(item);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${item.title}`}
          >
            <div
              style={{
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
            >
              {item.icon || getItemIcon(item.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  ...typography.bodySmall,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: colors.neutral[900],
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </div>
              {item.subtitle && (
                <div
                  style={{
                    ...typography.bodySmall,
                    fontSize: '10px',
                    color: colors.neutral[600],
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.subtitle}
                </div>
              )}
              <div
                style={{
                  ...typography.bodySmall,
                  fontSize: '10px',
                  color: colors.neutral[500],
                  margin: 0,
                  marginTop: '2px',
                }}
              >
                {formatRelativeTime(item.timestamp)}
              </div>
            </div>
            <button
              onClick={(e) => handleRemoveItem(e, item)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: borderRadius.sm,
                display: 'flex',
                alignItems: 'center',
                color: colors.neutral[400],
                transition: 'all 0.2s ease',
                opacity: 0.7,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[200];
                e.currentTarget.style.color = colors.status.critical;
                e.currentTarget.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.neutral[400];
                e.currentTarget.style.opacity = 0.7;
              }}
              aria-label={`Remove ${item.title} from recently viewed`}
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;


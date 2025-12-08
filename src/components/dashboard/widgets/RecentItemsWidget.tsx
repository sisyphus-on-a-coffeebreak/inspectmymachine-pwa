/**
 * Recent Items Widget
 * 
 * Shows recently accessed items across modules
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentlyViewed, getItemIcon, formatRelativeTime } from '../../../lib/recentlyViewed';
import { colors, spacing, typography } from '../../../lib/theme';
import { Clock, ArrowRight } from 'lucide-react';

export function RecentItemsWidget() {
  const navigate = useNavigate();
  const recentItems = getRecentlyViewed().slice(0, 5);

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: spacing.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Clock size={24} color={colors.neutral[600]} />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.neutral[900],
              margin: 0,
            }}
          >
            Recent Items
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {recentItems.map((item) => (
          <div
            key={`${item.id}-${item.type}`}
            style={{
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onClick={() => navigate(item.path)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <span style={{ fontSize: '20px' }}>{getItemIcon(item.type)}</span>
              <div>
                <div style={{ fontWeight: 600, color: colors.neutral[900], fontSize: '14px' }}>
                  {item.title}
                </div>
                {item.subtitle && (
                  <div style={{ fontSize: '12px', color: colors.neutral[600] }}>
                    {item.subtitle}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: colors.neutral[500] }}>
                  {formatRelativeTime(item.timestamp)}
                </div>
              </div>
            </div>
            <ArrowRight size={16} color={colors.neutral[400]} />
          </div>
        ))}
      </div>
    </div>
  );
}


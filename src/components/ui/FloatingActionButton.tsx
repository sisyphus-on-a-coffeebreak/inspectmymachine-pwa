/**
 * Floating Action Button (FAB)
 * 
 * Expandable FAB for quick-create actions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/theme';
import { zIndex } from '../../lib/z-index';

export interface FabAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

interface FloatingActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  actions: FabAction[];
}

export function FloatingActionButton({ icon: Icon, label, actions }: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleActionClick = (route: string) => {
    navigate(route);
    setExpanded(false);
  };

  return (
    <>
      {/* Backdrop */}
      {expanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 99,
          }}
          onClick={() => setExpanded(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className="fab-container"
        style={{
          position: 'fixed',
          bottom: 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))', // Bottom nav (64px) + gap (16px) + safe area
          right: 'calc(16px + env(safe-area-inset-right, 0px))',
          zIndex: zIndex.fab, // 1300 - Above bottom nav
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: spacing.sm,
        }}
      >
        {/* Expanded Actions */}
        {expanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              marginBottom: spacing.sm,
            }}
          >
            {actions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.route}
                  onClick={() => handleActionClick(action.route)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: 'white',
                    borderRadius: borderRadius.lg,
                    boxShadow: shadows.lg,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    animation: `slideIn 0.2s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = shadows.xl;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = shadows.lg;
                  }}
                >
                  <ActionIcon size={20} color={colors.primary} />
                  <span style={{ ...typography.body, fontWeight: 600, color: colors.neutral[900] }}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.xl,
            transition: 'all 0.2s ease',
            transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = expanded ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = expanded ? 'rotate(45deg)' : 'rotate(0deg)';
          }}
          aria-label={expanded ? 'Close' : label}
        >
          {expanded ? (
            <X size={24} />
          ) : (
            <Icon size={24} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Hide FAB on desktop */
        @media (min-width: 768px) {
          .fab-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

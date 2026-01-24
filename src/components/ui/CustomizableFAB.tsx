/**
 * Customizable Floating Action Button (FAB)
 * 
 * Android-style expandable FAB with:
 * - Long-press to expand
 * - Drag to reorder actions
 * - User preferences storage
 * - Role-based defaults
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, GripVertical, Settings } from 'lucide-react';
import { colors, spacing, typography, borderRadius, shadows } from '../../lib/theme';
import { zIndex } from '../../lib/z-index';
import type { FabAction } from '../../lib/unifiedNavigation';
import {
  loadFabPreferences,
  saveFabPreferences,
  getDefaultFabPreferences,
  mergeFabPreferences,
  updateActionOrder,
  toggleAction,
  setPrimaryAction,
  type FabPreferences,
} from '../../lib/fabPreferences';
import { useAuth } from '../../providers/useAuth';

interface CustomizableFABProps {
  defaultActions: FabAction[];
  onCustomize?: () => void; // Opens customization UI
}

const LONG_PRESS_DURATION = 500; // ms

export function CustomizableFAB({ defaultActions, onCustomize }: CustomizableFABProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Load user preferences
  const [preferences, setPreferences] = useState<FabPreferences | null>(() => {
    return loadFabPreferences(userId);
  });

  // Merge preferences with defaults
  const actions = mergeFabPreferences(defaultActions, preferences);

  // State
  const [expanded, setExpanded] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const dragStartY = useRef<number>(0);
  const dragStartIndex = useRef<number>(0);

  // Save preferences when they change
  useEffect(() => {
    if (preferences) {
      saveFabPreferences(preferences, userId);
    }
  }, [preferences, userId]);

  // Close on Escape key
  useEffect(() => {
    if (!expanded) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
        setIsCustomizing(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [expanded]);

  // Handle long press
  const handleTouchStart = (e: React.TouchEvent) => {
    const timer = setTimeout(() => {
      setIsCustomizing(true);
      setExpanded(true);
    }, LONG_PRESS_DURATION);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle click (short press)
  const handleClick = () => {
    if (isCustomizing) {
      setIsCustomizing(false);
      return;
    }
    setExpanded(!expanded);
  };

  // Handle action click
  const handleActionClick = (route: string) => {
    if (isCustomizing) return;
    navigate(route);
    setExpanded(false);
  };

  // Drag handlers
  const handleDragStart = (index: number, e: React.TouchEvent | React.MouseEvent) => {
    if (!isCustomizing) return;
    
    setDraggedIndex(index);
    dragStartIndex.current = index;
    
    if ('touches' in e) {
      dragStartY.current = e.touches[0].clientY;
    } else {
      dragStartY.current = e.clientY;
    }
  };

  const handleDragMove = (index: number, e: React.TouchEvent | React.MouseEvent) => {
    if (!isCustomizing || draggedIndex === null) return;

    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragStartY.current;
    const itemHeight = 60; // Approximate height of each action item
    const newIndex = Math.round(index + deltaY / itemHeight);

    if (newIndex >= 0 && newIndex < actions.length && newIndex !== draggedIndex) {
      const newOrder = [...actions.map(a => a.route)];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(newIndex, 0, removed);
      
      const updatedPreferences = updateActionOrder(preferences, newOrder);
      setPreferences(updatedPreferences);
      setDraggedIndex(newIndex);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Toggle action enabled/disabled
  const handleToggleAction = (route: string, enabled: boolean) => {
    const updated = toggleAction(preferences, route, enabled);
    setPreferences(updated);
  };

  // Set primary action
  const handleSetPrimary = (route: string) => {
    const updated = setPrimaryAction(preferences, route);
    setPreferences(updated);
  };

  // Reset to defaults
  const handleReset = () => {
    const defaults = getDefaultFabPreferences(defaultActions);
    setPreferences(defaults);
    setIsCustomizing(false);
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
            zIndex: zIndex.fab - 1,
          }}
          onClick={() => {
            setExpanded(false);
            setIsCustomizing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setExpanded(false);
              setIsCustomizing(false);
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />
      )}

      {/* FAB Container */}
      <div
        className="customizable-fab-container"
        style={{
          position: 'fixed',
          bottom: 'calc(64px + 16px + env(safe-area-inset-bottom, 0px))',
          right: 'calc(16px + env(safe-area-inset-right, 0px))',
          zIndex: zIndex.fab,
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
              const isPrimary = preferences?.primaryAction === action.route;
              const isEnabled = !preferences || preferences.enabledActions.includes(action.route);
              
              return (
                <div
                  key={action.route}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    opacity: isEnabled ? 1 : 0.5,
                  }}
                >
                  {/* Drag Handle (only in customize mode) */}
                  {isCustomizing && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'grab',
                        touchAction: 'none',
                      }}
                      onTouchStart={(e) => handleDragStart(index, e)}
                      onTouchMove={(e) => handleDragMove(index, e)}
                      onTouchEnd={handleDragEnd}
                      onMouseDown={(e) => handleDragStart(index, e)}
                      onMouseMove={(e) => handleDragMove(index, e)}
                      onMouseUp={handleDragEnd}
                    >
                      <GripVertical size={16} color={colors.neutral[500]} />
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => handleActionClick(action.route)}
                    onDoubleClick={() => isCustomizing && handleSetPrimary(action.route)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      padding: `${spacing.sm} ${spacing.md}`,
                      backgroundColor: isPrimary ? colors.primary : 'white',
                      color: isPrimary ? 'white' : colors.neutral[900],
                      borderRadius: borderRadius.lg,
                      boxShadow: shadows.lg,
                      border: isPrimary ? `2px solid ${colors.primary}` : 'none',
                      cursor: isCustomizing ? 'default' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      animation: `slideIn 0.2s ease ${index * 0.05}s both`,
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      opacity: isEnabled ? 1 : 0.5,
                    }}
                    disabled={!isEnabled || isCustomizing}
                    title={isPrimary ? 'Primary action (double-tap to change)' : undefined}
                  >
                    <ActionIcon size={20} color={isPrimary ? 'white' : colors.primary} />
                    <span style={{ ...typography.body, fontWeight: 600 }}>
                      {action.label}
                      {isPrimary && ' ⭐'}
                    </span>
                  </button>

                  {/* Toggle Button (only in customize mode) */}
                  {isCustomizing && (
                    <button
                      onClick={() => handleToggleAction(action.route, !isEnabled)}
                      style={{
                        padding: spacing.xs,
                        backgroundColor: isEnabled ? colors.success[500] : colors.neutral[300],
                        color: 'white',
                        border: 'none',
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                        minWidth: '32px',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={isEnabled ? 'Disable' : 'Enable'}
                    >
                      {isEnabled ? '✓' : '✕'}
                    </button>
                  )}
                </div>
              );
            })}

            {/* Customization Controls */}
            {isCustomizing && (
              <div
                style={{
                  display: 'flex',
                  gap: spacing.sm,
                  padding: spacing.sm,
                  backgroundColor: colors.neutral[100],
                  borderRadius: borderRadius.lg,
                  marginTop: spacing.sm,
                }}
              >
                <button
                  onClick={handleReset}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: colors.neutral[300],
                    color: 'white',
                    border: 'none',
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Reset
                </button>
                {onCustomize && (
                  <button
                    onClick={onCustomize}
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}
                  >
                    <Settings size={14} />
                    More Options
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isCustomizing ? colors.warning[500] : colors.primary,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadows.xl,
            transition: 'all 0.2s ease',
            transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
            touchAction: 'manipulation',
          }}
          aria-label={expanded ? (isCustomizing ? 'Exit customization' : 'Close') : 'Open quick actions'}
        >
          {expanded ? (
            <X size={24} />
          ) : (
            <Plus size={24} />
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
          .customizable-fab-container {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}


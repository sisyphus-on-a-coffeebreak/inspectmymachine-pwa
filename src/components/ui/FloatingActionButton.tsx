/**
 * FloatingActionButton (FAB) Component
 * 
 * Floating action button for common tasks
 * Supports multiple actions with expandable menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { Plus, X } from 'lucide-react';

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

export interface FloatingActionButtonProps {
  mainAction: FABAction;
  secondaryActions?: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  mainAction,
  secondaryActions = [],
  position = 'bottom-right',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const positionStyles: Record<string, React.CSSProperties> = {
    'bottom-right': {
      bottom: spacing.xl,
      right: spacing.xl,
    },
    'bottom-left': {
      bottom: spacing.xl,
      left: spacing.xl,
    },
    'top-right': {
      top: spacing.xl,
      right: spacing.xl,
    },
    'top-left': {
      top: spacing.xl,
      left: spacing.xl,
    },
  };

  const handleMainClick = () => {
    if (secondaryActions.length > 0) {
      setIsExpanded(!isExpanded);
    } else {
      mainAction.onClick();
    }
  };

  return (
    <div
      ref={fabRef}
      className={`fab-container ${className}`}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      {/* Secondary Actions */}
      {isExpanded && secondaryActions.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
            marginBottom: spacing.md,
            animation: 'fadeInUp 0.2s ease-out',
          }}
        >
          {secondaryActions.map((action, index) => (
            <div
              key={action.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                animation: `fadeInUp 0.2s ease-out ${index * 0.05}s both`,
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.md,
                  boxShadow: shadows.md,
                  fontSize: '12px',
                  fontFamily: typography.body.fontFamily,
                  fontWeight: 500,
                  color: colors.neutral[700],
                  whiteSpace: 'nowrap',
                }}
              >
                {action.label}
              </div>
              <button
                onClick={() => {
                  action.onClick();
                  setIsExpanded(false);
                }}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: action.color || colors.primary,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: shadows.lg,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${colors.primary}`;
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
                aria-label={action.label}
              >
                {action.icon}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={handleMainClick}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: mainAction.color || colors.primary,
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: shadows.lg,
          transition: 'all 0.2s ease',
          transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isExpanded
            ? 'rotate(45deg) scale(1.1)'
            : 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isExpanded ? 'rotate(45deg)' : 'scale(1)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = `2px solid ${colors.primary}`;
          e.currentTarget.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
        aria-label={secondaryActions.length > 0 ? 'Toggle actions' : mainAction.label}
        aria-expanded={isExpanded}
      >
        {isExpanded ? <X size={24} /> : mainAction.icon}
      </button>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingActionButton;


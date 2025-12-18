/**
 * Action Menu Component
 * 
 * Reusable overflow menu for actions.
 * Groups regular items, then destructive items at bottom.
 * Supports keyboard navigation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { MoreVertical, X } from 'lucide-react';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
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

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter items
  const visibleItems = items.filter((item) => !item.hidden);
  const regularItems = visibleItems.filter((item) => item.variant !== 'destructive');
  const destructiveItems = visibleItems.filter((item) => item.variant === 'destructive');

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.md,
          backgroundColor: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
          e.currentTarget.style.backgroundColor = colors.neutral[50];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.neutral[300];
          e.currentTarget.style.backgroundColor = 'white';
        }}
        aria-label="More actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger || <MoreVertical size={18} color={colors.neutral[600]} />}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            ...cardStyles.card,
            position: 'absolute',
            top: '100%',
            [align]: 0,
            marginTop: spacing.xs,
            minWidth: '200px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: spacing.xs,
          }}
        >
          {/* Regular items */}
          {regularItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              style={{
                width: '100%',
                padding: spacing.sm,
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                ...typography.body,
                color: item.disabled ? colors.neutral[400] : colors.neutral[900],
                borderRadius: borderRadius.sm,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}

          {/* Divider before destructive items */}
          {regularItems.length > 0 && destructiveItems.length > 0 && (
            <div
              style={{
                height: '1px',
                backgroundColor: colors.neutral[200],
                margin: `${spacing.xs} 0`,
              }}
            />
          )}

          {/* Destructive items */}
          {destructiveItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              style={{
                width: '100%',
                padding: spacing.sm,
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                ...typography.body,
                color: item.disabled ? colors.neutral[400] : colors.error,
                borderRadius: borderRadius.sm,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = colors.error + '10';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};





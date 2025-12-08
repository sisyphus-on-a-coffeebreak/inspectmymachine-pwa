/**
 * Keyboard Shortcuts Help Component
 * 
 * Displays available keyboard shortcuts in a modal
 */

import React from 'react';
import { Modal } from './Modal';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { Keyboard, X } from 'lucide-react';
import { formatShortcut, type KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
    >
      <div style={{ padding: spacing.md }}>
        {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
          <div key={category} style={{ marginBottom: spacing.lg }}>
            <h3 style={{
              ...typography.subheader,
              marginBottom: spacing.md,
              color: colors.neutral[700],
            }}>
              {category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {categoryShortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.sm,
                    borderRadius: borderRadius.sm,
                    background: colors.neutral[50],
                  }}
                >
                  <span style={{ ...typography.body, color: colors.neutral[700] }}>
                    {shortcut.description}
                  </span>
                  <kbd
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      padding: `${spacing.xs}px ${spacing.sm}px`,
                      background: colors.neutral[200],
                      borderRadius: borderRadius.sm,
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.neutral[700],
                      border: `1px solid ${colors.neutral[300]}`,
                    }}
                  >
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};


/**
 * Keyboard Shortcuts Hook
 * 
 * Provides keyboard shortcuts for common actions across the application
 * - Ctrl/Cmd+N: New pass (opens type selector)
 * - Ctrl/Cmd+Shift+V: New visitor pass
 * - Ctrl/Cmd+Shift+C: New vehicle pass
 * - Ctrl/Cmd+K: Global search (future)
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        (target.tagName === 'SELECT')
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Global keyboard shortcuts for the application
 * These work from any page
 */
export function useGlobalKeyboardShortcuts(enabled: boolean = true) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useKeyboardShortcuts(
    [
      {
        key: 'n',
        ctrl: true,
        action: () => {
          // Navigate to create pass page - user can select type
          navigate('/app/stockyard/access/create');
        },
        description: 'Create new pass',
      },
      {
        key: 'v',
        ctrl: true,
        shift: true,
        action: () => {
          // Navigate directly to visitor pass creation
          navigate('/app/stockyard/access/create?type=visitor');
        },
        description: 'Create visitor pass',
      },
      {
        key: 'c',
        ctrl: true,
        shift: true,
        action: () => {
          // Navigate directly to vehicle pass creation
          navigate('/app/stockyard/access/create?type=vehicle_inbound');
        },
        description: 'Create vehicle pass',
      },
      {
        key: 'e',
        ctrl: true,
        shift: true,
        action: () => {
          // Navigate to expense creation
          navigate('/app/expenses/create');
        },
        description: 'Create expense',
      },
      {
        key: 'k',
        ctrl: true,
        action: () => {
          // Future: Open global search
          // For now, just navigate to dashboard
          navigate('/app');
        },
        description: 'Global search (coming soon)',
      },
    ],
    enabled && !!user // Only enable if user is logged in
  );
}

/**
 * Alias for useGlobalKeyboardShortcuts (for backward compatibility)
 * @deprecated Use useGlobalKeyboardShortcuts instead
 */
export const useAppKeyboardShortcuts = useGlobalKeyboardShortcuts;

/**
 * Keyboard Shortcuts Hook
 * 
 * Comprehensive keyboard shortcuts system for power users
 * Supports global and context-specific shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { enabled = true, shortcuts } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Find matching shortcut
      const shortcut = shortcutsRef.current.find((s) => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrlKey === undefined ? true : s.ctrlKey === (e.ctrlKey || e.metaKey);
        const metaMatch = s.metaKey === undefined ? true : s.metaKey === e.metaKey;
        const shiftMatch = s.shiftKey === undefined ? true : s.shiftKey === e.shiftKey;
        const altMatch = s.altKey === undefined ? true : s.altKey === e.altKey;

        return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
      });

      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        if (shortcut.stopPropagation) {
          e.stopPropagation();
        }
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}

/**
 * Common keyboard shortcuts for the app
 */
export function useAppKeyboardShortcuts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'k',
      metaKey: true,
      ctrlKey: true, // Also works with Ctrl+K on Windows/Linux
      action: () => {
        // Open command palette (handled by useCommandPalette)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      },
      description: 'Open command palette',
      category: 'Navigation',
    },
    {
      key: '/',
      action: () => {
        // Focus search
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
      category: 'Navigation',
    },
    {
      key: 'g',
      metaKey: true,
      ctrlKey: true,
      action: () => {
        navigate('/dashboard');
      },
      description: 'Go to dashboard',
      category: 'Navigation',
    },
    {
      key: 'n',
      metaKey: true,
      ctrlKey: true,
      action: () => {
        // Navigate to create page based on current route
        const path = window.location.pathname;
        if (path.includes('/gate-pass')) {
          navigate('/app/gate-pass/create-visitor');
        } else if (path.includes('/inspections')) {
          navigate('/app/inspections/new');
        } else if (path.includes('/expenses')) {
          navigate('/app/expenses/create');
        } else {
          navigate('/dashboard');
        }
      },
      description: 'Create new item',
      category: 'Actions',
    },
    {
      key: 's',
      metaKey: true,
      ctrlKey: true,
      action: () => {
        // Save current form (if in a form context)
        const form = document.querySelector('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        }
      },
      description: 'Save form',
      category: 'Actions',
      preventDefault: true,
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, dropdowns, etc.
        const modal = document.querySelector('[role="dialog"]');
        if (modal) {
          const closeButton = modal.querySelector('button[aria-label*="close" i], button[aria-label*="Close" i]') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      },
      description: 'Close modal/dialog',
      category: 'Navigation',
    },
  ];

  useKeyboardShortcuts({
    enabled: true,
    shortcuts,
  });
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.metaKey) {
    parts.push('⌘');
  } else if (shortcut.ctrlKey) {
    parts.push('Ctrl');
  }
  
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  
  if (shortcut.altKey) {
    parts.push('Alt');
  }
  
  // Format key
  let key = shortcut.key;
  if (key === ' ') {
    key = 'Space';
  } else if (key.length === 1) {
    key = key.toUpperCase();
  }
  parts.push(key);
  
  return parts.join(' + ');
}


/**
 * Auto-Save Hook
 * 
 * Automatically saves form data to localStorage and restores it on mount
 * Supports debouncing to avoid excessive saves
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseAutoSaveOptions {
  key: string; // localStorage key
  debounceMs?: number; // Debounce delay (default: 1000ms)
  enabled?: boolean; // Enable/disable auto-save
  onSave?: (data: any) => void; // Callback when saving
  onRestore?: (data: any) => void; // Callback when restoring
}

export interface UseAutoSaveReturn {
  hasUnsavedChanges: boolean;
  clearDraft: () => void;
  saveDraft: (data: any) => void;
  restoreDraft: () => any | null;
}

export function useAutoSave<T = any>(
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { key, debounceMs = 1000, enabled = true, onSave, onRestore } = options;
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<string | null>(null);

  // Save to localStorage
  const saveToStorage = useCallback(
    (data: T) => {
      if (!enabled) return;

      try {
        const dataString = JSON.stringify(data);
        
        // Only save if data has changed
        if (dataString !== lastSavedData.current) {
          localStorage.setItem(key, dataString);
          lastSavedData.current = dataString;
          setHasUnsavedChanges(false);
          
          if (onSave) {
            onSave(data);
          }
        }
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [key, enabled, onSave]
  );

  // Debounced save
  const saveDraft = useCallback(
    (data: T) => {
      if (!enabled) return;

      setHasUnsavedChanges(true);

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Set new timer
      debounceTimer.current = setTimeout(() => {
        saveToStorage(data);
      }, debounceMs);
    },
    [enabled, debounceMs, saveToStorage]
  );

  // Restore from localStorage
  const restoreDraft = useCallback((): T | null => {
    if (!enabled) return null;

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored) as T;
      lastSavedData.current = stored;
      setHasUnsavedChanges(false);

      if (onRestore) {
        onRestore(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to restore draft:', error);
      return null;
    }
  }, [key, enabled, onRestore]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedData.current = null;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    hasUnsavedChanges,
    clearDraft,
    saveDraft,
    restoreDraft,
  };
}





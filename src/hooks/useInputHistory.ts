/**
 * useInputHistory Hook
 * 
 * Provides input history/autocomplete suggestions based on previously entered values
 * Stores values in localStorage for persistence across sessions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../lib/logger';

export interface UseInputHistoryOptions {
  storageKey: string; // Unique key for storing history (e.g., 'visitor-name-history')
  maxItems?: number; // Maximum number of history items to store (default: 10)
  minLength?: number; // Minimum input length before showing suggestions (default: 2)
  debounceMs?: number; // Debounce delay for filtering (default: 100)
}

export interface InputHistoryItem {
  value: string;
  timestamp: number;
  count: number; // How many times this value was entered
}

export interface UseInputHistoryReturn {
  suggestions: string[];
  addToHistory: (value: string) => void;
  clearHistory: () => void;
  getHistory: () => InputHistoryItem[];
}

/**
 * Get history from localStorage
 */
function getStoredHistory(storageKey: string): InputHistoryItem[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.error('Error reading input history', error, 'useInputHistory');
  }
  return [];
}

/**
 * Save history to localStorage
 */
function saveHistory(storageKey: string, history: InputHistoryItem[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch (error) {
    logger.error('Error saving input history', error, 'useInputHistory');
  }
}

/**
 * Hook for managing input history with autocomplete suggestions
 */
export function useInputHistory(
  currentValue: string,
  options: UseInputHistoryOptions
): UseInputHistoryReturn {
  const {
    storageKey,
    maxItems = 10,
    minLength = 2,
    debounceMs = 100,
  } = options;

  const [history, setHistory] = useState<InputHistoryItem[]>(() => 
    getStoredHistory(storageKey)
  );

  // Filter and sort suggestions based on current input
  const suggestions = useMemo(() => {
    if (!currentValue || currentValue.length < minLength) {
      return [];
    }

    const lowerValue = currentValue.toLowerCase();
    const matching = history
      .filter(item => 
        item.value.toLowerCase().includes(lowerValue) && 
        item.value.toLowerCase() !== lowerValue // Don't suggest the exact current value
      )
      .sort((a, b) => {
        // Sort by: exact match start > count > recent
        const aStarts = a.value.toLowerCase().startsWith(lowerValue);
        const bStarts = b.value.toLowerCase().startsWith(lowerValue);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        if (b.count !== a.count) return b.count - a.count;
        return b.timestamp - a.timestamp;
      })
      .slice(0, maxItems)
      .map(item => item.value);

    return matching;
  }, [currentValue, history, minLength, maxItems]);

  // Add value to history
  const addToHistory = useCallback((value: string) => {
    if (!value || value.trim().length === 0) return;

    const trimmedValue = value.trim();
    setHistory(prevHistory => {
      const existingIndex = prevHistory.findIndex(
        item => item.value.toLowerCase() === trimmedValue.toLowerCase()
      );

      let newHistory: InputHistoryItem[];

      if (existingIndex >= 0) {
        // Update existing item
        newHistory = [...prevHistory];
        newHistory[existingIndex] = {
          ...newHistory[existingIndex],
          count: newHistory[existingIndex].count + 1,
          timestamp: Date.now(),
        };
      } else {
        // Add new item
        newHistory = [
          ...prevHistory,
          {
            value: trimmedValue,
            timestamp: Date.now(),
            count: 1,
          },
        ];
      }

      // Sort by count and timestamp, keep only top items
      newHistory.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.timestamp - a.timestamp;
      });

      // Keep only maxItems
      const trimmed = newHistory.slice(0, maxItems);

      // Save to localStorage
      saveHistory(storageKey, trimmed);

      return trimmed;
    });
  }, [storageKey, maxItems]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error('Error clearing input history', error, 'useInputHistory');
    }
  }, [storageKey]);

  // Get full history
  const getHistory = useCallback(() => {
    return [...history];
  }, [history]);

  return {
    suggestions,
    addToHistory,
    clearHistory,
    getHistory,
  };
}





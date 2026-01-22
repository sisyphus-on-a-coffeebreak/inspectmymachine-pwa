/**
 * useHapticFeedback Hook
 * 
 * Provides haptic feedback using the Vibration API
 * Falls back gracefully on devices that don't support it
 */

import { useCallback } from 'react';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export interface UseHapticFeedbackReturn {
  trigger: (type?: HapticFeedbackType) => void;
  isSupported: boolean;
}

const HAPTIC_PATTERNS: Record<HapticFeedbackType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10], // Short, pause, short
  error: [20, 50, 20, 50, 20], // Three medium vibrations
  warning: [15, 30, 15], // Two light vibrations
};

// Track if user has interacted with the page
let hasUserInteracted = false;

// Listen for any user interaction to enable haptic feedback
if (typeof window !== 'undefined') {
  const enableHaptic = () => {
    hasUserInteracted = true;
    // Remove listeners after first interaction
    window.removeEventListener('touchstart', enableHaptic);
    window.removeEventListener('mousedown', enableHaptic);
    window.removeEventListener('keydown', enableHaptic);
  };
  
  window.addEventListener('touchstart', enableHaptic, { once: true });
  window.addEventListener('mousedown', enableHaptic, { once: true });
  window.addEventListener('keydown', enableHaptic, { once: true });
}

export function useHapticFeedback(): UseHapticFeedbackReturn {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = useCallback((type: HapticFeedbackType = 'medium') => {
    if (!isSupported) return;
    
    // Only trigger haptic feedback after user interaction
    // This prevents browser warnings about blocked vibration
    if (!hasUserInteracted) return;

    try {
      const pattern = HAPTIC_PATTERNS[type];
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
    }
  }, [isSupported]);

  return {
    trigger,
    isSupported,
  };
}





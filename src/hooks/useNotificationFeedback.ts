/**
 * Notification Feedback Hook
 * 
 * Hook for playing sounds and vibrations when notifications arrive
 */

import { useEffect, useRef } from 'react';

export interface NotificationFeedbackOptions {
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  soundUrl?: string;
}

/**
 * Hook for notification sound and vibration feedback
 */
export function useNotificationFeedback(options: NotificationFeedbackOptions = {}) {
  const {
    soundEnabled = true,
    vibrationEnabled = true,
    soundUrl = '/sounds/notification.mp3', // Default notification sound
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (soundEnabled && typeof Audio !== 'undefined') {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = 0.5; // 50% volume
      audioRef.current.preload = 'auto';
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundEnabled, soundUrl]);

  /**
   * Play notification sound
   */
  const playSound = async () => {
    if (!soundEnabled || !audioRef.current) return;

    try {
      // Reset audio to start
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      // Audio play failed (user interaction required, autoplay blocked, etc.)
      console.warn('Failed to play notification sound:', error);
    }
  };

  /**
   * Vibrate device
   * @param pattern - Vibration pattern (default: [200, 100, 200])
   */
  const vibrate = (pattern: number[] = [200, 100, 200]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration not supported or failed:', error);
    }
  };

  /**
   * Play both sound and vibration
   */
  const playFeedback = (vibrationPattern?: number[]) => {
    playSound();
    vibrate(vibrationPattern);
  };

  return {
    playSound,
    vibrate,
    playFeedback,
  };
}

/**
 * Get vibration pattern for notification type
 */
export function getVibrationPattern(type: string): number[] {
  const patterns: Record<string, number[]> = {
    alert: [200, 100, 200, 100, 200], // Long pattern for alerts
    approval_request: [200, 100, 200], // Standard pattern
    reminder: [100, 50, 100], // Short pattern
    escalation: [300, 100, 300, 100, 300], // Urgent pattern
    info: [100], // Single vibration
  };

  return patterns[type] || [200, 100, 200];
}



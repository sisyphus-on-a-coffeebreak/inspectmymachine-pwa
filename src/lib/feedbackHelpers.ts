/**
 * Feedback Helpers
 * 
 * Utility functions for haptic and audio feedback
 */

/**
 * Haptic feedback using navigator.vibrate
 */
export function hapticFeedback(type: 'success' | 'error'): void {
  if (!navigator.vibrate) {
    return;
  }

  try {
    if (type === 'success') {
      // Single short vibration
      navigator.vibrate(100);
    } else {
      // Error pattern: short-short-short
      navigator.vibrate([50, 50, 50]);
    }
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Audio feedback using Web Audio API
 */
export function playSound(type: 'success' | 'error'): void {
  try {
    const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    
    if (type === 'success') {
      // High beep: 800Hz for 150ms
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } else {
      // Low beep: 300Hz for 300ms
      oscillator.frequency.value = 300;
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    }

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
  } catch (error) {
    // Silently fail if audio is not available
    console.debug('Audio feedback not available:', error);
  }
}

/**
 * Haptic feedback for action confirmation
 * Two 100ms vibrations with 50ms gap
 */
export function hapticFeedbackAction(): void {
  if (!navigator.vibrate) {
    return;
  }

  try {
    // Two 100ms vibrations with 50ms gap
    navigator.vibrate([100, 50, 100]);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Combined feedback: haptic + audio
 */
export function triggerFeedback(type: 'success' | 'error'): void {
  hapticFeedback(type);
  playSound(type);
}

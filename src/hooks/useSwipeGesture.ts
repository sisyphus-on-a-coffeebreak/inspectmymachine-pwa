/**
 * useSwipeGesture Hook
 * 
 * Provides swipe gesture detection for navigation and actions
 * Supports swipe left, right, up, down with configurable thresholds
 */

import { useRef, useCallback, useState } from 'react';

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number; // Minimum velocity to trigger swipe
  preventDefault?: boolean;
  hapticFeedback?: boolean;
}

export interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  isSwiping: boolean;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefault = true,
    hapticFeedback = true,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;
    setIsSwiping(false);
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchCurrentX.current = touch.clientX;
    touchCurrentY.current = touch.clientY;

    const deltaX = touchCurrentX.current - touchStartX.current;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if we're swiping
    if (absDeltaX > 10 || absDeltaY > 10) {
      setIsSwiping(true);
      
      // Determine direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          setSwipeDirection('right');
        } else {
          setSwipeDirection('left');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          setSwipeDirection('down');
        } else {
          setSwipeDirection('up');
        }
      }

      // Prevent default scrolling if horizontal swipe
      if (preventDefault && absDeltaX > absDeltaY && absDeltaX > threshold * 0.5) {
        e.preventDefault();
      }
    }
  }, [threshold, preventDefault]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) {
      setIsSwiping(false);
      setSwipeDirection(null);
      return;
    }

    const deltaX = touchCurrentX.current - touchStartX.current;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Check if swipe meets threshold and velocity requirements
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX >= threshold && velocity >= velocityThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          if (hapticFeedback && navigator.vibrate) {
            navigator.vibrate(10);
          }
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          if (hapticFeedback && navigator.vibrate) {
            navigator.vibrate(10);
          }
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY >= threshold && velocity >= velocityThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          if (hapticFeedback && navigator.vibrate) {
            navigator.vibrate(10);
          }
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          if (hapticFeedback && navigator.vibrate) {
            navigator.vibrate(10);
          }
          onSwipeUp();
        }
      }
    }

    setIsSwiping(false);
    setSwipeDirection(null);
  }, [isSwiping, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, hapticFeedback]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping,
    swipeDirection,
  };
}





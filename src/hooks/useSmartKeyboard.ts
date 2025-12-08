/**
 * Smart Keyboard Handling Hook
 * 
 * Better mobile keyboard handling with auto-scroll and keyboard-aware layouts
 */

import { useEffect, useRef, useState } from 'react';

export interface UseSmartKeyboardOptions {
  enabled?: boolean;
  scrollOffset?: number; // Offset from top when scrolling to input
  adjustLayout?: boolean; // Adjust layout when keyboard is visible
}

/**
 * Hook for smart keyboard handling on mobile devices
 */
export function useSmartKeyboard(options: UseSmartKeyboardOptions = {}) {
  const {
    enabled = true,
    scrollOffset = 100, // 100px offset from top
    adjustLayout = true,
  } = options;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const viewportHeightRef = useRef(window.innerHeight);

  // Detect keyboard visibility by monitoring viewport height changes
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = viewportHeightRef.current - currentHeight;
      
      // If viewport height decreased significantly (likely keyboard opened)
      if (heightDiff > 150) {
        setIsKeyboardVisible(true);
      } else if (heightDiff < -50) {
        // If viewport height increased (likely keyboard closed)
        setIsKeyboardVisible(false);
      }
      
      viewportHeightRef.current = currentHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled]);

  // Auto-scroll to focused input
  useEffect(() => {
    if (!enabled) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Only handle input elements
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Small delay to ensure keyboard animation starts
        setTimeout(() => {
          const rect = target.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const viewportHeight = window.innerHeight;
          
          // Check if input is above viewport or too close to bottom
          if (rect.top < scrollOffset || rect.bottom > viewportHeight - scrollOffset) {
            // Calculate scroll position
            const targetScrollY = scrollY + rect.top - scrollOffset;
            
            window.scrollTo({
              top: Math.max(0, targetScrollY),
              behavior: 'smooth',
            });
          }
        }, 300); // Wait for keyboard animation
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [enabled, scrollOffset]);

  // Adjust layout when keyboard is visible
  useEffect(() => {
    if (!enabled || !adjustLayout) return;

    const body = document.body;
    
    if (isKeyboardVisible) {
      // Add class to body for CSS adjustments
      body.classList.add('keyboard-visible');
      
      // Prevent body scroll when keyboard is visible (optional)
      // body.style.overflow = 'hidden';
    } else {
      body.classList.remove('keyboard-visible');
      // body.style.overflow = '';
    }

    return () => {
      body.classList.remove('keyboard-visible');
    };
  }, [enabled, adjustLayout, isKeyboardVisible]);

  return {
    isKeyboardVisible,
  };
}

/**
 * Hook for input with smart keyboard handling
 */
export function useSmartInput(options: UseSmartKeyboardOptions = {}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { isKeyboardVisible } = useSmartKeyboard(options);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const blur = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  return {
    inputRef,
    isKeyboardVisible,
    focus,
    blur,
  };
}



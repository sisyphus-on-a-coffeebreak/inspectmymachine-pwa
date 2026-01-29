/**
 * Mobile-First Utilities
 * 
 * Centralized utilities for mobile-first responsive design.
 * Ensures consistent behavior across all components.
 */

import { breakpoints, type Breakpoint } from './breakpoints';

/**
 * Mobile-first spacing utilities
 * Returns larger spacing on mobile for better touch targets
 */
export const mobileSpacing = {
  touchTarget: 44, // Minimum touch target size (WCAG)
  padding: {
    xs: 'clamp(8px, 2vw, 12px)',
    sm: 'clamp(12px, 3vw, 16px)',
    md: 'clamp(16px, 4vw, 24px)',
    lg: 'clamp(24px, 5vw, 32px)',
    xl: 'clamp(32px, 6vw, 48px)',
  },
  gap: {
    xs: 'clamp(8px, 2vw, 12px)',
    sm: 'clamp(12px, 3vw, 16px)',
    md: 'clamp(16px, 4vw, 24px)',
    lg: 'clamp(24px, 5vw, 32px)',
    xl: 'clamp(32px, 6vw, 48px)',
  },
};

/**
 * Mobile-first typography utilities
 */
export const mobileTypography = {
  fontSize: {
    xs: 'clamp(11px, 2.5vw, 12px)',
    sm: 'clamp(13px, 3vw, 14px)',
    base: 'clamp(14px, 3.5vw, 16px)',
    lg: 'clamp(16px, 4vw, 18px)',
    xl: 'clamp(18px, 4.5vw, 20px)',
    '2xl': 'clamp(20px, 5vw, 24px)',
    '3xl': 'clamp(24px, 6vw, 28px)',
    '4xl': 'clamp(28px, 7vw, 32px)',
  },
};

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.tablet;
}

/**
 * Check if current viewport is tablet or larger
 */
export function isTabletOrLarger(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= breakpoints.tablet;
}

/**
 * Get responsive container styles
 * Ensures no horizontal overflow on mobile
 */
export function getResponsiveContainerStyles(options?: {
  maxWidth?: string;
  padding?: string;
  mobilePadding?: string;
}): React.CSSProperties {
  return {
    width: '100%',
    maxWidth: options?.maxWidth || '100%',
    padding: options?.mobilePadding || options?.padding || mobileSpacing.padding.md,
    boxSizing: 'border-box',
    // INVARIANT 1: NO overflow-x masking - we prevent overflow, not hide it
    ...(isTabletOrLarger() && {
      padding: options?.padding || mobileSpacing.padding.lg,
      maxWidth: options?.maxWidth || '1280px',
      margin: '0 auto',
    }),
  };
}

/**
 * Get responsive page container styles
 * Standard pattern for page-level containers
 * Mobile: 100% width, reduced padding
 * Desktop: Centered with max-width, larger padding
 */
export function getResponsivePageContainerStyles(options?: {
  maxWidth?: string;
  desktopMaxWidth?: string;
  padding?: string;
  mobilePadding?: string;
}): React.CSSProperties {
  const isMobile = isMobileViewport();
  const desktopMaxWidth = options?.desktopMaxWidth || options?.maxWidth || '1200px';
  
  return {
    width: '100%',
    maxWidth: isMobile ? '100%' : desktopMaxWidth,
    margin: isMobile ? '0' : '0 auto',
    padding: isMobile 
      ? (options?.mobilePadding || mobileSpacing.padding.lg)
      : (options?.padding || mobileSpacing.padding.xl),
    boxSizing: 'border-box',
  };
}

/**
 * Get touch-friendly button styles
 * Ensures minimum 44x44px touch targets
 */
export function getTouchButtonStyles(options?: {
  minHeight?: number;
  minWidth?: number;
  padding?: string;
}): React.CSSProperties {
  const minSize = mobileSpacing.touchTarget;
  return {
    minHeight: options?.minHeight || minSize,
    minWidth: options?.minWidth || minSize,
    padding: options?.padding || mobileSpacing.padding.sm,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation', // Disable double-tap zoom
    WebkitTapHighlightColor: 'transparent',
  };
}

/**
 * Get mobile-first modal styles
 * Full-screen on mobile, centered on desktop
 */
export function getResponsiveModalStyles(isOpen: boolean): React.CSSProperties {
  if (!isOpen) {
    return { display: 'none' };
  }

  if (isMobileViewport()) {
    // Full-screen on mobile
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100dvh',
      maxWidth: '100vw',
      maxHeight: '100dvh',
      margin: 0,
      borderRadius: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    };
  }

  // Centered on desktop
  return {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90vw',
    maxHeight: '90vh',
    width: 'auto',
    height: 'auto',
    margin: 0,
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
}

/**
 * Get scrollable container styles
 * Prevents overflow issues on mobile
 */
export function getScrollableContainerStyles(options?: {
  maxHeight?: string;
  mobileMaxHeight?: string;
}): React.CSSProperties {
  return {
    overflowY: 'auto',
    // INVARIANT 1: Content must not overflow horizontally - fix the cause, not symptom
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    WebkitOverflowScrolling: 'touch',
    maxHeight: isMobileViewport()
      ? options?.mobileMaxHeight || 'calc(100dvh - 200px)'
      : options?.maxHeight || 'calc(100vh - 200px)',
    overscrollBehavior: 'contain', // Prevent scroll chaining
  };
}

/**
 * Get table wrapper styles for mobile
 * Horizontal scroll wrapper on mobile
 */
export function getTableWrapperStyles(): React.CSSProperties {
  return {
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    ...(isMobileViewport() && {
      // On mobile, ensure table doesn't break layout
      marginLeft: `-${mobileSpacing.padding.md}`,
      marginRight: `-${mobileSpacing.padding.md}`,
      paddingLeft: mobileSpacing.padding.md,
      paddingRight: mobileSpacing.padding.md,
    }),
  };
}

/**
 * Prevent body scroll when modal/drawer is open
 */
export function lockBodyScroll(lock: boolean): void {
  if (typeof document === 'undefined') return;

  if (lock) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  } else {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }
}

/**
 * Get safe area insets for mobile devices
 */
export function getSafeAreaInsets(): {
  top: string;
  bottom: string;
  left: string;
  right: string;
} {
  return {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  };
}

// Import React for hooks
import React from 'react';

/**
 * React hook for mobile viewport detection
 */
export function useMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;

  const [isMobile, setIsMobile] = React.useState(() => isMobileViewport());

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileViewport());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isMobile;
}

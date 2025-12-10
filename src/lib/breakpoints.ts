/**
 * Centralized Breakpoint Utilities
 * 
 * Standardized breakpoints for consistent responsive design across the application.
 * All components should use these breakpoints instead of hardcoded values.
 */

import React from 'react';

export const breakpoints = {
  mobile: 0,
  mobileLandscape: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Get the current breakpoint based on window width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  if (width >= breakpoints.mobileLandscape) return 'mobileLandscape';
  return 'mobile';
}

/**
 * Check if current width matches a breakpoint
 */
export function isBreakpoint(width: number, breakpoint: Breakpoint): boolean {
  const bp = breakpoints[breakpoint];
  const nextBp = breakpoint === 'mobile' 
    ? breakpoints.mobileLandscape
    : breakpoint === 'mobileLandscape'
    ? breakpoints.tablet
    : breakpoint === 'tablet'
    ? breakpoints.desktop
    : breakpoint === 'desktop'
    ? breakpoints.wide
    : Infinity;
  
  return width >= bp && width < nextBp;
}

/**
 * Check if width is mobile (0-767px)
 */
export function isMobile(width: number): boolean {
  return width < breakpoints.tablet;
}

/**
 * Check if width is tablet (768-1023px)
 */
export function isTablet(width: number): boolean {
  return width >= breakpoints.tablet && width < breakpoints.desktop;
}

/**
 * Check if width is desktop (1024px+)
 */
export function isDesktop(width: number): boolean {
  return width >= breakpoints.desktop;
}

/**
 * Media query strings for use in CSS
 */
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobileLandscape - 1}px)`,
  mobileLandscape: `@media (min-width: ${breakpoints.mobileLandscape}px) and (max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.desktop}px) and (max-width: ${breakpoints.wide - 1}px)`,
  wide: `@media (min-width: ${breakpoints.wide}px)`,
  
  // Utility queries
  upToTablet: `@media (max-width: ${breakpoints.tablet - 1}px)`,
  tabletAndUp: `@media (min-width: ${breakpoints.tablet}px)`,
  desktopAndUp: `@media (min-width: ${breakpoints.desktop}px)`,
} as const;

/**
 * React hook to get current breakpoint
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') return 'desktop';
  
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() => 
    getCurrentBreakpoint(window.innerWidth)
  );

  React.useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getCurrentBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

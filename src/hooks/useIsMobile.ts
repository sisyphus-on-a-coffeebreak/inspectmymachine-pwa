import { useState, useEffect } from 'react';

/**
 * Mobile detection hook (INVARIANT 2: responsive primitives)
 *
 * Detects mobile viewport and updates on resize.
 * Breakpoint: 768px (matches theme.ts breakpoints)
 *
 * @returns boolean - true if viewport width < 768px
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

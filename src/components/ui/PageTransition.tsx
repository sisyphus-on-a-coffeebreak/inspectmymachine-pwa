/**
 * PageTransition Component
 * 
 * Provides fade-in and slide-in animations for page transitions
 * Uses CSS transitions for optimal performance
 */

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { colors } from '../../lib/theme';

export interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'fade' | 'slide' | 'fade-slide';
  duration?: number;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fade',
  duration = 300,
}) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Fade out
    setIsVisible(false);
    
    // After fade out, update children and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      // Force reflow
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, duration / 2);

    return () => clearTimeout(timer);
  }, [location.pathname, children, duration]);

  useEffect(() => {
    // Initial fade in
    setIsVisible(true);
  }, []);

  const getTransitionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`,
      opacity: isVisible ? 1 : 0,
      minHeight: '100%',
    };

    switch (variant) {
      case 'fade':
        return baseStyle;
      
      case 'slide':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        };
      
      case 'fade-slide':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        };
      
      default:
        return baseStyle;
    }
  };

  return (
    <div style={getTransitionStyle()}>
      {displayChildren}
    </div>
  );
};

/**
 * Hook to get page transition styles
 */
export function usePageTransition(variant: 'fade' | 'slide' | 'fade-slide' = 'fade', duration: number = 300) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, duration / 2);
    return () => clearTimeout(timer);
  }, [location.pathname, duration]);

  const getStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`,
      opacity: isVisible ? 1 : 0,
    };

    switch (variant) {
      case 'fade':
        return baseStyle;
      case 'slide':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        };
      case 'fade-slide':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        };
      default:
        return baseStyle;
    }
  };

  return { style: getStyle(), isVisible };
}




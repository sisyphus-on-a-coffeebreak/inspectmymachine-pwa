/**
 * Tooltip Component
 * 
 * Contextual help tooltips for better UX
 * Supports multiple positions and trigger modes
 */

import React, { useState, useRef, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  trigger?: 'hover' | 'click' | 'focus';
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  trigger = 'hover',
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + 8;
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
        left = triggerRect.right + scrollX + 8;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    if (top < scrollY + padding) top = scrollY + padding;
    if (left < scrollX + padding) left = scrollX + padding;
    if (left + tooltipRect.width > scrollX + window.innerWidth - padding) {
      left = scrollX + window.innerWidth - tooltipRect.width - padding;
    }

    setTooltipPosition({ top, left });
  };

  const showTooltip = () => {
    if (disabled) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(calculatePosition, 10);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const toggleTooltip = () => {
    if (disabled) return;
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      const handleScroll = () => calculatePosition();
      const handleResize = () => calculatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const eventHandlers: Record<string, any> = {};
  if (trigger === 'hover') {
    eventHandlers.onMouseEnter = showTooltip;
    eventHandlers.onMouseLeave = hideTooltip;
  } else if (trigger === 'click') {
    eventHandlers.onClick = toggleTooltip;
  } else if (trigger === 'focus') {
    eventHandlers.onFocus = showTooltip;
    eventHandlers.onBlur = hideTooltip;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`tooltip-trigger ${className}`}
        style={{ display: 'inline-block', position: 'relative' }}
        {...eventHandlers}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="tooltip-content"
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 9999,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: colors.neutral[900],
            color: 'white',
            borderRadius: borderRadius.md,
            fontSize: '12px',
            fontFamily: typography.body.fontFamily,
            lineHeight: '1.4',
            maxWidth: '250px',
            boxShadow: shadows.lg,
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out',
          }}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(position === 'top' && {
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '6px 6px 0 6px',
                borderColor: `${colors.neutral[900]} transparent transparent transparent`,
              }),
              ...(position === 'bottom' && {
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '0 6px 6px 6px',
                borderColor: `transparent transparent ${colors.neutral[900]} transparent`,
              }),
              ...(position === 'left' && {
                right: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '6px 0 6px 6px',
                borderColor: `transparent transparent transparent ${colors.neutral[900]}`,
              }),
              ...(position === 'right' && {
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '6px 6px 6px 0',
                borderColor: `transparent ${colors.neutral[900]} transparent transparent`,
              }),
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Tooltip;


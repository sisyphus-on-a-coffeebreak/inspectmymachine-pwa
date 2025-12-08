/**
 * SwipeableListItem Component
 * 
 * A list item that supports swipe gestures for actions
 * Commonly used for swipe-to-delete or swipe-to-reveal actions
 */

import React, { useRef, useState, useCallback } from 'react';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { Trash2, ChevronRight } from 'lucide-react';

export interface SwipeableListItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: React.ReactNode;
    label?: string;
    color?: string;
    onClick: () => void;
  };
  rightAction?: {
    icon?: React.ReactNode;
    label?: string;
    color?: string;
    onClick: () => void;
  };
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 80,
  disabled = false,
  className = '',
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const startTranslateX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    startTranslateX.current = translateX;
    setIsDragging(true);
  }, [disabled, translateX]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // Only allow horizontal swipe if vertical movement is minimal
    if (deltaY < 30) {
      const newTranslateX = startTranslateX.current + deltaX;
      
      // Limit swipe distance based on available actions
      let minTranslate = 0;
      let maxTranslate = 0;
      
      if (rightAction) {
        minTranslate = -threshold;
      }
      if (leftAction) {
        maxTranslate = threshold;
      }
      
      const clampedTranslate = Math.max(minTranslate, Math.min(maxTranslate, newTranslateX));
      setTranslateX(clampedTranslate);
      
      // Prevent scrolling during horizontal swipe
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isDragging, threshold, leftAction, rightAction]);

  const handleTouchEnd = useCallback(() => {
    if (disabled) return;
    
    setIsDragging(false);
    
    // Determine if we should trigger an action or snap back
    if (translateX < -threshold / 2 && rightAction) {
      // Swipe left enough to trigger right action
      setTranslateX(-threshold);
      setTimeout(() => {
        rightAction.onClick();
        setTranslateX(0);
      }, 200);
      if (onSwipeLeft) onSwipeLeft();
    } else if (translateX > threshold / 2 && leftAction) {
      // Swipe right enough to trigger left action
      setTranslateX(threshold);
      setTimeout(() => {
        leftAction.onClick();
        setTranslateX(0);
      }, 200);
      if (onSwipeRight) onSwipeRight();
    } else {
      // Snap back to center
      setTranslateX(0);
    }
  }, [disabled, translateX, threshold, leftAction, rightAction, onSwipeLeft, onSwipeRight]);

  const handleActionClick = useCallback((action: typeof leftAction | typeof rightAction) => {
    if (action) {
      action.onClick();
      setTranslateX(0);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`swipeable-list-item ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
      }}
    >
      {/* Left Action (revealed on swipe right) */}
      {leftAction && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${threshold}px`,
            backgroundColor: leftAction.color || colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 1,
            transform: `translateX(${Math.max(0, translateX - threshold)}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
          onClick={() => handleActionClick(leftAction)}
        >
          {leftAction.icon || <ChevronRight size={20} />}
          {leftAction.label && (
            <span style={{ marginLeft: spacing.xs, fontSize: '12px', fontWeight: 500 }}>
              {leftAction.label}
            </span>
          )}
        </div>
      )}

      {/* Right Action (revealed on swipe left) */}
      {rightAction && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: `${threshold}px`,
            backgroundColor: rightAction.color || colors.error[500],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 1,
            transform: `translateX(${Math.min(0, translateX + threshold)}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
          onClick={() => handleActionClick(rightAction)}
        >
          {rightAction.icon || <Trash2 size={20} />}
          {rightAction.label && (
            <span style={{ marginRight: spacing.xs, fontSize: '12px', fontWeight: 500 }}>
              {rightAction.label}
            </span>
          )}
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'white',
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};





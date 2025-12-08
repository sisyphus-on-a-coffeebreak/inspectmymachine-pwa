/**
 * PullToRefreshWrapper Component
 * 
 * Wraps content with pull-to-refresh functionality
 * Easy to integrate into any list or dashboard page
 */

import React, { useRef, useEffect } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

export interface PullToRefreshWrapperProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const PullToRefreshWrapper: React.FC<PullToRefreshWrapperProps> = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { pullDistance, isRefreshing, containerProps } = usePullToRefresh(containerRef, {
    onRefresh,
    threshold,
    disabled,
  });

  // Apply touch handlers to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', containerProps.onTouchStart as any);
    container.addEventListener('touchmove', containerProps.onTouchMove as any);
    container.addEventListener('touchend', containerProps.onTouchEnd as any);

    return () => {
      container.removeEventListener('touchstart', containerProps.onTouchStart as any);
      container.removeEventListener('touchmove', containerProps.onTouchMove as any);
      container.removeEventListener('touchend', containerProps.onTouchEnd as any);
    };
  }, [containerProps]);

  return (
    <div
      ref={containerRef}
      className={`pull-to-refresh-wrapper ${className}`}
      style={{
        position: 'relative',
        minHeight: '100%',
        ...style,
      }}
    >
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        threshold={threshold}
        isRefreshing={isRefreshing}
      />
      {children}
    </div>
  );
};





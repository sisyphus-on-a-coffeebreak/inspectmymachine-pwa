import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // default 80
  disabled?: boolean;
}

export interface UsePullToRefreshReturn {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement>,
  options: UsePullToRefreshOptions
): UsePullToRefreshReturn {
  const { onRefresh, threshold = 80, disabled = false } = options;
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const touchStartY = useRef<number>(0);
  const touchStartScrollTop = useRef<number>(0);
  const isAtTop = useRef<boolean>(false);

  const checkIfAtTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    
    // Check if container is at the top
    if (container === document.body || container === document.documentElement) {
      return window.scrollY === 0;
    }
    return container.scrollTop === 0;
  }, [containerRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    isAtTop.current = checkIfAtTop();
    
    if (isAtTop.current) {
      touchStartY.current = e.touches[0].clientY;
      touchStartScrollTop.current = container.scrollTop;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing, containerRef, checkIfAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isPulling || !isAtTop.current) return;

    const container = containerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Only allow pull down (positive deltaY)
    if (deltaY > 0 && container.scrollTop === 0) {
      e.preventDefault();
      
      // Calculate pull distance with resistance
      const resistance = 0.5; // Add resistance after threshold
      const rawDistance = deltaY;
      const distance = rawDistance > threshold
        ? threshold + (rawDistance - threshold) * resistance
        : rawDistance;

      setPullDistance(distance);

      // Haptic feedback when threshold is reached
      if (rawDistance >= threshold && pullDistance < threshold) {
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [disabled, isRefreshing, isPulling, threshold, pullDistance, containerRef]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
  }, [disabled, isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  // Reset on mount/unmount
  useEffect(() => {
    return () => {
      setPullDistance(0);
      setIsPulling(false);
      setIsRefreshing(false);
    };
  }, []);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}


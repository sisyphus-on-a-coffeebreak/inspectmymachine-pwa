/**
 * useInfiniteScroll Hook
 * 
 * Provides infinite scroll functionality that works with paginated APIs
 * Automatically loads more data when user scrolls near the bottom
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => void;
  threshold?: number; // Distance from bottom in pixels to trigger load
  enabled?: boolean;
  rootMargin?: string; // IntersectionObserver rootMargin
}

export interface UseInfiniteScrollReturn {
  ref: (node: HTMLElement | null) => void;
  isFetching: boolean;
  hasNextPage: boolean;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  fetchNextPage,
  threshold = 200,
  enabled = true,
  rootMargin = '200px',
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const [sentinelRef, setSentinelRef] = useState<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Set up IntersectionObserver
  useEffect(() => {
    if (!enabled || !hasNextPage || isFetching || !sentinelRef) {
      return;
    }

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sentinelRef, hasNextPage, isFetching, fetchNextPage, enabled, rootMargin]);

  const ref = useCallback((node: HTMLElement | null) => {
    setSentinelRef(node);
  }, []);

  return {
    ref,
    isFetching,
    hasNextPage,
  };
}

/**
 * Alternative: Scroll-based infinite scroll (fallback if IntersectionObserver not available)
 */
export function useInfiniteScrollLegacy({
  hasNextPage,
  isFetching,
  fetchNextPage,
  threshold = 200,
  enabled = true,
  containerRef,
}: Omit<UseInfiniteScrollOptions, 'rootMargin'> & { containerRef: React.RefObject<HTMLElement> }): UseInfiniteScrollReturn {
  const [isFetchingState, setIsFetchingState] = useState(false);

  useEffect(() => {
    if (!enabled || !hasNextPage || isFetching) return;

    const container = containerRef.current || window;
    const handleScroll = () => {
      const scrollTop = container === window 
        ? window.scrollY 
        : (container as HTMLElement).scrollTop;
      const scrollHeight = container === window
        ? document.documentElement.scrollHeight
        : (container as HTMLElement).scrollHeight;
      const clientHeight = container === window
        ? window.innerHeight
        : (container as HTMLElement).clientHeight;

      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

      if (distanceFromBottom < threshold && !isFetching && !isFetchingState) {
        setIsFetchingState(true);
        fetchNextPage();
        setTimeout(() => setIsFetchingState(false), 1000);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetching, fetchNextPage, threshold, enabled, containerRef, isFetchingState]);

  return {
    ref: () => {}, // Not used in legacy mode
    isFetching: isFetching || isFetchingState,
    hasNextPage,
  };
}





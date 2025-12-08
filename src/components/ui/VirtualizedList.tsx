/**
 * VirtualizedList Component
 * 
 * A lightweight virtualized list for rendering large datasets efficiently
 * Uses windowing technique to only render visible items
 * Falls back to regular list if virtualization not needed
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { colors, spacing } from '../../lib/theme';

export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  containerHeight?: number;
  overscan?: number; // Number of items to render outside visible area
  className?: string;
  style?: React.CSSProperties;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  className = '',
  style = {},
  onScroll,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ height: containerHeight, width: 0 });

  // Calculate item height (fixed or dynamic)
  const getItemHeight = useMemo(() => {
    if (typeof itemHeight === 'function') {
      return itemHeight;
    }
    return () => itemHeight;
  }, [itemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    return items.reduce((sum, _, index) => sum + getItemHeight(index), 0);
  }, [items.length, itemHeight, getItemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = items.length;
    let offsetY = 0;

    if (typeof itemHeight === 'number') {
      start = Math.floor(scrollTop / itemHeight);
      end = Math.min(
        items.length,
        Math.ceil((scrollTop + containerSize.height) / itemHeight)
      );
      offsetY = start * itemHeight;
    } else {
      // Dynamic height calculation
      let currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (currentOffset + height > scrollTop) {
          start = Math.max(0, i - overscan);
          break;
        }
        currentOffset += height;
      }

      currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (currentOffset > scrollTop + containerSize.height) {
          end = Math.min(items.length, i + overscan);
          break;
        }
        currentOffset += height;
      }

      // Calculate offsetY for dynamic heights
      offsetY = 0;
      for (let i = 0; i < start; i++) {
        offsetY += getItemHeight(i);
      }
    }

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
      offsetY,
    };
  }, [scrollTop, containerSize.height, items.length, itemHeight, getItemHeight, overscan]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    if (onScroll) {
      onScroll(newScrollTop);
    }
  }, [onScroll]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          height: entry.contentRect.height,
          width: entry.contentRect.width,
        });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange.start, visibleRange.end]);

  // For small lists, don't virtualize
  if (items.length < 50) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          height: containerHeight,
          overflowY: 'auto',
          ...style,
        }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        position: 'relative',
        ...style,
      }}
      onScroll={handleScroll}
    >
      {/* Spacer for items above visible area */}
      <div style={{ height: visibleRange.offsetY }} />

      {/* Visible items */}
      <div style={{ position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <div key={actualIndex}>
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>

      {/* Spacer for items below visible area */}
      <div
        style={{
          height: totalHeight - visibleRange.offsetY - (visibleItems.length * (typeof itemHeight === 'number' ? itemHeight : 60)),
        }}
      />
    </div>
  );
}





/**
 * ImageViewer Component
 * 
 * A full-screen image viewer with pinch-to-zoom, pan, and double-tap to zoom
 * Uses native touch events for optimal performance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { colors, spacing, borderRadius } from '../../lib/theme';

export interface ImageViewerProps {
  images: Array<{ id: string; url: string; alt?: string }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onImageChange?: (index: number) => void;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_DELAY = 300;

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onImageChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotation: 0,
  });
  const [isZoomed, setIsZoomed] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartDistanceRef = useRef<number>(0);
  const touchStartScaleRef = useRef<number>(1);
  const touchStartCenterRef = useRef<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset transform when image changes
  useEffect(() => {
    if (isOpen) {
      setTransform({ scale: 1, translateX: 0, translateY: 0, rotation: 0 });
      setIsZoomed(false);
    }
  }, [currentIndex, isOpen]);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Notify parent of image change
  useEffect(() => {
    if (onImageChange) {
      onImageChange(currentIndex);
    }
  }, [currentIndex, onImageChange]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  // Calculate distance between two touches
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for pan or double tap
      const touch = e.touches[0];
      panStartRef.current = { x: touch.clientX, y: touch.clientY };
      
      // Double tap detection
      const now = Date.now();
      const timeDiff = now - lastTapRef.current;
      if (timeDiff < DOUBLE_TAP_DELAY && timeDiff > 0) {
        // Double tap - toggle zoom
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          if (transform.scale > MIN_SCALE) {
            // Zoom out
            setTransform({ scale: MIN_SCALE, translateX: 0, translateY: 0, rotation: 0 });
            setIsZoomed(false);
          } else {
            // Zoom in
            const newScale = 2;
            setTransform({
              scale: newScale,
              translateX: 0,
              translateY: 0,
              rotation: 0,
            });
            setIsZoomed(true);
          }
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      touchStartDistanceRef.current = getTouchDistance(touch1, touch2);
      touchStartScaleRef.current = transform.scale;
      touchStartCenterRef.current = getTouchCenter(touch1, touch2);
    }
  }, [transform.scale]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isZoomed) {
      // Single touch pan when zoomed
      const touch = e.touches[0];
      if (panStartRef.current) {
        const deltaX = touch.clientX - panStartRef.current.x;
        const deltaY = touch.clientY - panStartRef.current.y;
        
        setTransform((prev) => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY,
        }));
        
        panStartRef.current = { x: touch.clientX, y: touch.clientY };
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = getTouchDistance(touch1, touch2);
      const scaleChange = currentDistance / touchStartDistanceRef.current;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, touchStartScaleRef.current * scaleChange));
      
      if (touchStartCenterRef.current) {
        const currentCenter = getTouchCenter(touch1, touch2);
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = touchStartCenterRef.current.x - rect.left;
          const centerY = touchStartCenterRef.current.y - rect.top;
          
          setTransform({
            scale: newScale,
            translateX: (currentCenter.x - touchStartCenterRef.current.x) + transform.translateX,
            translateY: (currentCenter.y - touchStartCenterRef.current.y) + transform.translateY,
            rotation: transform.rotation,
          });
          setIsZoomed(newScale > MIN_SCALE);
        }
      }
    }
  }, [isZoomed, transform.translateX, transform.translateY, transform.rotation]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    panStartRef.current = null;
    touchStartDistanceRef.current = 0;
    touchStartCenterRef.current = null;
  }, []);

  // Reset zoom
  const handleResetZoom = useCallback(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0, rotation: 0 });
    setIsZoomed(false);
  }, []);

  // Rotate image
  const handleRotate = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close image viewer"
        style={{
          position: 'absolute',
          top: spacing.lg,
          right: spacing.lg,
          background: 'rgba(0, 0, 0, 0.5)',
          border: 'none',
          borderRadius: borderRadius.full,
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white',
          zIndex: 10001,
        }}
      >
        <X size={24} />
      </button>

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: spacing.lg,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: spacing.md,
          zIndex: 10001,
        }}
      >
        <button
          onClick={handleResetZoom}
          aria-label="Reset zoom"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
        </button>
        <button
          onClick={handleRotate}
          aria-label="Rotate image"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: 'none',
            borderRadius: borderRadius.md,
            padding: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          <RotateCw size={20} />
        </button>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: spacing.lg,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                borderRadius: borderRadius.full,
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                zIndex: 10001,
              }}
            >
              ←
            </button>
          )}
          {currentIndex < images.length - 1 && (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: spacing.lg,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                borderRadius: borderRadius.full,
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                zIndex: 10001,
              }}
            >
              →
            </button>
          )}
        </>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: spacing.lg,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.5)',
            padding: `${spacing.xs} ${spacing.md}`,
            borderRadius: borderRadius.full,
            fontSize: '14px',
            zIndex: 10001,
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <img
        ref={imageRef}
        src={currentImage.url}
        alt={currentImage.alt || `Image ${currentIndex + 1}`}
        // Only use crossOrigin in production (when not using proxy)
        crossOrigin={import.meta.env.PROD ? "anonymous" : undefined}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          transform: `scale(${transform.scale}) translate(${transform.translateX / transform.scale}px, ${transform.translateY / transform.scale}px) rotate(${transform.rotation}deg)`,
          transition: 'transform 0.1s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'none',
        }}
        draggable={false}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // In prod, try without crossOrigin if it fails
          if (import.meta.env.PROD && img.crossOrigin === 'anonymous') {
            img.crossOrigin = null;
            img.src = currentImage.url;
          }
        }}
      />
    </div>
  );
};





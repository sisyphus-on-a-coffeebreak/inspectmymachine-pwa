import React, { useEffect, useRef, useState } from 'react';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { zIndex } from '../../lib/z-index';

export interface BottomSheetProps {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * BottomSheet Component
 *
 * Native mobile-style bottom sheet that slides up from the bottom
 * Supports touch swipe-to-dismiss gesture
 * Replaces Modal for mobile-first interactions
 */
export function BottomSheet({
  title,
  children,
  onClose,
  isOpen,
  className = '',
}: BottomSheetProps) {
  const contentRef = useFocusTrap<HTMLDivElement>(isOpen);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow dragging down (positive deltaY)
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // If dragged more than 100px, close the sheet
    if (dragY > 100) {
      onClose();
    }

    // Reset drag position
    setDragY(0);
  };

  // Handle responsive breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1024);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute transform based on screen size and drag state
  const getTransform = () => {
    if (isDesktop) {
      // Desktop: Centered modal (no drag support on desktop)
      return 'translate(-50%, -50%)';
    } else if (isTablet) {
      // Tablet: Bottom sheet centered horizontally with drag support
      return `translate(-50%, ${dragY}px)`;
    } else {
      // Mobile: Full-width bottom sheet with drag support
      return `translateY(${dragY}px)`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          zIndex: zIndex.bottomSheetBackdrop,
          animation: 'fadeIn 0.2s ease-out',
        }}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={contentRef}
        className={`bottom-sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        onTouchStart={!isDesktop ? handleTouchStart : undefined}
        onTouchMove={!isDesktop ? handleTouchMove : undefined}
        onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        style={{
          position: 'fixed',
          bottom: isDesktop ? 'auto' : 0,
          top: isDesktop ? '50%' : 'auto',
          left: isDesktop || isTablet ? '50%' : 0,
          right: isDesktop || isTablet ? 'auto' : 0,
          maxWidth: isDesktop ? '400px' : isTablet ? '600px' : 'none',
          maxHeight: isDesktop ? '80vh' : '90vh',
          backgroundColor: 'white',
          borderRadius: isDesktop ? borderRadius.lg : 'auto',
          borderTopLeftRadius: !isDesktop ? borderRadius.xl : 'auto',
          borderTopRightRadius: !isDesktop ? borderRadius.xl : 'auto',
          boxShadow: shadows.xl,
          zIndex: zIndex.bottomSheet,
          display: 'flex',
          flexDirection: 'column',
          animation: isDragging ? 'none' : isDesktop ? 'fadeIn 0.2s ease-out' : 'slideUp 0.3s ease-out',
          transform: getTransform(),
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          paddingBottom: isDesktop ? '0' : 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Handle Bar - Only show on mobile/tablet */}
        {!isDesktop && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: spacing.sm,
              paddingBottom: spacing.xs,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: colors.neutral[300],
                borderRadius: borderRadius.full,
              }}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Header */}
        {(title || true) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `0 ${spacing.lg} ${spacing.md} ${spacing.lg}`,
              borderBottom: `1px solid ${colors.neutral[200]}`,
            }}
          >
            {title && (
              <h2
                id="bottom-sheet-title"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.neutral[900],
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.neutral[600],
                transition: 'all 0.2s',
                minWidth: '44px', // Minimum touch target
                minHeight: '44px', // Minimum touch target
                width: '44px',
                height: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
                e.currentTarget.style.color = colors.neutral[900];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.neutral[600];
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.lg,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default BottomSheet;

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '90vh',
          backgroundColor: 'white',
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          boxShadow: shadows.xl,
          zIndex: zIndex.bottomSheet,
          display: 'flex',
          flexDirection: 'column',
          animation: isDragging ? 'none' : 'slideUp 0.3s ease-out',
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {/* Handle Bar */}
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

        /* Tablet: Wider bottom sheet but still bottom-anchored */
        @media (min-width: 768px) and (max-width: 1023px) {
          .bottom-sheet {
            max-width: 600px;
            margin: 0 auto;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
          }
        }

        /* Desktop: Show as centered modal */
        @media (min-width: 1024px) {
          .bottom-sheet {
            position: fixed;
            top: 50%;
            left: 50%;
            bottom: auto;
            right: auto;
            transform: translate(-50%, -50%);
            max-width: 400px;
            max-height: 80vh;
            border-radius: ${borderRadius.lg};
            animation: fadeIn 0.2s ease-out;
          }

          .bottom-sheet-backdrop {
            animation: fadeIn 0.2s ease-out;
          }
        }
      `}</style>
    </>
  );
}

export default BottomSheet;

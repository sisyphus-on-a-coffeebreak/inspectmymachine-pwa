import React, { useEffect } from 'react';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
          zIndex: 9998,
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
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out',
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
            cursor: 'grab',
          }}
          onMouseDown={(e) => {
            // Allow dragging to close (optional enhancement)
            const startY = e.clientY;
            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaY = moveEvent.clientY - startY;
              if (deltaY > 100) {
                onClose();
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              }
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
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
        
        /* Desktop: Show as modal */
        @media (min-width: 768px) {
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


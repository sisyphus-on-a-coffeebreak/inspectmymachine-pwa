/**
 * SortablePhotoGrid Component
 * 
 * Provides drag-to-reorder and swipe-to-delete functionality for photos.
 * 
 * Usage with backend:
 * - For photos stored in inspection_answers.answer_files, use reorderInspectionPhotos()
 *   from @/lib/inspectionPhotoReorder
 * - The photo.id should match the 'key' field in answer_files
 * 
 * Example:
 * ```tsx
 * const handleReorder = async (newOrder: string[]) => {
 *   await reorderInspectionPhotos(inspectionId, answerId, newOrder);
 *   // Refresh data
 * };
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';
import { cn } from '../../lib/utils';

export interface Photo {
  id: string; // Should match the 'key' in answer_files for backend reordering
  url: string;
  name?: string;
}

export interface SortablePhotoGridProps {
  photos: Photo[];
  onReorder: (newOrder: string[]) => void;
  onDelete: (id: string) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function SortablePhotoGrid({
  photos,
  onReorder,
  onDelete,
  maxPhotos,
  disabled = false,
}: SortablePhotoGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [swipedPhotoId, setSwipedPhotoId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchPhotoId = useRef<string | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  }, [disabled]);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  }, [disabled, draggedIndex]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhotos = [...photos];
    const [removed] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dragOverIndex, 0, removed);
    
    onReorder(newPhotos.map(p => p.id));
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, photos, onReorder]);

  // Touch handlers for swipe-to-delete
  const handleTouchStart = useCallback((e: React.TouchEvent, photoId: string) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchPhotoId.current = photoId;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchPhotoId.current) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 80 && deltaY < 50 && deltaX < 0) {
      setSwipedPhotoId(touchPhotoId.current);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    } else if (Math.abs(deltaX) < 80) {
      setSwipedPhotoId(null);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    touchPhotoId.current = null;
    // Reset swipe after a delay if not confirmed
    setTimeout(() => {
      if (swipedPhotoId && deleteConfirmId !== swipedPhotoId) {
        setSwipedPhotoId(null);
      }
    }, 3000);
  }, [swipedPhotoId, deleteConfirmId]);

  // Handle delete with undo
  const handleDelete = useCallback((photoId: string) => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    setDeleteConfirmId(photoId);
    setSwipedPhotoId(null);
    
    // Auto-delete after 3 seconds
    undoTimeoutRef.current = setTimeout(() => {
      onDelete(photoId);
      setDeleteConfirmId(null);
    }, 3000);
  }, [onDelete]);

  const handleUndo = useCallback(() => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setDeleteConfirmId(null);
    setSwipedPhotoId(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const isSwiped = swipedPhotoId === photo.id;
          const isDeleting = deleteConfirmId === photo.id;

          return (
            <div
              key={photo.id}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, photo.id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
                opacity: isDragging ? 0.5 : isDeleting ? 0.3 : 1,
                transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                transition: isDragging ? 'none' : 'all 0.3s ease',
                border: isDragOver ? `2px solid ${colors.primary}` : `2px solid ${colors.neutral[200]}`,
              }}
              className={cn(
                'group',
                isDragging && 'z-50',
                isDragOver && 'ring-2 ring-primary'
              )}
            >
              {/* Drag Handle - Desktop */}
              {!disabled && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    zIndex: 10,
                    padding: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: borderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  className="group-hover:opacity-100"
                >
                  <GripVertical style={{ width: '16px', height: '16px', color: 'white' }} />
                </div>
              )}

              {/* Image */}
              <img
                src={photo.url}
                alt={photo.name || `Photo ${index + 1}`}
                loading="lazy"
                className="w-full h-full object-cover select-none"
                style={{ pointerEvents: 'none' }}
                draggable={false}
              />

              {/* Delete Button - Desktop (hover) */}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo.id);
                  }}
                  aria-label="Delete photo"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(220, 38, 38, 0.95)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    cursor: 'pointer',
                    zIndex: 10,
                    border: 'none',
                    boxShadow: shadows.md,
                  }}
                  className="group-hover:opacity-100"
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              )}

              {/* Delete Button - Mobile (swipe reveal) */}
              {!disabled && isSwiped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo.id);
                  }}
                  aria-label="Delete photo"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: '-80px',
                    width: '80px',
                    height: '100%',
                    backgroundColor: colors.error[500],
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    border: 'none',
                  }}
                >
                  <Trash2 style={{ width: '24px', height: '24px' }} />
                </button>
              )}

              {/* Delete Confirmation Toast */}
              {isDeleting && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borderRadius.md,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    zIndex: 20,
                    boxShadow: shadows.lg,
                  }}
                >
                  <span>Deleting...</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUndo();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.primary,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '12px',
                    }}
                  >
                    Undo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Delete Toast */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.neutral[900],
            color: 'white',
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: borderRadius.lg,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            zIndex: 10000,
            boxShadow: shadows.xl,
            animation: 'slideUp 0.3s ease',
          }}
        >
          <Trash2 style={{ width: '20px', height: '20px' }} />
          <span style={{ fontSize: '14px' }}>Photo deleted</span>
          <button
            onClick={handleUndo}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              marginLeft: spacing.sm,
            }}
          >
            Undo
          </button>
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateX(-50%) translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}


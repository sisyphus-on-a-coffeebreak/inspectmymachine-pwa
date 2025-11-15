/**
 * ReceiptPreview Component
 * 
 * Receipt preview with thumbnail gallery and lightbox
 * Supports multiple receipt images
 */

import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn } from 'lucide-react';

export interface ReceiptPreviewProps {
  receipts: Array<{
    id: string;
    url: string;
    thumbnail?: string;
    name?: string;
  }>;
  maxThumbnails?: number;
  className?: string;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receipts,
  maxThumbnails = 4,
  className = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!receipts || receipts.length === 0) {
    return (
      <div
        style={{
          ...cardStyles.base,
          padding: spacing.lg,
          textAlign: 'center',
          color: colors.neutral[500],
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📄</div>
        <div style={{ ...typography.bodySmall }}>No receipts available</div>
      </div>
    );
  }

  const displayReceipts = receipts.slice(0, maxThumbnails);
  const remainingCount = receipts.length - maxThumbnails;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : receipts.length - 1));
    } else {
      setCurrentIndex((prev) => (prev < receipts.length - 1 ? prev + 1 : 0));
    }
  };

  const downloadReceipt = (url: string, name?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'receipt.jpg';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className={`receipt-preview ${className}`} style={{ ...cardStyles.base, padding: spacing.md }}>
        <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.sm }}>
          Receipts ({receipts.length})
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(displayReceipts.length, 4)}, 1fr)`,
            gap: spacing.sm,
          }}
        >
          {displayReceipts.map((receipt, index) => (
            <div
              key={receipt.id}
              onClick={() => openLightbox(index)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: borderRadius.md,
                overflow: 'hidden',
                cursor: 'pointer',
                border: `2px solid ${colors.neutral[200]}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[200];
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img
                src={receipt.thumbnail || receipt.url}
                alt={receipt.name || `Receipt ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" fill="%239ca3af" font-size="12"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: spacing.xs,
                  right: spacing.xs,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ZoomIn size={12} color="white" />
              </div>
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              onClick={() => openLightbox(maxThumbnails)}
              style={{
                aspectRatio: '1',
                borderRadius: borderRadius.md,
                backgroundColor: colors.neutral[100],
                border: `2px dashed ${colors.neutral[300]}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.backgroundColor = colors.neutral[50];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.backgroundColor = colors.neutral[100];
              }}
            >
              <div style={{ ...typography.header, fontSize: '24px', color: colors.neutral[600] }}>
                +{remainingCount}
              </div>
              <div style={{ ...typography.bodySmall, fontSize: '10px', color: colors.neutral[500] }}>
                More
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: -spacing.xl,
                right: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>

            {/* Image */}
            <img
              src={receipts[currentIndex].url}
              alt={receipts[currentIndex].name || `Receipt ${currentIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                borderRadius: borderRadius.md,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />

            {/* Navigation */}
            {receipts.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('prev');
                  }}
                  style={{
                    position: 'absolute',
                    left: -spacing.xl,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  }}
                  aria-label="Previous receipt"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('next');
                  }}
                  style={{
                    position: 'absolute',
                    right: -spacing.xl,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                  }}
                  aria-label="Next receipt"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadReceipt(receipts[currentIndex].url, receipts[currentIndex].name);
              }}
              style={{
                position: 'absolute',
                bottom: -spacing.xl,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                padding: `${spacing.sm} ${spacing.md}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                cursor: 'pointer',
                color: 'white',
                fontFamily: typography.body.fontFamily,
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary + 'dd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
              }}
            >
              <Download size={16} />
              Download
            </button>

            {/* Counter */}
            {receipts.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: -spacing.xl,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: borderRadius.md,
                  color: 'white',
                  fontSize: '12px',
                  fontFamily: typography.body.fontFamily,
                }}
              >
                {currentIndex + 1} / {receipts.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReceiptPreview;


/**
 * Emergency Overlay Fix Component
 * 
 * Shows a visible button when overlays are stuck, allowing users to clear them
 * even when keyboard shortcuts don't work
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { zIndex } from '@/lib/z-index';

export function EmergencyOverlayFix() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check for stuck overlays every 2 seconds
    const checkInterval = setInterval(() => {
      const overlays = document.querySelectorAll<HTMLElement>(
        '[style*="position: fixed"], [style*="position:fixed"]'
      );

      let hasStuckOverlay = false;
      overlays.forEach((el) => {
        const bgColor = window.getComputedStyle(el).backgroundColor;
        const zIndex = parseInt(window.getComputedStyle(el).zIndex || '0');
        const role = el.getAttribute('role');

        // Check if it's a blocking overlay
        if (
          (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) ||
          (zIndex >= 8000 && role === 'dialog') ||
          (zIndex >= 99 && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)')
        ) {
          // Check if it's been there for more than 5 seconds (likely stuck)
          const createdAt = el.dataset.createdAt;
          if (!createdAt) {
            el.dataset.createdAt = Date.now().toString();
          } else if (Date.now() - parseInt(createdAt) > 5000) {
            hasStuckOverlay = true;
          }
        }
      });

      setShowButton(hasStuckOverlay);
    }, 2000);

    return () => clearInterval(checkInterval);
  }, []);

  const handleFix = () => {
    // Remove all fixed overlays with dark backgrounds
    document.querySelectorAll<HTMLElement>(
      '[style*="position: fixed"], [style*="position:fixed"]'
    ).forEach((el) => {
      const bgColor = window.getComputedStyle(el).backgroundColor;
      const zIndex = parseInt(window.getComputedStyle(el).zIndex || '0');
      const role = el.getAttribute('role');

      if (
        (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) ||
        (zIndex >= 8000 && role === 'dialog') ||
        (zIndex >= 99 && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)')
      ) {
        el.remove();
      }
    });

    // Remove all modals
    document.querySelectorAll('[role="dialog"]').forEach(el => el.remove());

    // Unlock body scroll
    document.body.style.cssText = '';
    document.documentElement.style.overflow = '';
    document.body.classList.remove('keyboard-visible');

    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleFix}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999, // Highest possible z-index
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        fontSize: '24px',
        fontWeight: 'bold',
        touchAction: 'manipulation',
        animation: 'pulse 2s infinite',
      }}
      aria-label="Emergency: Clear stuck overlay"
      title="Click to clear stuck overlay and restore page"
    >
      <X size={28} />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </button>
  );
}




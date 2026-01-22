/**
 * Emergency utility to fix stuck overlays/modals
 * 
 * This can be called from the browser console if the screen gets stuck:
 * 
 * import { fixStuckOverlay } from './lib/emergencyOverlayFix';
 * fixStuckOverlay();
 * 
 * Or directly in console:
 * document.querySelectorAll('[style*="position: fixed"][style*="z-index"]').forEach(el => {
 *   if (el.style.backgroundColor?.includes('rgba') || el.style.backgroundColor === 'rgba(0, 0, 0, 0.4)') {
 *     el.remove();
 *   }
 * });
 * document.body.style.overflow = '';
 * document.body.style.position = '';
 */

/**
 * Fix stuck overlays and modals
 */
export function fixStuckOverlay(): void {
  if (typeof document === 'undefined') return;

  // Remove all fixed overlays with dark backgrounds
  const overlays = document.querySelectorAll<HTMLElement>(
    '[style*="position: fixed"], [style*="position:fixed"]'
  );
  
  overlays.forEach((el) => {
    const style = el.style.cssText || window.getComputedStyle(el).cssText;
    const bgColor = el.style.backgroundColor || window.getComputedStyle(el).backgroundColor;
    const zIndex = parseInt(el.style.zIndex || window.getComputedStyle(el).zIndex || '0');
    
    // Check if it's a dark overlay (modal backdrop, FAB backdrop, etc.)
    if (
      (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) ||
      (zIndex >= 8000 && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)')
    ) {
      // Check if it has children (might be a modal with content)
      // Only remove if it's just a backdrop
      if (el.children.length === 0 || el.getAttribute('role') === 'dialog') {
        el.remove();
      }
    }
  });

  // Unlock body scroll
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  
  // Remove any inline styles that might be blocking
  document.body.removeAttribute('style');
  
  // Force a reflow
  void document.body.offsetHeight;
}

// Auto-fix on import in development (can be disabled)
if (import.meta.env.DEV) {
  // Only auto-fix if there's a stuck overlay after 5 seconds
  setTimeout(() => {
    const stuckOverlay = document.querySelector<HTMLElement>(
      '[style*="position: fixed"][style*="z-index"]'
    );
    if (stuckOverlay) {
      const bgColor = window.getComputedStyle(stuckOverlay).backgroundColor;
      if (bgColor.includes('rgba(0, 0, 0') || bgColor.includes('rgba(0,0,0')) {
        // Check if it's been there for more than 30 seconds (likely stuck)
        const hasBeenThere = stuckOverlay.dataset.createdAt;
        if (!hasBeenThere) {
          stuckOverlay.dataset.createdAt = Date.now().toString();
        } else if (Date.now() - parseInt(hasBeenThere) > 30000) {
          console.warn('Detected stuck overlay, attempting to fix...');
          fixStuckOverlay();
        }
      }
    }
  }, 5000);
}


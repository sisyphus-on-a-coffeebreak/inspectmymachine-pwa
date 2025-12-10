/**
 * Z-Index Hierarchy
 *
 * Centralized z-index values to prevent stacking conflicts.
 * Higher numbers appear above lower numbers.
 *
 * USAGE:
 * import { zIndex } from '@/lib/z-index';
 * style={{ zIndex: zIndex.modal }}
 */

export const zIndex = {
  // Base layers (0-999)
  base: 0,
  above: 1,
  sticky: 10,

  // Dropdowns and popovers (1000-1999)
  dropdown: 1000,
  autocomplete: 1100,
  datepicker: 1100,

  // Navigation (1200-1499)
  bottomNav: 1200,
  mobileHeader: 1200,
  fab: 1300, // Above bottom nav
  sidebar: 1400,

  // Overlays (8000-8999)
  backdrop: 8000,
  drawer: 8100,
  actionMenu: 8200,

  // Modals and sheets (9000-9499)
  modal: 9000,
  modalBackdrop: 8900,
  bottomSheet: 9100,
  bottomSheetBackdrop: 9000,
  confirmDialog: 9200,

  // Notifications and feedback (9500-9799)
  toast: 9500, // Above modals so errors are always visible
  offlineIndicator: 9600,
  installBanner: 9650,

  // Tooltips and hints (9700-9899)
  tooltip: 9700,
  contextualGuidance: 9750,

  // System UI (9800-9999)
  commandPalette: 9800,
  commandPaletteBackdrop: 9750,

  // Full-screen overlays (10000+)
  imageViewer: 10000,
  qrScanner: 10100,
  cameraCapture: 10100,
  sessionTimeout: 10200,
  skipToContent: 10300, // Highest - accessibility
} as const;

/**
 * Get z-index value with optional offset
 * Useful for nested elements that need to be slightly above/below
 *
 * @example
 * getZIndex('modal', 1) // Returns 9001
 */
export function getZIndex(key: keyof typeof zIndex, offset: number = 0): number {
  return zIndex[key] + offset;
}

/**
 * Check if one layer is above another
 */
export function isAbove(upper: keyof typeof zIndex, lower: keyof typeof zIndex): boolean {
  return zIndex[upper] > zIndex[lower];
}

export default zIndex;

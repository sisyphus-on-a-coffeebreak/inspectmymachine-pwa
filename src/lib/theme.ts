// 🎨 VOMS Design System - Orange Theme
// Professional corporate color palette with accessibility focus

export const colors = {
  // Primary Actions
  primary: '#2563eb',      // Blue for primary actions (buttons, links)
  
  // Status Colors (with scales)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',      // Base green
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',      // Base orange
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',      // Base red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#eff6ff',      // Very light blue
    100: '#dbeafe',     // Light blue
    200: '#bfdbfe',     // Lighter blue
    300: '#93c5fd',     // Light blue
    400: '#60a5fa',     // Medium light blue
    500: '#3b82f6',     // Base blue (matches primary)
    600: '#2563eb',     // Medium blue
    700: '#1d4ed8',     // Dark blue
    800: '#1e40af',     // Very dark blue
    900: '#1e3a8a',     // Darkest blue
  },
  critical: '#ef4444',     // Red for critical 8PM+ (🔴) - alias for error[500]
  
  // Brand Colors
  brand: '#eb8b00',        // Orange for passes, branding, accents
  brandLight: '#fbbf24',   // Light orange for highlights
  brandDark: '#d97706',    // Dark orange for text on light backgrounds
  
  // Access Codes & Special Elements
  accessCode: '#fbbf24',   // Gold for access codes
  accent: '#fbbf24',       // Gold accent color
  
  // Background Gradients
  background: {
    primary: 'linear-gradient(135deg, #eb8b00 0%, #d97706 100%)', // Orange gradient
    secondary: 'linear-gradient(135deg, #fbbf24 0%, #eb8b00 100%)', // Light orange gradient
    neutral: '#f9fafb',    // Light gray for cards
    white: '#ffffff'       // Pure white
  },
  
  // Neutral Grays
  neutral: {
    50: '#f9fafb',   // Lightest gray
    100: '#f3f4f6',  // Very light gray
    200: '#e5e7eb',  // Light gray
    300: '#d1d5db',  // Medium light gray
    400: '#9ca3af',  // Medium gray
    500: '#6b7280',  // Base gray
    600: '#4b5563',  // Medium dark gray
    700: '#374151',  // Dark gray
    800: '#1f2937',  // Very dark gray
    900: '#111827'   // Darkest gray
  },
  
  // Status Indicators
  status: {
    normal: '#10b981',     // Green - all good
    warning: '#f59e0b',    // Orange - needs attention
    critical: '#ef4444',   // Red - action required
    success: '#10b981',    // Green - success (alias for normal)
    error: '#ef4444'       // Red - error (alias for critical)
  }
};

export const typography = {
  // Headers - Adaptive typography using clamp()
  header: {
    fontSize: 'clamp(24px, 4vw, 28px)', // Responsive: 24px mobile, scales up to 28px
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.neutral[900],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  headerLarge: {
    fontSize: 'clamp(28px, 5vw, 32px)', // Responsive: 28px mobile, scales up to 32px
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.neutral[900],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  headerSmall: {
    fontSize: 'clamp(20px, 3vw, 24px)', // Responsive: 20px mobile, scales up to 24px
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.neutral[900],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  subheader: {
    fontSize: 'clamp(20px, 3vw, 24px)', // Responsive: 20px mobile, scales up to 24px
    fontWeight: 600,
    lineHeight: 1.3,
    color: colors.neutral[800],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  // Body Text - Adaptive
  body: {
    fontSize: 'clamp(14px, 2vw, 16px)', // Responsive: 14px mobile, scales up to 16px
    fontWeight: 400,
    lineHeight: 1.5,
    color: colors.neutral[700],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  bodySmall: {
    fontSize: 'clamp(12px, 1.5vw, 14px)', // Responsive: 12px mobile, scales up to 14px
    fontWeight: 400,
    lineHeight: 1.4,
    color: colors.neutral[600],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  // Labels
  label: {
    fontSize: 'clamp(12px, 1.5vw, 14px)', // Responsive
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.neutral[600],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  
  // Access Codes (Special)
  accessCode: {
    fontSize: 'clamp(24px, 5vw, 32px)', // Responsive
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: colors.accessCode,
    fontFamily: 'monospace'
  },
  
  // QR Code Labels
  qrLabel: {
    fontSize: 'clamp(16px, 2.5vw, 18px)', // Responsive
    fontWeight: 600,
    color: colors.neutral[800],
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px'
};

/**
 * Responsive spacing utilities using clamp()
 * Mobile-first: Smaller values on mobile, scales up on larger screens
 * Use these for padding, margins, and gaps that need to adapt to viewport
 */
export const responsiveSpacing = {
  padding: {
    xs: 'clamp(8px, 2vw, 12px)',   // Mobile: 8px, Desktop: 12px
    sm: 'clamp(12px, 3vw, 16px)',   // Mobile: 12px, Desktop: 16px
    md: 'clamp(16px, 4vw, 24px)',   // Mobile: 16px, Desktop: 24px
    lg: 'clamp(24px, 5vw, 32px)',   // Mobile: 24px, Desktop: 32px
    xl: 'clamp(32px, 6vw, 48px)',   // Mobile: 32px, Desktop: 48px
  },
  gap: {
    xs: 'clamp(8px, 2vw, 12px)',
    sm: 'clamp(12px, 3vw, 16px)',
    md: 'clamp(16px, 4vw, 24px)',
    lg: 'clamp(24px, 5vw, 32px)',
    xl: 'clamp(32px, 6vw, 48px)',
  },
};

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 12px rgba(0, 0, 0, 0.08)', // Standard card shadow
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)', // Elevated card shadow
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(235, 139, 0, 0.3)', // Orange glow
  // Additional variants for consistency
  card: '0 4px 12px rgba(0,0,0,0.08)', // Alias for md - most common card shadow
  elevated: '0 8px 24px rgba(0,0,0,0.12)', // Alias for lg - elevated cards
  hover: '0 4px 16px rgba(0,0,0,0.12)', // Hover state shadow
  focus: '0 0 0 4px rgba(37, 99, 235, 0.2)' // Focus ring shadow
};

export const breakpoints = {
  mobile: '320px',          // 0-479px: Mobile portrait
  mobileLandscape: '480px', // 480-767px: Mobile landscape
  tablet: '768px',          // 768-1023px: Tablet (both orientations)
  desktop: '1024px',        // 1024-1279px: Desktop / Large tablet landscape
  wide: '1280px',           // 1280px+: Wide desktop
};

// Media query helpers for consistent responsive design
export const mediaQueries = {
  mobile: `@media (max-width: 479px)`,
  mobileLandscape: `@media (min-width: 480px) and (max-width: 767px)`,
  tablet: `@media (min-width: 768px) and (max-width: 1023px)`,
  desktop: `@media (min-width: 1024px)`,
  wide: `@media (min-width: 1280px)`,

  // Utility queries
  upToTablet: `@media (max-width: 767px)`,     // Mobile (portrait + landscape)
  tabletAndUp: `@media (min-width: 768px)`,    // Tablet and Desktop
  desktopAndUp: `@media (min-width: 1024px)`,  // Desktop and Wide
};

// Focus ring utilities for accessibility (WCAG 2.1 AA compliant)
export const focusRings = {
  // Standard focus ring - 2px solid with 2px offset
  default: {
    outline: `2px solid ${colors.primary}`,
    outlineOffset: '2px',
  },
  // Thick focus ring for high contrast mode
  thick: {
    outline: `3px solid ${colors.primary}`,
    outlineOffset: '3px',
  },
  // Subtle focus ring for less prominent elements
  subtle: {
    outline: `1px solid ${colors.primary}`,
    outlineOffset: '1px',
  },
  // Focus ring with box shadow for better visibility
  shadow: {
    outline: `2px solid ${colors.primary}`,
    outlineOffset: '2px',
    boxShadow: `0 0 0 4px ${colors.primary}20`,
  },
  // No outline (for custom implementations)
  none: {
    outline: 'none',
  },
};

// Helper function to get focus styles
export const getFocusStyles = (variant: keyof typeof focusRings = 'default'): React.CSSProperties => {
  return focusRings[variant] as React.CSSProperties;
};

// Status calculation helper
export const getStatusColor = (entryTime: Date, currentTime: Date, closingTime?: Date) => {
  const duration = currentTime.getTime() - entryTime.getTime();
  const hours = duration / (1000 * 60 * 60);
  
  // Check if after closing time (default 8 PM)
  const defaultClosing = new Date(currentTime);
  defaultClosing.setHours(20, 0, 0, 0);
  const isAfterClosing = currentTime > (closingTime || defaultClosing);
  
  if (isAfterClosing) return colors.error[500];  // 🔴 Red
  if (hours >= 1) return colors.warning[500];      // 🟠 Orange
  return colors.success[500];                       // 🟢 Green
};

// Status dot component props
export const getStatusDot = (status: 'normal' | 'warning' | 'critical') => ({
  color: status === 'normal' ? colors.success[500] : status === 'warning' ? colors.warning[500] : colors.error[500],
  size: '12px',
  borderRadius: '50%',
  display: 'inline-block',
  marginRight: spacing.sm
});

// Standardized button hover/press states
export const buttonHoverStates = {
  // Standard hover effect - slight scale and shadow increase
  hover: {
    transform: 'translateY(-1px)',
    boxShadow: shadows.md,
  },
  // Active/pressed state
  active: {
    transform: 'translateY(0)',
    boxShadow: shadows.sm,
  },
  // Disabled state
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
};

// Button styles with standardized hover states
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: shadows.sm,
    // Hover state
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: '#1d4ed8', // Darker blue
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
  
  secondary: {
    backgroundColor: 'white',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // Hover state
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: colors.primary + '10',
      borderColor: '#1d4ed8',
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
  
  success: {
    backgroundColor: colors.success[500],
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: shadows.sm,
    // Hover state
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: colors.success[600],
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
  
  warning: {
    backgroundColor: colors.warning[500],
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: shadows.sm,
    // Hover state
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: colors.warning[600],
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
  
  critical: {
    backgroundColor: colors.error[500],
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: shadows.sm,
    // Hover state
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: colors.error[600],
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
  
  destructive: {
    backgroundColor: colors.error[500],
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: shadows.sm,
    // Hover state - darker red
    '&:hover:not(:disabled)': {
      ...buttonHoverStates.hover,
      backgroundColor: colors.error[600],
    },
    // Active state
    '&:active:not(:disabled)': {
      ...buttonHoverStates.active,
    },
    // Focus state
    '&:focus': {
      ...focusRings.default,
    },
    // Disabled state
    '&:disabled': {
      ...buttonHoverStates.disabled,
    },
  },
};

// Helper function to get button hover styles (for inline use)
export const getButtonHoverStyles = () => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    Object.assign(target.style, buttonHoverStates.hover);
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    Object.assign(target.style, buttonHoverStates.active);
  },
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    Object.assign(target.style, buttonHoverStates.active);
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    Object.assign(target.style, buttonHoverStates.hover);
  },
});

// Form styles
export const formStyles = {
  input: {
    width: '100%',
    maxWidth: '600px', // Max width for readability
    padding: spacing.md,
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: borderRadius.md,
    fontSize: '16px',
    color: colors.neutral[700],
    backgroundColor: 'white',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px ${colors.primary}20`
    },
    '&:invalid': {
      borderColor: colors.critical
    }
  },
  
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: colors.neutral[700],
    marginBottom: spacing.sm
  },
  
  error: {
    color: colors.error[500],
    fontSize: '14px',
    marginTop: spacing.xs
  },
  
  success: {
    color: colors.success[500],
    fontSize: '14px',
    marginTop: spacing.xs
  }
};

// Card styles (INVARIANT 2: Safe by default)
export const cardStyles = {
  base: {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.card,
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease',
  },
  
  // Alias for backward compatibility
  card: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.card,
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },

  // Elevated card variant (with stronger shadow)
  elevated: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.elevated,
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },

  // Bordered card variant (no shadow, just border)
  bordered: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: 'none',
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },

  // Interactive card (for clickable cards)
  interactive: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.card,
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
  },

  hover: {
    transform: 'translateY(-2px)',
    boxShadow: shadows.hover
  },

  selected: {
    borderColor: colors.primary,
    boxShadow: shadows.focus
  }
};

/**
 * @deprecated UNSAFE - DO NOT USE DIRECTLY
 * These gridStyles use minmax patterns that can break on mobile.
 *
 * Instead, use ResponsiveGrid components from @/components/ui/ResponsiveGrid:
 * - <ResponsiveGrid> for custom column counts
 * - <CardGrid> for card layouts (1/1/2/3/4 columns)
 * - <StatsGrid> for stats (1/2/2/3/4 columns)
 * - <ActionGrid> for actions (1/1/2/3/3 columns)
 *
 * If you must use raw grid styles, use the safe alternatives below.
 */
export const gridStyles = {
  /**
   * @deprecated Use <ResponsiveGrid> or <CardGrid> instead
   * This pattern uses minmax(300px, 1fr) which breaks on narrow viewports
   */
  mobileFirst: (isMobile: boolean) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing.lg,
    width: '100%',
    maxWidth: '100%'
  }),

  /**
   * @deprecated Use <StatsGrid> instead
   * This pattern uses minmax(200px, 1fr) which breaks on narrow viewports
   */
  stats: (isMobile: boolean) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.lg,
    width: '100%',
    maxWidth: '100%'
  }),

  /**
   * @deprecated Use <CardGrid> instead
   * This pattern can still break on some viewports
   */
  cards: (isMobile: boolean) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
    gap: spacing.lg,
    width: '100%',
    maxWidth: '100%'
  }),

  /**
   * @deprecated Use <ResponsiveGrid columns={{ mobile: 2, tablet: 3, desktop: 4 }}> instead
   * This pattern uses minmax(150px, 1fr) which breaks on narrow viewports
   */
  dense: (isMobile: boolean) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: spacing.md,
    width: '100%',
    maxWidth: '100%'
  })
};

/**
 * SAFE GRID STYLES - Use these if you cannot use ResponsiveGrid components
 * These styles NEVER use minmax with fixed pixel minimums
 */
export const safeGridStyles = {
  /**
   * Single column on mobile, responsive columns on larger screens
   * Safe because it never creates overflow
   */
  mobileFirst: (isMobile: boolean, columns: number = 3) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : `repeat(${columns}, 1fr)`,
    gap: spacing.lg,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  }),

  /**
   * Two columns on mobile, more on tablet/desktop
   */
  twoColumn: (isMobile: boolean, desktopColumns: number = 4) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${desktopColumns}, 1fr)`,
    gap: isMobile ? spacing.md : spacing.lg,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  }),

  /**
   * Stacked list layout - always single column
   */
  list: () => ({
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: spacing.md,
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  })
};

// Status badge styles
export const statusBadgeStyles = {
  normal: {
    backgroundColor: colors.success[500],
    color: 'white',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const
  },
  
  warning: {
    backgroundColor: colors.warning[500],
    color: 'white',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const
  },
  
  critical: {
    backgroundColor: colors.error[500],
    color: 'white',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    animation: 'pulse 2s infinite'
  }
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  mediaQueries,
  getStatusColor,
  getStatusDot,
  buttonStyles,
  formStyles,
  cardStyles,
  gridStyles, // @deprecated - use safeGridStyles or ResponsiveGrid components
  safeGridStyles,
  statusBadgeStyles
};

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
  // Headers
  header: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.neutral[900]
  },
  
  subheader: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.3,
    color: colors.neutral[800]
  },
  
  // Body Text
  body: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
    color: colors.neutral[700]
  },
  
  bodySmall: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.4,
    color: colors.neutral[600]
  },
  
  // Labels
  label: {
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.neutral[600]
  },
  
  // Access Codes (Special)
  accessCode: {
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: colors.accessCode,
    fontFamily: 'monospace'
  },
  
  // QR Code Labels
  qrLabel: {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.neutral[800]
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

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  glow: '0 0 20px rgba(235, 139, 0, 0.3)' // Orange glow
};

export const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
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

// Button styles
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
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: shadows.md
    },
    '&:active': {
      transform: 'scale(0.98)'
    }
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
    transition: 'all 0.2s ease'
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
    transition: 'all 0.2s ease'
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
    transition: 'all 0.2s ease'
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
    animation: 'pulse 2s infinite'
  }
};

// Form styles
export const formStyles = {
  input: {
    width: '100%',
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

// Card styles
export const cardStyles = {
  base: {
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.neutral[200]}`,
    transition: 'all 0.2s ease'
  },
  
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: shadows.md
  },
  
  selected: {
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px ${colors.primary}20`
  }
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
  getStatusColor,
  getStatusDot,
  buttonStyles,
  formStyles,
  cardStyles,
  statusBadgeStyles
};

import React from 'react';
import { buttonStyles, spacing, borderRadius } from '../../lib/theme';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'critical' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}) => {
  const { trigger: hapticTrigger } = useHapticFeedback();
  const sizeMap = {
    sm: {
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: '14px'
    },
    md: {
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: '16px'
    },
    lg: {
      padding: `${spacing.lg} ${spacing.xl}`,
      fontSize: '18px'
    }
  };

  const baseStyle = {
    ...buttonStyles[variant],
    ...sizeMap[size],
    width: fullWidth ? '100%' : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? spacing.sm : 0,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    minHeight: '44px', // Touch target minimum
    minWidth: '44px',
    border: 'none',
    borderRadius: borderRadius.md,
    fontWeight: 600,
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    willChange: 'transform', // GPU acceleration
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!disabled && !loading) {
      // Haptic feedback based on button variant
      if (variant === 'critical' || variant === 'destructive') {
        hapticTrigger('error');
      } else if (variant === 'success') {
        hapticTrigger('success');
      } else if (variant === 'warning') {
        hapticTrigger('warning');
      } else {
        hapticTrigger('medium');
      }
      
      if (onClick) {
        onClick(e);
      }
    }
  };

  // Only apply hover effects on hover-capable devices
  const isHoverCapable = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && isHoverCapable) {
      e.currentTarget.style.transform = 'scale(1.02)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && isHoverCapable) {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'scale(0.98)';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'scale(1.02)';
    }
  };

  return (
    <button
      type={type}
      style={baseStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled || loading}
      className={`btn-hover-scale touch-feedback ${className}`}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-labelledby={ariaLabelledBy}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            marginRight: spacing.sm,
            animation: 'spin 1s linear infinite',
          }}
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="32"
            opacity="0.3"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="24"
          />
        </svg>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {icon && !loading && icon}
      {children}
    </button>
  );
};

// Specialized button variants
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="primary" />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="secondary" />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="success" />
);

export const WarningButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="warning" />
);

export const CriticalButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button {...props} variant="critical" />
);

// Icon button for compact spaces
export const IconButton: React.FC<Omit<ButtonProps, 'children' | 'icon'> & { icon: React.ReactNode }> = ({
  icon,
  size = 'md',
  ...props
}) => {
  const iconSizeMap = {
    sm: '16px',
    md: '20px',
    lg: '24px'
  };

  return (
    <Button
      {...props}
      size={size}
      className={props.className}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontSize: iconSizeMap[size],
        width: size === 'sm' ? '44px' : size === 'lg' ? '56px' : '48px',
        height: size === 'sm' ? '44px' : size === 'lg' ? '56px' : '48px',
      }}>
        {icon}
      </div>
    </Button>
  );
};

export default Button;
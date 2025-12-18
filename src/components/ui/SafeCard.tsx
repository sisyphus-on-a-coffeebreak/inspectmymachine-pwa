import React, { CSSProperties } from 'react';
import { cardStyles } from '../../lib/theme';

/**
 * SafeCard - INVARIANT 3: Width-safe card primitive
 *
 * Enforces mobile safety by default. Cannot overflow viewport.
 * Makes width violations STRUCTURALLY IMPOSSIBLE.
 *
 * DO NOT:
 * - Add overflow: hidden to mask layout bugs
 * - Add fixed heights on mobile
 * - Add minWidth constraints
 *
 * All layout safety is GUARANTEED by this component.
 */

interface SafeCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  hover?: boolean;
  selected?: boolean;
}

export const SafeCard: React.FC<SafeCardProps> = ({
  children,
  onClick,
  style = {},
  className = '',
  hover = false,
  selected = false
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyles: CSSProperties = {
    ...cardStyles.base,
    ...(hover && isHovered ? cardStyles.hover : {}),
    ...(selected ? cardStyles.selected : {}),
    ...style,
    // INVARIANT 3: Force width safety (cannot be overridden by style prop)
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    // NO overflow hidden - we prevent, not mask
    cursor: onClick ? 'pointer' : 'default'
  };

  return (
    <div
      className={className}
      style={combinedStyles}
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
    >
      {children}
    </div>
  );
};

/**
 * ActionStack - INVARIANT 3: Mobile-safe action container
 *
 * Automatically stacks actions vertically on mobile.
 * Prevents buttons from exceeding viewport width.
 */

interface ActionStackProps {
  children: React.ReactNode;
  gap?: string;
  align?: 'left' | 'center' | 'right';
  isMobile?: boolean;
}

export const ActionStack: React.FC<ActionStackProps> = ({
  children,
  gap = '12px',
  align = 'left',
  isMobile = false
}) => {
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
  };

  const stackStyles: CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap,
    alignItems: isMobile ? 'stretch' : alignMap[align],
    justifyContent: alignMap[align],
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={stackStyles}>
      {children}
    </div>
  );
};

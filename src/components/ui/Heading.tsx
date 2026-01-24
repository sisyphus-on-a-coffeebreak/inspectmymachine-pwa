/**
 * Heading Components
 * 
 * Semantic heading components using design system typography.
 * Ensures consistent heading hierarchy and styling.
 */

import React from 'react';
import { typography, colors, spacing } from '../../lib/theme';

export interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

/**
 * PageTitle - Main page heading (h1)
 * Use once per page at the top level
 */
export const PageTitle: React.FC<HeadingProps> = ({
  children,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) => (
  <h1
    style={{
      ...typography.headerLarge,
      margin: 0,
      marginBottom: spacing.sm,
      ...style,
    }}
    className={className}
    aria-label={ariaLabel}
  >
    {children}
  </h1>
);

/**
 * SectionTitle - Section heading (h2)
 * Use for major sections within a page
 */
export const SectionTitle: React.FC<HeadingProps> = ({
  children,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) => (
  <h2
    style={{
      ...typography.subheader,
      margin: 0,
      marginBottom: spacing.md,
      ...style,
    }}
    className={className}
    aria-label={ariaLabel}
  >
    {children}
  </h2>
);

/**
 * SubsectionTitle - Subsection heading (h3)
 * Use for subsections within sections
 */
export const SubsectionTitle: React.FC<HeadingProps> = ({
  children,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) => (
  <h3
    style={{
      ...typography.body,
      fontSize: 'clamp(16px, 2.5vw, 18px)',
      fontWeight: 600,
      color: colors.neutral[800],
      margin: 0,
      marginBottom: spacing.sm,
      ...style,
    }}
    className={className}
    aria-label={ariaLabel}
  >
    {children}
  </h3>
);

/**
 * CardTitle - Title for cards (h3 or h4)
 * Use within cards for card-specific titles
 */
export const CardTitle: React.FC<HeadingProps & { level?: 3 | 4 }> = ({
  children,
  level = 3,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) => {
  const Component = `h${level}` as 'h3' | 'h4';
  return (
    <Component
      style={{
        ...typography.subheader,
        fontSize: 'clamp(16px, 2.5vw, 18px)',
        margin: 0,
        marginBottom: spacing.xs,
        ...style,
      }}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
};

/**
 * Label - Form label or small heading (not semantic heading)
 * Use for labels, not for document structure
 */
export const Label: React.FC<HeadingProps> = ({
  children,
  className = '',
  style = {},
  'aria-label': ariaLabel,
}) => (
  <div
    style={{
      ...typography.label,
      margin: 0,
      marginBottom: spacing.xs,
      ...style,
    }}
    className={className}
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

export default PageTitle;



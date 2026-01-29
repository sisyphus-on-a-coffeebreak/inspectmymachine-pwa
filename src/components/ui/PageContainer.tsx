/**
 * PageContainer Component
 * 
 * CSS-based responsive container for all pages.
 * Uses media queries instead of JavaScript for better performance.
 * 
 * Usage:
 * <PageContainer maxWidth="1200px">
 *   Page content here
 * </PageContainer>
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  /** Maximum width on desktop (default: 1200px) */
  maxWidth?: '800px' | '900px' | '1000px' | '1200px' | '1400px' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles (use sparingly) */
  style?: React.CSSProperties;
}

const maxWidthClasses = {
  '800px': 'page-container-max-800',
  '900px': 'page-container-max-900',
  '1000px': 'page-container-max-1000',
  '1200px': 'page-container-max-1200',
  '1400px': 'page-container-max-1400',
  'full': 'page-container-max-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = '1200px',
  className,
  style,
}) => {
  return (
    <div
      className={cn('page-container', maxWidthClasses[maxWidth], className)}
      style={style}
    >
      {children}
    </div>
  );
};


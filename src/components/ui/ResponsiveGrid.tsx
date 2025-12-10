import React, { useMemo } from 'react';
import { spacing, breakpoints } from '../../lib/theme';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;           // 0-479px: Mobile portrait
    mobileLandscape?: number;  // 480-767px: Mobile landscape
    tablet?: number;           // 768-1023px: Tablet
    desktop?: number;          // 1024-1279px: Desktop
    wide?: number;             // 1280px+: Wide desktop
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveGridComponent: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, mobileLandscape: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'md',
  className = ''
}) => {
  const gapMap = useMemo(() => ({
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg
  }), []);

  const gridStyle = useMemo(() => ({
    display: 'grid' as const,
    gap: gapMap[gap],
    gridTemplateColumns: `repeat(${columns.mobile || 1}, 1fr)`,
    width: '100%'
  }), [gapMap, gap, columns.mobile]);

  const mediaQueries = useMemo(() => `
    /* Mobile landscape: 480-767px */
    @media (min-width: ${breakpoints.mobileLandscape}) and (max-width: 767px) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.mobileLandscape || columns.mobile || 1}, 1fr) !important;
      }
    }

    /* Tablet: 768-1023px */
    @media (min-width: ${breakpoints.tablet}) and (max-width: 1023px) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.tablet || 2}, 1fr) !important;
      }
    }

    /* Desktop: 1024-1279px */
    @media (min-width: ${breakpoints.desktop}) and (max-width: 1279px) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.desktop || 3}, 1fr) !important;
      }
    }

    /* Wide desktop: 1280px+ */
    @media (min-width: ${breakpoints.wide}) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.wide || columns.desktop || 4}, 1fr) !important;
      }
    }
  `, [columns.mobileLandscape, columns.tablet, columns.desktop, columns.wide, columns.mobile]);

  return (
    <>
      <style>{mediaQueries}</style>
      <div 
        className={`responsive-grid ${className}`}
        style={gridStyle}
      >
        {children}
      </div>
    </>
  );
};

// Memoize ResponsiveGrid to prevent unnecessary re-renders
export const ResponsiveGrid = React.memo(ResponsiveGridComponent);

// Mobile-first card grid - 1 column mobile, 2 tablet, 3 desktop, 4 wide
export const CardGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 1, mobileLandscape: 1, tablet: 2, desktop: 3, wide: 4 }}
  />
);

// Stats grid for dashboard - 1 mobile, 2 landscape/tablet, 3 desktop, 4 wide
export const StatsGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 1, mobileLandscape: 2, tablet: 2, desktop: 3, wide: 4 }}
    gap="md"
  />
);

// Action buttons grid - 1 mobile, 2 tablet, 3 desktop
export const ActionGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 1, mobileLandscape: 1, tablet: 2, desktop: 3, wide: 3 }}
    gap="lg"
  />
);

// Wide 4-column grid for data-heavy dashboards
export const WideGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 1, mobileLandscape: 2, tablet: 2, desktop: 4, wide: 4 }}
    gap="md"
  />
);

export default ResponsiveGrid;

import React, { useMemo } from 'react';
import { spacing, breakpoints } from '../../lib/theme';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveGridComponent: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
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
    gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    width: '100%'
  }), [gapMap, gap, columns.mobile]);

  const mediaQueries = useMemo(() => `
    @media (min-width: ${breakpoints.tablet}) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
      }
    }
    
    @media (min-width: ${breakpoints.desktop}) {
      .responsive-grid {
        grid-template-columns: repeat(${columns.desktop}, 1fr) !important;
      }
    }
  `, [columns.tablet, columns.desktop]);

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

// Mobile-first card grid
export const CardGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid 
    {...props}
    columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  />
);

// Stats grid for dashboard
export const StatsGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid 
    {...props}
    columns={{ mobile: 1, tablet: 2, desktop: 3 }}
    gap="md"
  />
);

// Action buttons grid
export const ActionGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid 
    {...props}
    columns={{ mobile: 1, tablet: 2, desktop: 3 }}
    gap="lg"
  />
);

export default ResponsiveGrid;

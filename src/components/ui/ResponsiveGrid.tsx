import React, { useMemo } from 'react';
import { spacing, breakpoints } from '../../lib/theme';

/**
 * ResponsiveGrid - Mobile-First Grid Layout Primitive
 *
 * ARCHITECTURAL INVARIANT:
 * This component enforces mobile-safe grid layouts by construction.
 * - Always single-column on mobile by default (no overflow possible)
 * - Progressively enhances to multi-column on larger screens
 * - Never uses minmax() with fixed pixel minimums
 * - Cannot be misconfigured to cause mobile overflow
 *
 * DO NOT bypass this component with raw CSS grid unless you have
 * explicit architectural approval and mobile testing.
 *
 * @example
 * // Standard card grid
 * <CardGrid gap="md">
 *   <Card>...</Card>
 *   <Card>...</Card>
 * </CardGrid>
 *
 * @example
 * // Custom column counts
 * <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }}>
 *   <Item />
 * </ResponsiveGrid>
 */
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
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
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

// Compact grid - 2 columns mobile, 4 desktop (for small cards/thumbnails)
export const CompactGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 2, mobileLandscape: 3, tablet: 3, desktop: 4, wide: 6 }}
    gap="sm"
  />
);

// Dense grid - 3 columns mobile, 6 desktop (for tiny thumbnails/chips)
export const DenseGrid: React.FC<Omit<ResponsiveGridProps, 'columns'>> = (props) => (
  <ResponsiveGrid
    {...props}
    columns={{ mobile: 3, mobileLandscape: 4, tablet: 4, desktop: 6, wide: 6 }}
    gap="sm"
  />
);

/**
 * LLM-PROOF GUARD:
 *
 * THIS IS THE ONLY FILE WHERE gridTemplateColumns MAY BE DEFINED.
 *
 * Pages and other components MUST import and use one of the exports above:
 * - CardGrid (1/1/2/3/4 cols)
 * - StatsGrid (1/2/2/3/4 cols)
 * - ActionGrid (1/1/2/3/3 cols)
 * - WideGrid (1/2/2/4/4 cols)
 * - CompactGrid (2/3/3/4/6 cols)
 * - DenseGrid (3/4/4/6/6 cols)
 *
 * If none of these fit your use case:
 * 1. Add a new named export HERE with semantic naming
 * 2. Do NOT define gridTemplateColumns in pages
 * 3. Do NOT use window.innerWidth or inline breakpoint logic
 *
 * Bypassing this primitive violates architectural invariants.
 */

export default ResponsiveGrid;

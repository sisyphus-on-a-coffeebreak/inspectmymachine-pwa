/**
 * Chart Widget
 * 
 * Displays charts (module activity, trends, etc.)
 */

import React, { useMemo, useCallback } from 'react';
import type { WidgetProps } from '../../../types/widgets';
import { BarChart } from '../../ui/charts';
import { colors, spacing, typography } from '../../../lib/theme';

const ChartWidgetInner: React.FC<WidgetProps> = ({ config, data }) => {
  // Memoize chart data to prevent recreation
  const chartData = useMemo(() => {
    return data?.chartData || config.config?.chartData;
  }, [data?.chartData, config.config?.chartData]);

  // Memoize dataKeys to prevent recreation on every render
  const dataKeys = useMemo(() => {
    return config.config?.dataKeys || [
      { key: 'active', name: 'Active/Pending', color: colors.warning[500] },
      { key: 'completed', name: 'Completed Today', color: colors.success[500] },
    ];
  }, [config.config?.dataKeys]);

  // Memoize height calculation
  const height = useMemo(() => {
    return config.size === 'small' ? 200 : config.size === 'large' ? 350 : 300;
  }, [config.size]);

  // Memoize tooltip formatter
  const tooltipFormatter = useCallback((value: any) => [value.toString(), ''], []);

  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.neutral[600] }}>
        No chart data available
      </div>
    );
  }

  return (
    <BarChart
      data={chartData}
      dataKeys={dataKeys}
      height={height}
      tooltipFormatter={tooltipFormatter}
    />
  );
};

// Export memoized component
export const ChartWidget = React.memo(ChartWidgetInner, (prevProps, nextProps) => {
  // Only re-render if config or data actually changed
  return (
    prevProps.config === nextProps.config &&
    prevProps.data === nextProps.data
  );
});

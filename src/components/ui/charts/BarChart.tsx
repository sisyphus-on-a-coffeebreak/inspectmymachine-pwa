import React, { useMemo, useCallback } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { colors } from '@/lib/theme';

export interface BarChartData {
  [key: string]: string | number;
}

export interface BarChartProps {
  data: BarChartData[];
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  xAxisFormatter?: (value: string) => string;
  yAxisLabel?: string;
  barSize?: number;
}

const BarChartInner: React.FC<BarChartProps> = ({
  data,
  dataKeys,
  xAxisKey = 'name',
  height = 300,
  showGrid = true,
  showLegend = true,
  tooltipFormatter,
  xAxisFormatter,
  yAxisLabel,
  barSize = 60,
}) => {
  // Memoize data to prevent re-renders when reference changes but content is same
  const memoData = useMemo(() => data, [data]);
  
  // Memoize dataKeys array
  const memoDataKeys = useMemo(() => dataKeys, [dataKeys]);
  
  // Memoize all style objects
  const margin = useMemo(() => ({ top: 5, right: 20, left: 0, bottom: 5 }), []);
  
  const contentStyle = useMemo(() => ({
    backgroundColor: 'white',
    border: `1px solid ${colors.neutral[200]}`,
    borderRadius: '8px',
    padding: '8px 12px',
  }), []);

  const legendStyle = useMemo(() => ({ paddingTop: '20px' }), []);

  const xAxisStyle = useMemo(() => ({ fontSize: '12px' }), []);
  const yAxisStyle = useMemo(() => ({ fontSize: '12px' }), []);

  // Memoize YAxis label config
  const yAxisLabelConfig = useMemo(() => {
    return yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' as const } : undefined;
  }, [yAxisLabel]);

  // Memoize tooltip formatter
  const memoTooltipFormatter = useCallback(
    (value: any, name: string) => {
      if (tooltipFormatter) {
        return tooltipFormatter(value, name);
      }
      return [String(value), String(name)];
    },
    [tooltipFormatter]
  );

  // Memoize Bar components
  const barComponents = useMemo(() => {
    return memoDataKeys.map(({ key, name, color }) => (
      <Bar 
        key={key} 
        dataKey={key} 
        name={name} 
        fill={color || colors.primary} 
        barSize={barSize} 
      />
    ));
  }, [memoDataKeys, barSize]);

  // Use fixed width instead of ResponsiveContainer to avoid infinite loops
  const containerWidth = useMemo(() => 800, []);
  
  return (
    <div style={{ width: '100%', height: `${height}px`, overflow: 'hidden' }}>
      <RechartsBarChart 
        width={containerWidth} 
        height={height} 
        data={memoData} 
        margin={margin}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />}
        <XAxis
          dataKey={xAxisKey}
          stroke={colors.neutral[600]}
          style={xAxisStyle}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          stroke={colors.neutral[600]}
          style={yAxisStyle}
          label={yAxisLabelConfig}
        />
        <Tooltip
          contentStyle={contentStyle}
          formatter={memoTooltipFormatter}
        />
        {showLegend && <Legend wrapperStyle={legendStyle} />}
        {barComponents}
      </RechartsBarChart>
    </div>
  );
};

// Export memoized component with proper comparison
export const BarChart = React.memo(BarChartInner, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.data === nextProps.data &&
    prevProps.dataKeys === nextProps.dataKeys &&
    prevProps.height === nextProps.height &&
    prevProps.xAxisKey === nextProps.xAxisKey &&
    prevProps.showGrid === nextProps.showGrid &&
    prevProps.showLegend === nextProps.showLegend &&
    prevProps.tooltipFormatter === nextProps.tooltipFormatter &&
    prevProps.xAxisFormatter === nextProps.xAxisFormatter &&
    prevProps.yAxisLabel === nextProps.yAxisLabel &&
    prevProps.barSize === nextProps.barSize
  );
});

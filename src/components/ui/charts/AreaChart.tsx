import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colors } from '../../../lib/theme';

export interface AreaChartData {
  date: string;
  [key: string]: string | number;
}

export interface AreaChartProps {
  data: AreaChartData[];
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
    fillOpacity?: number;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  xAxisFormatter?: (value: string) => string;
  yAxisLabel?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKeys,
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showLegend = true,
  tooltipFormatter,
  xAxisFormatter,
  yAxisLabel,
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[200]} />}
        <XAxis
          dataKey={xAxisKey}
          stroke={colors.neutral[600]}
          style={{ fontSize: '12px' }}
          tickFormatter={xAxisFormatter || formatDate}
        />
        <YAxis
          stroke={colors.neutral[600]}
          style={{ fontSize: '12px' }}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={tooltipFormatter}
          labelFormatter={(label) => formatDate(label)}
        />
        {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
        {dataKeys.map(({ key, name, color, fillOpacity = 0.6 }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color || colors.primary}
            fill={color || colors.primary}
            fillOpacity={fillOpacity}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};



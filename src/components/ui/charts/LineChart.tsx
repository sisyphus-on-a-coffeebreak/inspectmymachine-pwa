import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colors } from '@/lib/theme';

export interface LineChartData {
  date: string;
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartData[];
  dataKeys: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
  }>;
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  xAxisFormatter?: (value: string) => string;
  yAxisLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
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
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
        {dataKeys.map(({ key, name, color, strokeWidth = 2 }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={name}
            stroke={color || colors.primary}
            strokeWidth={strokeWidth}
            dot={{ fill: color || colors.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};



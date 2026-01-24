import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { colors } from '@/lib/theme';

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  colors.primary,
  colors.success[500],
  colors.warning[500],
  colors.error[500],
  colors.brand,
  colors.neutral[500],
  colors.success[400],
  colors.warning[400],
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  tooltipFormatter,
  innerRadius = 0,
  outerRadius = 80,
}) => {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          formatter={tooltipFormatter || ((value: number) => [value, ''])}
        />
        {showLegend && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};



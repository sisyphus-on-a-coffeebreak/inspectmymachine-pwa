export { LineChart } from './LineChart';
export type { LineChartProps, LineChartData } from './LineChart';
export { BarChart } from './BarChart';
export type { BarChartProps, BarChartData } from './BarChart';
export { PieChart } from './PieChart';
export type { PieChartProps, PieChartData } from './PieChart';
export { AreaChart } from './AreaChart';
export type { AreaChartProps, AreaChartData } from './AreaChart';

// Lazy-loaded chart components for code splitting
import { lazy } from 'react';

export const LazyLineChart = lazy(() => import('./LineChart').then(m => ({ default: m.LineChart })));
export const LazyBarChart = lazy(() => import('./BarChart').then(m => ({ default: m.BarChart })));
export const LazyPieChart = lazy(() => import('./PieChart').then(m => ({ default: m.PieChart })));
export const LazyAreaChart = lazy(() => import('./AreaChart').then(m => ({ default: m.AreaChart })));


/**
 * Widget System Types
 * 
 * Types for the customizable dashboard widget system
 */

export type WidgetType = 
  | 'stats'
  | 'quick-actions'
  | 'chart'
  | 'kanban'
  | 'recent-activity'
  | 'modules'
  | 'alerts'
  | 'inspection-sync'
  | 'scan-button'
  | 'pending-approvals'
  | 'needs-attention'
  | 'expected-arrivals'
  | 'inside-now'
  | 'my-inspections'
  | 'sync-status'
  | 'todays-activity'
  | 'recent-items';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  visible: boolean;
  order: number;
  position?: {
    row: number;
    col: number;
  };
  config?: Record<string, any>; // Widget-specific configuration
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  columns?: number; // Grid columns (default: 4)
  version?: string; // Layout version for migration
}

export interface WidgetProps {
  config: WidgetConfig;
  data?: any;
  onConfigChange?: (config: WidgetConfig) => void;
  onRemove?: () => void;
}

/**
 * Widget Components Index
 * 
 * Exports all widget components and registers them
 */

import { registerWidget } from '../../../lib/widgetRegistry';
import { StatsWidget } from './StatsWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { ChartWidget } from './ChartWidget';
import { KanbanWidget } from './KanbanWidget';
import { InspectionSyncWidget } from './InspectionSyncWidget';
import { ScanButtonWidget } from './ScanButtonWidget';
import { PendingApprovalsWidget } from './PendingApprovalsWidget';
import { NeedsAttentionWidget } from './NeedsAttentionWidget';
import { ExpectedArrivalsWidget } from './ExpectedArrivalsWidget';
import { InsideNowWidget } from './InsideNowWidget';
import { MyInspectionsWidget } from './MyInspectionsWidget';
import { SyncStatusWidget } from './SyncStatusWidget';
import { TodaysActivityWidget } from './TodaysActivityWidget';
import { RecentItemsWidget } from './RecentItemsWidget';

// Register all widgets
registerWidget({
  type: 'stats',
  title: 'Quick Stats',
  description: 'Display key statistics and metrics',
  defaultSize: 'full',
  icon: '📊',
  component: StatsWidget,
});

registerWidget({
  type: 'quick-actions',
  title: 'Quick Actions',
  description: 'Role-based quick action buttons',
  defaultSize: 'full',
  icon: '🚀',
  component: QuickActionsWidget,
});

registerWidget({
  type: 'chart',
  title: 'Chart',
  description: 'Display data visualizations',
  defaultSize: 'large',
  icon: '📈',
  component: ChartWidget,
});

registerWidget({
  type: 'kanban',
  title: 'Task Board',
  description: 'Kanban board for tasks and items',
  defaultSize: 'full',
  icon: '📋',
  component: KanbanWidget,
});

registerWidget({
  type: 'inspection-sync',
  title: 'Inspection Sync',
  description: 'Monitor and sync queued inspections',
  defaultSize: 'medium',
  icon: '🔄',
  component: InspectionSyncWidget,
  roles: ['super_admin', 'admin', 'inspector'],
});

registerWidget({
  type: 'scan-button',
  title: 'Scan Pass',
  description: 'Quick access to QR code scanning',
  defaultSize: 'full',
  icon: '📱',
  component: ScanButtonWidget,
  roles: ['guard'],
});

registerWidget({
  type: 'pending-approvals',
  title: 'Pending Approvals',
  description: 'Items awaiting your approval',
  defaultSize: 'medium',
  icon: '✅',
  component: PendingApprovalsWidget,
  roles: ['super_admin', 'admin', 'supervisor'],
});

registerWidget({
  type: 'needs-attention',
  title: 'Needs Attention',
  description: 'Items requiring immediate attention',
  defaultSize: 'medium',
  icon: '⚠️',
  component: NeedsAttentionWidget,
  roles: ['super_admin', 'admin', 'supervisor', 'clerk'],
});

registerWidget({
  type: 'expected-arrivals',
  title: 'Expected Arrivals',
  description: 'Gate passes expected today',
  defaultSize: 'medium',
  icon: '🕐',
  component: ExpectedArrivalsWidget,
  roles: ['guard'],
});

registerWidget({
  type: 'inside-now',
  title: 'Currently Inside',
  description: 'Vehicles and visitors currently inside',
  defaultSize: 'medium',
  icon: '👥',
  component: InsideNowWidget,
  roles: ['guard'],
});

registerWidget({
  type: 'my-inspections',
  title: 'My Inspections',
  description: 'Your recent and pending inspections',
  defaultSize: 'medium',
  icon: '📋',
  component: MyInspectionsWidget,
  roles: ['inspector'],
});

registerWidget({
  type: 'sync-status',
  title: 'Sync Status',
  description: 'Inspection sync status',
  defaultSize: 'small',
  icon: '🔄',
  component: SyncStatusWidget,
  roles: ['inspector'],
});

registerWidget({
  type: 'todays-activity',
  title: "Today's Activity",
  description: 'Summary of today\'s activity',
  defaultSize: 'large',
  icon: '📊',
  component: TodaysActivityWidget,
  roles: ['super_admin', 'admin', 'supervisor', 'clerk', 'inspector'],
});

registerWidget({
  type: 'recent-items',
  title: 'Recent Items',
  description: 'Recently viewed items',
  defaultSize: 'large',
  icon: '🕒',
  component: RecentItemsWidget,
  roles: ['super_admin', 'admin', 'supervisor', 'clerk', 'inspector'],
});

export { 
  StatsWidget, 
  QuickActionsWidget, 
  ChartWidget, 
  KanbanWidget, 
  InspectionSyncWidget,
  ScanButtonWidget,
  PendingApprovalsWidget,
  NeedsAttentionWidget,
  ExpectedArrivalsWidget,
  InsideNowWidget,
  MyInspectionsWidget,
  SyncStatusWidget,
  TodaysActivityWidget,
  RecentItemsWidget,
};


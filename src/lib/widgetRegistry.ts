/**
 * Widget Registry
 * 
 * Central registry for all dashboard widgets
 * 
 * ⚠️ MIGRATION: This file now supports both role-based (legacy) and capability-based checks.
 * Capability checks are preferred when a user object is available.
 */

import type { WidgetType, WidgetConfig, WidgetProps } from '../types/widgets';
import { colors } from './theme';
import type { User } from '../providers/authTypes';
import { hasCapability } from './users';

export interface WidgetDefinition {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  icon?: string;
  component: React.ComponentType<WidgetProps>;
  defaultConfig?: Record<string, any>;
  roles?: string[]; // Roles that can use this widget
}

// Widget registry - will be populated by widget components
const widgetRegistry = new Map<WidgetType, WidgetDefinition>();

/**
 * Register a widget definition
 */
export function registerWidget(definition: WidgetDefinition): void {
  widgetRegistry.set(definition.type, definition);
}

/**
 * Get widget definition by type
 */
export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
  return widgetRegistry.get(type);
}

/**
 * Get all available widgets for a role
 */
export function getAvailableWidgets(role?: string): WidgetDefinition[] {
  const widgets = Array.from(widgetRegistry.values());
  if (!role) return widgets;
  return widgets.filter(widget => !widget.roles || widget.roles.includes(role));
}

/**
 * Get default widget layout for a role or user
 * 
 * ⚠️ MIGRATION: Now accepts either role string (legacy) or user object (preferred).
 * When user object is provided, capability checks are used instead of role checks.
 * 
 * @param roleOrUser - Role string (legacy) or User object (preferred)
 */
export function getDefaultLayout(roleOrUser?: string | User | null): WidgetConfig[] {
  // Extract role string for backward compatibility
  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser?.role;
  const user = typeof roleOrUser === 'object' && roleOrUser !== null ? roleOrUser : null;
  
  const availableWidgets = getAvailableWidgets(role);
  
  // Helper to check capabilities when user is available, otherwise fall back to role
  const hasCap = (module: string, action: string): boolean => {
    if (user) {
      return hasCapability(user, module as any, action as any);
    }
    // Fallback to role checks for backward compatibility
    return false; // Will be handled by role checks below
  };
  
  // Role-specific default layouts
  if (role === 'guard') {
    const guardLayout: WidgetConfig[] = [
      {
        id: 'scan-button',
        type: 'scan-button',
        title: 'Scan Pass',
        size: 'full',
        visible: true,
        order: 1,
      },
      {
        id: 'expected-arrivals',
        type: 'expected-arrivals',
        title: 'Expected Arrivals',
        size: 'medium',
        visible: true,
        order: 2,
      },
      {
        id: 'inside-now',
        type: 'inside-now',
        title: 'Currently Inside',
        size: 'medium',
        visible: true,
        order: 3,
      },
    ];
    return guardLayout.filter(widget => 
      availableWidgets.some(aw => aw.type === widget.type)
    );
  }

  if (role === 'inspector') {
    const inspectorLayout: WidgetConfig[] = [
      {
        id: 'my-inspections',
        type: 'my-inspections',
        title: 'My Inspections',
        size: 'medium',
        visible: true,
        order: 1,
      },
      {
        id: 'sync-status',
        type: 'sync-status',
        title: 'Sync Status',
        size: 'small',
        visible: true,
        order: 2,
      },
      {
        id: 'todays-activity',
        type: 'todays-activity',
        title: "Today's Activity",
        size: 'large',
        visible: true,
        order: 3,
      },
      {
        id: 'recent-items',
        type: 'recent-items',
        title: 'Recent Items',
        size: 'large',
        visible: true,
        order: 4,
      },
    ];
    return inspectorLayout.filter(widget => 
      availableWidgets.some(aw => aw.type === widget.type)
    );
  }

  // Default layout for office staff (super_admin, admin, supervisor, yard_incharge, executive, clerk)
  const defaultLayout: WidgetConfig[] = [
    {
      id: 'quick-actions',
      type: 'quick-actions',
      title: 'Quick Actions',
      size: 'full',
      visible: true,
      order: 1,
    },
    {
      id: 'pending-approvals',
      type: 'pending-approvals',
      title: 'Pending Approvals',
      size: 'medium',
      visible: hasCap('gate_pass', 'approve') || role === 'super_admin' || role === 'admin' || role === 'supervisor' || role === 'yard_incharge',
      order: 2,
    },
    {
      id: 'needs-attention',
      type: 'needs-attention',
      title: 'Needs Attention',
      size: 'medium',
      visible: hasCap('gate_pass', 'read') || role === 'super_admin' || role === 'admin' || role === 'supervisor' || role === 'yard_incharge' || role === 'executive' || role === 'clerk',
      order: 3,
    },
    {
      id: 'todays-activity',
      type: 'todays-activity',
      title: "Today's Activity",
      size: 'large',
      visible: true,
      order: 4,
    },
    {
      id: 'recent-items',
      type: 'recent-items',
      title: 'Recent Items',
      size: 'large',
      visible: true,
      order: 5,
    },
    {
      id: 'inspection-sync',
      type: 'inspection-sync',
      title: 'Inspection Sync',
      size: 'medium',
      visible: hasCap('inspection', 'read') || role === 'super_admin' || role === 'admin' || role === 'inspector',
      order: 6,
    },
    {
      id: 'module-chart',
      type: 'chart',
      title: 'Module Activity',
      size: 'large',
      visible: true,
      order: 7,
      config: {
        dataKeys: [
          { key: 'active', name: 'Active/Pending', color: '#f59e0b' },
          { key: 'completed', name: 'Completed Today', color: '#10b981' },
        ],
      },
    },
  ];

  // Filter based on available widgets
  return defaultLayout.filter(widget => 
    availableWidgets.some(aw => aw.type === widget.type)
  );
}

/**
 * Save widget layout to localStorage
 */
export function saveWidgetLayout(layout: WidgetConfig[], userId?: string): void {
  const key = userId ? `dashboard-layout-${userId}` : 'dashboard-layout';
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save widget layout:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Load widget layout from localStorage
 */
export function loadWidgetLayout(userId?: string): WidgetConfig[] | null {
  const key = userId ? `dashboard-layout-${userId}` : 'dashboard-layout';
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load widget layout:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Reset widget layout to default
 */
export function resetWidgetLayout(role?: string): WidgetConfig[] {
  return getDefaultLayout(role);
}


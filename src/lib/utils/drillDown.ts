/**
 * Drill-Down Utility
 * 
 * Generates URLs for drilling down from dashboard stats
 */

export interface DrillDownOptions {
  module?: string;
  status?: string;
  type?: string;
  date?: 'today' | 'week' | 'month';
  priority?: 'urgent' | 'high' | 'normal';
  filter?: Record<string, string>;
}

/**
 * Generate drill-down URL based on stat type and context
 */
export function getDrillDownUrl(statType: string, options: DrillDownOptions = {}): string | undefined {
  const { module, status, type, date, priority, filter } = options;

  switch (statType) {
    // Overall stats
    case 'completed_today':
      return '/app/approvals?status=approved&date=today';
    
    case 'pending_tasks':
    case 'pending_approvals':
      return '/app/approvals';
    
    case 'urgent_items':
      return '/app/approvals?priority=urgent';
    
    case 'efficiency':
      return '/app/reports';

    // Module-specific stats
    case 'gate_pass_active':
    case 'active_passes':
      return '/app/stockyard/access?status=active';
    
    case 'gate_pass_pending':
      return '/app/stockyard/access?status=pending';
    
    case 'gate_pass_completed_today':
      return '/app/stockyard/access?status=completed&date=today';
    
    case 'inspection_completed_today':
      return '/app/inspections?status=completed&date=today';
    
    case 'inspection_pending':
      return '/app/inspections?status=pending';
    
    case 'expense_pending_approval':
      return '/app/approvals?type=expense&status=pending';
    
    case 'expense_urgent':
      return '/app/approvals?type=expense&priority=urgent';
    
    case 'user_total':
      return '/app/admin/users';
    
    case 'user_new_this_month':
      return '/app/admin/users?filter=new_this_month';

    // Generic module navigation
    default:
      if (module) {
        const baseUrl = getModuleBaseUrl(module);
        if (!baseUrl) return undefined;
        
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (type) params.set('type', type);
        if (date) params.set('date', date);
        if (priority) params.set('priority', priority);
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            params.set(key, value);
          });
        }
        
        const queryString = params.toString();
        return queryString ? `${baseUrl}?${queryString}` : baseUrl;
      }
      return undefined;
  }
}

/**
 * Get base URL for a module
 */
function getModuleBaseUrl(module: string): string | undefined {
  const moduleMap: Record<string, string> = {
    'gate_pass': '/app/stockyard/access',
    'gate-passes': '/app/stockyard/access',
    'stockyard': '/app/stockyard/access',
    'inspections': '/app/inspections',
    'inspection': '/app/inspections',
    'expenses': '/app/expenses',
    'expense': '/app/expenses',
    'users': '/app/admin/users',
    'user_management': '/app/admin/users',
    'approvals': '/app/approvals',
    'reports': '/app/reports',
  };

  return moduleMap[module.toLowerCase()] || undefined;
}

/**
 * Generate filter URL for a stat card
 */
export function createFilterUrl(
  basePath: string,
  filters: Record<string, string | number | boolean>
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}



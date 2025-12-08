/**
 * Template History Utilities
 * 
 * Tracks recently used inspection templates for quick access
 */

const RECENT_TEMPLATES_KEY = 'voms_recent_templates';
const MAX_RECENT_TEMPLATES = 5;

export interface RecentTemplate {
  templateId: string;
  templateName: string;
  usedAt: string;
  vehicleId?: string;
}

// Explicit type export for compatibility
export type { RecentTemplate };

/**
 * Get recently used templates
 */
export function getRecentTemplates(vehicleId?: string): RecentTemplate[] {
  try {
    const stored = localStorage.getItem(RECENT_TEMPLATES_KEY);
    if (!stored) return [];
    
    const recent: RecentTemplate[] = JSON.parse(stored);
    
    // Filter by vehicle if provided
    if (vehicleId) {
      return recent.filter(t => !t.vehicleId || t.vehicleId === vehicleId);
    }
    
    // Return all recent templates, sorted by most recent
    return recent.sort((a, b) => 
      new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Add a template to recent history
 */
export function addRecentTemplate(
  templateId: string,
  templateName: string,
  vehicleId?: string
): void {
  try {
    const recent = getRecentTemplates();
    
    // Remove if already exists
    const filtered = recent.filter(t => t.templateId !== templateId);
    
    // Add to beginning
    const updated: RecentTemplate[] = [
      {
        templateId,
        templateName,
        usedAt: new Date().toISOString(),
        vehicleId,
      },
      ...filtered,
    ].slice(0, MAX_RECENT_TEMPLATES);
    
    localStorage.setItem(RECENT_TEMPLATES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

/**
 * Clear recent templates
 */
export function clearRecentTemplates(): void {
  try {
    localStorage.removeItem(RECENT_TEMPLATES_KEY);
  } catch {
    // Ignore errors
  }
}




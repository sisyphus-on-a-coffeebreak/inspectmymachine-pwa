/**
 * Recently Viewed Items Tracker
 * 
 * Tracks the last 5 viewed items (passes, expenses, inspections, stockyard requests)
 * Stores in localStorage for persistence across sessions
 */

export interface RecentlyViewedItem {
  id: string;
  type: 'gate-pass' | 'expense' | 'inspection' | 'stockyard-request' | 'user';
  title: string;
  subtitle?: string;
  path: string;
  timestamp: number;
  icon?: string;
}

const STORAGE_KEY = 'voms_recently_viewed';
const MAX_ITEMS = 5;

/**
 * Get all recently viewed items
 */
export function getRecentlyViewed(): RecentlyViewedItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as RecentlyViewedItem[];
    // Sort by timestamp (newest first) and limit to MAX_ITEMS
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_ITEMS);
  } catch (error) {
    return [];
  }
}

/**
 * Add an item to recently viewed
 */
export function addRecentlyViewed(item: Omit<RecentlyViewedItem, 'timestamp'>): void {
  try {
    const existing = getRecentlyViewed();
    
    // Remove duplicate (if same id and type)
    const filtered = existing.filter(
      (existingItem) => !(existingItem.id === item.id && existingItem.type === item.type)
    );
    
    // Add new item at the beginning
    const updated = [
      {
        ...item,
        timestamp: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_ITEMS); // Keep only MAX_ITEMS
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Remove an item from recently viewed
 */
export function removeRecentlyViewed(id: string, type: RecentlyViewedItem['type']): void {
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter(
      (item) => !(item.id === id && item.type === type)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Clear all recently viewed items
 */
export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Get icon for item type
 */
export function getItemIcon(type: RecentlyViewedItem['type']): string {
  const icons: Record<RecentlyViewedItem['type'], string> = {
    'gate-pass': '🚪',
    'expense': '💰',
    'inspection': '🔍',
    'stockyard-request': '🏭',
    'user': '👤',
  };
  return icons[type] || '📄';
}

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return new Date(timestamp).toLocaleDateString();
}


/**
 * FAB Preferences Service
 * 
 * Manages user preferences for FAB (Floating Action Button) actions
 * - Stores action order
 * - Stores enabled/disabled state
 * - Syncs with backend (optional)
 */

import type { FabAction } from './unifiedNavigation';

export interface FabPreferences {
  actionOrder: string[]; // Route IDs in preferred order
  enabledActions: string[]; // Routes that are enabled
  primaryAction?: string; // Primary action route
}

const STORAGE_KEY_PREFIX = 'fab-preferences-';

/**
 * Get storage key for user
 */
function getStorageKey(userId?: string | number): string {
  return `${STORAGE_KEY_PREFIX}${userId || 'default'}`;
}

/**
 * Load FAB preferences for a user
 */
export function loadFabPreferences(userId?: string | number): FabPreferences | null {
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as FabPreferences;
  } catch (error) {
    console.error('Failed to load FAB preferences:', error);
    return null;
  }
}

/**
 * Save FAB preferences for a user
 */
export function saveFabPreferences(
  preferences: FabPreferences,
  userId?: string | number
): void {
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save FAB preferences:', error);
  }
}

/**
 * Get default preferences from role-based actions
 */
export function getDefaultFabPreferences(actions: FabAction[]): FabPreferences {
  return {
    actionOrder: actions.map(a => a.route),
    enabledActions: actions.map(a => a.route),
    primaryAction: actions[0]?.route,
  };
}

/**
 * Merge user preferences with default actions
 * Returns actions in user's preferred order with enabled/disabled state
 */
export function mergeFabPreferences(
  defaultActions: FabAction[],
  preferences: FabPreferences | null
): FabAction[] {
  if (!preferences) {
    return defaultActions;
  }

  // Create a map of actions by route
  const actionMap = new Map(defaultActions.map(a => [a.route, a]));

  // Build ordered list from preferences
  const orderedActions: FabAction[] = [];
  
  // Add actions in user's preferred order
  preferences.actionOrder.forEach(route => {
    const action = actionMap.get(route);
    if (action && preferences.enabledActions.includes(route)) {
      orderedActions.push(action);
    }
  });

  // Add any new actions that weren't in preferences (at the end)
  defaultActions.forEach(action => {
    if (!preferences.actionOrder.includes(action.route)) {
      orderedActions.push(action);
    }
  });

  return orderedActions;
}

/**
 * Update action order in preferences
 */
export function updateActionOrder(
  currentPreferences: FabPreferences | null,
  newOrder: string[]
): FabPreferences {
  return {
    ...currentPreferences,
    actionOrder: newOrder,
    primaryAction: newOrder[0],
  };
}

/**
 * Toggle action enabled state
 */
export function toggleAction(
  currentPreferences: FabPreferences | null,
  route: string,
  enabled: boolean
): FabPreferences {
  const enabledActions = currentPreferences?.enabledActions || [];
  
  if (enabled) {
    return {
      ...currentPreferences || getDefaultFabPreferences([]),
      enabledActions: [...enabledActions.filter(r => r !== route), route],
    };
  } else {
    return {
      ...currentPreferences || getDefaultFabPreferences([]),
      enabledActions: enabledActions.filter(r => r !== route),
      // Remove from primary if it was primary
      primaryAction: currentPreferences?.primaryAction === route 
        ? undefined 
        : currentPreferences?.primaryAction,
    };
  }
}

/**
 * Set primary action
 */
export function setPrimaryAction(
  currentPreferences: FabPreferences | null,
  route: string
): FabPreferences {
  const actionOrder = currentPreferences?.actionOrder || [];
  const newOrder = [route, ...actionOrder.filter(r => r !== route)];
  
  return {
    ...currentPreferences || getDefaultFabPreferences([]),
    actionOrder: newOrder,
    primaryAction: route,
  };
}


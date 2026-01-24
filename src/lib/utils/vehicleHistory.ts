/**
 * Vehicle History Utility
 * 
 * Tracks recently used vehicles per user to prioritize them in autocomplete
 */

const STORAGE_KEY = 'voms_vehicle_history';
const MAX_HISTORY = 10;

export interface VehicleHistoryEntry {
  vehicleId: string;
  registrationNumber: string;
  lastUsed: number; // timestamp
}

/**
 * Get recent vehicles for the current user
 */
export function getRecentVehicles(): VehicleHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const history: VehicleHistoryEntry[] = JSON.parse(stored);
    // Sort by last used (most recent first)
    return history.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

/**
 * Record a vehicle as recently used
 */
export function recordVehicleUse(vehicleId: string, registrationNumber: string): void {
  try {
    const history = getRecentVehicles();
    
    // Remove existing entry if present
    const filtered = history.filter((entry) => entry.vehicleId !== vehicleId);
    
    // Add new entry at the beginning
    const updated: VehicleHistoryEntry[] = [
      {
        vehicleId,
        registrationNumber,
        lastUsed: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_HISTORY);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Get vehicle IDs that should be prioritized (recently used)
 */
export function getPrioritizedVehicleIds(): string[] {
  return getRecentVehicles().map((entry) => entry.vehicleId);
}


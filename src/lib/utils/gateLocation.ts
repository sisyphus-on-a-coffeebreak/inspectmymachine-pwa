/**
 * Gate Location Utilities
 * 
 * Utilities for getting GPS location and gate information
 * for scan events and movements
 */

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Get current GPS location
 * Returns null if geolocation is not available or user denies permission
 */
export async function getCurrentLocation(): Promise<Location | null> {
  if (!navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // User denied or error occurred - return null
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Get default gate ID from user context or localStorage
 * This should be set when guard logs in or selects a gate
 */
export function getDefaultGateId(): string | null {
  // Try to get from localStorage first
  const storedGateId = localStorage.getItem('current_gate_id');
  if (storedGateId) {
    return storedGateId;
  }

  // Could also get from user context if gate is assigned to user
  // For now, return null and let backend handle default
  return null;
}

/**
 * Set current gate ID (for guards who work at specific gates)
 */
export function setCurrentGateId(gateId: string): void {
  localStorage.setItem('current_gate_id', gateId);
}


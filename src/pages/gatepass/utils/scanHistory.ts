/**
 * Scan History Utilities
 * 
 * Manages recent scan history in localStorage
 */

import type { RecentScan } from '../components/RecentScansList';

const STORAGE_KEY = 'gate_pass_recent_scans';
const MAX_SCANS = 10;

/**
 * Load recent scans from localStorage
 */
export function loadRecentScans(): RecentScan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const scans: RecentScan[] = JSON.parse(stored);
    // Filter out scans older than 24 hours
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    return scans.filter(scan => scan.timestamp > oneDayAgo);
  } catch (error) {
    console.error('Failed to load recent scans:', error);
    return [];
  }
}

/**
 * Save a scan to history
 */
export function saveScanToHistory(scan: RecentScan): void {
  try {
    const scans = loadRecentScans();
    
    // Remove duplicate (same pass number within last 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const filtered = scans.filter(s => 
      s.passNumber !== scan.passNumber || s.timestamp < fiveMinutesAgo
    );
    
    // Add new scan at the beginning
    const updated = [scan, ...filtered].slice(0, MAX_SCANS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save scan to history:', error);
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear scan history:', error);
  }
}



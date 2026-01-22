/**
 * Scan History Utilities
 * 
 * Manages recent scan history in localStorage
 */

import type { RecentScan } from '../components/RecentScansList';
import { MAX_SCAN_HISTORY, SCAN_HISTORY_RETENTION_HOURS, SCAN_DEDUPLICATION_MINUTES } from '../constants';

const STORAGE_KEY = 'gate_pass_recent_scans';

/**
 * Load recent scans from localStorage
 */
export function loadRecentScans(): RecentScan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const scans: RecentScan[] = JSON.parse(stored);
    // Filter out scans older than retention period
    const now = Date.now();
    const retentionThreshold = now - (SCAN_HISTORY_RETENTION_HOURS * 60 * 60 * 1000);
    
    return scans.filter(scan => scan.timestamp > retentionThreshold);
  } catch (error) {
    return [];
  }
}

/**
 * Save a scan to history
 */
export function saveScanToHistory(scan: RecentScan): void {
  try {
    const scans = loadRecentScans();
    
    // Remove duplicate (same pass number within deduplication window)
    const deduplicationThreshold = Date.now() - (SCAN_DEDUPLICATION_MINUTES * 60 * 1000);
    const filtered = scans.filter(s => 
      s.passNumber !== scan.passNumber || s.timestamp < deduplicationThreshold
    );
    
    // Add new scan at the beginning
    const updated = [scan, ...filtered].slice(0, MAX_SCAN_HISTORY);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail - scan history is non-critical
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Silently fail - scan history is non-critical
  }
}













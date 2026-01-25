/**
 * Dashboard Service
 * 
 * Handles batched dashboard data fetching with caching
 */

import { apiClient, normalizeError } from '../apiClient';

const CACHE_KEY = 'dashboard_stats_cache';
const CACHE_DURATION = 30 * 1000; // 30 seconds

interface DashboardCache {
  data: any;
  timestamp: number;
}

class DashboardService {
  /**
   * Get dashboard stats with caching
   */
  async getStats(forceRefresh = false): Promise<any> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.getCachedStats();
      if (cached) {
        return cached.data;
      }
    }

    try {
      const response = await apiClient.get<{ success: boolean; data: any }>('/v1/dashboard', {
        suppressErrorLog: true,
      });

      const data = response.data.success && response.data.data ? response.data.data : response.data;
      
      // Cache the result
      this.setCachedStats(data);
      
      return data;
    } catch (error) {
      // Return cached data if available, even if stale
      const cached = this.getCachedStats();
      if (cached) {
        return cached.data;
      }
      throw normalizeError(error);
    }
  }

  /**
   * Get cached stats if still valid
   */
  private getCachedStats(): DashboardCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: DashboardCache = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      if (age < CACHE_DURATION) {
        return parsed;
      }

      // Cache expired, remove it
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Cache stats
   */
  private setCachedStats(data: any): void {
    try {
      const cache: DashboardCache = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Invalidate cache (call when data changes)
   */
  invalidateCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get cache age in seconds
   */
  getCacheAge(): number | null {
    const cached = this.getCachedStats();
    if (!cached) return null;
    return Math.floor((Date.now() - cached.timestamp) / 1000);
  }
}

export const dashboardService = new DashboardService();



/**
 * Hook for managing user filters with URL state persistence
 * 
 * Provides URL-based filter management for user list view
 * Filters persist in URL, enabling deep linking and back button support
 */

import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GetUsersParams } from '../lib/users';

export function useUserFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL
  const filters = useMemo<GetUsersParams>(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    per_page: parseInt(searchParams.get('per_page') || '50', 10),
    search: searchParams.get('search') || undefined,
    role: searchParams.get('role') || undefined,
    status: (searchParams.get('status') as 'active' | 'inactive' | 'all') || undefined,
    yard_id: searchParams.get('yard_id') || undefined,
  }), [searchParams]);

  /**
   * Update a single filter
   */
  const updateFilter = (key: keyof GetUsersParams, value: any) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      
      // Remove filter if value is undefined, empty, or 'all'
      if (value === undefined || value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      
      // Reset to page 1 when filters change (except when changing page itself)
      if (key !== 'page' && key !== 'per_page') {
        newParams.set('page', '1');
      }
      
      return newParams;
    });
  };

  /**
   * Update multiple filters at once
   */
  const updateFilters = (newFilters: Partial<GetUsersParams>) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      
      // Reset to page 1 when filters change
      if (!('page' in newFilters) && !('per_page' in newFilters)) {
        newParams.set('page', '1');
      }
      
      return newParams;
    });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchParams({});
  };

  /**
   * Get current search term
   */
  const searchTerm = filters.search || '';

  /**
   * Get current role filter
   */
  const filterRole = filters.role || 'all';

  /**
   * Get current status filter
   */
  const filterStatus = filters.status || 'all';

  /**
   * Get current page
   */
  const page = filters.page || 1;

  /**
   * Get current per page
   */
  const perPage = filters.per_page || 50;

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    searchTerm,
    filterRole,
    filterStatus,
    page,
    perPage,
  };
}


/**
 * useInspectionFilters Hook
 * 
 * Manages inspection filter state synchronized with URL query parameters
 * Provides bidirectional sync: URL ↔ Filter State
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface InspectionFilters {
  status: 'all' | 'completed' | 'pending' | 'approved' | 'rejected';
  search: string;
  page: number;
}

const DEFAULT_FILTERS: InspectionFilters = {
  status: 'all',
  search: '',
  page: 1,
};

/**
 * Parse and validate URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<InspectionFilters> {
  const filters: Partial<InspectionFilters> = {};

  const status = searchParams.get('status');
  if (status && ['all', 'completed', 'pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status as InspectionFilters['status'];
  }

  const search = searchParams.get('search');
  if (search !== null) {
    filters.search = search;
  }

  const page = searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      filters.page = pageNum;
    }
  }

  return filters;
}

/**
 * Build URL search params from filters
 */
function buildURLParams(filters: InspectionFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== DEFAULT_FILTERS.status) {
    params.set('status', filters.status);
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.page !== DEFAULT_FILTERS.page && filters.page > 1) {
    params.set('page', filters.page.toString());
  }

  return params;
}

export function useInspectionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL on mount and when URL changes
  const urlFilters = useMemo(() => {
    return parseFiltersFromURL(searchParams);
  }, [searchParams]);

  // Merge URL filters with defaults
  const filters: InspectionFilters = useMemo(() => {
    return {
      ...DEFAULT_FILTERS,
      ...urlFilters,
    };
  }, [urlFilters]);

  // Debounce search to avoid spamming URL updates
  const debouncedSearch = useDebounce(filters.search, 300);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      const newFilters = { ...filters, search: debouncedSearch };
      const newParams = buildURLParams(newFilters);
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearch, filters, setSearchParams]);

  // Set a single filter value
  const setFilter = useCallback(
    <K extends keyof InspectionFilters>(key: K, value: InspectionFilters[K]) => {
      const newFilters = { ...filters, [key]: value };
      
      // Reset to page 1 when filters change (except when changing page itself)
      if (key !== 'page') {
        newFilters.page = 1;
      }

      const newParams = buildURLParams(newFilters);
      setSearchParams(newParams, { replace: false }); // Use push to allow back button
    },
    [filters, setSearchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: false });
  }, [setSearchParams]);

  // Check if any filters are active (non-default)
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== DEFAULT_FILTERS.status ||
      filters.search.trim() !== '' ||
      filters.page !== DEFAULT_FILTERS.page
    );
  }, [filters]);

  // Count active filters (excluding page)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.search.trim() !== '') count++;
    return count;
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}


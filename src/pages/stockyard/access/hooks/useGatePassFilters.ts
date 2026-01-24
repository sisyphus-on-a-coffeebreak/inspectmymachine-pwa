/**
 * useGatePassFilters Hook
 * 
 * Manages gate pass filter state synchronized with URL query parameters
 * Provides bidirectional sync: URL ↔ Filter State
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface GatePassFilters {
  status: 'all' | 'active' | 'pending' | 'inside' | 'completed';
  type: 'all' | 'visitor' | 'vehicle';
  search: string;
  page: number;
}

const DEFAULT_FILTERS: GatePassFilters = {
  status: 'active',
  type: 'all',
  search: '',
  page: 1,
};

// Valid status options (excluding 'completed' from URL for now, but allow it)
const VALID_STATUSES = ['all', 'active', 'pending', 'inside', 'completed'] as const;
const VALID_TYPES = ['all', 'visitor', 'vehicle'] as const;


/**
 * Parse and validate URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<GatePassFilters> {
  const filters: Partial<GatePassFilters> = {};

  // Parse status
  const status = searchParams.get('status');
  if (status && VALID_STATUSES.includes(status)) {
    filters.status = status as GatePassFilters['status'];
  }

  // Parse type
  const type = searchParams.get('type');
  if (type && VALID_TYPES.includes(type)) {
    filters.type = type as GatePassFilters['type'];
  }

  // Parse search
  const search = searchParams.get('search');
  if (search !== null) {
    filters.search = search;
  }

  // Parse page
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
function buildURLParams(filters: GatePassFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== DEFAULT_FILTERS.status) {
    params.set('status', filters.status);
  }

  if (filters.type !== DEFAULT_FILTERS.type) {
    params.set('type', filters.type);
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.page !== DEFAULT_FILTERS.page && filters.page > 1) {
    params.set('page', filters.page.toString());
  }

  return params;
}

export function useGatePassFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL on mount and when URL changes
  const urlFilters = useMemo(() => {
    return parseFiltersFromURL(searchParams);
  }, [searchParams]);

  // Merge URL filters with defaults
  const filters: GatePassFilters = useMemo(() => {
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
    <K extends keyof GatePassFilters>(key: K, value: GatePassFilters[K]) => {
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
      filters.type !== DEFAULT_FILTERS.type ||
      filters.search.trim() !== '' ||
      filters.page !== DEFAULT_FILTERS.page
    );
  }, [filters]);

  // Count active filters (excluding page)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.type !== DEFAULT_FILTERS.type) count++;
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


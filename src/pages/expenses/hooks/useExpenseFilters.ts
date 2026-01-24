/**
 * useExpenseFilters Hook
 * 
 * Manages expense filter state synchronized with URL query parameters
 * Provides bidirectional sync: URL ↔ Filter State
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface ExpenseFilters {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  category: 'all' | string;
  project: 'all' | string;
  asset: 'all' | string;
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
  amountRange: 'all' | 'low' | 'medium' | 'high';
  search: string;
  page: number;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  status: 'all',
  category: 'all',
  project: 'all',
  asset: 'all',
  dateRange: 'all',
  amountRange: 'all',
  search: '',
  page: 1,
};

/**
 * Parse and validate URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): Partial<ExpenseFilters> {
  const filters: Partial<ExpenseFilters> = {};

  const status = searchParams.get('status');
  if (status && ['all', 'pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status as ExpenseFilters['status'];
  }

  const category = searchParams.get('category');
  if (category) {
    filters.category = category;
  }

  const project = searchParams.get('project');
  if (project) {
    filters.project = project;
  }

  const asset = searchParams.get('asset');
  if (asset) {
    filters.asset = asset;
  }

  const dateRange = searchParams.get('dateRange');
  if (dateRange && ['all', 'week', 'month', 'quarter', 'year'].includes(dateRange)) {
    filters.dateRange = dateRange as ExpenseFilters['dateRange'];
  }

  const amountRange = searchParams.get('amountRange');
  if (amountRange && ['all', 'low', 'medium', 'high'].includes(amountRange)) {
    filters.amountRange = amountRange as ExpenseFilters['amountRange'];
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
function buildURLParams(filters: ExpenseFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.status !== DEFAULT_FILTERS.status) {
    params.set('status', filters.status);
  }

  if (filters.category !== DEFAULT_FILTERS.category) {
    params.set('category', filters.category);
  }

  if (filters.project !== DEFAULT_FILTERS.project) {
    params.set('project', filters.project);
  }

  if (filters.asset !== DEFAULT_FILTERS.asset) {
    params.set('asset', filters.asset);
  }

  if (filters.dateRange !== DEFAULT_FILTERS.dateRange) {
    params.set('dateRange', filters.dateRange);
  }

  if (filters.amountRange !== DEFAULT_FILTERS.amountRange) {
    params.set('amountRange', filters.amountRange);
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.page !== DEFAULT_FILTERS.page && filters.page > 1) {
    params.set('page', filters.page.toString());
  }

  return params;
}

export function useExpenseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL on mount and when URL changes
  const urlFilters = useMemo(() => {
    return parseFiltersFromURL(searchParams);
  }, [searchParams]);

  // Merge URL filters with defaults
  const filters: ExpenseFilters = useMemo(() => {
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
    <K extends keyof ExpenseFilters>(key: K, value: ExpenseFilters[K]) => {
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
      filters.category !== DEFAULT_FILTERS.category ||
      filters.project !== DEFAULT_FILTERS.project ||
      filters.asset !== DEFAULT_FILTERS.asset ||
      filters.dateRange !== DEFAULT_FILTERS.dateRange ||
      filters.amountRange !== DEFAULT_FILTERS.amountRange ||
      filters.search.trim() !== '' ||
      filters.page !== DEFAULT_FILTERS.page
    );
  }, [filters]);

  // Count active filters (excluding page)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== DEFAULT_FILTERS.status) count++;
    if (filters.category !== DEFAULT_FILTERS.category) count++;
    if (filters.project !== DEFAULT_FILTERS.project) count++;
    if (filters.asset !== DEFAULT_FILTERS.asset) count++;
    if (filters.dateRange !== DEFAULT_FILTERS.dateRange) count++;
    if (filters.amountRange !== DEFAULT_FILTERS.amountRange) count++;
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


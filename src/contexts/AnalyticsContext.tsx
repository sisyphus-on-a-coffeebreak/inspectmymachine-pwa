/**
 * Analytics Context
 * 
 * Shared filter state for expense analytics across all tabs
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface AnalyticsFilters {
  dateRange: { start: Date; end: Date };
  accountIds: string[];
  categoryIds: string[];
  projectIds: string[];
  employeeIds: string[];
  status?: 'all' | 'pending' | 'approved' | 'rejected';
}

interface AnalyticsContextType {
  filters: AnalyticsFilters;
  setFilters: (filters: Partial<AnalyticsFilters>) => void;
  clearFilters: () => void;
  updateDateRange: (range: { start: Date; end: Date } | 'week' | 'month' | 'quarter' | 'year' | 'all') => void;
}

const defaultFilters: AnalyticsFilters = {
  dateRange: {
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    end: new Date(), // Today
  },
  accountIds: [],
  categoryIds: [],
  projectIds: [],
  employeeIds: [],
  status: 'all',
};

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

function parseFiltersFromURL(searchParams: URLSearchParams): Partial<AnalyticsFilters> {
  const filters: Partial<AnalyticsFilters> = {};

  // Parse date range
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom && dateTo) {
    filters.dateRange = {
      start: new Date(dateFrom),
      end: new Date(dateTo),
    };
  }

  // Parse arrays
  const accountIds = searchParams.get('accounts');
  if (accountIds) {
    filters.accountIds = accountIds.split(',');
  }

  const categoryIds = searchParams.get('categories');
  if (categoryIds) {
    filters.categoryIds = categoryIds.split(',');
  }

  const projectIds = searchParams.get('projects');
  if (projectIds) {
    filters.projectIds = projectIds.split(',');
  }

  const employeeIds = searchParams.get('employees');
  if (employeeIds) {
    filters.employeeIds = employeeIds.split(',');
  }

  const status = searchParams.get('status');
  if (status && ['all', 'pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status as AnalyticsFilters['status'];
  }

  return filters;
}

function filtersToURL(filters: AnalyticsFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.dateRange) {
    params.set('dateFrom', filters.dateRange.start.toISOString().split('T')[0]);
    params.set('dateTo', filters.dateRange.end.toISOString().split('T')[0]);
  }

  if (filters.accountIds.length > 0) {
    params.set('accounts', filters.accountIds.join(','));
  }

  if (filters.categoryIds.length > 0) {
    params.set('categories', filters.categoryIds.join(','));
  }

  if (filters.projectIds.length > 0) {
    params.set('projects', filters.projectIds.join(','));
  }

  if (filters.employeeIds.length > 0) {
    params.set('employees', filters.employeeIds.join(','));
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  return params;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<AnalyticsFilters>(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    return { ...defaultFilters, ...urlFilters };
  });

  // Sync with URL on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      setFiltersState((prev) => ({ ...prev, ...urlFilters }));
    }
  }, []); // Only on mount

  const setFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters };
      const params = filtersToURL(updated);
      setSearchParams(params, { replace: true });
      return updated;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const updateDateRange = useCallback((
    range: { start: Date; end: Date } | 'week' | 'month' | 'quarter' | 'year' | 'all'
  ) => {
    let dateRange: { start: Date; end: Date };

    if (typeof range === 'string') {
      const end = new Date();
      let start: Date;

      switch (range) {
        case 'week':
          start = new Date(end);
          start.setDate(start.getDate() - 7);
          break;
        case 'month':
          start = new Date(end.getFullYear(), end.getMonth(), 1);
          break;
        case 'quarter':
          const quarter = Math.floor(end.getMonth() / 3);
          start = new Date(end.getFullYear(), quarter * 3, 1);
          break;
        case 'year':
          start = new Date(end.getFullYear(), 0, 1);
          break;
        case 'all':
        default:
          start = new Date(2020, 0, 1); // Arbitrary start date
          break;
      }

      dateRange = { start, end };
    } else {
      dateRange = range;
    }

    setFilters({ dateRange });
  }, [setFilters]);

  return (
    <AnalyticsContext.Provider value={{ filters, setFilters, clearFilters, updateDateRange }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}






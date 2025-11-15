/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient, normalizeError } from '../lib/apiClient';
import { useToast } from './ToastProvider';
import { useAuth } from './useAuth';

export interface ProjectReference {
  id: string;
  name: string;
  code: string;
  status?: string;
}

export interface AssetReference {
  id: string;
  name: string;
  type?: string;
  registration_number?: string;
  status?: string;
}

export interface ExpenseTemplateReference {
  id: string;
  name: string;
  category: string;
  amount?: number;
  description?: string;
  payment_method?: string;
  project_id?: string;
  asset_id?: string;
}

type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';

type ResourceState<T> = {
  data: T[];
  status: ResourceStatus;
  error?: string | null;
  lastFetched?: number | null;
};

type ResourceKey = 'projects' | 'assets' | 'templates';

interface ExpenseReferencesContextValue {
  projects: ResourceState<ProjectReference>;
  assets: ResourceState<AssetReference>;
  templates: ResourceState<ExpenseTemplateReference>;
  refreshProjects: () => Promise<void>;
  refreshAssets: () => Promise<void>;
  refreshTemplates: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const CACHE_KEYS: Record<ResourceKey, string> = {
  projects: 'expense:projects',
  assets: 'expense:assets',
  templates: 'expense:templates',
};

const FETCH_URLS: Record<ResourceKey, string> = {
  projects: '/v1/projects',
  assets: '/v1/assets',
  templates: '/v1/expense-templates',
};

const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

const initialState = <T,>(): ResourceState<T> => ({ data: [], status: 'idle', error: null, lastFetched: null });

const ExpenseReferencesContext = createContext<ExpenseReferencesContextValue | undefined>(undefined);

function safeParse<T>(value: string | null): ResourceState<T> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ResourceState<T>;
    if (!parsed || !Array.isArray(parsed.data)) return null;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse cached expense references', error);
    return null;
  }
}

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const maybe = payload as Record<string, unknown>;
    if (Array.isArray(maybe.data)) return maybe.data as T[];
    if (Array.isArray(maybe.items)) return maybe.items as T[];
    if (maybe.success && Array.isArray(maybe.results)) return maybe.results as T[];
  }
  throw new Error('Response did not contain a list payload');
}

function errorMessage(err: unknown): string {
  const apiError = normalizeError(err);
  if (apiError.message) {
    return apiError.message;
  }
  if (apiError.status) {
    return `HTTP ${apiError.status}: ${apiError.statusText || 'Unknown error'}`;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export const ExpenseReferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ResourceState<ProjectReference>>(initialState<ProjectReference>());
  const [assets, setAssets] = useState<ResourceState<AssetReference>>(initialState<AssetReference>());
  const [templates, setTemplates] = useState<ResourceState<ExpenseTemplateReference>>(initialState<ExpenseTemplateReference>());
  const initializingRef = useRef(true);
  
  // Use refs to track fetch attempts and prevent infinite loops
  const fetchingRef = useRef<Set<ResourceKey>>(new Set());
  const hasFetchedRef = useRef<Set<ResourceKey>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cachedProjects = safeParse<ProjectReference>(localStorage.getItem(CACHE_KEYS.projects));
    const cachedAssets = safeParse<AssetReference>(localStorage.getItem(CACHE_KEYS.assets));
    const cachedTemplates = safeParse<ExpenseTemplateReference>(localStorage.getItem(CACHE_KEYS.templates));

    if (cachedProjects) {
      setProjects({ ...cachedProjects, status: 'success' });
      hasFetchedRef.current.add('projects');
    }
    if (cachedAssets) {
      setAssets({ ...cachedAssets, status: 'success' });
      hasFetchedRef.current.add('assets');
    }
    if (cachedTemplates) {
      setTemplates({ ...cachedTemplates, status: 'success' });
      hasFetchedRef.current.add('templates');
    }

    initializingRef.current = false;
  }, []);

  const fetchResource = useCallback(
    async <T,>(key: ResourceKey, setState: React.Dispatch<React.SetStateAction<ResourceState<T>>>) => {
      // Don't fetch if user is not authenticated
      if (!user) {
        return;
      }
      
      // Prevent multiple simultaneous requests
      if (fetchingRef.current.has(key)) return;
      fetchingRef.current.add(key);
      
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        const response = await apiClient.get(FETCH_URLS[key], {
          skipRetry: true, // Prevent retries for 404 and 401 errors
        });
        const data = extractList<T>(response.data);
        const nextState: ResourceState<T> = {
          data,
          status: 'success',
          error: null,
          lastFetched: Date.now(),
        };
        setState(nextState);
        hasFetchedRef.current.add(key);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEYS[key], JSON.stringify(nextState));
          // Also save as fallback for offline/error scenarios
          localStorage.setItem(`expense:${key}:fallback`, JSON.stringify(data));
        }
      } catch (err) {
        const message = errorMessage(err);
        const apiError = normalizeError(err);
        const is404 = apiError.status === 404;
        const is401 = apiError.status === 401;
        const is500 = apiError.status === 500;
        
        // Try JSON fallback for 404/500 errors
        if ((is404 || is500) && typeof window !== 'undefined') {
          try {
            const fallbackKey = `expense:${key}:fallback`;
            const fallbackData = localStorage.getItem(fallbackKey);
            if (fallbackData) {
              const parsed = JSON.parse(fallbackData);
              if (Array.isArray(parsed)) {
                setState({
                  data: parsed as T[],
                  status: 'success',
                  error: null,
                  lastFetched: Date.now(),
                });
                hasFetchedRef.current.add(key);
                return;
              }
            }
          } catch (fallbackError) {
            // Ignore fallback errors
          }
        }
        
        // Silently handle 401 (not authenticated) and 404 (endpoints don't exist yet)
        if (is401 || is404) {
          // For 401/404 errors, just set empty data and mark as fetched to prevent retries
          setState((prev) => ({
            ...prev,
            status: 'success',
            error: null,
            data: prev.data.length > 0 ? prev.data : [],
            lastFetched: Date.now(),
          }));
          hasFetchedRef.current.add(key);
        } else {
          // Only show toast for other errors
          setState((prev) => ({
            ...prev,
            status: prev.data.length > 0 ? 'success' : 'error',
            error: message,
          }));
          showToast({
            title: 'Failed to refresh data',
            description: message,
            variant: 'error',
            actionLabel: 'Retry',
            onAction: () => {
              fetchingRef.current.delete(key);
              void fetchResource(key, setState);
            },
          });
        }
      } finally {
        fetchingRef.current.delete(key);
      }
    },
    [showToast, user],
  );

  const refreshProjects = useCallback(async () => {
    await fetchResource<ProjectReference>('projects', setProjects);
  }, [fetchResource]);

  const refreshAssets = useCallback(async () => {
    await fetchResource<AssetReference>('assets', setAssets);
  }, [fetchResource]);

  const refreshTemplates = useCallback(async () => {
    await fetchResource<ExpenseTemplateReference>('templates', setTemplates);
  }, [fetchResource]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshProjects(), refreshAssets(), refreshTemplates()]);
  }, [refreshProjects, refreshAssets, refreshTemplates]);

  useEffect(() => {
    // Don't fetch if user is not authenticated
    if (!user) {
      return;
    }

    const shouldRefresh = (state: ResourceState<unknown>, key: ResourceKey) => {
      // Don't refresh if already fetching
      if (fetchingRef.current.has(key)) return false;
      // Don't refresh if we've already fetched and it's not expired
      if (hasFetchedRef.current.has(key) && state.lastFetched) {
        return Date.now() - state.lastFetched > CACHE_TTL;
      }
      // Refresh if never fetched
      if (!state.lastFetched) return true;
      return false;
    };

    if (initializingRef.current) return;

    if (shouldRefresh(projects, 'projects')) {
      void refreshProjects();
    }
    if (shouldRefresh(assets, 'assets')) {
      void refreshAssets();
    }
    if (shouldRefresh(templates, 'templates')) {
      void refreshTemplates();
    }
  }, [user, projects.lastFetched, assets.lastFetched, templates.lastFetched, refreshProjects, refreshAssets, refreshTemplates]);

  const value = useMemo<ExpenseReferencesContextValue>(
    () => ({
      projects,
      assets,
      templates,
      refreshProjects,
      refreshAssets,
      refreshTemplates,
      refreshAll,
    }),
    [projects, assets, templates, refreshProjects, refreshAssets, refreshTemplates, refreshAll],
  );

  return <ExpenseReferencesContext.Provider value={value}>{children}</ExpenseReferencesContext.Provider>;
};

export function useExpenseReferences() {
  const ctx = useContext(ExpenseReferencesContext);
  if (!ctx) {
    throw new Error('useExpenseReferences must be used within an ExpenseReferencesProvider');
  }
  return ctx;
}

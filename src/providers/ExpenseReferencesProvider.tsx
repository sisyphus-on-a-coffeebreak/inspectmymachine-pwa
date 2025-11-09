/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useToast } from './ToastProvider';

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
  projects: '/api/v1/projects',
  assets: '/api/v1/assets',
  templates: '/api/v1/expense-templates',
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
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string } & Record<string, unknown>>;
    return (
      axiosErr.response?.data?.message ||
      axiosErr.response?.statusText ||
      axiosErr.message ||
      'Unable to reach server'
    );
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export const ExpenseReferencesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ResourceState<ProjectReference>>(initialState<ProjectReference>());
  const [assets, setAssets] = useState<ResourceState<AssetReference>>(initialState<AssetReference>());
  const [templates, setTemplates] = useState<ResourceState<ExpenseTemplateReference>>(initialState<ExpenseTemplateReference>());
  const initializingRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cachedProjects = safeParse<ProjectReference>(localStorage.getItem(CACHE_KEYS.projects));
    const cachedAssets = safeParse<AssetReference>(localStorage.getItem(CACHE_KEYS.assets));
    const cachedTemplates = safeParse<ExpenseTemplateReference>(localStorage.getItem(CACHE_KEYS.templates));

    if (cachedProjects) setProjects({ ...cachedProjects, status: 'success' });
    if (cachedAssets) setAssets({ ...cachedAssets, status: 'success' });
    if (cachedTemplates) setTemplates({ ...cachedTemplates, status: 'success' });

    initializingRef.current = false;
  }, []);

  const fetchResource = useCallback(
    async <T,>(key: ResourceKey, setState: React.Dispatch<React.SetStateAction<ResourceState<T>>>) => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));
      try {
        const response = await axios.get(FETCH_URLS[key]);
        const data = extractList<T>(response.data);
        const nextState: ResourceState<T> = {
          data,
          status: 'success',
          error: null,
          lastFetched: Date.now(),
        };
        setState(nextState);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHE_KEYS[key], JSON.stringify(nextState));
        }
      } catch (err) {
        const message = errorMessage(err);
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
            void fetchResource(key, setState);
          },
        });
      }
    },
    [showToast],
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
    const shouldRefresh = (state: ResourceState<unknown>) => {
      if (!state.lastFetched) return true;
      return Date.now() - state.lastFetched > CACHE_TTL;
    };

    if (initializingRef.current) return;

    if (shouldRefresh(projects)) {
      void refreshProjects();
    }
    if (shouldRefresh(assets)) {
      void refreshAssets();
    }
    if (shouldRefresh(templates)) {
      void refreshTemplates();
    }
  }, [projects, assets, templates, refreshProjects, refreshAssets, refreshTemplates]);

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

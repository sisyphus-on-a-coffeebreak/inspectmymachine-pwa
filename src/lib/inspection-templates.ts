import { apiClient } from './apiClient';
import { get, set, del, keys } from './idb-safe';
import type { InspectionTemplate } from '@/types/inspection';

const CACHE_PREFIX = 'inspection-template:';
const CACHE_VERSION = 1;

interface CachedTemplateRecord {
  version: number;
  cachedAt: number;
  template: InspectionTemplate;
}

export interface TemplateFetchResult {
  template: InspectionTemplate;
  source: 'network' | 'cache';
  cachedAt: number;
  error?: unknown;
}

export async function fetchInspectionTemplate(
  templateId: string,
  { forceRefresh = false, signal }: { forceRefresh?: boolean; signal?: AbortSignal } = {},
): Promise<TemplateFetchResult> {
  if (!templateId) {
    throw new Error('templateId is required');
  }

  const cacheKey = buildCacheKey(templateId);
  const cached = await get<CachedTemplateRecord>(cacheKey);

  if (!forceRefresh && cached?.template) {
    try {
      if (!navigator.onLine) {
        return {
          template: cached.template,
          source: 'cache',
          cachedAt: cached.cachedAt,
        };
      }
    } catch {
      // navigator may not exist in SSR; ignore and fall back to network fetch below
    }
  }

  try {
    const response = await apiClient.get<InspectionTemplate>(`/v1/inspection-templates/${templateId}`, {
      skipRetry: false, // apiClient handles retry internally
    });

    const template = response.data;
    const record: CachedTemplateRecord = {
      version: CACHE_VERSION,
      cachedAt: Date.now(),
      template,
    };

    await set(cacheKey, record);

    return {
      template,
      source: 'network',
      cachedAt: record.cachedAt,
    };
  } catch (error) {
    if (cached?.template) {
      return {
        template: cached.template,
        source: 'cache',
        cachedAt: cached.cachedAt,
        error,
      };
    }

    throw error;
  }
}

export async function getCachedTemplate(templateId: string): Promise<TemplateFetchResult | null> {
  const cacheKey = buildCacheKey(templateId);
  const cached = await get<CachedTemplateRecord>(cacheKey);
  if (!cached) {
    return null;
  }

  return {
    template: cached.template,
    source: 'cache',
    cachedAt: cached.cachedAt,
  };
}

export async function clearTemplateCache(templateId?: string) {
  if (templateId) {
    await del(buildCacheKey(templateId));
    return;
  }

  const allKeys = await keys();
  await Promise.all(
    allKeys
      .filter((key): key is string => typeof key === 'string' && key.startsWith(CACHE_PREFIX))
      .map((key) => del(key)),
  );
}

/**
 * Get all cached template IDs
 */
export async function getCachedTemplateIds(): Promise<string[]> {
  try {
    const allKeys = await keys();
    const templateKeys = allKeys.filter(
      (key): key is string => typeof key === 'string' && key.startsWith(CACHE_PREFIX)
    );
    
    // Extract template IDs from cache keys
    return templateKeys.map((key) => {
      const parts = key.split(':');
      return parts[parts.length - 1]; // Last part is the template ID
    });
  } catch {
    return [];
  }
}

/**
 * Cache template list metadata for offline browsing
 */
const TEMPLATE_LIST_CACHE_KEY = 'inspection-template-list:v1';

export interface TemplateListMetadata {
  templates: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    question_count?: number;
    updated_at?: string;
  }>;
  cachedAt: number;
}

export async function cacheTemplateList(metadata: TemplateListMetadata['templates']): Promise<void> {
  const record: TemplateListMetadata = {
    templates: metadata,
    cachedAt: Date.now(),
  };
  await set(TEMPLATE_LIST_CACHE_KEY, record);
}

export async function getCachedTemplateList(): Promise<TemplateListMetadata | null> {
  try {
    return await get<TemplateListMetadata>(TEMPLATE_LIST_CACHE_KEY);
  } catch {
    return null;
  }
}

function buildCacheKey(templateId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}:${templateId}`;
}

import axios from 'axios';
import { get, set, del, keys } from 'idb-keyval';
import { withBackoff } from './retry';
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
    const response = await withBackoff(
      () => axios.get<InspectionTemplate>(`/v1/inspection-templates/${templateId}`, { signal }),
      { tries: 3, baseMs: 400 },
    );

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

function buildCacheKey(templateId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}:${templateId}`;
}

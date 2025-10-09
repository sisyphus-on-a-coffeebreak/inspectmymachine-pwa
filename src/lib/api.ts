// src/lib/api.ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Rich error that carries HTTP status and parsed body (if any). */
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Low-level fetch wrapper.
 * Pass relative paths like "/api/v1/inspections" to use Vite's dev proxy.
 * - Dev: Bearer token via VITE_DEV_BEARER_TOKEN
 * - Prod: Sanctum cookies (credentials: 'include')
 */
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const token = import.meta.env.VITE_DEV_BEARER_TOKEN as string | undefined;

  const headers = new Headers(init.headers as HeadersInit);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(path, {
    ...init,
    headers,
    credentials: token ? 'omit' : 'include',
  });
}

/**
 * Typed JSON helper.
 * Parses JSON when content-type is JSON; otherwise returns text.
 * Throws ApiError on non-2xx with parsed payload/text attached.
 */
export async function json<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await api(path, init);

  // Handle 204/205 quickly
  if (res.status === 204 || res.status === 205) {
    if (!res.ok) throw new ApiError(res.statusText || 'Request failed', res.status, null);
    return undefined as T;
  }

  const ct = res.headers.get('content-type') ?? '';
  const isJson = ct.includes('application/json');
  const payload: unknown = isJson ? await safeParseJson(res) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && isRecord(payload) && typeof payload.message === 'string' && payload.message) ||
      res.statusText ||
      'Request failed';
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

/** Legacy aliases for existing imports in the app. */
export const apiFetch = api;
export async function apiFetchJSON<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return json<T>(path, init);
}

/* ----------------------- internal helpers ----------------------- */

async function safeParseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

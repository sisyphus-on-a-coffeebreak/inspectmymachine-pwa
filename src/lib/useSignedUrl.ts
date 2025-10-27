// src/lib/useSignedUrl.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/providers/useAuth";

type SignedUrlResponse = { key: string; url: string; expires_at?: string };

// In-memory cache + in-flight dedupe
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

type FetchJson = <T = unknown>(url: string, init?: RequestInit) => Promise<T>;

export function useSignedUrl(storageKey?: string) {
  const { fetchJson } = useAuth();
  const fetchTyped = fetchJson as FetchJson;

  const [url, setUrl] = useState<string | undefined>(
    storageKey ? cache.get(storageKey) : undefined
  );

  const unmounted = useRef(false);
  useEffect(() => {
    return () => {
      unmounted.current = true;
    };
  }, []);

  const fetchSigned = useCallback(
    async (key: string): Promise<string> => {
      // Deduplicate concurrent requests
      let p = inflight.get(key);
      if (!p) {
        p = (async () => {
          const res = await fetchTyped<SignedUrlResponse>(
            `/api/v1/files/signed?key=${encodeURIComponent(key)}`
          );
          cache.set(key, res.url);
          return res.url;
        })().finally(() => {
          inflight.delete(key);
        });
        inflight.set(key, p);
      }
      const fresh = await p;
      if (!unmounted.current) setUrl(fresh);
      return fresh;
    },
    [fetchTyped]
  );

  useEffect(() => {
    if (!storageKey) return;
    const hit = cache.get(storageKey);
    if (hit) {
      setUrl(hit);
    } else {
      void fetchSigned(storageKey);
    }
  }, [storageKey, fetchSigned]);

  const refresh = useCallback(async () => {
    if (!storageKey) return url;
    cache.delete(storageKey);
    return fetchSigned(storageKey);
  }, [storageKey, fetchSigned, url]);

  return { url, refresh };
}

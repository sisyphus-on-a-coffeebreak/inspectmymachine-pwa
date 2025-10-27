// src/pages/InspectionShow.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Removed import - using dynamic inspection data instead
import { useAuth } from "@/providers/useAuth";
import { useUploader } from "@/lib/upload";
import ThumbnailGrid from "@/components/ThumbnailGrid";

type UploadItem = { key: string; object_url?: string };
type ByQuestion = Record<string, UploadItem[]>;
type SignedUrlResponse = { key: string; url: string; expires_at?: string };

function errMsg(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return fallback; }
}

function todayPrefix(inspectionId: string, qKey: string) {
  // This matches your capture/upload prefix style
  return `inspections/${inspectionId}/${qKey}`;
}

export default function InspectionShow() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { token, fetchJson } = useAuth();
  const { listFiles, remove } = useUploader();

  const [groups, setGroups] = useState<ByQuestion>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [reloadTick, setReloadTick] = useState(0);

  const questions = useMemo(() => CAPTURE_QUESTIONS, []);
  const signedCache = useRef(new Map<string, string>());

  const ensureUrl = useCallback(
    async (key: string, maybeUrl?: string): Promise<string> => {
      if (maybeUrl) return maybeUrl;
      const cached = signedCache.current.get(key);
      if (cached) return cached;
      const res = await fetchJson<SignedUrlResponse>(
        `/api/v1/files/signed?key=${encodeURIComponent(key)}`
      );
      signedCache.current.set(key, res.url);
      return res.url;
    },
    [fetchJson]
  );

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setErr(undefined);
    try {
      const next: ByQuestion = {};
      await Promise.all(
        questions.map(async (q) => {
          const base = todayPrefix(id, q.key);
          const { items } = (await listFiles(base, true)) as {
            items: { key: string; object_url?: string }[];
          };
          const hydrated: UploadItem[] = await Promise.all(
            items.map(async (it) => ({
              key: it.key,
              object_url: await ensureUrl(it.key, it.object_url),
            }))
          );
          next[q.key] = hydrated;
        })
      );
      setGroups(next);
    } catch (e: unknown) {
      setErr(errMsg(e));
      setGroups({});
    } finally {
      setLoading(false);
    }
  }, [token, id, questions, listFiles, ensureUrl]);

  useEffect(() => {
    void load();
  }, [load, reloadTick]);

  async function onDelete(qKey: string, key: string) {
    try {
      await remove(key);
      signedCache.current.delete(key);
      setGroups((prev) => ({
        ...prev,
        [qKey]: (prev[qKey] ?? []).filter((r) => r.key !== key),
      }));
    } catch (e: unknown) {
      setErr(errMsg(e, "Delete failed"));
    }
  }

  return (
    <AppShell>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inspection #{id}</h1>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => setReloadTick((t) => t + 1)}>
            Refresh
          </Button>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>
      </div>

      {err && (
        <div className="mb-3 rounded-lg border border-red-300/50 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          Error: {err}
        </div>
      )}

      {loading && (
        <div className="mb-3 rounded-lg border px-3 py-2 text-sm opacity-70">
          Loading…
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q) => {
          const list = groups[q.key] ?? [];
          return (
            <div key={q.key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {q.label}
                  {list.length > 0 && (
                    <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">
                      {list.length}
                    </span>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              {list.length === 0 ? (
                <div className="text-sm opacity-60">No photos found.</div>
              ) : (
                <ThumbnailGrid
                  items={list.map((r) => ({ key: r.key, url: r.object_url! }))}
                  onDelete={(key) => onDelete(q.key, key)}
                />
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

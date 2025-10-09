// src/pages/InspectionDetails.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { apiFetch } from "@/lib/api";
import { useUploader } from "@/lib/upload";
import { CAPTURE_QUESTIONS } from "@/data/inspectionQuestions";
import ThumbnailGrid from "@/components/ThumbnailGrid";
import { Separator } from "@/components/ui/separator";

type Detail = {
  id: string;
  date: string;
  vehicle: string;
  reg: string;
  inspector: string;
  location: string;
  rating: number;
};

type UploadItem = { key: string; object_url?: string };
type ByQ = Record<string, UploadItem[]>;

type SignedUrlResponse = { key: string; url: string; expires_at?: string };

function errMsg(e: unknown, fb = "Something went wrong") {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return fb; }
}

export default function InspectionDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { token, fetchJson } = useAuth();
  const { listFiles } = useUploader();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [photos, setPhotos] = useState<ByQ>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  // cache signed URLs
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

  const questions = useMemo(() => CAPTURE_QUESTIONS, []);

  // Fetch header/details
  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      setLoading(true);
      setErr(undefined);
      try {
        // Adjust this path if your API uses a different endpoint
        const res = await apiFetch(`/metrics/inspections/${id}`, {}, token);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json: Detail = await res.json();
        setDetail(json);
      } catch (e: unknown) {
        setErr(errMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  // Fetch photos grouped by question
  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      try {
        const next: ByQ = {};
        await Promise.all(
          questions.map(async (q) => {
            const base = `inspections/${id}/${q.key}`;
            const { items } = (await listFiles(base, true)) as {
              items: { key: string; object_url?: string }[];
            };
            next[q.key] = await Promise.all(
              items.map(async (it) => ({
                key: it.key,
                object_url: await ensureUrl(it.key, it.object_url),
              }))
            );
          })
        );
        setPhotos(next);
      } catch (e: unknown) {
        // non-fatal — show details even if photos fail
        console.warn("[InspectionDetails] photos load failed:", e);
      }
    })();
  }, [id, token, questions, listFiles, ensureUrl]);

  return (
    <AppShell>
      <div className="mb-4">
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => navigate(-1)}
          type="button"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-xl font-semibold">Inspection Details</h1>
      {err && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Error: {err}
        </div>
      )}

      {loading && <div className="mt-4 text-sm opacity-70">Loading…</div>}

      {detail && (
        <div className="mt-4 rounded-xl border p-4 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="opacity-60">ID:</span> <span className="font-mono">{detail.id}</span></div>
            <div><span className="opacity-60">Date:</span> {detail.date}</div>
            <div><span className="opacity-60">Vehicle:</span> {detail.vehicle}</div>
            <div><span className="opacity-60">Reg:</span> {detail.reg}</div>
            <div><span className="opacity-60">Inspector:</span> {detail.inspector}</div>
            <div><span className="opacity-60">Location:</span> {detail.location}</div>
            <div><span className="opacity-60">Rating:</span> {detail.rating}</div>
          </div>
        </div>
      )}

      <Separator className="my-6" />

      <h2 className="text-lg font-medium mb-3">Photos</h2>
      <div className="space-y-6">
        {questions.map((q) => {
          const list = photos[q.key] ?? [];
          return (
            <div key={q.key} className="rounded-xl border p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {q.label}
                  {list.length > 0 && (
                    <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs">
                      {list.length}
                    </span>
                  )}
                </div>
                {/* Optional: link to capture to add more */}
                <Link
                  to={`/capture/${id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Add more
                </Link>
              </div>

              <Separator className="my-3" />

              {list.length === 0 ? (
                <div className="text-sm opacity-60">No photos for this section.</div>
              ) : (
                <ThumbnailGrid
                  items={list.map((r) => ({ key: r.key, url: r.object_url! }))}
                />
              )}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

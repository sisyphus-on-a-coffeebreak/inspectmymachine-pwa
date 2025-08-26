// src/pages/InspectionCapture.tsx
import type React from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CAPTURE_QUESTIONS } from "@/data/inspectionQuestions";
import { useAuth } from "@/providers/AuthProvider";
import { useUploader, type UploadResult } from "@/lib/upload";
import { Camera } from "lucide-react";
import { downscaleImage } from "@/lib/image";
import { useOnline } from "@/hooks/useOnline";
import { withBackoff } from "@/lib/retry";
import { useAppVisible } from "@/hooks/useAppVisible";
import { flushQueue } from "@/lib/queue-runner";
import { enqueue, subscribeQueuedCount } from "@/lib/upload-queue";
import { compressInWorker } from "@/lib/image-worker";
import ThumbnailGrid from "@/components/ThumbnailGrid";

type UploadItem = { key: string; object_url?: string; uploading?: boolean; progress?: number };
type UploadedByQuestion = Record<string, UploadItem[]>;
type SignedUrlResponse = { key: string; url: string; expires_at?: string };
type QueueEvent = { id: string; status: "start" | "ok" | "fail"; error?: unknown };

const debug = (...args: unknown[]) => console.debug("[Capture]", ...args);

const MAX_MB = 30;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function hasPublicUrl(x: unknown): x is { object_url: string } {
  return !!x && typeof (x as Record<string, unknown>).object_url === "string";
}


function blobToFile(b: Blob, nameFallback = `photo-${Date.now()}.jpg`): File {
  const name = b instanceof File ? b.name : nameFallback;
  const type = b.type || "image/jpeg";
  return b instanceof File ? b : new File([b], name, { type });
}

function validateFiles(files: FileList): string | null {
  for (const f of Array.from(files)) {
    if (!ALLOWED.has(f.type)) return `Unsupported: ${f.type} (${f.name})`;
    if (f.size > MAX_BYTES) return `${f.name} is over ${MAX_MB}MB`;
  }
  return null;
}

function todayPrefix(inspectionId: string, qKey: string) {
  return `inspections/${inspectionId}/${qKey}`; // server appends date/uuid
}

const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

function errMsg(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try { return JSON.stringify(e); } catch { return fallback; }
}

export default function InspectionCapture() {
  const navigate = useNavigate();
  const { id = "demo-inspection" } = useParams();
  const { token, fetchJson } = useAuth();
  const { uploadImageWithProgress, listFiles, remove } = useUploader();

  const [uploaded, setUploaded] = useState<UploadedByQuestion>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingQKey = useRef<string | null>(null);

  const online = useOnline();
  const visible = useAppVisible();

  // questions (stable ref)
  const questions = useMemo(() => CAPTURE_QUESTIONS, []);

  // live queued count
  useEffect(() => subscribeQueuedCount(setQueuedCount), []);

  // cache for signed urls (private objects)
  const signedCache = useRef(new Map<string, string>());

  const replaceItem = useCallback(
    (qKey: string, matchKey: string, next: Partial<UploadItem>) => {
      setUploaded((prev: UploadedByQuestion) => {
        const list = prev[qKey] ?? [];
        return {
          ...prev,
          [qKey]: list.map((it) => (it.key === matchKey ? { ...it, ...next } : it)),
        };
      });
    },
    []
  );

  const ensureUrl = useCallback(
  async (key: string, maybeUrl?: string, force = false): Promise<string> => {
    if (maybeUrl) return maybeUrl; // already public/provided
    if (!force) {
      const cached = signedCache.current.get(key);
      if (cached) return cached;
    }
    const res = await fetchJson<SignedUrlResponse>(
      `/api/v1/files/signed?key=${encodeURIComponent(key)}`
    );
    signedCache.current.set(key, res.url);
    return res.url;
  },
  [fetchJson]
);

  const refreshSigned = useCallback(
  async (qKey: string, key: string) => {
    try {
      signedCache.current.delete(key);                // drop stale
      const fresh = await ensureUrl(key, undefined, true); // force new sign
      replaceItem(qKey, key, { object_url: fresh });
    } catch (e) {
      debug("re-sign failed", e);
    }
  },
  [ensureUrl, replaceItem]
);

  // central rehydrate you can call after flush or at mount
  const rehydrate = useCallback(async () => {
    if (!token) return;
    const next: UploadedByQuestion = {};
    await Promise.all(
      questions.map(async (q) => {
        const base = todayPrefix(id!, q.key);
        const { items } = (await listFiles(base, true)) as {
          items: { key: string; object_url?: string }[];
        };
        const enriched: UploadItem[] = await Promise.all(
          items.map(async (it) => ({
            key: it.key,
            object_url: await ensureUrl(it.key, it.object_url),
          }))
        );
        next[q.key] = enriched;
      })
    );
    setUploaded(next);
  }, [token, id, questions, listFiles, ensureUrl]);

  // one-shot hydrate guard (avoids spam in dev/StrictMode)
  const didHydrateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!token) return;
    const guardKey = `${id}:1`;
    if (didHydrateRef.current === guardKey) return;
    didHydrateRef.current = guardKey;

    let cancelled = false;
    (async () => {
      try {
        await rehydrate();
      } catch (e: unknown) {
        if (!cancelled) setError(errMsg(e, "Failed to load existing files"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const onPick = (qKey: string) => {
    debug("onPick", { qKey, token: !!token });
    if (!token) {
      setError("You are not logged in. Please log in again.");
      navigate("/login");
      return;
    }
    pendingQKey.current = qKey;
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  };

  const onSyncQueued = useCallback(async () => {
    setBusy("sync");
    setError(null);
    try {
      await flushQueue(
        {
          uploadImageWithProgress: (blob: Blob, prefix: string, onProgress?: (pct: number) => void) => {
            const file = blobToFile(blob);
            return uploadImageWithProgress(file, prefix, onProgress);
          },
        },
        (ev: QueueEvent) => {
          if (ev.status === "fail") {
            setError(errMsg(ev.error, "Queued upload failed"));
          }
        }
      );
      // one refresh after queue drains
      await rehydrate();
    } finally {
      setBusy(null);
    }
  }, [uploadImageWithProgress, rehydrate]);

  // auto flush when back online + tab visible
  useEffect(() => {
    if (!online || !visible || queuedCount === 0 || !!busy) return;
    onSyncQueued();
  }, [online, visible, queuedCount, busy, onSyncQueued]);

  const onFiles = async (files: FileList | null) => {
    const qKey = pendingQKey.current;
    debug("onFiles:start", { qKey, hasFiles: !!files && files.length, online });
    if (!qKey || !files || files.length === 0 || !token) return;

    const v = validateFiles(files);
    if (v) {
      setError(v);
      pendingQKey.current = null;
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const prefix = todayPrefix(id!, qKey);

    // If offline, queue and exit
    if (!online) {
      for (let i = 0; i < files.length; i++) {
        await enqueue(files[i], qKey, prefix);
      }
      setError(`Saved ${files.length} photo(s) to upload queue (offline).`);
      pendingQKey.current = null;
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Online path
    setBusy(qKey);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const preparedBlob = await prepareForUpload(files[i]);
        const preparedFile = blobToFile(
          preparedBlob,
          files[i].name.replace(/\.[^.]+$/, ".jpg")
        );

        // 1) optimistic placeholder
        const tempKey = `tmp:${crypto?.randomUUID?.() ?? Date.now()}-${i}`;
        const blobUrl = URL.createObjectURL(preparedBlob);

        let swappedToReal = false; // ✅ track if we replaced object_url
        let matchKey = tempKey;    // ✅ progress-safe key

        setUploaded((prev: UploadedByQuestion) => {
          const list = prev[qKey] ?? [];
          return {
            ...prev,
            [qKey]: [...list, { key: tempKey, object_url: blobUrl, uploading: true, progress: 0 }],
          };
        });

        // 2) live progress → update the *same* tile even after key changes
        const handleProgress = (pct: number) => {
          replaceItem(qKey, matchKey, { progress: Math.max(2, pct) });
          if (pct === 2 || pct === 50 || pct === 100) debug("progress", { qKey, key: matchKey, pct });
        };

        try {
          const out: UploadResult = await withBackoff(
            () => uploadImageWithProgress(preparedFile, prefix, handleProgress),
            { tries: 3, baseMs: 400 }
          );

         // optional public URL on the result (if your uploader provides it)
          let objectUrlFromUploader: string | undefined;
          if (hasPublicUrl(out)) {
            objectUrlFromUploader = out.object_url;
          }

          // 3) swap placeholder → real key + (signed) URL
          let url: string;
          try {
            url = await ensureUrl(out.key, objectUrlFromUploader);
          } catch {
            // If signing fails, keep the blob visible and try again on next rehydrate/403.
            debug("sign:fail; keep blob", { key: out.key });
            url = blobUrl; // fallback to the blob until rehydrate runs
          }
          replaceItem(qKey, tempKey, {
            key: out.key,
            object_url: url,
            uploading: false,
            progress: 100,
          });

          matchKey = out.key; // future late ticks (rare) still hit the right tile
          swappedToReal = url !== blobUrl;
        } catch (err: unknown) {
          // mark failure visually; keep tile so user can delete/retry
          replaceItem(qKey, tempKey, { uploading: false });
          setError(errMsg(err, "Upload failed"));
        } finally {
          // free memory (important on Android)
          if (swappedToReal) URL.revokeObjectURL(blobUrl);
        }
      }
    } catch (e: unknown) {
      const msg = errMsg(e, "Upload failed");
      if (/(401|unauthorized)/i.test(msg)) {
        setError("Session expired. Please log in again.");
        navigate("/login");
      } else {
        setError(msg);
      }
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setBusy(null);
      pendingQKey.current = null;
    }
  };

  async function onDelete(qKey: string, key: string) {
    if (!online) {
      setError("You’re offline. Try again when you’re back online.");
      return;
    }
    // optimistic UI
    setUploaded((prev: UploadedByQuestion) => ({
      ...prev,
      [qKey]: (prev[qKey] ?? []).filter((r) => r.key !== key),
    }));
    try {
      // Don't call server for temporary placeholders
      if (key.startsWith("tmp:")) return;
      await remove(key);
      signedCache.current.delete(key);
    } catch (e: unknown) {
      setError(errMsg(e, "Delete failed"));
    }
  }

  async function prepareForUpload(file: File) {
    try {
      return await compressInWorker(file, {
        maxDim: 1600,
        type: "image/jpeg",
        quality: 0.82,
      });
    } catch {
      return await downscaleImage(file, {
        maxDim: 1600,
        targetType: "image/jpeg",
        quality: 0.82,
      });
    }
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-1">Inspection Capture</h1>
      <p className="opacity-70 text-sm mb-4">
        ID: <span className="font-mono">{id}</span>
      </p>

      {/* Status / queue bar */}
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className={online ? "text-green-600" : "text-amber-600"}>
          {online ? "Online" : "Offline — photos will be queued"}
        </span>
        {queuedCount > 0 && (
          <Button
            variant="secondary"
            onClick={onSyncQueued}
            disabled={!!busy || !online}
            className="h-7 px-3"
          >
            Sync queued ({queuedCount})
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        name="photos"
        accept="image/*"
        multiple={!isIOS}
        capture="environment"
        className="hidden"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFiles(e.target.files)
        }
      />

      {error && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q) => {
          const list = uploaded[q.key] ?? [];
          const isThisBusy = busy === q.key;

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
                <Button
                  onClick={() => onPick(q.key)}
                  disabled={busy === "sync" || isThisBusy}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {isThisBusy ? "Uploading…" : "Take photos"}
                </Button>
              </div>

              <Separator className="my-3" />

              {list.length === 0 ? (
                <div className="text-sm opacity-60">No photos yet.</div>
              ) : (
                <ThumbnailGrid
                  items={list.map((r) => ({
                    key: r.key,
                    url: r.object_url!, // ensured during hydrate/upload
                    onDelete: () => onDelete(q.key, r.key), // item-scoped delete (optional)
                    onError:  () => refreshSigned(q.key, r.key), // ← re-sign on load error
                  }))}
                />
              )}

              <div className="mt-3 text-xs opacity-60">
                Tip: Tap “Take photos” again to add more
                {isIOS ? " (iOS opens camera one shot at a time)." : "."}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

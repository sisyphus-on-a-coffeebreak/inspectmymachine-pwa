// src/lib/queue-runner.ts
import { listQueued, removeQueued, notifyChange, type QueuedItem } from "./upload-queue";
import { withBackoff } from "@/lib/retry";

export type UploadResult = { key: string; object_url?: string };

export type QueueEvent =
  | { id: string; status: "start"; qKey?: string }
  | { id: string; status: "ok"; qKey: string; result: UploadResult }
  | { id: string; status: "fail"; qKey?: string; error?: unknown };

export type Uploader = {
  uploadImageWithProgress: (
    file: Blob,              // File is fine too (File extends Blob)
    prefix: string,
    onProgress?: (pct: number) => void
  ) => Promise<UploadResult>;
};

let inflight = false;

export async function flushQueue(
  uploader: Uploader,
  onItem?: (ev: QueueEvent) => void
): Promise<{ total: number; ok: number; fail: number }> {
  if (inflight) return { total: 0, ok: 0, fail: 0 };
  inflight = true;

  try {
    const items: QueuedItem[] = await listQueued();
    let ok = 0;
    let fail = 0;

    for (const it of items) {
      const { id, qKey, prefix } = it as unknown as { id: string; qKey?: string; prefix: string };

      if (!("file" in it) || !(it as any).file) {
        fail++;
        onItem?.({ id, status: "fail", qKey, error: new Error("Missing file in queue item") });
        continue;
      }

      const fileLike: Blob = (it as any).file; // File works because File extends Blob
      onItem?.({ id, status: "start", qKey });

      try {
        const result = await withBackoff(
          () => uploader.uploadImageWithProgress(fileLike, prefix),
          { tries: 3, baseMs: 400 }
        );

        await removeQueued(id);
        notifyChange(); // keep queued counter fresh

        ok++;
        onItem?.({ id, status: "ok", qKey: qKey!, result });
      } catch (error) {
        fail++;
        onItem?.({ id, status: "fail", qKey, error });
        // leave item for next retry on reconnect/refocus
      }
    }

    return { total: items.length, ok, fail };
  } finally {
    inflight = false;
  }
}

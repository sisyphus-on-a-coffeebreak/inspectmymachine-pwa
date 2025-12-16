// src/lib/upload-queue.ts
import { set, get, del, keys } from "./idb-safe";

export type QueuedItem = {
  id: string;
  file: Blob;             // or File; Blob is safer across reloads
  name: string;
  type: string;
  prefix: string;
  createdAt: number;
};

const BC_NAME = "voms-upload-queue";
const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(BC_NAME) : null;

const KEY_PREFIX = "uq:";
const id = () => crypto.randomUUID();

export async function enqueue(file: File | Blob, qKey: string, prefix: string) {
  const item: QueuedItem = {
    id: qKey || id(),
    file: file instanceof File ? new Blob([file], { type: file.type || "application/octet-stream" }) : file,
    name: (file as File).name ?? `image-${Date.now()}`,
    type: (file as File).type ?? "application/octet-stream",
    prefix,
    createdAt: Date.now(),
  };
  await set(KEY_PREFIX + item.id, item);
  notifyChange();
  return item.id;
}

export async function listQueued(): Promise<QueuedItem[]> {
  const ks = await keys();
  const relevant = ks.filter((k: unknown) => typeof k === "string" && (k as string).startsWith(KEY_PREFIX)) as string[];
  const items = await Promise.all(relevant.map(k => get(k)));
  return (items.filter(Boolean) as QueuedItem[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueued(qid: string) {
  await del(KEY_PREFIX + qid);
  notifyChange();
}

export function subscribeQueuedCount(cb: (count: number) => void) {
  let cancelled = false;

  async function emit() {
    if (cancelled) return;
    try {
      const count = (await listQueued()).length;
      cb(count);
    } catch (error) {
      // Silently handle IndexedDB errors - notify with 0 count
      cb(0);
    }
  }

  // initial tick
  emit();

  // cross-tab updates
  if (bc) {
    const handler = (e: MessageEvent) => {
      if (e?.data?.type === "uq:changed") emit();
    };
    bc.addEventListener("message", handler);
    return () => {
      cancelled = true;
      bc.removeEventListener("message", handler);
    };
  }

  // fallback: poll lightly if BC not available
  const t = setInterval(emit, 3000);
  return () => {
    cancelled = true;
    clearInterval(t);
  };
}

export function notifyChange() {
  if (bc) bc.postMessage({ type: "uq:changed", ts: Date.now() });
}

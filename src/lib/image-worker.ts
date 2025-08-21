// src/lib/image-worker.ts
let worker: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  if (worker) return worker;
  try {
    // adjust the path if your worker lives elsewhere
    worker = new Worker(new URL("../workers/imageWorker.ts", import.meta.url), { type: "module" });
  } catch {
    worker = null;
  }
  return worker;
}

type CompressOpts = { maxDim?: number; type?: string; quality?: number };

export function compressInWorker(
  file: File | Blob,
  opts?: CompressOpts
): Promise<Blob> {
  // Fallback when no Worker/OffscreenCanvas (SSR or older browsers)
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    return Promise.resolve(file instanceof Blob ? file : new Blob([file]));
  }

  const w = getWorker();
  if (!w) {
    return Promise.resolve(file instanceof Blob ? file : new Blob([file]));
  }

  return new Promise<Blob>((resolve, reject) => {
    const handle = (ev: MessageEvent) => {
      w.removeEventListener("message", handle);
      const { ok, blob, error } = ev.data || {};
      ok ? resolve(blob as Blob) : reject(new Error(error || "Compression failed"));
    };

    w.addEventListener("message", handle);
    try {
      w.postMessage({ blob: file, ...(opts || {}) });
    } catch (e) {
      w.removeEventListener("message", handle);
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

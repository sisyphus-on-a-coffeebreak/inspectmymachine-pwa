/// <reference lib="webworker" />
export {};

type CompressReq = {
  blob: Blob;
  maxDim?: number;
  type?: string;
  quality?: number;
};

type CompressRes =
  | { ok: true; blob: Blob }
  | { ok: false; error: string };

const ctx = self as DedicatedWorkerGlobalScope;

ctx.onmessage = async (e: MessageEvent<CompressReq>) => {
  const {
    blob,
    maxDim = 1600,
    type = "image/jpeg",
    quality = 0.82,
  } = e.data;

  try {
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const canvas = new OffscreenCanvas(w, h);
    const g = canvas.getContext("2d")!;
    g.drawImage(bmp, 0, 0, w, h);

    const out = await canvas.convertToBlob({ type, quality });

    // NOTE: Blob is not Transferable; just post it (structured clone).
    ctx.postMessage({ ok: true, blob: out } satisfies CompressRes);
  } catch (err) {
    ctx.postMessage({ ok: false, error: String(err) } satisfies CompressRes);
  }
};

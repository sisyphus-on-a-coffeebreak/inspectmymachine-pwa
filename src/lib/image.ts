// src/lib/image.ts
export type PrepareOptions = {
    /** Max width/height in pixels (longest side). Default 2000. */
    maxDim?: number;
    /** Output mime. Use "image/jpeg" for camera photos (best compatibility). */
    targetType?: "image/jpeg" | "image/webp";
    /** Quality 0..1 for lossy formats. Default 0.85. */
    quality?: number;
  };
  
  /** Best-effort downscale + convert. Returns the original file if no change needed. */
  export async function downscaleImage(file: File, opts: PrepareOptions = {}): Promise<File> {
    const maxDim = opts.maxDim ?? 2000;
    const targetType = opts.targetType ?? "image/jpeg";
    const quality = opts.quality ?? 0.85;
  
    // Only process known image types
    if (!file.type.startsWith("image/")) return file;
  
    // If tiny already and type matches, skip work
    if ((file.type === targetType || file.type === "image/png") && file.size < 512 * 1024) {
      return file;
    }
  
    const blob = file.slice(0, file.size, file.type);
  
    // Try createImageBitmap for auto-orientation; fall back to HTMLImageElement
    let bmp: ImageBitmap | null = null;
    try {
      // @ts-ignore - imageOrientation is widely supported where createImageBitmap exists
      bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch { /* ignore */ }
  
    let naturalW: number, naturalH: number, draw: (ctx: CanvasRenderingContext2D) => void;
  
    if (bmp) {
      naturalW = bmp.width; naturalH = bmp.height;
      draw = (ctx) => ctx.drawImage(bmp!, 0, 0, naturalW, naturalH);
    } else {
      const url = URL.createObjectURL(blob);
      try {
        const img = await loadImage(url);
        naturalW = img.naturalWidth || img.width;
        naturalH = img.naturalHeight || img.height;
        draw = (ctx) => ctx.drawImage(img, 0, 0, naturalW, naturalH);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  
    // Compute target size
    const longest = Math.max(naturalW, naturalH);
    const scale = longest > maxDim ? maxDim / longest : 1;
    const outW = Math.max(1, Math.round(naturalW * scale));
    const outH = Math.max(1, Math.round(naturalH * scale));
  
    // If no resize and keeping same (or PNG small), return original
    if (scale === 1 && (file.type === targetType || (file.type === "image/png" && file.size < 2 * 1024 * 1024))) {
      if (bmp) bmp.close?.();
      return file;
    }
  
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d", { alpha: targetType !== "image/jpeg" })!;
    // Slightly better resizing quality where supported
    // @ts-ignore
    ctx.imageSmoothingQuality = "high";
    draw(ctx);
    if (bmp) bmp.close?.();
  
    const outBlob = await canvasToBlob(canvas, targetType, quality);
    const newName = renameWithExt(file.name, targetType);
    return new File([outBlob], newName, { type: outBlob.type, lastModified: Date.now() });
  }
  
  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  
  function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality);
    });
  }
  
  function renameWithExt(name: string, mime: string): string {
    const ext = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
    return name.replace(/\.[a-z0-9]+$/i, "") + "." + ext;
  }
  
// src/lib/upload.ts
import { useAuth } from "@/providers/AuthProvider";

function join(apiBase: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBase) return path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export type UploadResult = {
  key: string;
  size?: number;
  mime?: string;
  etag?: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function useUploader() {
  const { fetchJson, token, apiBase } = useAuth();

  function requireApiBase(): string {
    const base = (apiBase || "").trim().replace(/\/+$/g, "");
    if (!base) throw new Error("API base not configured. Set localStorage['voms.apiBase'] or VITE_API_BASE.");
    return base;
  }

  async function uploadImage(file: File, prefix?: string): Promise<UploadResult> {
    const fd = new FormData();
    fd.append("file", file, file.name || "photo");
    const clean = (prefix ?? "").replace(/^\/+/, "");
    if (clean) fd.append("prefix", clean);
    return await fetchJson("/api/v1/files/upload", { method: "POST", body: fd });
  }

  function uploadImageWithProgress(
    file: File,
    prefix?: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      let base: string;
      try {
        base = requireApiBase();
      } catch (e) {
        reject(e);
        return;
      }

      const url = join(base, "/api/v1/files/upload");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Accept", "application/json");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        let data: unknown = null;

        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // ignore parse error; backend should return JSON
        }

        const getMsg = (u: unknown): string | undefined => {
          if (isRecord(u)) {
            const m = (u as Record<string, unknown>).message;
            if (typeof m === "string") return m;
            const e = (u as Record<string, unknown>).error;
            if (typeof e === "string") return e;
          }
          return undefined;
        };

        if (!ok) {
          const msg =
            getMsg(data) ??
            (xhr.status === 401 ? "Unauthorized (401)" : `Upload failed: ${xhr.status}`);
          reject(new Error(msg));
          return;
        }

        // Best-effort typing to UploadResult
        const payload = isRecord(data) ? (data as Partial<UploadResult>) : {};
        resolve({
          key: String(payload.key ?? ""),
          size: payload.size,
          mime: payload.mime,
          etag: payload.etag,
        });
      };


      const fd = new FormData();
      fd.append("file", file, file.name || "photo");
      const clean = (prefix ?? "").replace(/^\/+/, "");
      if (clean) fd.append("prefix", clean);

      xhr.send(fd);
    });
  }

  async function listFiles(prefix: string, recursive = true) {
    const clean = (prefix ?? "").replace(/^\/+/, "");
    const qs = new URLSearchParams({ prefix: clean, recursive: recursive ? "1" : "0" });
    return await fetchJson(`/api/v1/files?${qs.toString()}`);
  }

  async function exists(key: string) {
    return await fetchJson(`/api/v1/files/exists?key=${encodeURIComponent(key)}`);
  }

  async function remove(key: string) {
    return await fetchJson("/api/v1/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  }

  return { uploadImage, uploadImageWithProgress, exists, listFiles, remove };
}

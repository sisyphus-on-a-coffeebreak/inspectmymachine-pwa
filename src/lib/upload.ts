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
    // Uses fetchJson so base + auth are consistent with the rest of the app
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

      const url = join(base, "/api/v1/files/upload"); // ← absolute API base guaranteed
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
        let data: any = null;

        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // fall through if non-JSON; backend should return JSON
        }

        if (!ok) {
          const msg =
            (data && (data.message || data.error)) ||
            (xhr.status === 401 ? "Unauthorized (401)" : `Upload failed: ${xhr.status}`);
          reject(new Error(msg));
          return;
        }

        // Best effort typing
        resolve((data as UploadResult) ?? ({ key: "" } as UploadResult));
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

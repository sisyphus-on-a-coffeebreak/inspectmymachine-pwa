// src/lib/upload.ts
import { useAuth } from "@/providers/useAuth";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

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

interface UploadError {
  message?: string;
  error?: string;
}

export function useUploader() {
  const { fetchJson } = useAuth();

  function requireApiBase(): string {
    const base = API_BASE.trim().replace(/\/+$/g, "");
    if (!base) throw new Error("API base not configured. Set VITE_API_BASE in .env");
    return base;
  }

  async function uploadImage(file: File, prefix?: string): Promise<UploadResult> {
    const fd = new FormData();
    fd.append("file", file, file.name || "photo");
    const clean = (prefix ?? "").replace(/^\/+/, "");
    if (clean) fd.append("prefix", clean);
    
    // Uses fetchJson so cookies are automatically included
    return await fetchJson<UploadResult>("/api/v1/files/upload", { 
      method: "POST", 
      body: fd 
    });
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
      
      // Cookie-based auth - credentials are sent automatically
      xhr.withCredentials = true;

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
          // fall through if non-JSON; backend should return JSON
        }

        if (!ok) {
          const errorData = data as UploadError;
          const msg =
            (errorData && (errorData.message || errorData.error)) ||
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
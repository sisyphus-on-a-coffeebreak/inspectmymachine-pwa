// src/lib/upload.ts
import { useAuth } from "@/providers/useAuth";
import { ensureCsrfToken } from "./csrf";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

function join(apiBase: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBase) return path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Helper to get CSRF token from cookie
function getCsrfToken(): string | null {
  const cookies = document.cookie;
  const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
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
    return await fetchJson<UploadResult>("/v1/files/upload", { 
      method: "POST", 
      body: fd 
    });
  }

  function uploadImageWithProgress(
    file: File,
    prefix?: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult> {
    return new Promise(async (resolve, reject) => {
      let base: string;
      try {
        base = requireApiBase();
      } catch (e) {
        reject(e);
        return;
      }

      // Ensure CSRF token is available
      try {
        await ensureCsrfToken();
      } catch (csrfError) {
        // If CSRF fails, try to continue anyway (backend might have it excluded)
        console.warn('CSRF token initialization failed, continuing anyway:', csrfError);
      }

      const url = join(base, "/v1/files/upload");
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Accept", "application/json");
      
      // Add CSRF token if available
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        xhr.setRequestHeader("X-XSRF-TOKEN", csrfToken);
      }
      
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
          let msg: string;
          
          if (xhr.status === 419) {
            msg = "Session expired. Please refresh the page and try again.";
          } else if (xhr.status === 401) {
            msg = "Unauthorized. Please log in again.";
          } else if (errorData && (errorData.message || errorData.error)) {
            msg = errorData.message || errorData.error || `Upload failed: ${xhr.status}`;
          } else {
            msg = `Upload failed: ${xhr.status}`;
          }
          
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
    return await fetchJson(`/v1/files?${qs.toString()}`);
  }

  async function exists(key: string) {
    return await fetchJson(`/v1/files/exists?key=${encodeURIComponent(key)}`);
  }

  async function remove(key: string) {
    return await fetchJson("/v1/files", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  }

  return { uploadImage, uploadImageWithProgress, exists, listFiles, remove };
}
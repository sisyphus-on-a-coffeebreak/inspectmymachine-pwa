// src/lib/upload.ts
import { useAuth } from "@/providers/AuthProvider";

// Read a fresh PAT every call (avoid stale closures)
const getLiveToken = () => {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem("voms.pat") : null;
    } catch {
      return null;
    }
  };

export type UploadResult = {
  key: string;
  object_url?: string;
  content_type?: string;
  size?: number;
};

export type FileItem = { key: string; object_url?: string };

export type ListFilesResult = {
  prefix: string;
  recursive: boolean;
  count: number;
  items: FileItem[];
};

// Always return a string; strip leading slashes.
function normalizePrefix(prefix?: string): string {
  return (prefix ?? "").replace(/^\/+/, "");
}

export function useUploader() {
  const { fetchJson, token } = useAuth();

  async function uploadImage(file: File, prefix?: string): Promise<UploadResult> {
    const fd = new FormData();
    fd.append("file", file, file.name || "photo");
    const clean = normalizePrefix(prefix);
    if (clean) fd.append("prefix", clean);
    const live = getLiveToken();
    const res = await fetch("/api/v1/files/upload", {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(live ? { Authorization: `Bearer ${live}` } : {}),
    },
    body: fd,
    credentials: "omit",
    });
    if (res.status === 401) throw new Error("unauthorized");
    if (!res.ok) throw new Error(`upload failed: ${res.status}`);
    return (await res.json()) as UploadResult;
  }

  // Progress uploader via XHR
  function uploadImageWithProgress(
    file: File,
    prefix?: string,
    onProgress?: (pct: number) => void
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/v1/files/upload");
      xhr.setRequestHeader("Accept", "application/json");
      const live = getLiveToken() ?? token ?? null;
        if (!live) return reject(new Error("unauthorized"));
        xhr.setRequestHeader("Authorization", `Bearer ${live}`);
        xhr.timeout = 90_000;
        xhr.ontimeout = () => reject(new Error("Upload timeout"));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(Math.min(99, pct)); // keep <100 until server ack
          }
      };
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          ok ? resolve(data as UploadResult) : reject(new Error(data?.message || `Upload failed: ${xhr.status}`));
        } catch {
          ok ? resolve({ key: "" } as UploadResult) : reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      const fd = new FormData();
      fd.append("file", file, file.name || "photo");
      const clean = normalizePrefix(prefix);
      if (clean) fd.append("prefix", clean);
      xhr.send(fd);
    });
  }

  async function exists(key: string): Promise<{ key: string; exists: boolean }> {
    return await fetchJson<{ key: string; exists: boolean }>(
      `/api/v1/files/exists?key=${encodeURIComponent(key)}`
    );
  }

  async function listFiles(prefix: string, recursive = true): Promise<ListFilesResult> {
    const clean = normalizePrefix(prefix);
    const qs = new URLSearchParams({ prefix: clean, recursive: recursive ? "1" : "0" });
    const raw = await fetchJson<any>(`/api/v1/files?${qs.toString()}`);

    // Normalize to ListFilesResult shape (support old {files: string[]} too)
    const items: FileItem[] = Array.isArray(raw.items)
      ? raw.items.map((it: any) => ({ key: String(it.key), object_url: it.object_url }))
      : Array.isArray(raw.files)
      ? raw.files.map((k: any) => ({ key: String(k) }))
      : [];

    const out: ListFilesResult = {
      prefix: typeof raw.prefix === "string" ? raw.prefix : clean,
      recursive: raw.recursive == null ? recursive : !!raw.recursive,
      count: typeof raw.count === "number" ? raw.count : items.length,
      items,
    };
    return out;
  }

  async function remove(key: string): Promise<{ key: string; exists_before?: boolean; deleted: boolean }> {
    return await fetchJson<{ key: string; exists_before?: boolean; deleted: boolean }>(
      "/api/v1/files",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }
    );
  }

  return { uploadImage, uploadImageWithProgress, exists, listFiles, remove };
}

// Raw helpers for tests (kept in sync)
export function makeUploader(
  fetchJson: <T = unknown>(i: RequestInfo | URL, init?: RequestInit) => Promise<T>,
  token?: string
) {
  return {
    uploadImage: (file: File, prefix?: string) => {
      const fd = new FormData();
      fd.append("file", file, file.name || "photo");
      const clean = normalizePrefix(prefix);
      if (clean) fd.append("prefix", clean);
      return fetchJson<UploadResult>("/api/v1/files/upload", { method: "POST", body: fd });
    },
    uploadImageWithProgress: (file: File, prefix?: string, onProgress?: (pct: number) => void) =>
      new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/files/upload");
        xhr.setRequestHeader("Accept", "application/json");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.onload = () => {
          const ok = xhr.status >= 200 && xhr.status < 300;
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            ok ? resolve(data as UploadResult) : reject(new Error(data?.message || `Upload failed: ${xhr.status}`));
          } catch {
            ok ? resolve({ key: "" } as UploadResult) : reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        const fd = new FormData();
        fd.append("file", file, file.name || "photo");
        const clean = normalizePrefix(prefix);
        if (clean) fd.append("prefix", clean);
        xhr.send(fd);
      }),
    exists: (key: string) =>
      fetchJson<{ key: string; exists: boolean }>(`/api/v1/files/exists?key=${encodeURIComponent(key)}`),
    listFiles: async (prefix: string, recursive = true) => {
      const clean = normalizePrefix(prefix);
      const qs = new URLSearchParams({ prefix: clean, recursive: recursive ? "1" : "0" });
      const raw = await fetchJson<any>(`/api/v1/files?${qs.toString()}`);
      const items: FileItem[] = Array.isArray(raw.items)
        ? raw.items.map((it: any) => ({ key: String(it.key), object_url: it.object_url }))
        : Array.isArray(raw.files)
        ? raw.files.map((k: any) => ({ key: String(k) }))
        : [];
      return {
        prefix: typeof raw.prefix === "string" ? raw.prefix : clean,
        recursive: raw.recursive == null ? recursive : !!raw.recursive,
        count: typeof raw.count === "number" ? raw.count : items.length,
        items,
      } as ListFilesResult;
    },
    remove: (key: string) =>
      fetchJson<{ key: string; exists_before?: boolean; deleted: boolean }>("/api/v1/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }),
  };
}

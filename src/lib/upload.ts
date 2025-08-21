// src/lib/upload.ts
import { useAuth } from "@/providers/AuthProvider";

function join(apiBase: string, path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!apiBase) return path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function useUploader() {
  const { fetchJson, token, apiBase } = useAuth();

  async function uploadImage(file: File, prefix?: string) {
    const fd = new FormData();
    fd.append("file", file, file.name || "photo");
    const clean = (prefix ?? "").replace(/^\/+/, "");
    if (clean) fd.append("prefix", clean);
    // use fetchJson so base + auth is consistent:
    return await fetchJson("/api/v1/files/upload", { method: "POST", body: fd });
  }

  function uploadImageWithProgress(
    file: File,
    prefix?: string,
    onProgress?: (pct: number) => void
  ) {
    return new Promise((resolve, reject) => {
      const url = join(apiBase, "/api/v1/files/upload");      // ← absolute
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
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
          ok ? resolve(data) : reject(new Error(data?.message || `Upload failed: ${xhr.status}`));
        } catch {
          ok ? resolve({ key: "" } as any) : reject(new Error(`Upload failed: ${xhr.status}`));
        }
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

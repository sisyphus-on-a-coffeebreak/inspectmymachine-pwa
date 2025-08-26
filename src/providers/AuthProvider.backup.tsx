// src/providers/AuthProvider.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

type FetchJson = <T = unknown>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;

type AuthCtx = {
  token: string | null;
  setToken: (t: string | null) => void;
  fetchJson: FetchJson;
  logout: () => void;
  apiBase: string;               // ← expose for upload.ts (XHR)
};

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "voms.pat";

// Build API base:
// 1) runtime override (localStorage: voms.apiBase)
// 2) build-time env (VITE_API_BASE)
// 3) fallback to same-origin (good for dev with Vite proxy)
function resolveApiBase(): string {
  const ls = (typeof localStorage !== "undefined" && localStorage.getItem("voms.apiBase")) || "";
  const env = (import.meta as any)?.env?.VITE_API_BASE || "";
  const base = (ls || env || "").toString().trim();
  if (!base) return ""; // same-origin fallback
  return base.replace(/\/+$/, ""); // strip trailing slashes
}

// Turn path or absolute URL into absolute URL using apiBase
function makeUrl(apiBase: string, input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input !== "string") return input;
  if (/^https?:\/\//i.test(input)) return input;  // already absolute
  if (!apiBase) {
    // same-origin
    return input.startsWith("/") ? input : `/${input}`;
  }
  return `${apiBase}${input.startsWith("/") ? "" : "/"}${input}`;
}

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const [token, _setToken] = useState<string | null>(() => (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null));
  const [apiBase] = useState<string>(() => resolveApiBase());

  const logout = useCallback(() => {
    _setToken(null);
    if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
    // (optional) also clear API base override on logout:
    // localStorage.removeItem('voms.apiBase');
    navigate("/login", { replace: true });
  }, [navigate]);

  const setToken = useCallback((t: string | null) => {
    _setToken(t);
    if (typeof localStorage !== "undefined") {
      if (t) localStorage.setItem(STORAGE_KEY, t);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const fetchJson = useCallback<FetchJson>(async (input, init = {}) => {
    const url = makeUrl(apiBase, input);

    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // 30s timeout guard
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);

    let res: Response;
    try {
      res = await fetch(url, { ...init, headers, credentials: "omit", signal: ac.signal });
    } catch (err: any) {
      clearTimeout(timer);
      const msg = err?.name === "AbortError" ? "Request timed out. Check your network." : "Network error. Please retry.";
      throw new Error(msg);
    }
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const text = await res.text();
    const asJson = isJson && text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

    if (res.status === 401) {
      console.warn("401 from API, logging out");
      logout();
      throw new Error(asJson?.message || "Unauthorized. Please log in again.");
    }

    if (!res.ok) {
      if (res.status === 413) throw new Error(asJson?.message || "File too large.");
      if (res.status === 422) {
        const vmsg = asJson?.message ?? (asJson?.errors ? JSON.stringify(asJson.errors) : "Validation failed.");
        throw new Error(vmsg);
      }
      throw new Error(asJson?.message || `Request failed: ${res.status}`);
    }

    if (!text) return {} as any;
    return (asJson ?? (text as any)) as any;
  }, [apiBase, token, logout]);

  const value = useMemo(() => ({ token, setToken, fetchJson, logout, apiBase }), [token, setToken, fetchJson, logout, apiBase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

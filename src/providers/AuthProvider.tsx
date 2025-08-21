import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

type FetchJson = <T = unknown>(input: RequestInfo | URL, init?: RequestInit) => Promise<T>;

type AuthCtx = {
  token: string | null;
  setToken: (t: string | null) => void;
  fetchJson: FetchJson;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "voms.pat";

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const [token, _setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const logout = useCallback(() => {
    _setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login", { replace: true });
  }, [navigate]);

  const setToken = useCallback((t: string | null) => {
    _setToken(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ←—— THIS is the fetchJson you’ll use everywhere (upload.ts, etc.)
  const fetchJson = useCallback<FetchJson>(async (input, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    // 30s timeout guard
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 30_000);

    let res: Response;
    try {
      res = await fetch(input, { ...init, headers, credentials: "omit", signal: ac.signal });
    } catch (err: any) {
      const msg = err?.name === "AbortError" ? "Request timed out. Check your network." : "Network error. Please retry.";
      throw new Error(msg);
    } finally {
      clearTimeout(t);
    }

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
  }, [token, logout]);

  const value = useMemo(() => ({ token, setToken, fetchJson, logout }), [token, setToken, fetchJson, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

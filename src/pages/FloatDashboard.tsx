// src/pages/FloatDashboard.tsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/useAuth";
import { Button } from "@/components/ui/button";

type Who = { ok: boolean; user?: { id: number; name: string; email: string }; can?: { manage_floats?: boolean } };
type Txn = { id?: number; ts?: string; amount: number; kind?: string; note?: string };
type Statement = {
  user_id: number;
  cap: number;
  carry_forward?: number;
  outstanding?: number;
  remaining?: number;
  transactions: Txn[];
  range?: { from?: string; to?: string };
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function FloatDashboard() {
  const { fetchJson, logout } = useAuth();
  const [who, setWho] = useState<Who | null>(null);
  const [stmt, setStmt] = useState<Statement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await fetchJson<Who>("/v1/whoami");
      setWho(w);
      const s = await fetchJson<Statement>("/v1/float/statement?mine=1");
      setStmt(s);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load float data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    load();
  }, [load]);

  // Basic HTML-guard (in case wrong host ever returns the SPA again)
  const looksLikeHtml = (x: unknown) =>
    typeof x === "string" && /^\s*<!doctype html/i.test(x);

  const balance = stmt?.remaining ?? null;
  const outstanding = stmt?.outstanding ?? 0;
  const cap = stmt?.cap ?? null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Float</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="ghost" onClick={logout} className="border">
            Logout
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {who?.user ? (
        <div className="text-sm text-muted-foreground">
          Signed in <span className="mx-1">•</span>
          <span className="font-medium">{who.user.name}</span>{" "}
          <span className="opacity-70">&lt;{who.user.email}&gt;</span>
        </div>
      ) : (
        <div className="text-sm">Not signed in.</div>
      )}

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-xs uppercase tracking-wide opacity-70">Balance</div>
        <div className="text-3xl font-semibold">
          {balance == null ? "—" : inr.format(balance)}
        </div>
        <div className="text-sm opacity-70">
          {cap != null ? <>Cap {inr.format(cap)}</> : null}
          {cap != null && outstanding != null ? (
            <> · Outstanding {inr.format(outstanding)}</>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Recent transactions</div>
        </div>
        {stmt?.transactions?.length ? (
          <ul className="divide-y">
            {stmt.transactions.map((t, idx) => (
              <li key={t.id ?? idx} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">
                    {t.kind || "txn"} {t.note ? `• ${t.note}` : ""}
                  </div>
                  <div className="text-xs opacity-70">
                    {t.ts ? new Date(t.ts).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="text-sm font-medium">{inr.format(t.amount)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm opacity-60">No transactions.</div>
        )}
      </div>

      {/* Debug panel — collapse or remove later */}
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-medium">Debug payloads</summary>
        <pre className="text-xs mt-3 overflow-auto">
{JSON.stringify(
  {
    who: looksLikeHtml(who) ? "(HTML)" : who,
    stmt: looksLikeHtml(stmt) ? "(HTML)" : stmt,
  },
  null,
  2
)}
        </pre>
      </details>
    </div>
  );
}
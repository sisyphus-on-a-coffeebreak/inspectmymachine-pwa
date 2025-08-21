// src/pages/FloatDashboard.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

type AnyObj = Record<string, any>;

export default function FloatDashboard() {
  const { fetchJson } = useAuth();
  const [who, setWho] = useState<AnyObj | null>(null);
  const [stmt, setStmt] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const w = await fetchJson("/api/v1/whoami");
      setWho(w as AnyObj);

      // statement for the logged-in user
      const s = await fetchJson("/api/v1/float/statement?mine=1");
      setStmt(s as AnyObj);
    } catch (e: any) {
      setError(e?.message || "Failed to load float info");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const balance =
    (stmt?.balance ?? stmt?.account?.balance ?? null) as number | null;

  const txns = ((stmt?.transactions ?? stmt?.txns) || []) as AnyObj[];

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Float</h1>
        <Button onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}

      {loading && !who && (
        <div className="opacity-70 text-sm">Loading…</div>
      )}

      {who && (
        <div className="mb-4 text-sm">
          <div className="font-medium">Signed in</div>
          <div className="opacity-70">
            {who?.user?.name} &lt;{who?.user?.email}&gt;
          </div>
        </div>
      )}

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Balance</div>
          <div className="text-lg font-semibold">
            {balance !== null ? `₹${balance.toLocaleString("en-IN")}` : "—"}
          </div>
        </div>

        <div className="mt-4">
          <div className="font-medium mb-2">Recent transactions</div>
          {Array.isArray(txns) && txns.length > 0 ? (
            <ul className="space-y-2">
              {txns.slice(0, 10).map((t, i) => (
                <li key={t.id ?? i} className="text-sm flex justify-between">
                  <span className="opacity-80">
                    {(t.type ?? t.kind ?? "").toString() || "txn"} —{" "}
                    {(t.note ?? t.description ?? "").toString()}
                  </span>
                  <span className="font-medium">
                    {t.amount != null ? `₹${Number(t.amount).toLocaleString("en-IN")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm opacity-60">No transactions.</div>
          )}
        </div>
      </div>

      {/* Raw JSON fallback for quick backend shape inspection */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium">Debug payloads</summary>
        <pre className="mt-2 text-xs overflow-auto rounded bg-muted p-3">
{JSON.stringify({ who, stmt }, null, 2)}
        </pre>
      </details>
    </div>
  );
}

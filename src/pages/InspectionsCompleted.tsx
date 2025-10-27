// src/pages/InspectionsCompleted.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { useAuth } from "@/providers/useAuth";

type Row = {
  id: string;
  date: string;
  vehicle: string;
  reg: string;
  inspector: string;
  location: string;
  rating: number;
};

type Meta = { current_page: number; last_page: number; total: number };
type Resp = { data: Row[]; meta?: Meta };

export default function InspectionsCompleted() {
  const { fetchJson } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const qs = useMemo(
    () => new URLSearchParams({ page: String(page) }).toString(),
    [page]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(undefined);
      try {
        const json = await fetchJson<Resp>(`/metrics/inspections/completed?${qs}`);
        setRows(json.data ?? []);
        setMeta(json.meta);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
        setRows([]);
        setMeta(undefined);
      } finally {
        setLoading(false);
      }
    })();
  }, [qs, fetchJson]);

  const canPrev = (meta?.current_page ?? page) > 1;
  const canNext = meta ? meta.current_page < meta.last_page : true;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Completed Inspections</h1>
        <div className="text-xs opacity-70">
          {meta ? (
            <>Page {meta.current_page} of {meta.last_page} • {meta.total} total</>
          ) : (
            <>Page {page}</>
          )}
        </div>
      </div>

      {err && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
          Error: {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border dark:border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th>Date</th>
              <th>Vehicle</th>
              <th>Reg</th>
              <th>Inspector</th>
              <th>Location</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
            {rows.map((r) => (
              <tr key={r.id} className="border-t dark:border-zinc-800">
                <td>{r.date}</td>
                <td>
                  <Link
                    className="text-blue-600 hover:underline"
                    to={`/inspections/${r.id}`}
                  >
                    {r.vehicle || "-"}
                  </Link>
                </td>
                <td>{r.reg}</td>
                <td>{r.inspector}</td>
                <td>{r.location}</td>
                <td>{r.rating}</td>
              </tr>
            ))}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center opacity-60">
                  No data
                </td>
              </tr>
            )}

            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center opacity-60">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          className="px-3 py-1.5 rounded border dark:border-zinc-800 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev || loading}
        >
          ← Previous
        </button>
        <button
          className="px-3 py-1.5 rounded border dark:border-zinc-800 disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
          disabled={!canNext || loading}
        >
          Next →
        </button>
      </div>
    </AppShell>
  );
}
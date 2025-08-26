import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/layouts/AppShell";
import { useAuth } from "@/providers/AuthProvider";
import { apiFetch } from "@/lib/api";

type Row = {
  id: string;
  date: string;
  vehicle: string;
  reg: string;
  inspector: string;
  location: string;
  rating: number;
};

type Resp = {
  data: Row[];
  meta?: { current_page: number; last_page: number; total: number };
};

export default function InspectionsCompleted() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  void setPage; // silence unused until pagination is wired
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const qs = useMemo(
    () => new URLSearchParams({ page: String(page) }).toString(),
    [page]
  );

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setErr(undefined);
      try {
        const res = await apiFetch(`/metrics/inspections/completed?${qs}`, {}, token);
        if (!res.ok) {
          setErr(`Request failed: ${res.status}`);
          setRows([]);
          return;
        }
        const json: Resp = await res.json();
        setRows(json.data ?? []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [qs, token]);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">Completed Inspections</h1>
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

                {/* Vehicle cell with Link to details page */}
                <td>
                  <Link className="text-blue-600 hover:underline" to={`/inspections/${r.id}`}>
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
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

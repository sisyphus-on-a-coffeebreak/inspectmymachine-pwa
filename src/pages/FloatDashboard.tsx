import { useEffect, useState } from "react";
import AppShell from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/AuthProvider";

type Who = { ok: boolean; user: { id: number; name: string; email: string }; can?: { manage_floats?: boolean } };
type Statement = {
  user_id: number; cap: number; carry_forward: number;
  week_start: string; week_topup: number; week_expense: number;
  outstanding: number; remaining: number;
  transactions: { id:number; type:string; amount:number; memo?:string; ts:string }[];
};

export default function FloatDashboard() {
  const { fetchJson } = useAuth();
  const [who, setWho] = useState<Who | null>(null);
  const [stmt, setStmt] = useState<Statement | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    (async () => {
      const w = await fetchJson("/api/v1/whoami");
      setWho(w);
      const s = await fetchJson("/api/v1/float/statement?mine=1");
      setStmt(s);
    })();
  }, [fetchJson]);

  async function onTopup(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    await fetchJson("/api/v1/float/topup", {
      method: "POST",
      body: JSON.stringify({ user_id: who!.user.id, amount: parseInt(amount, 10), memo: "manual top-up" }),
    });
    setStmt(await fetchJson("/api/v1/float/statement?mine=1"));
    setAmount("");
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">Float</h1>
      {!stmt ? <div>Loading…</div> : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border p-4"><div className="text-sm opacity-60 mb-1">Cap</div><div className="text-2xl font-semibold">₹{stmt.cap.toLocaleString()}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm opacity-60 mb-1">Outstanding</div><div className="text-2xl font-semibold">₹{stmt.outstanding.toLocaleString()}</div><div className="text-xs opacity-60 mt-1">Since {new Date(stmt.week_start).toLocaleDateString()}</div></div>
          <div className="rounded-xl border p-4"><div className="text-sm opacity-60 mb-1">Remaining</div><div className="text-2xl font-semibold">₹{stmt.remaining.toLocaleString()}</div></div>
          <div className="rounded-xl border p-4 md:col-span-3">
            <div className="flex items-center gap-6">
              <div><div className="text-sm opacity-60">Top-ups (week)</div><div className="text-xl font-semibold">₹{stmt.week_topup.toLocaleString()}</div></div>
              <div><div className="text-sm opacity-60">Expenses (week)</div><div className="text-xl font-semibold">₹{stmt.week_expense.toLocaleString()}</div></div>
              {who?.can?.manage_floats && (
                <form onSubmit={onTopup} className="ml-auto flex items-end gap-2">
                  <div><div className="text-sm opacity-60 mb-1">Admin Top-up</div>
                    <Input inputMode="numeric" value={amount} onChange={(e)=>setAmount(e.target.value.replace(/\D/g,''))} placeholder="₹ amount" />
                  </div>
                  <Button type="submit" disabled={!amount}>Top-up</Button>
                </form>
              )}
            </div>
            <hr className="my-4" />
            <div className="text-sm font-medium mb-2">Recent activity</div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40"><tr><th className="text-left p-2">When</th><th className="text-left p-2">Type</th><th className="text-right p-2">Amount</th><th className="text-left p-2">Memo</th></tr></thead>
                <tbody>
                  {stmt.transactions.slice().reverse().slice(0, 20).map(t=>(
                    <tr key={t.id} className="border-t">
                      <td className="p-2">{new Date(t.ts).toLocaleString()}</td>
                      <td className="p-2">{t.type}</td>
                      <td className="p-2 text-right">₹{t.amount.toLocaleString()}</td>
                      <td className="p-2">{t.memo}</td>
                    </tr>
                  ))}
                  {stmt.transactions.length===0 && <tr><td className="p-3 text-center opacity-60" colSpan={4}>No transactions in range.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

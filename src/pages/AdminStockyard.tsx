import { useState } from "react"
import AppShell from "@/layouts/AppShell"
import { useAuth } from "@/providers/AuthProvider"
import { approveStockyardRequest } from "@/lib/stockyard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function toIsoFromLocal(local: string | undefined) {
  if (!local) return undefined
  // local like "2025-08-09T18:45" → ISO with local TZ
  const d = new Date(local)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export default function AdminStockyard() {
  const { token } = useAuth()
  const [id, setId] = useState("")
  const [from, setFrom] = useState("") // datetime-local
  const [to, setTo] = useState("")     // datetime-local
  const [busy, setBusy] = useState(false)
  const [out, setOut] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onApprove() {
    if (!token) return
    if (!id.trim()) { setErr("Enter a request ID"); return }
    setBusy(true); setErr(null); setOut(null)
    try {
      const payload = {
        valid_from: toIsoFromLocal(from),
        valid_to: toIsoFromLocal(to),
      }
      const json = await approveStockyardRequest(id.trim(), token, payload)
      setOut(json)
    } catch (e:any) {
      setErr(e.message || "Approval failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Approve Stockyard Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="req">Request ID</Label>
              <Input id="req" placeholder="paste StockyardRequest UUID" value={id} onChange={(e)=>setId(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="from">Valid From</Label>
              <Input id="from" type="datetime-local" value={from} onChange={(e)=>setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="to">Valid To</Label>
              <Input id="to" type="datetime-local" value={to} onChange={(e)=>setTo(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onApprove} disabled={busy || !id.trim()}>{busy ? "Approving…" : "Approve"}</Button>
            <Button variant="secondary" onClick={()=>{setId(""); setFrom(""); setTo(""); setErr(null); setOut(null)}}>Clear</Button>
          </div>

          {err && <div className="text-sm text-red-600 dark:text-red-400">{err}</div>}
          {out && (
            <>
              <Separator />
              <pre className="text-xs overflow-auto p-3 rounded-md bg-zinc-50 dark:bg-zinc-900">{JSON.stringify(out,null,2)}</pre>
            </>
          )}
        </CardContent>
      </Card>
      <p className="mt-3 text-xs opacity-70">
        Tip: You can grab a known request ID via <code>php artisan tinker</code> and querying <code>StockyardRequest::first()</code>.
      </p>
    </AppShell>
  )
}

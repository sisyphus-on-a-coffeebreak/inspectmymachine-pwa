import { useState } from "react";
import AppShell from "@/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploader, type UploadResult } from "@/lib/upload";
import { useAuth } from "@/providers/useAuth";

type ExpenseDecisionResponse = {
  decision?: { status?: string };
};

const CATS = [
  "LOCAL_TRANSPORT","INTERCITY_TRAVEL","LODGING","FOOD","TOLLS_PARKING","FUEL",
  "PARTS_REPAIR","RTO_COMPLIANCE","DRIVER_PAYMENT","RECHARGE","CONSUMABLES_MISC",
  "VENDOR_AGENT_FEE","MISC"
];

export default function ExpenseForm() {
  const { fetchJson } = useAuth();
  const { uploadImageWithProgress } = useUploader();
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("LOCAL_TRANSPORT");
  const [payment, setPayment] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [receiptKey, setReceiptKey] = useState<string | undefined>();
  const [status, setStatus] = useState<string>("");

  async function getGPS() {
    return new Promise<{lat?:number;lng?:number}>((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({})
      );
    });
  }

  async function onPickReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const out: UploadResult = await uploadImageWithProgress(f, "receipts");
    setReceiptKey(out.key);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const gps = await getGPS();
    const payload = {
      amount: parseInt(amount, 10),
      category, payment_method: payment,
      notes, receipt_key: receiptKey,
      gps_lat: gps.lat, gps_lng: gps.lng,
      ts: new Date().toISOString(),
    };
    const res = await fetchJson<ExpenseDecisionResponse>(
      "/api/v1/expenses/...", 
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    
    setStatus(res.decision?.status ?? "OK");
    setAmount(""); setNotes("");
  }

  return (
    <AppShell>
      <h1 className="text-xl font-semibold mb-4">New Expense</h1>
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <Label>Category</Label>
          <select className="mt-1 w-full border rounded p-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <Label>Amount (₹)</Label>
          <Input value={amount} onChange={(e)=>setAmount(e.target.value.replace(/\D/g,''))} required />
        </div>
        <div>
          <Label>Payment Method</Label>
          <select className="mt-1 w-full border rounded p-2" value={payment} onChange={(e)=>setPayment(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="COMPANY_UPI">Company UPI</option>
            <option value="PERSONAL_UPI">Personal UPI</option>
          </select>
        </div>
        <div>
          <Label>Receipt</Label>
          <input type="file" accept="image/*" onChange={onPickReceipt} />
          {receiptKey && <p className="text-xs mt-1 opacity-70">Attached: {receiptKey}</p>}
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </div>
        <Button type="submit">Submit</Button>
        {status && <p className="text-sm mt-2">Decision: <b>{status}</b></p>}
      </form>
    </AppShell>
  );
}

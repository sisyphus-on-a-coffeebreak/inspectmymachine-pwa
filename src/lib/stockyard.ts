import { apiFetch } from "@/lib/api"

export type ApprovePayload = {
  valid_from?: string // ISO 8601
  valid_to?: string   // ISO 8601
}

export async function approveStockyardRequest(id: string, token: string, payload: ApprovePayload = {}) {
  const body: Record<string, any> = {}
  if (payload.valid_from) body.valid_from = payload.valid_from
  if (payload.valid_to) body.valid_to = payload.valid_to

  const res = await apiFetch(`/stockyard-requests/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  }, token)

  return res.json() // whatever your controller returns; we show it in UI
}

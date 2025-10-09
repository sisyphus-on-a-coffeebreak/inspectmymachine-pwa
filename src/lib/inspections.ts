// src/lib/inspections.ts
import { json } from "./api";

export type UUID = string;

export type InspectionStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "submitted"
  | "approved"
  | "rejected";

export interface Inspection {
  id: UUID;
  vehicle_id: UUID | null;
  inspector_id: number;
  inspection_date: string;
  status: InspectionStatus;
  current_step: number;
  total_steps: number;
  completion_percentage: number | string;
  overall_rating?: number | null;

  step_1?: unknown | null;
  step_2?: unknown | null;
  step_3?: unknown | null;
  step_4?: unknown | null;
  step_5?: unknown | null;
  step_6?: unknown | null;
  step_7?: unknown | null;
  step_8?: unknown | null;
  step_9?: unknown | null;
  step_10?: unknown | null;
  step_11?: unknown | null;
  step_12?: unknown | null;

  [k: string]: unknown;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  [k: string]: unknown;
}

export interface IndexResponse {
  success: boolean;
  data: Paginated<Inspection>;
  statuses: Record<InspectionStatus, string>;
}

export interface StoreResponse {
  success: boolean;
  message: string;
  id: UUID;
  data: Inspection;
}

export interface UpdateStepResponse {
  success: boolean;
  message: string;
  data: Inspection;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  data?: Inspection;
  missing_steps?: string[];
}

export async function createInspectionDraft(step1?: Record<string, unknown>) {
  const body = step1 ? { step_1: step1 } : {};
  const res = await json<StoreResponse>("/api/v1/inspections", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { id: res.id, inspection: res.data };
}

export async function saveInspectionStep(
  id: UUID,
  n: number,
  payload: Record<string, unknown>
) {
  const res = await json<UpdateStepResponse>(
    `/api/v1/inspections/${id}/step/${n}`,
    {
      method: "PUT",
      body: JSON.stringify({ payload }),
    }
  );
  return res.data;
}

export async function getInspection(id: UUID) {
  const res = await json<{ success: boolean; data: Inspection }>(
    `/api/v1/inspections/${id}`
  );
  return res.data;
}

export async function listInspections(params?: {
  status?: InspectionStatus;
  inspector_id?: number;
  page?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.inspector_id != null) q.set("inspector_id", String(params.inspector_id));
  if (params?.page != null) q.set("page", String(params.page));
  const path = q.toString()
    ? `/api/v1/inspections?${q.toString()}`
    : "/api/v1/inspections";
  return json<IndexResponse>(path);
}

export async function submitInspection(id: UUID) {
  return json<SubmitResponse>(`/api/v1/inspections/${id}/submit`, {
    method: "POST",
  });
}

export async function getInspectionFormStructure() {
  return json<{ success: boolean; data: { steps: unknown; total_steps: number } }>(
    "/api/v1/inspections/form-structure"
  );
}

export async function generateTyreFields(number_of_tyres: number) {
  return json<{ success: boolean; data: { dynamic_fields: unknown; total_tyres: number } }>(
    "/api/v1/inspections/generate-tyre-fields",
    { method: "POST", body: JSON.stringify({ number_of_tyres }) }
  );
}

/**
 * Stockyard Management API Client
 * 
 * Handles all stockyard request operations:
 * - Create, list, approve, reject requests
 * - Scan vehicles in/out
 * - View request details and history
 */

import { apiClient } from './apiClient';

export type StockyardRequestType = 'ENTRY' | 'EXIT';
export type StockyardRequestStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';

export interface StockyardRequest {
  id: string;
  vehicle_id: string;
  yard_id: string;
  type: StockyardRequestType;
  status: StockyardRequestStatus;
  valid_from?: string | null;
  valid_to?: string | null;
  scan_in_at?: string | null;
  scan_in_gatekeeper?: string | null;
  scan_in_odometer_km?: number | null;
  scan_in_engine_hours?: number | null;
  scan_in_vehicle_photo_url?: string | null;
  scan_in_driver_photo_url?: string | null;
  scan_out_at?: string | null;
  scan_out_gatekeeper?: string | null;
  requested_by?: number | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Relations (when loaded)
  vehicle?: {
    id: string;
    registration_number: string;
    make?: string;
    model?: string;
  };
  yard?: {
    id: string;
    name: string;
  };
  requester?: {
    id: number;
    name: string;
    employee_id: string;
  };
  approver?: {
    id: number;
    name: string;
  };
}

export interface CreateStockyardRequestPayload {
  vehicle_id: string;
  yard_id: string;
  type: StockyardRequestType;
  notes?: string;
}

export interface ApproveStockyardRequestPayload {
  valid_from?: string; // ISO 8601
  valid_to?: string; // ISO 8601
  notify?: boolean;
  email?: string;
}

export interface ScanStockyardRequestPayload {
  action: 'IN' | 'OUT';
  gatekeeper_name?: string;
  odometer_km?: number;
  engine_hours?: number;
  photos?: string[]; // Array of photo URLs
}

export interface StockyardStats {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  vehicles_inside: number;
  vehicles_outside: number;
  requests_today: number;
}

/**
 * Get all stockyard requests with filters
 */
export async function getStockyardRequests(params?: {
  status?: StockyardRequestStatus | 'all';
  type?: StockyardRequestType | 'all';
  yard_id?: string;
  vehicle_id?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
}): Promise<{ data: StockyardRequest[]; total: number; page: number; per_page: number; last_page: number }> {
  const response = await apiClient.get('/v1/stockyard-requests', { params });
  return response.data;
}

/**
 * Get a single stockyard request by ID
 */
export async function getStockyardRequest(id: string): Promise<StockyardRequest> {
  const response = await apiClient.get(`/v1/stockyard-requests/${id}`);
  return response.data.data || response.data;
}

/**
 * Create a new stockyard request
 */
export async function createStockyardRequest(payload: CreateStockyardRequestPayload): Promise<StockyardRequest> {
  const response = await apiClient.post('/v1/stockyard-requests', payload);
  return response.data.data || response.data;
}

/**
 * Approve a stockyard request
 */
export async function approveStockyardRequest(
  id: string,
  payload: ApproveStockyardRequestPayload = {}
): Promise<StockyardRequest> {
  const response = await apiClient.post(`/v1/stockyard-requests/${id}/approve`, payload);
  return response.data.data || response.data;
}

/**
 * Reject a stockyard request
 */
export async function rejectStockyardRequest(id: string, reason?: string): Promise<StockyardRequest> {
  const response = await apiClient.post(`/v1/stockyard-requests/${id}/reject`, { reason });
  return response.data.data || response.data;
}

/**
 * Cancel a stockyard request
 */
export async function cancelStockyardRequest(id: string, reason?: string): Promise<StockyardRequest> {
  const response = await apiClient.post(`/v1/stockyard-requests/${id}/cancel`, { reason });
  return response.data.data || response.data;
}

/**
 * Scan vehicle in/out
 */
export async function scanStockyardRequest(
  id: string,
  payload: ScanStockyardRequestPayload
): Promise<StockyardRequest> {
  const response = await apiClient.post(`/v1/stockyard-requests/${id}/scan`, payload);
  return response.data.data || response.data;
}

/**
 * Get stockyard statistics
 */
export async function getStockyardStats(yard_id?: string): Promise<StockyardStats> {
  const response = await apiClient.get('/v1/stockyard-requests/stats', { params: { yard_id } });
  return response.data.data || response.data;
}

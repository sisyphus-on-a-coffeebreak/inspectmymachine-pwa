/**
 * Stockyard Management API Client
 * 
 * Handles all stockyard request operations:
 * - Create, list, approve, reject requests
 * - Scan vehicles in/out
 * - View request details and history
 * - Yard occupancy & slot scheduling
 * - Condition verification & checklists
 * - Component lifecycle & custody tracking
 * - Compliance & documentation
 * - Transporter scheduling
 * - Analytics & intelligence
 */

import { apiClient } from './apiClient';

export type StockyardRequestType = 'ENTRY' | 'EXIT';
export type StockyardRequestStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type YardSlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked';
export type ChecklistStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type BuyerReadinessStage = 'awaiting_inspection' | 'ready_to_photograph' | 'awaiting_detailing' | 'ready_for_listing' | 'listed';
export type DocumentType = 'rc_book' | 'insurance' | 'pollution_certificate' | 'fitness_certificate' | 'permit' | 'noc' | 'other';
export type ComplianceStatus = 'complete' | 'missing' | 'expired' | 'expiring_soon';

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
  days_since_entry_avg?: number;
  slots_occupied?: number;
  slots_available?: number;
  slots_total?: number;
}

// Yard Slot Management
export interface YardSlot {
  id: string;
  yard_id: string;
  slot_number: string;
  zone?: string;
  status: YardSlotStatus;
  capacity: number; // Number of vehicles this slot can hold
  current_occupancy: number;
  vehicle_id?: string | null;
  stockyard_request_id?: string | null;
  reserved_until?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    registration_number: string;
    make?: string;
    model?: string;
  };
  stockyard_request?: StockyardRequest;
}

export interface YardMap {
  yard_id: string;
  yard_name: string;
  slots: YardSlot[];
  zones?: Array<{
    id: string;
    name: string;
    slot_ids: string[];
  }>;
}

export interface SlotSuggestion {
  slot_id: string;
  slot_number: string;
  zone?: string;
  reason: string;
  score: number; // 0-100, higher is better
}

// Condition Verification & Checklists
export interface ChecklistItem {
  id: string;
  checklist_id: string;
  item_key: string;
  label: string;
  type: 'boolean' | 'text' | 'number' | 'photo' | 'signature';
  required: boolean;
  value?: string | number | boolean | null;
  photos?: string[];
  notes?: string;
  verified_by?: number | null;
  verified_at?: string | null;
  order: number;
}

export interface Checklist {
  id: string;
  stockyard_request_id: string;
  type: 'inbound' | 'outbound';
  status: ChecklistStatus;
  auto_generated: boolean;
  items: ChecklistItem[];
  completed_at?: string | null;
  completed_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateChecklistPayload {
  stockyard_request_id: string;
  type: 'inbound' | 'outbound';
  items?: Array<{
    item_key: string;
    label: string;
    type: 'boolean' | 'text' | 'number' | 'photo' | 'signature';
    required: boolean;
    order: number;
  }>;
}

export interface UpdateChecklistItemPayload {
  value?: string | number | boolean;
  photos?: string[];
  notes?: string;
}

// Component Custody & Lifecycle
export interface ComponentCustodyEvent {
  id: string;
  component_type: 'battery' | 'tyre' | 'spare_part';
  component_id: string;
  event_type: 'install' | 'remove' | 'transfer' | 'inspection' | 'maintenance' | 'expense';
  from_vehicle_id?: string | null;
  to_vehicle_id?: string | null;
  stockyard_request_id?: string | null;
  inspection_id?: string | null;
  expense_id?: string | null;
  performed_by?: number | null;
  approved_by?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  vehicle?: {
    id: string;
    registration_number: string;
  };
  component?: {
    id: string;
    type: string;
    serial_number?: string;
    brand: string;
    model: string;
  };
  performer?: {
    id: number;
    name: string;
  };
  approver?: {
    id: number;
    name: string;
  };
}

export interface ComponentAnalytics {
  component_id: string;
  component_type: 'battery' | 'tyre' | 'spare_part';
  total_installations: number;
  total_removals: number;
  total_transfers: number;
  average_lifespan_days: number;
  replacement_frequency: number; // Replacements per year
  total_cost: number;
  current_age_days: number;
  warranty_status: 'active' | 'expiring_soon' | 'expired';
  warranty_expires_at?: string;
}

// Compliance & Documentation
export interface StockyardDocument {
  id: string;
  stockyard_request_id: string;
  vehicle_id: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number;
  approved_by?: number | null;
  approved_at?: string | null;
  expires_at?: string | null;
  status: ComplianceStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    name: string;
  };
  approver?: {
    id: number;
    name: string;
  };
}

export interface ComplianceTask {
  id: string;
  stockyard_request_id: string;
  vehicle_id: string;
  document_type: DocumentType;
  status: 'pending' | 'completed' | 'overdue';
  due_date?: string | null;
  assigned_to?: number | null;
  created_at: string;
  updated_at: string;
}

// Transporter & Scheduling
export interface TransporterBid {
  id: string;
  stockyard_request_id: string;
  transporter_name: string;
  transporter_contact: string;
  bid_amount: number;
  estimated_pickup_time: string;
  notes?: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface CreateTransporterBidPayload {
  stockyard_request_id: string;
  transporter_name: string;
  transporter_contact: string;
  bid_amount: number;
  estimated_pickup_time: string;
  notes?: string;
}

// Buyer Readiness & Merchandising
export interface BuyerReadinessRecord {
  id: string;
  vehicle_id: string;
  stockyard_request_id: string;
  stage: BuyerReadinessStage;
  photo_set_url?: string | null;
  inspection_summary_url?: string | null;
  pricing_guidance?: number | null;
  listing_url?: string | null;
  assigned_to?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    registration_number: string;
    make?: string;
    model?: string;
  };
}

// Analytics & Intelligence
export interface VehicleTimelineEvent {
  id: string;
  event_type: 'gate_entry' | 'gate_exit' | 'inspection' | 'expense' | 'component_install' | 'component_remove' | 'document_upload' | 'checklist_complete';
  vehicle_id: string;
  stockyard_request_id?: string | null;
  inspection_id?: string | null;
  expense_id?: string | null;
  component_id?: string | null;
  document_id?: string | null;
  checklist_id?: string | null;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_by?: number | null;
}

export interface StockyardAlert {
  id: string;
  type: 'warranty_expiring' | 'overdue_maintenance' | 'anomalous_spend' | 'days_in_yard' | 'missing_document' | 'checklist_blocked';
  severity: 'info' | 'warning' | 'critical';
  vehicle_id?: string | null;
  component_id?: string | null;
  stockyard_request_id?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledged_by?: number | null;
  acknowledged_at?: string | null;
  created_at: string;
}

export interface ProfitabilityForecast {
  vehicle_id: string;
  expected_sale_price: number;
  total_maintenance_cost: number;
  holding_cost: number; // Cost per day * days in yard
  days_in_yard: number;
  estimated_margin: number;
  margin_percentage: number;
  recommendation: 'repair' | 'liquidate' | 'hold';
  reasoning: string;
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

// ==================== Yard Slot Management ====================

/**
 * Get yard map with all slots
 */
export async function getYardMap(yard_id: string): Promise<YardMap> {
  const response = await apiClient.get(`/v1/stockyard/yards/${yard_id}/map`);
  return response.data.data || response.data;
}

/**
 * Get slot suggestions for a vehicle entry request
 */
export async function getSlotSuggestions(
  yard_id: string,
  vehicle_id: string,
  stockyard_request_id?: string
): Promise<SlotSuggestion[]> {
  const response = await apiClient.get(`/v1/stockyard/yards/${yard_id}/slot-suggestions`, {
    params: { vehicle_id, stockyard_request_id },
  });
  return response.data.data || response.data;
}

/**
 * Assign vehicle to slot
 */
export async function assignVehicleToSlot(
  slot_id: string,
  vehicle_id: string,
  stockyard_request_id: string
): Promise<YardSlot> {
  const response = await apiClient.post(`/v1/stockyard/slots/${slot_id}/assign`, {
    vehicle_id,
    stockyard_request_id,
  });
  return response.data.data || response.data;
}

/**
 * Reassign vehicle to different slot
 */
export async function reassignVehicleSlot(
  from_slot_id: string,
  to_slot_id: string,
  vehicle_id: string
): Promise<{ from_slot: YardSlot; to_slot: YardSlot }> {
  const response = await apiClient.post(`/v1/stockyard/slots/reassign`, {
    from_slot_id,
    to_slot_id,
    vehicle_id,
  });
  return response.data.data || response.data;
}

/**
 * Release slot (when vehicle exits)
 */
export async function releaseSlot(slot_id: string, vehicle_id: string): Promise<YardSlot> {
  const response = await apiClient.post(`/v1/stockyard/slots/${slot_id}/release`, { vehicle_id });
  return response.data.data || response.data;
}

// ==================== Checklists ====================

/**
 * Get checklist for a stockyard request
 */
export async function getChecklist(
  stockyard_request_id: string,
  type?: 'inbound' | 'outbound'
): Promise<Checklist> {
  const response = await apiClient.get(`/v1/stockyard-requests/${stockyard_request_id}/checklist`, {
    params: { type },
  });
  return response.data.data || response.data;
}

/**
 * Create checklist (auto-generate from scan data or manual)
 */
export async function createChecklist(payload: CreateChecklistPayload): Promise<Checklist> {
  const response = await apiClient.post('/v1/stockyard/checklists', payload);
  return response.data.data || response.data;
}

/**
 * Update checklist item
 */
export async function updateChecklistItem(
  checklist_id: string,
  item_id: string,
  payload: UpdateChecklistItemPayload
): Promise<ChecklistItem> {
  const response = await apiClient.patch(
    `/v1/stockyard/checklists/${checklist_id}/items/${item_id}`,
    payload
  );
  return response.data.data || response.data;
}

/**
 * Complete checklist
 */
export async function completeChecklist(
  checklist_id: string,
  notes?: string
): Promise<Checklist> {
  const response = await apiClient.post(`/v1/stockyard/checklists/${checklist_id}/complete`, {
    notes,
  });
  return response.data.data || response.data;
}

// ==================== Component Custody ====================

/**
 * Get component custody events
 */
export async function getComponentCustodyEvents(params?: {
  component_type?: 'battery' | 'tyre' | 'spare_part';
  component_id?: string;
  vehicle_id?: string;
  event_type?: string;
  page?: number;
  per_page?: number;
}): Promise<{ data: ComponentCustodyEvent[]; total: number; page: number; per_page: number; last_page: number }> {
  const response = await apiClient.get('/v1/components/custody-events', { params });
  return response.data;
}

/**
 * Get component analytics
 */
export async function getComponentAnalytics(
  component_type: 'battery' | 'tyre' | 'spare_part',
  component_id: string
): Promise<ComponentAnalytics> {
  const response = await apiClient.get(`/v1/components/${component_type}/${component_id}/analytics`);
  return response.data.data || response.data;
}

// ==================== Compliance & Documents ====================

/**
 * Get documents for a stockyard request
 */
export async function getStockyardDocuments(
  stockyard_request_id: string
): Promise<StockyardDocument[]> {
  const response = await apiClient.get(
    `/v1/stockyard-requests/${stockyard_request_id}/documents`
  );
  return response.data.data || response.data;
}

/**
 * Upload document (back-office staff only)
 */
export async function uploadStockyardDocument(
  stockyard_request_id: string,
  formData: FormData
): Promise<StockyardDocument> {
  const response = await apiClient.upload(
    `/v1/stockyard-requests/${stockyard_request_id}/documents`,
    formData
  );
  return response.data.data || response.data;
}

/**
 * Approve document
 */
export async function approveDocument(document_id: string): Promise<StockyardDocument> {
  const response = await apiClient.post(`/v1/stockyard/documents/${document_id}/approve`);
  return response.data.data || response.data;
}

/**
 * Get compliance tasks
 */
export async function getComplianceTasks(params?: {
  stockyard_request_id?: string;
  vehicle_id?: string;
  status?: 'pending' | 'completed' | 'overdue';
}): Promise<ComplianceTask[]> {
  const response = await apiClient.get('/v1/stockyard/compliance-tasks', { params });
  return response.data.data || response.data;
}

// ==================== Transporter Scheduling ====================

/**
 * Get transporter bids for a stockyard request
 */
export async function getTransporterBids(
  stockyard_request_id: string
): Promise<TransporterBid[]> {
  const response = await apiClient.get(
    `/v1/stockyard-requests/${stockyard_request_id}/transporter-bids`
  );
  return response.data.data || response.data;
}

/**
 * Create transporter bid request
 */
export async function createTransporterBid(
  payload: CreateTransporterBidPayload
): Promise<TransporterBid> {
  const response = await apiClient.post('/v1/stockyard/transporter-bids', payload);
  return response.data.data || response.data;
}

/**
 * Accept transporter bid
 */
export async function acceptTransporterBid(bid_id: string): Promise<TransporterBid> {
  const response = await apiClient.post(`/v1/stockyard/transporter-bids/${bid_id}/accept`);
  return response.data.data || response.data;
}

// ==================== Buyer Readiness ====================

/**
 * Get buyer readiness records
 */
export async function getBuyerReadinessRecords(params?: {
  stage?: BuyerReadinessStage;
  vehicle_id?: string;
  page?: number;
  per_page?: number;
}): Promise<{ data: BuyerReadinessRecord[]; total: number; page: number; per_page: number; last_page: number }> {
  const response = await apiClient.get('/v1/stockyard/buyer-readiness', { params });
  return response.data;
}

/**
 * Update buyer readiness stage
 */
export async function updateBuyerReadinessStage(
  record_id: string,
  stage: BuyerReadinessStage,
  metadata?: {
    photo_set_url?: string;
    inspection_summary_url?: string;
    pricing_guidance?: number;
    listing_url?: string;
    notes?: string;
  }
): Promise<BuyerReadinessRecord> {
  const response = await apiClient.patch(`/v1/stockyard/buyer-readiness/${record_id}`, {
    stage,
    ...metadata,
  });
  return response.data.data || response.data;
}

// ==================== Analytics & Intelligence ====================

/**
 * Get vehicle timeline (all events)
 */
export async function getVehicleTimeline(
  vehicle_id: string,
  params?: {
    date_from?: string;
    date_to?: string;
    event_types?: string[];
  }
): Promise<VehicleTimelineEvent[]> {
  const response = await apiClient.get(`/v1/vehicles/${vehicle_id}/timeline`, { params });
  return response.data.data || response.data;
}

/**
 * Get stockyard alerts
 */
export async function getStockyardAlerts(params?: {
  vehicle_id?: string;
  component_id?: string;
  type?: string;
  severity?: 'info' | 'warning' | 'critical';
  acknowledged?: boolean;
}): Promise<StockyardAlert[]> {
  const response = await apiClient.get('/v1/stockyard/alerts', { params });
  return response.data.data || response.data;
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(alert_id: string): Promise<StockyardAlert> {
  const response = await apiClient.post(`/v1/stockyard/alerts/${alert_id}/acknowledge`);
  return response.data.data || response.data;
}

/**
 * Get profitability forecast for vehicle
 */
export async function getProfitabilityForecast(vehicle_id: string): Promise<ProfitabilityForecast> {
  const response = await apiClient.get(`/v1/stockyard/vehicles/${vehicle_id}/profitability`);
  return response.data.data || response.data;
}

/**
 * Get days since entry for vehicles in yard
 */
export async function getDaysSinceEntry(
  vehicle_id?: string
): Promise<Array<{ vehicle_id: string; days_since_entry: number; vehicle: { registration_number: string } }>> {
  const response = await apiClient.get('/v1/stockyard/days-since-entry', {
    params: { vehicle_id },
  });
  return response.data.data || response.data;
}

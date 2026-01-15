// 📋 Unified Gate Pass Type Definitions
// Types for the unified gate_passes table (API v2)

// Type definitions for relationships
export interface Vehicle {
  id: string; // UUID
  registration_number: string;
  make: string;
  model: string;
  year?: number;
  vehicle_type?: string; // Changed from 'type' to match backend
  current_location?: string;
  status?: 'available' | 'sold' | 'under_maintenance' | 'out';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

// ============================================================================
// Core Type Definitions
// ============================================================================

export type GatePassType = 'visitor' | 'vehicle_inbound' | 'vehicle_outbound';

export type GatePassStatus = 
  | 'draft' 
  | 'pending' 
  | 'pending_approval'
  | 'active' 
  | 'inside' 
  | 'completed' 
  | 'expired' 
  | 'rejected' 
  | 'cancelled';

export type GatePassPurpose = 
  | 'inspection' 
  | 'service' 
  | 'delivery' 
  | 'meeting' 
  | 'rto_work' 
  | 'sold' 
  | 'test_drive' 
  | 'auction' 
  | 'other';

export type ValidationAction = 'entry' | 'exit' | 'validation_only';

// ============================================================================
// QR Payload Interface
// ============================================================================

export interface QRPayload {
  type: 'gate_pass';
  id: string;
  pass_number: string;
  access_code: string;
  pass_type: GatePassType;
  valid_from: string;
  valid_to: string;
  created_at: string;
  signature?: string;
  validation_url?: string;
}

// ============================================================================
// Gate Pass Validation Interface
// ============================================================================

export interface GatePassValidation {
  id: number;
  gate_pass_id: string;
  action: ValidationAction;
  validated_by: number;
  validator?: User;
  notes?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Main Gate Pass Interface
// ============================================================================

export interface GatePass {
  // Primary identification
  id: string;
  pass_number: string;
  pass_type: GatePassType;
  status: GatePassStatus;
  
  // Purpose and validity
  purpose: GatePassPurpose;
  purpose_details?: string;
  valid_from: string;
  valid_to: string;
  entry_time?: string;
  exit_time?: string;
  
  // Access and QR
  access_code: string;
  qr_payload?: QRPayload | string; // Can be object or JSON string
  
  // Visitor-specific fields (nullable)
  visitor_name?: string;
  visitor_phone?: string;
  visitor_company?: string;
  referred_by?: string;
  additional_visitors?: string;
  additional_head_count?: number;
  vehicles_to_view?: string[]; // Array of vehicle UUIDs
  
  // Vehicle-specific fields (nullable)
  vehicle_id?: string; // UUID
  vehicle?: Vehicle;
  driver_name?: string;
  driver_contact?: string;
  driver_license_number?: string;
  driver_license_photo?: string;
  expected_return_date?: string;
  expected_return_time?: string;
  destination?: string;
  exit_photos?: string[];
  return_photos?: string[];
  exit_odometer?: number;
  return_odometer?: number;
  
  // Approval tracking
  approval_status?: 'pending' | 'approved' | 'rejected';
  approved_by?: number;
  approver?: User;
  approved_at?: string;
  rejection_reason?: string;
  
  // Metadata
  notes?: string;
  created_by: number;
  creator?: User;
  yard_id?: string;
  yard?: {
    id: string;
    name: string;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  
  // Relationships
  validations?: GatePassValidation[];
}

// ============================================================================
// Statistics Interface
// ============================================================================

export interface GatePassStats {
  visitors_inside: number;
  vehicles_out: number;
  expected_today: number;
  expiring_soon: number;
  pending_approval: number;
  total_today?: number;
}

// ============================================================================
// Filter & Request Types
// ============================================================================

export interface GatePassFilters {
  type?: GatePassType | GatePassType[] | 'all';
  status?: GatePassStatus | GatePassStatus[];
  yard_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  include_stats?: boolean;
}

export interface GatePassListResponse {
  data: GatePass[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
  stats?: GatePassStats;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

// ============================================================================
// Create Request Types
// ============================================================================

export interface CreateVisitorPassData {
  pass_type: 'visitor';
  visitor_name: string;
  visitor_phone: string;
  visitor_company?: string;
  referred_by: string;
  vehicles_to_view: string[]; // Vehicle IDs (UUIDs)
  purpose: GatePassPurpose;
  valid_from: string;
  valid_to: string;
  additional_visitors?: string;
  additional_head_count?: number;
  notes?: string;
  yard_id?: string;
}

export interface CreateVehiclePassData {
  pass_type: 'vehicle_inbound' | 'vehicle_outbound';
  vehicle_id: string; // Vehicle ID (UUID)
  purpose: GatePassPurpose;
  valid_from: string;
  valid_to: string;
  driver_name?: string;
  driver_contact?: string;
  driver_license_number?: string;
  driver_license_photo?: string;
  expected_return_date?: string;
  expected_return_time?: string;
  destination?: string;
  exit_photos?: string[];
  exit_odometer?: number;
  notes?: string;
  yard_id?: string;
}

export type CreateGatePassData = CreateVisitorPassData | CreateVehiclePassData;

export interface UpdateGatePassData {
  purpose?: GatePassPurpose;
  purpose_details?: string;
  valid_from?: string;
  valid_to?: string;
  notes?: string;
  visitor_name?: string;
  visitor_phone?: string;
  referred_by?: string;
  driver_name?: string;
  driver_contact?: string;
  [key: string]: any; // Allow other fields
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidatePassRequest {
  access_code: string;
  action: 'validate_only' | 'entry' | 'exit';
  notes?: string;
}

export interface ValidatePassResponse {
  valid: boolean;
  pass?: GatePass;
  action_taken?: 'entry' | 'exit' | null;
  suggested_action?: 'entry' | 'exit' | null;
  message: string;
  validation_history?: GatePassValidation[];
}

export interface GuardLogParams {
  date?: string;
  guard_id?: number;
  per_page?: number;
  page?: number;
}

// ============================================================================
// Legacy Types (kept for CreateGatePassData union type)
// ============================================================================
// Note: CreateVisitorPassData and CreateVehiclePassData are kept as they're
// used in the CreateGatePassData union type. All components should use
// the unified GatePass type and CreateGatePassData.

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a pass is a visitor pass
 */
export function isVisitorPass(pass: GatePass): boolean {
  return pass.pass_type === 'visitor';
}

/**
 * Check if a pass is a vehicle pass
 */
export function isVehiclePass(pass: GatePass): boolean {
  return pass.pass_type === 'vehicle_inbound' || pass.pass_type === 'vehicle_outbound';
}

/**
 * Check if a vehicle pass is outbound
 */
export function isOutboundVehicle(pass: GatePass): boolean {
  return pass.pass_type === 'vehicle_outbound';
}

/**
 * Check if a pass can enter (is active and not expired)
 */
export function canEnter(pass: GatePass): boolean {
  if (pass.status !== 'active') return false;
  if (isExpired(pass)) return false;
  return true;
}

/**
 * Check if a pass can exit (is currently inside)
 */
export function canExit(pass: GatePass): boolean {
  return pass.status === 'inside';
}

/**
 * Check if a pass is expired
 */
export function isExpired(pass: GatePass): boolean {
  if (!pass.valid_to) return false;
  const validTo = new Date(pass.valid_to);
  return validTo < new Date();
}

/**
 * Get display name for a pass
 */
export function getPassDisplayName(pass: GatePass): string {
  if (isVisitorPass(pass)) {
    return pass.visitor_name || 'Unknown Visitor';
  }
  if (pass.vehicle) {
    return pass.vehicle.registration_number || 'Unknown Vehicle';
  }
  return pass.pass_number;
}

/**
 * Get color for status badge
 */
export function getStatusColor(status: GatePassStatus): string {
  const colorMap: Record<GatePassStatus, string> = {
    draft: 'gray',
    pending: 'yellow',
    pending_approval: 'yellow',
    active: 'green',
    inside: 'blue',
    completed: 'gray',
    expired: 'red',
    rejected: 'red',
    cancelled: 'gray',
  };
  return colorMap[status] || 'gray';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: GatePassStatus): string {
  const labelMap: Record<GatePassStatus, string> = {
    draft: 'Draft',
    pending: 'Pending Approval',
    pending_approval: 'Pending Approval',
    active: 'Active',
    inside: 'Inside',
    completed: 'Completed',
    expired: 'Expired',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  return labelMap[status] || status;
}

/**
 * Get human-readable pass type label
 */
export function getPassTypeLabel(type: GatePassType): string {
  const labelMap: Record<GatePassType, string> = {
    visitor: 'Visitor Pass',
    vehicle_inbound: 'Vehicle Entry',
    vehicle_outbound: 'Vehicle Exit',
  };
  return labelMap[type] || type;
}

/**
 * Get Lucide icon name for pass type
 */
export function getPassTypeIcon(type: GatePassType): string {
  const iconMap: Record<GatePassType, string> = {
    visitor: 'User',
    vehicle_inbound: 'ArrowDownCircle',
    vehicle_outbound: 'ArrowUpCircle',
  };
  return iconMap[type] || 'FileText';
}

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

export interface DashboardStats {
  visitors_inside: number;
  vehicles_out: number;
  expected_today: number;
  total_today: number;
}

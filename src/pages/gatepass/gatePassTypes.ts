// 📋 Gate Pass Type Definitions
// This file defines what data structure each gate pass type should have
// Think of it like a form template - it ensures we always collect the right info

export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  type: string;
  current_location?: string;
  status: 'available' | 'sold' | 'under_maintenance' | 'out';
}

export interface VisitorGatePass {
  id?: string; // UUID from backend
  pass_number?: string; // Not used in backend, computed from ID
  visitor_name: string; // Backend field name
  visitor_phone: string; // Backend field name
  visitor_company?: string; // Backend field name
  additional_visitors?: string; // Comma-separated names
  additional_head_count?: number;
  referred_by?: string; // Mapped from visitor_company
  contact_number?: string; // Mapped from visitor_phone
  vehicle_ids?: number[]; // IDs of vehicles they want to inspect
  vehicles_to_view?: number[]; // Backend field name
  vehicles?: Vehicle[]; // Full vehicle objects (populated from API)
  purpose: 'inspection' | 'service' | 'delivery' | 'meeting' | 'other';
  expected_date?: string; // Frontend field
  expected_time?: string; // Frontend field
  valid_from: string; // Backend field
  valid_to: string; // Backend field
  notes?: string;
  entry_time?: string;
  exit_time?: string;
  status: 'pending' | 'active' | 'expired' | 'used' | 'cancelled' | 'inside' | 'completed';
  created_by?: number;
  created_by_user_id?: number; // Backend field
  yard_id?: string; // Backend field
  created_at?: string;
  updated_at?: string;
}

export interface VehicleMovementPass {
  id?: number;
  pass_number: string;
  vehicle_id: number;
  vehicle?: Vehicle;
  direction: 'inbound' | 'outbound';
  purpose: 'rto_work' | 'sold' | 'test_drive' | 'service' | 'auction' | 'other';
  
  // Driver details (for outbound)
  driver_name?: string;
  driver_contact?: string;
  driver_license_number?: string;
  driver_license_photo?: string; // URL or base64
  
  // Movement details
  expected_return_date?: string;
  expected_return_time?: string;
  destination?: string;
  
  // Vehicle condition
  exit_photos?: string[]; // URLs or base64 array
  return_photos?: string[];
  exit_odometer?: number;
  return_odometer?: number;
  
  // Status tracking
  departure_time?: string;
  actual_return_time?: string;
  work_completed?: boolean;
  return_notes?: string;
  
  status: 'pending' | 'out' | 'returned' | 'cancelled';
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface GuardLogEntry {
  id: number;
  pass_type: 'visitor' | 'vehicle_movement';
  pass_id: number;
  action: 'entry' | 'exit' | 'return';
  timestamp: string;
  guard_name: string;
  notes?: string;
}

// Form state types (what the user is currently filling out)
export interface VisitorPassFormData {
  primary_visitor_name: string;
  additional_visitors: string;
  additional_head_count: number;
  referred_by: string;
  contact_number: string;
  selected_vehicle_ids: number[];
  purpose: VisitorGatePass['purpose'];
  expected_date: string;
  expected_time: string;
  notes: string;
}

export interface VehicleMovementFormData {
  vehicle_id: number | null;
  direction: VehicleMovementPass['direction'];
  purpose: VehicleMovementPass['purpose'];
  driver_name: string;
  driver_contact: string;
  driver_license_number: string;
  driver_license_photo: File | null;
  expected_return_date: string;
  expected_return_time: string;
  destination: string;
  exit_photos: File[];
  exit_odometer: string;
  notes: string;
  // New fields for inbound vehicle selection
  vehicle_selection_type?: 'existing' | 'manual';
  manual_vehicle?: {
    registration_number: string;
    make?: string;
    model?: string;
  };
  yard_id: string | null;
}

// API Response types
export interface GatePassListResponse {
  visitor_passes: VisitorGatePass[];
  vehicle_movements: VehicleMovementPass[];
}

export interface DashboardStats {
  visitors_inside: number;
  vehicles_out: number;
  expected_today: number;
  total_today: number;
}
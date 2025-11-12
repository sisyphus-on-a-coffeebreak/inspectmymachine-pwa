/**
 * Gate Pass Service
 * 
 * Unified service for managing all gate pass records (visitor + vehicle)
 * Combines visitor and vehicle pass data with timeline events into a single
 * normalized data structure consumed by all dashboards.
 */

import { apiClient, normalizeError } from '../apiClient';
import type { VisitorGatePass, VehicleMovementPass } from '@/pages/gatepass/gatePassTypes';

export interface TimelineEvent {
  id: string;
  type: 'created' | 'entry' | 'exit' | 'approved' | 'rejected' | 'escalated' | 'updated';
  timestamp: string;
  actor?: {
    id: number;
    name: string;
    role: string;
  };
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UnifiedGatePassRecord {
  id: string;
  type: 'visitor' | 'vehicle';
  passNumber: string;
  
  // Visitor-specific fields
  visitorName?: string;
  visitorPhone?: string;
  visitorCompany?: string;
  additionalVisitors?: string[];
  additionalHeadCount?: number;
  
  // Vehicle-specific fields
  vehicleId?: number;
  vehicle?: {
    id: number;
    registration_number: string;
    make: string;
    model: string;
    year?: number;
    type?: string;
  };
  driverName?: string;
  driverContact?: string;
  driverLicenseNumber?: string;
  
  // Common fields
  purpose: string;
  direction?: 'inbound' | 'outbound';
  status: string;
  validFrom: string;
  validTo: string;
  expectedReturnDate?: string;
  expectedReturnTime?: string;
  entryTime?: string;
  exitTime?: string;
  notes?: string;
  
  // QR and access
  accessCode?: string;
  qrPayload?: string;
  qrCode?: string;
  
  // Metadata
  yardId?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  
  // Timeline
  timeline: TimelineEvent[];
  
  // Raw data for backward compatibility
  raw: VisitorGatePass | VehicleMovementPass;
}

export interface GatePassListParams {
  status?: string;
  type?: 'visitor' | 'vehicle' | 'all';
  yardId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface GatePassListResponse {
  data: UnifiedGatePassRecord[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

/**
 * Gate Pass Service
 */
class GatePassService {
  /**
   * Fetch all gate pass records (unified)
   */
  async list(params?: GatePassListParams): Promise<GatePassListResponse> {
    try {
      const response = await apiClient.get<GatePassListResponse>('/gate-pass-records', {
        params,
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get a single gate pass record by ID
   */
  async get(id: string, type: 'visitor' | 'vehicle'): Promise<UnifiedGatePassRecord> {
    try {
      const endpoint = type === 'visitor' 
        ? `/visitor-gate-passes/${id}`
        : `/vehicle-exit-passes/${id}`;
      
      const response = await apiClient.get<UnifiedGatePassRecord>(endpoint);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Create a visitor gate pass
   */
  async createVisitorPass(data: {
    visitor_name: string;
    visitor_phone: string;
    visitor_company?: string;
    vehicles_to_view: number[];
    purpose: string;
    valid_from: string;
    valid_to: string;
    yard_id: string;
    notes?: string;
  }): Promise<UnifiedGatePassRecord> {
    try {
      const response = await apiClient.post<UnifiedGatePassRecord>('/visitor-gate-passes', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Create a vehicle movement pass
   */
  async createVehiclePass(data: {
    vehicle_id: number;
    direction: 'inbound' | 'outbound';
    purpose: string;
    driver_name: string;
    driver_contact: string;
    driver_license_number?: string;
    driver_license_photo?: string;
    expected_return_date?: string;
    expected_return_time?: string;
    destination?: string;
    exit_photos?: string[];
    exit_odometer?: number;
    notes?: string;
    yard_id?: string;
  }): Promise<UnifiedGatePassRecord> {
    try {
      const response = await apiClient.post<UnifiedGatePassRecord>('/vehicle-exit-passes', data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Mark entry for a gate pass
   */
  async markEntry(id: string, type: 'visitor' | 'vehicle', data?: {
    notes?: string;
    incident_log?: string;
    escort_required?: boolean;
    asset_checklist?: Record<string, boolean>;
  }): Promise<UnifiedGatePassRecord> {
    try {
      const endpoint = type === 'visitor'
        ? `/visitor-gate-passes/${id}/entry`
        : `/vehicle-exit-passes/${id}/entry`;
      
      const response = await apiClient.post<UnifiedGatePassRecord>(endpoint, data || {});
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Mark exit for a gate pass
   */
  async markExit(id: string, type: 'visitor' | 'vehicle', data?: {
    notes?: string;
  }): Promise<UnifiedGatePassRecord> {
    try {
      const endpoint = type === 'visitor'
        ? `/visitor-gate-passes/${id}/exit`
        : `/vehicle-exit-passes/${id}/exit`;
      
      const response = await apiClient.post<UnifiedGatePassRecord>(endpoint, data || {});
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Sync gate pass record (ensure QR payload exists)
   */
  async syncRecord(passId: string | number, passType: 'visitor' | 'vehicle', metadata?: Record<string, unknown>): Promise<{
    id: string;
    accessCode: string;
    qrPayload: string;
    qrCode?: string;
    passNumber: string;
  }> {
    try {
      const response = await apiClient.post<{
        record: {
          id: string;
          access_code: string;
          qr_payload: string;
          qr_code?: string;
          pass_number?: string;
        };
      }>('/gate-pass-records/sync', {
        pass_id: passId,
        pass_type: passType,
        metadata,
      });

      const record = response.data.record;
      
      if (!record.qr_payload) {
        throw new Error('Backend did not return qr_payload. This is required for verifiable QR codes.');
      }

      return {
        id: record.id,
        accessCode: record.access_code,
        qrPayload: record.qr_payload,
        qrCode: record.qr_code,
        passNumber: record.pass_number || `${passType === 'visitor' ? 'VP' : 'VM'}${String(passId).substring(0, 8).toUpperCase()}`,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(yardId?: string): Promise<{
    visitors_inside: number;
    vehicles_out: number;
    expected_today: number;
    total_today: number;
    pending_approvals: number;
  }> {
    try {
      const response = await apiClient.get<{
        visitors_inside: number;
        vehicles_out: number;
        expected_today: number;
        total_today: number;
        pending_approvals: number;
      }>('/gate-pass-records/stats', {
        params: yardId ? { yard_id: yardId } : {},
      });
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

// Export singleton instance
export const gatePassService = new GatePassService();


/**
 * Access Service (formerly Gate Pass Service)
 * 
 * Service layer for unified Access Pass API v2
 * Handles all API calls to /api/v2/gate-passes endpoints
 * Note: API endpoints remain the same for backward compatibility
 */

import { apiClient, normalizeError } from '../apiClient';
import type {
  GatePass,
  GatePassFilters,
  GatePassListResponse,
  GatePassStats,
  CreateGatePassData,
  UpdateGatePassData,
  ValidatePassRequest,
  ValidatePassResponse,
  GuardLogParams,
} from '@/pages/stockyard/access/gatePassTypes';

const BASE_URL = '/v2/gate-passes'; // Keep API endpoint same for backward compatibility

class AccessService {
  /**
   * List access passes with filters
   */
  async list(filters?: GatePassFilters): Promise<GatePassListResponse> {
    try {
      const params: Record<string, any> = {};

      // Handle type filter (can be single, array, or 'all')
      if (filters?.type) {
        if (filters.type === 'all') {
          // Don't filter by type
        } else if (Array.isArray(filters.type)) {
          params.type = filters.type.join(',');
        } else {
          params.type = filters.type;
        }
      }

      // Handle status filter (can be single or array)
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          params.status = filters.status.join(',');
        } else {
          params.status = filters.status;
        }
      }

      // Other filters
      if (filters?.yard_id) params.yard_id = filters.yard_id;
      if (filters?.date_from) params.date_from = filters.date_from;
      if (filters?.date_to) params.date_to = filters.date_to;
      if (filters?.search) params.search = filters.search;
      if (filters?.sort_by) params.sort_by = filters.sort_by;
      if (filters?.sort_dir) params.sort_dir = filters.sort_dir;
      if (filters?.per_page) params.per_page = filters.per_page;
      if (filters?.page) params.page = filters.page;
      if (filters?.include_stats) params.include_stats = true;

      const response = await apiClient.get<GatePassListResponse>(BASE_URL, { params });
      const responseData = response.data;

      // Handle different response formats
      if (responseData.data) {
        return {
          data: responseData.data,
          total: responseData.total || responseData.pagination?.total || 0,
          page: responseData.page || responseData.pagination?.current_page || 1,
          per_page: responseData.per_page || responseData.pagination?.per_page || 20,
          last_page: responseData.last_page || responseData.pagination?.last_page || 1,
          stats: responseData.stats,
        };
      }

      // Fallback for array response
      const data = Array.isArray(responseData) ? responseData : [];
      return {
        data,
        total: data.length,
        page: 1,
        per_page: data.length,
        last_page: 1,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get statistics
   */
  async getStats(yardId?: string): Promise<GatePassStats> {
    try {
      const params = yardId ? { yard_id: yardId } : {};
      const response = await apiClient.get<GatePassStats>('/v2/gate-passes-stats', { params });
      
      // Map pending_approval field if needed
      const stats = response.data;
      return {
        ...stats,
        pending_approval: stats.pending_approval || 0,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get a single access pass by ID
   */
  async get(id: string): Promise<GatePass> {
    // Validate id is not undefined, empty, or the literal ':id'
    if (!id || id === ':id' || id.trim() === '') {
      throw new Error('Invalid gate pass ID');
    }
    
    try {
      const response = await apiClient.get<GatePass>(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Create a new access pass
   */
  async create(data: CreateGatePassData): Promise<GatePass> {
    try {
      // Normalize vehicles_to_view to ensure it's a plain array
      const normalizedData = { ...data };
      if ('vehicles_to_view' in normalizedData && normalizedData.vehicles_to_view) {
        normalizedData.vehicles_to_view = Array.isArray(normalizedData.vehicles_to_view)
          ? normalizedData.vehicles_to_view.map(id => String(id)).filter(id => id.length > 0)
          : [];
      }

      const response = await apiClient.post<GatePass>(BASE_URL, normalizedData);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Update an access pass
   */
  async update(id: string, data: UpdateGatePassData): Promise<GatePass> {
    try {
      const response = await apiClient.patch<GatePass>(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Cancel an access pass (soft delete)
   */
  async cancel(id: string): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Validate and optionally process a pass (entry/exit)
   */
  async validateAndProcess(data: ValidatePassRequest): Promise<ValidatePassResponse> {
    try {
      const response = await apiClient.post<ValidatePassResponse>(
        `${BASE_URL}/validate`,
        data
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Record entry for an access pass
   * Automatically creates scan event and movement with pass_id linkage
   */
  async recordEntry(
    id: string, 
    options?: {
      notes?: string;
      gate_id?: string;
      guard_id?: number;
      location?: { lat: number; lng: number };
      photos?: string[];
      condition_snapshot?: Record<string, unknown>;
    }
  ): Promise<GatePass> {
    try {
      // Get current user for guard_id if not provided
      const payload: Record<string, any> = {
        notes: options?.notes || undefined,
      };

      // Include gate_id, guard_id, location if provided
      // Backend should use these to create scan event and movement
      if (options?.gate_id) {
        payload.gate_id = options.gate_id;
      }
      if (options?.guard_id) {
        payload.guard_id = options.guard_id;
      }
      if (options?.location) {
        payload.location = options.location;
      }
      if (options?.photos && options.photos.length > 0) {
        payload.photos = options.photos;
      }
      if (options?.condition_snapshot) {
        payload.condition_snapshot = options.condition_snapshot;
      }

      const response = await apiClient.post<GatePass>(
        `${BASE_URL}/${id}/entry`,
        payload
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Record exit for an access pass
   * Automatically creates scan event and movement with pass_id linkage
   */
  async recordExit(
    id: string,
    options?: {
      notes?: string;
      gate_id?: string;
      guard_id?: number;
      location?: { lat: number; lng: number };
      photos?: string[];
      odometer_km?: number;
      component_snapshot?: Record<string, unknown>;
    }
  ): Promise<GatePass> {
    try {
      const payload: Record<string, any> = {
        notes: options?.notes || undefined,
      };

      // Include gate_id, guard_id, location if provided
      // Backend should use these to create scan event and movement
      if (options?.gate_id) {
        payload.gate_id = options.gate_id;
      }
      if (options?.guard_id) {
        payload.guard_id = options.guard_id;
      }
      if (options?.location) {
        payload.location = options.location;
      }
      if (options?.photos && options.photos.length > 0) {
        payload.photos = options.photos;
      }
      if (options?.odometer_km !== undefined) {
        payload.odometer_km = options.odometer_km;
      }
      if (options?.component_snapshot) {
        payload.component_snapshot = options.component_snapshot;
      }

      const response = await apiClient.post<GatePass>(
        `${BASE_URL}/${id}/exit`,
        payload
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Get guard logs (validation records)
   */
  async getGuardLogs(params?: GuardLogParams): Promise<{
    data: any[];
    total: number;
    page: number;
    per_page: number;
    last_page: number;
  }> {
    try {
      const queryParams: Record<string, any> = {};
      if (params?.date) queryParams.date = params.date;
      if (params?.guard_id) queryParams.guard_id = params.guard_id;
      if (params?.per_page) queryParams.per_page = params.per_page;
      if (params?.page) queryParams.page = params.page;

      const response = await apiClient.get('/v2/gate-passes-guard-logs', {
        params: queryParams,
      });

      const responseData = response.data;
      if (responseData.data) {
        return {
          data: responseData.data,
          total: responseData.total || responseData.pagination?.total || 0,
          page: responseData.page || responseData.pagination?.current_page || 1,
          per_page: responseData.per_page || responseData.pagination?.per_page || 20,
          last_page: responseData.last_page || responseData.pagination?.last_page || 1,
        };
      }

      // Fallback
      const data = Array.isArray(responseData) ? responseData : [];
      return {
        data,
        total: data.length,
        page: 1,
        per_page: data.length,
        last_page: 1,
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

// Export singleton instance
export const accessService = new AccessService();



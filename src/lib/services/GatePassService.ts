/**
 * Gate Pass Service
 * 
 * Service layer for unified Gate Pass API v2
 * Handles all API calls to /api/v2/gate-passes endpoints
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
} from '@/pages/gatepass/gatePassTypes';

const BASE_URL = '/v2/gate-passes';

class GatePassService {
  /**
   * List gate passes with filters
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
   * Get a single gate pass by ID
   */
  async get(id: string): Promise<GatePass> {
    try {
      const response = await apiClient.get<GatePass>(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Create a new gate pass
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
   * Update a gate pass
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
   * Cancel a gate pass (soft delete)
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
   * Record entry for a gate pass
   */
  async recordEntry(id: string, notes?: string): Promise<GatePass> {
    try {
      const response = await apiClient.post<GatePass>(
        `${BASE_URL}/${id}/entry`,
        { notes: notes || undefined }
      );
      return response.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  /**
   * Record exit for a gate pass
   */
  async recordExit(id: string, notes?: string): Promise<GatePass> {
    try {
      const response = await apiClient.post<GatePass>(
        `${BASE_URL}/${id}/exit`,
        { notes: notes || undefined }
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
export const gatePassService = new GatePassService();

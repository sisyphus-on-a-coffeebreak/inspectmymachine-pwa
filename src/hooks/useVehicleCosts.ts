/**
 * Vehicle Costs Hook
 * 
 * Hook for fetching vehicle cost data (Super Admin Only)
 */

import { useQuery } from '@tanstack/react-query';
import { fetchVehicleCosts, fetchVehicleCostBreakdown } from '../lib/services/VehicleCostService';
import type { VehicleCostRecord, VehicleCostBreakdown } from '../lib/services/VehicleCostService';

export interface UseVehicleCostsOptions {
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  /** When false, no request is made. Use when backend does not implement /vehicles/costs yet. */
  enabled?: boolean;
}

/** Backend supports vehicle costs API. Set VITE_VEHICLE_COSTS_ENABLED=false to skip requests until backend implements the endpoint. */
const isVehicleCostsApiEnabled = () =>
  import.meta.env.VITE_VEHICLE_COSTS_ENABLED !== 'false';

/**
 * Hook for fetching vehicle cost records
 */
export function useVehicleCosts(options: UseVehicleCostsOptions = {}) {
  const {
    vehicleId,
    dateFrom,
    dateTo,
    category,
    enabled = true,
  } = options;

  const effectivelyEnabled = enabled && isVehicleCostsApiEnabled();

  return useQuery<VehicleCostRecord[]>({
    queryKey: ['vehicleCosts', vehicleId, dateFrom, dateTo, category],
    queryFn: () => fetchVehicleCosts({
      vehicleId,
      dateFrom,
      dateTo,
      category,
    }),
    enabled: effectivelyEnabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false, // Avoid repeated 404s when backend endpoint is not implemented yet
    retry: false, // Don't retry when endpoint returns 404 (backend may not have /vehicles/costs yet)
  });
}

/**
 * Hook for fetching detailed cost breakdown for a vehicle
 */
export function useVehicleCostBreakdown(
  vehicleId: string | null,
  options: Omit<UseVehicleCostsOptions, 'vehicleId'> = {}
) {
  const {
    dateFrom,
    dateTo,
    category,
    enabled = true,
  } = options;

  return useQuery<VehicleCostBreakdown | null>({
    queryKey: ['vehicleCostBreakdown', vehicleId, dateFrom, dateTo, category],
    queryFn: () => vehicleId ? fetchVehicleCostBreakdown(vehicleId, { dateFrom, dateTo, category }) : null,
    enabled: enabled && !!vehicleId,
    staleTime: 60 * 1000,
  });
}





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
  enabled?: boolean;
}

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

  return useQuery<VehicleCostRecord[]>({
    queryKey: ['vehicleCosts', vehicleId, dateFrom, dateTo, category],
    queryFn: () => fetchVehicleCosts({
      vehicleId,
      dateFrom,
      dateTo,
      category,
    }),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
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




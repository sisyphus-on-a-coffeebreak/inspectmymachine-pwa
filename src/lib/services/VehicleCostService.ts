/**
 * Vehicle Cost Service
 * 
 * Service for tracking costs per vehicle (Super Admin Only)
 * Links expenses to vehicles and calculates running totals
 */

import { apiClient } from '../apiClient';
import type { Expense } from '../queries';

export interface VehicleCostRecord {
  vehicleId: string;
  vehicleRegistration?: string;
  totalCost: number;
  costByCategory: Record<string, number>;
  expenseCount: number;
  lastExpenseDate?: Date;
  lastUpdated: Date;
}

export interface VehicleCostBreakdown {
  vehicleId: string;
  vehicleRegistration?: string;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    date: Date;
    description?: string;
  }>;
  totalCost: number;
  costByCategory: Record<string, number>;
  monthlyCosts: Array<{
    month: string;
    cost: number;
    expenseCount: number;
  }>;
}

/**
 * Fetch vehicle cost records (Super Admin Only)
 */
export async function fetchVehicleCosts(filters?: {
  vehicleId?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
}): Promise<VehicleCostRecord[]> {
  try {
    const response = await apiClient.get('/v1/vehicles/costs', {
      params: filters,
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    const costs = Array.isArray(response.data) ? response.data : response.data?.data || [];
    return costs.map(transformCostRecord);
  } catch (error) {
    // Return empty array if endpoint doesn't exist yet
    return [];
  }
}

/**
 * Fetch detailed cost breakdown for a vehicle
 */
export async function fetchVehicleCostBreakdown(
  vehicleId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    category?: string;
  }
): Promise<VehicleCostBreakdown | null> {
  try {
    const response = await apiClient.get(`/v1/vehicles/${vehicleId}/costs`, {
      params: filters,
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
    
    return transformCostBreakdown(response.data);
  } catch (error) {
    return null;
  }
}

/**
 * Update vehicle cost record when expense is approved
 * This is called automatically by the workflow system
 */
export async function updateVehicleCostOnExpense(
  expenseId: string,
  vehicleId: string,
  amount: number,
  category: string
): Promise<void> {
  try {
    await apiClient.post('/v1/vehicles/costs/update', {
      expense_id: expenseId,
      vehicle_id: vehicleId,
      amount,
      category,
    }, {
      suppressErrorLog: true,
      suppressPermissionError: true,
    });
  } catch (error) {
    // Silently fail if endpoint doesn't exist yet
    console.debug('Vehicle cost update failed (backend may not be ready)');
  }
}

/**
 * Transform backend cost record to frontend format
 */
function transformCostRecord(data: any): VehicleCostRecord {
  return {
    vehicleId: data.vehicle_id || data.vehicleId,
    vehicleRegistration: data.vehicle_registration || data.vehicleRegistration,
    totalCost: data.total_cost || data.totalCost || 0,
    costByCategory: data.cost_by_category || data.costByCategory || {},
    expenseCount: data.expense_count || data.expenseCount || 0,
    lastExpenseDate: data.last_expense_date ? new Date(data.last_expense_date) : undefined,
    lastUpdated: new Date(data.last_updated || data.updated_at || Date.now()),
  };
}

/**
 * Transform backend cost breakdown to frontend format
 */
function transformCostBreakdown(data: any): VehicleCostBreakdown {
  return {
    vehicleId: data.vehicle_id || data.vehicleId,
    vehicleRegistration: data.vehicle_registration || data.vehicleRegistration,
    expenses: (data.expenses || []).map((exp: any) => ({
      id: exp.id || exp.expense_id,
      amount: exp.amount || 0,
      category: exp.category || '',
      date: new Date(exp.date || exp.created_at),
      description: exp.description,
    })),
    totalCost: data.total_cost || data.totalCost || 0,
    costByCategory: data.cost_by_category || data.costByCategory || {},
    monthlyCosts: (data.monthly_costs || data.monthlyCosts || []).map((mc: any) => ({
      month: mc.month,
      cost: mc.cost || 0,
      expenseCount: mc.expense_count || mc.expenseCount || 0,
    })),
  };
}





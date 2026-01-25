/**
 * Smart Defaults Library
 * 
 * Provides intelligent default values for forms based on:
 * - User's role and permissions
 * - Time of day
 * - Recent selections
 * - Context (yard, vehicle, etc.)
 */

import { useAuth } from '../providers/useAuth';
import { useMemo } from 'react';

/**
 * Get default expense category based on time and context
 */
export function getDefaultExpenseCategory(): string {
  const hour = new Date().getHours();
  
  // Morning: likely fuel or breakfast
  if (hour >= 6 && hour < 10) {
    return 'FUEL';
  }
  
  // Lunch time: likely food
  if (hour >= 12 && hour < 14) {
    return 'FOOD';
  }
  
  // Evening: likely lodging or dinner
  if (hour >= 18 && hour < 22) {
    return 'LODGING';
  }
  
  // Default to local transport
  return 'LOCAL_TRANSPORT';
}

/**
 * Get default payment method based on user role and context
 */
/**
 * Get default payment method based on user role and context
 * 
 * ⚠️ MIGRATION: This function still uses role checks for backward compatibility.
 * In the future, this should accept a user object and use capability checks.
 */
export function getDefaultPaymentMethod(role?: string): 'CASH' | 'COMPANY_UPI' | 'PERSONAL_UPI' | 'CARD' {
  // Admins and supervisors typically use company UPI
  // Note: After migration, this should check for expense.approve capability
  if (role === 'admin' || role === 'super_admin' || role === 'supervisor') {
    return 'COMPANY_UPI';
  }
  
  // Others typically use cash or personal UPI
  return 'CASH';
}

/**
 * Get default expense date (today or most recent expense date)
 */
export function getDefaultExpenseDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get default expense time (current time rounded to nearest 15 minutes)
 */
export function getDefaultExpenseTime(): string {
  const now = new Date();
  const minutes = Math.round(now.getMinutes() / 15) * 15;
  const hours = now.getHours();
  const roundedMinutes = minutes === 60 ? 0 : minutes;
  const roundedHours = minutes === 60 ? hours + 1 : hours;
  
  return `${String(roundedHours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
}

/**
 * Get default gate pass validity dates based on pass type
 */
export function getDefaultGatePassValidity(
  passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound'
): { validFrom: string; validTo: string } {
  const now = new Date();
  const validFrom = now.toISOString();
  
  let hoursToAdd = 4; // Default 4 hours
  
  switch (passType) {
    case 'visitor':
      hoursToAdd = 4; // 4 hours for visitors
      break;
    case 'vehicle_outbound':
      hoursToAdd = 24; // 24 hours for vehicle exit
      break;
    case 'vehicle_inbound':
      hoursToAdd = 2; // 2 hours for vehicle entry
      break;
  }
  
  const validTo = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString();
  
  return {
    validFrom,
    validTo,
  };
}

/**
 * Get default yard ID from user context
 */
export function getDefaultYardId(user?: { yard_id?: string | null }): string | undefined {
  return user?.yard_id || undefined;
}

/**
 * Hook for getting smart defaults for expense form
 */
export function useExpenseDefaults() {
  const { user } = useAuth();
  
  return useMemo(() => ({
    category: getDefaultExpenseCategory(),
    paymentMethod: getDefaultPaymentMethod(user?.role),
    date: getDefaultExpenseDate(),
    time: getDefaultExpenseTime(),
    yardId: getDefaultYardId(user),
  }), [user]);
}

/**
 * Hook for getting smart defaults for gate pass form
 */
export function useGatePassDefaults(passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound') {
  const { user } = useAuth();
  
  return useMemo(() => {
    const validity = getDefaultGatePassValidity(passType);
    return {
      validFrom: validity.validFrom,
      validTo: validity.validTo,
      yardId: getDefaultYardId(user),
    };
  }, [passType, user]);
}

/**
 * Get recent selections from localStorage
 */
export function getRecentSelections(key: string, limit: number = 5): string[] {
  try {
    const stored = localStorage.getItem(`recent_${key}`);
    if (!stored) return [];
    const items = JSON.parse(stored) as string[];
    return items.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Save selection to recent list
 */
export function saveRecentSelection(key: string, value: string): void {
  try {
    const recent = getRecentSelections(key, 10);
    const updated = [value, ...recent.filter(v => v !== value)].slice(0, 10);
    localStorage.setItem(`recent_${key}`, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}





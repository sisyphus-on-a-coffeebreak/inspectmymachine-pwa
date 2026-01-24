import type { GatePassPurpose } from '../gatePassTypes';
import {
  DEFAULT_VISITOR_VALIDITY_HOURS,
  DEFAULT_VEHICLE_OUTBOUND_VALIDITY_HOURS,
  DEFAULT_VEHICLE_INBOUND_VALIDITY_HOURS,
  MORNING_HOUR_THRESHOLD,
  GATE_PASS_PURPOSE,
} from '../constants';

/**
 * Smart defaults for gate pass creation
 * Applied automatically based on pass type and time of day
 */

export const GATE_PASS_DEFAULTS = {
  visitor: {
    purpose: GATE_PASS_PURPOSE.INSPECTION as GatePassPurpose,
    validityHours: DEFAULT_VISITOR_VALIDITY_HOURS,
  },
  vehicle_outbound: {
    purpose: (() => {
      const hour = new Date().getHours();
      return hour < MORNING_HOUR_THRESHOLD ? GATE_PASS_PURPOSE.RTO_WORK : GATE_PASS_PURPOSE.SERVICE;
    })() as GatePassPurpose,
    validityHours: DEFAULT_VEHICLE_OUTBOUND_VALIDITY_HOURS,
  },
  vehicle_inbound: {
    purpose: GATE_PASS_PURPOSE.SERVICE as GatePassPurpose,
    validityHours: DEFAULT_VEHICLE_INBOUND_VALIDITY_HOURS,
  },
} as const;

/**
 * Get default purpose for a pass type
 */
export function getDefaultPurpose(
  passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound'
): GatePassPurpose {
  const defaults = GATE_PASS_DEFAULTS[passType];
  if (typeof defaults.purpose === 'function') {
    return defaults.purpose();
  }
  return defaults.purpose;
}

/**
 * Get default validity hours for a pass type
 */
export function getDefaultValidityHours(
  passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound'
): number {
  return GATE_PASS_DEFAULTS[passType].validityHours;
}

/**
 * Calculate default valid_from and valid_to dates
 */
export function getDefaultValidityDates(
  passType: 'visitor' | 'vehicle_outbound' | 'vehicle_inbound'
): { validFrom: string; validTo: string } {
  const hours = getDefaultValidityHours(passType);
  const now = new Date();
  const validTo = new Date(now.getTime() + hours * 60 * 60 * 1000);

  return {
    validFrom: now.toISOString(),
    validTo: validTo.toISOString(),
  };
}













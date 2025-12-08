/**
 * Pass Expiry Utilities
 * 
 * Helper functions for checking pass expiry status and generating reminders
 */

export interface ExpiryStatus {
  isExpired: boolean;
  isExpiringSoon: boolean;
  hoursUntilExpiry: number;
  daysUntilExpiry: number;
  expiryDate: Date | null;
  severity: 'none' | 'warning' | 'critical' | 'expired';
  message: string;
}

/**
 * Calculate expiry status for a pass
 * 
 * @param validTo - The valid_to date string from the pass
 * @param reminderHours - Hours before expiry to show warning (default: 24)
 * @param criticalHours - Hours before expiry to show critical warning (default: 1)
 * @returns ExpiryStatus object with details
 */
export function calculateExpiryStatus(
  validTo: string | null | undefined,
  reminderHours: number = 24,
  criticalHours: number = 1
): ExpiryStatus {
  if (!validTo) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      hoursUntilExpiry: Infinity,
      daysUntilExpiry: Infinity,
      expiryDate: null,
      severity: 'none',
      message: 'No expiry date set',
    };
  }

  const now = new Date();
  const expiryDate = new Date(validTo);
  const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const daysUntilExpiry = hoursUntilExpiry / 24;

  const isExpired = hoursUntilExpiry < 0;
  const isExpiringSoon = !isExpired && hoursUntilExpiry <= reminderHours;

  let severity: 'none' | 'warning' | 'critical' | 'expired' = 'none';
  let message = '';

  if (isExpired) {
    severity = 'expired';
    const hoursAgo = Math.abs(Math.floor(hoursUntilExpiry));
    if (hoursAgo < 24) {
      message = `Expired ${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} ago`;
    } else {
      const daysAgo = Math.floor(hoursAgo / 24);
      message = `Expired ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
  } else if (hoursUntilExpiry <= criticalHours) {
    severity = 'critical';
    const minutes = Math.floor(hoursUntilExpiry * 60);
    if (minutes <= 0) {
      message = 'Expiring very soon';
    } else if (minutes < 60) {
      message = `Expires in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      message = `Expires in ${Math.floor(hoursUntilExpiry)} hour${Math.floor(hoursUntilExpiry) !== 1 ? 's' : ''}`;
    }
  } else if (isExpiringSoon) {
    severity = 'warning';
    if (daysUntilExpiry < 1) {
      message = `Expires in ${Math.floor(hoursUntilExpiry)} hour${Math.floor(hoursUntilExpiry) !== 1 ? 's' : ''}`;
    } else if (daysUntilExpiry < 2) {
      message = `Expires in ${Math.floor(daysUntilExpiry)} day`;
    } else {
      message = `Expires in ${Math.floor(daysUntilExpiry)} days`;
    }
  } else {
    severity = 'none';
    message = `Expires on ${expiryDate.toLocaleDateString()}`;
  }

  return {
    isExpired,
    isExpiringSoon,
    hoursUntilExpiry,
    daysUntilExpiry,
    expiryDate,
    severity,
    message,
  };
}

/**
 * Get passes expiring soon from a list
 * 
 * @param passes - Array of passes with valid_to field
 * @param hoursThreshold - Hours before expiry to consider "soon" (default: 24)
 * @returns Array of passes expiring soon
 */
export function getExpiringPasses<T extends { valid_to?: string | null }>(
  passes: T[],
  hoursThreshold: number = 24
): T[] {
  const now = new Date();
  return passes.filter((pass) => {
    if (!pass.valid_to) return false;
    const expiryDate = new Date(pass.valid_to);
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= hoursThreshold;
  });
}

/**
 * Get expired passes from a list
 * 
 * @param passes - Array of passes with valid_to field
 * @returns Array of expired passes
 */
export function getExpiredPasses<T extends { valid_to?: string | null }>(
  passes: T[]
): T[] {
  const now = new Date();
  return passes.filter((pass) => {
    if (!pass.valid_to) return false;
    const expiryDate = new Date(pass.valid_to);
    return expiryDate < now;
  });
}

/**
 * Get expiry badge color based on severity
 */
export function getExpiryBadgeColor(severity: ExpiryStatus['severity']): string {
  switch (severity) {
    case 'expired':
      return '#ef4444'; // error[500]
    case 'critical':
      return '#f59e0b'; // warning[500]
    case 'warning':
      return '#fbbf24'; // brandLight
    default:
      return '#6b7280'; // neutral[500]
  }
}




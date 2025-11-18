/**
 * Stockyard Utility Functions
 * 
 * Helper functions for stockyard operations
 */

import type {
  StockyardRequest,
  YardSlot,
  Checklist,
  StockyardDocument,
  BuyerReadinessStage,
  StockyardAlert,
} from './stockyard';

/**
 * Calculate days since entry for a stockyard request
 */
export function calculateDaysSinceEntry(request: StockyardRequest): number {
  if (!request.scan_in_at) return 0;
  if (request.scan_out_at) return 0; // Vehicle has exited

  const entryDate = new Date(request.scan_in_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - entryDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a vehicle is currently in the yard
 */
export function isVehicleInYard(request: StockyardRequest): boolean {
  return request.status === 'Approved' && !!request.scan_in_at && !request.scan_out_at;
}

/**
 * Get slot utilization percentage
 */
export function getSlotUtilization(slot: YardSlot): number {
  if (slot.capacity === 0) return 0;
  return Math.round((slot.current_occupancy / slot.capacity) * 100);
}

/**
 * Check if slot is available for assignment
 */
export function isSlotAvailable(slot: YardSlot): boolean {
  return (
    slot.status === 'available' &&
    slot.current_occupancy < slot.capacity &&
    (!slot.reserved_until || new Date(slot.reserved_until) < new Date())
  );
}

/**
 * Get checklist completion percentage
 */
export function getChecklistCompletion(checklist: Checklist): number {
  if (!checklist.items || checklist.items.length === 0) return 0;
  const completed = checklist.items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '').length;
  return Math.round((completed / checklist.items.length) * 100);
}

/**
 * Check if checklist can be completed
 */
export function canCompleteChecklist(checklist: Checklist): { canComplete: boolean; missingRequired: number } {
  if (!checklist.items) return { canComplete: true, missingRequired: 0 };
  
  const requiredItems = checklist.items.filter((item) => item.required);
  const incompleteRequired = requiredItems.filter((item) => !item.value || item.value === '').length;
  
  return {
    canComplete: incompleteRequired === 0,
    missingRequired: incompleteRequired,
  };
}

/**
 * Get compliance status for a stockyard request
 */
export function getComplianceStatus(documents: StockyardDocument[]): {
  complete: boolean;
  missing: string[];
  expiring: string[];
  expired: string[];
} {
  const requiredTypes = ['rc_book', 'insurance', 'pollution_certificate'] as const;
  
  const missing: string[] = [];
  const expiring: string[] = [];
  const expired: string[] = [];
  
  requiredTypes.forEach((type) => {
    const doc = documents.find((d) => d.document_type === type && d.status === 'complete');
    if (!doc) {
      missing.push(type);
    } else if (doc.expires_at) {
      const expiryDate = new Date(doc.expires_at);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        expired.push(type);
      } else if (daysUntilExpiry <= 30) {
        expiring.push(type);
      }
    }
  });
  
  return {
    complete: missing.length === 0 && expired.length === 0,
    missing,
    expiring,
    expired,
  };
}

/**
 * Get next buyer readiness stage
 */
export function getNextBuyerReadinessStage(currentStage: BuyerReadinessStage): BuyerReadinessStage | null {
  const stages: BuyerReadinessStage[] = [
    'awaiting_inspection',
    'ready_to_photograph',
    'awaiting_detailing',
    'ready_for_listing',
    'listed',
  ];
  
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex === stages.length - 1) return null;
  return stages[currentIndex + 1];
}

/**
 * Get previous buyer readiness stage
 */
export function getPreviousBuyerReadinessStage(currentStage: BuyerReadinessStage): BuyerReadinessStage | null {
  const stages: BuyerReadinessStage[] = [
    'awaiting_inspection',
    'ready_to_photograph',
    'awaiting_detailing',
    'ready_for_listing',
    'listed',
  ];
  
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex <= 0) return null;
  return stages[currentIndex - 1];
}

/**
 * Format days since entry for display
 */
export function formatDaysSinceEntry(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return remainingDays > 0 ? `${weeks} week${weeks !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  return remainingDays > 0 ? `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}` : `${months} month${months !== 1 ? 's' : ''}`;
}

/**
 * Get alert priority score (higher = more urgent)
 */
export function getAlertPriority(alert: StockyardAlert): number {
  let score = 0;
  
  // Severity weight
  switch (alert.severity) {
    case 'critical':
      score += 100;
      break;
    case 'warning':
      score += 50;
      break;
    case 'info':
      score += 10;
      break;
  }
  
  // Unacknowledged alerts are more urgent
  if (!alert.acknowledged) {
    score += 20;
  }
  
  // Age of alert (older = more urgent if unacknowledged)
  if (!alert.acknowledged) {
    const ageInHours = (new Date().getTime() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60);
    score += Math.min(ageInHours, 48); // Cap at 48 hours
  }
  
  return score;
}

/**
 * Sort alerts by priority
 */
export function sortAlertsByPriority(alerts: StockyardAlert[]): StockyardAlert[] {
  return [...alerts].sort((a, b) => getAlertPriority(b) - getAlertPriority(a));
}

/**
 * Check if a document type is required
 */
export function isDocumentTypeRequired(documentType: string): boolean {
  const requiredTypes = ['rc_book', 'insurance', 'pollution_certificate'];
  return requiredTypes.includes(documentType);
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    rc_book: 'RC Book',
    insurance: 'Insurance',
    pollution_certificate: 'Pollution Certificate',
    fitness_certificate: 'Fitness Certificate',
    permit: 'Permit',
    noc: 'NOC',
    other: 'Other',
  };
  return labels[documentType] || documentType;
}

/**
 * Format slot status for display
 */
export function formatSlotStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    maintenance: 'Maintenance',
    blocked: 'Blocked',
  };
  return statusLabels[status] || status;
}

/**
 * Get slot status color
 */
export function getSlotStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: '#10b981', // green
    occupied: '#2563eb', // blue
    reserved: '#f59e0b', // orange
    maintenance: '#ef4444', // red
    blocked: '#6b7280', // gray
  };
  return colors[status] || '#6b7280';
}



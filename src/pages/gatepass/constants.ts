/**
 * Gate Pass Module Constants
 * Centralized constants to avoid magic numbers and strings
 */

// Time constants (in hours)
export const EXPIRY_WARNING_HOURS = 24;
export const VEHICLE_OUT_ALERT_HOURS = 24;
export const SCAN_HISTORY_RETENTION_HOURS = 24;
export const VISITOR_LONG_STAY_HOURS = 8;

// Time constants (in minutes)
export const SCAN_DEDUPLICATION_MINUTES = 5;

// Time constants (in milliseconds)
export const PENDING_APPROVALS_REFRESH_INTERVAL_MS = 30000; // 30 seconds
export const DEBOUNCE_DELAY_MS = 300; // 300ms

// Default validity hours for pass types
export const DEFAULT_VISITOR_VALIDITY_HOURS = 4;
export const DEFAULT_VEHICLE_OUTBOUND_VALIDITY_HOURS = 24;
export const DEFAULT_VEHICLE_INBOUND_VALIDITY_HOURS = 2;

// Time of day thresholds
export const MORNING_HOUR_THRESHOLD = 12; // Noon (12 PM)

// Validation constants
export const ACCESS_CODE_LENGTH = 6;
export const MAX_PASS_NUMBER_LENGTH = 20;
export const MAX_VISITOR_NAME_LENGTH = 255;
export const MAX_PHONE_LENGTH = 10;
export const MIN_PHONE_LENGTH = 10;

// Status constants
export const GATE_PASS_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  INSIDE: 'inside',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

// Pass type constants
export const GATE_PASS_TYPE = {
  VISITOR: 'visitor',
  VEHICLE_INBOUND: 'vehicle_inbound',
  VEHICLE_OUTBOUND: 'vehicle_outbound',
} as const;

// Purpose constants
export const GATE_PASS_PURPOSE = {
  INSPECTION: 'inspection',
  SERVICE: 'service',
  DELIVERY: 'delivery',
  MEETING: 'meeting',
  RTO_WORK: 'rto_work',
  SOLD: 'sold',
  TEST_DRIVE: 'test_drive',
  AUCTION: 'auction',
  OTHER: 'other',
} as const;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const USER_LIST_LIMIT = 100;

// Scan history constants
export const MAX_SCAN_HISTORY = 10;

// API timeout constants (in milliseconds)
export const API_TIMEOUT = 30000; // 30 seconds
export const RETRY_DELAY = 1000; // 1 second

// PNG generation constants
export const PNG_CANVAS_WIDTH = 1200;
export const PNG_CANVAS_HEIGHT = 1600;
export const PNG_QR_SIZE = 600;

// Error message constants
export const ERROR_MESSAGES = {
  // General errors
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  
  // Gate pass specific errors
  CREATE_FAILED: 'Failed to create gate pass. Please try again.',
  UPDATE_FAILED: 'Failed to update gate pass. Please try again.',
  DELETE_FAILED: 'Failed to delete gate pass. Please try again.',
  FETCH_FAILED: 'Failed to load gate passes. Please try again.',
  FETCH_DETAILS_FAILED: 'Failed to load gate pass details. Please try again.',
  RECORD_ENTRY_FAILED: 'Failed to record entry. Please try again.',
  RECORD_EXIT_FAILED: 'Failed to record exit. Please try again.',
  CANCEL_FAILED: 'Failed to cancel gate pass. Please try again.',
  APPROVE_FAILED: 'Failed to approve gate pass. Please try again.',
  REJECT_FAILED: 'Failed to reject gate pass. Please try again.',
  VALIDATE_FAILED: 'Failed to validate gate pass. Please try again.',
  DOWNLOAD_PDF_FAILED: 'Failed to download PDF. Please try again.',
  DOWNLOAD_PNG_FAILED: 'Failed to download PNG. Please try again.',
  QR_CODE_GENERATION_FAILED: 'Failed to generate QR code. Please try again.',
  
  // Validation errors
  VEHICLE_REQUIRED: 'Please select a vehicle.',
  VISITOR_NAME_REQUIRED: 'Please enter visitor name.',
  PURPOSE_REQUIRED: 'Please select a purpose.',
  VALIDITY_REQUIRED: 'Please set validity dates.',
  VEHICLES_TO_VIEW_REQUIRED: 'Please select at least one vehicle to view.',
  
  // Not found errors
  PASS_NOT_FOUND: 'Gate pass not found.',
  VEHICLE_NOT_FOUND: 'Vehicle not found.',
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_DELAY_MULTIPLIER: 2, // Exponential backoff
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504], // Timeout, rate limit, server errors
} as const;


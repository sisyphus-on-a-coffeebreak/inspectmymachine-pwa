/**
 * Security API Client
 * 
 * Provides functions for security monitoring and management:
 * - Security metrics
 * - Failed login attempts
 * - Account lockout status
 * - Security events
 */

import { apiClient } from './apiClient';

/**
 * Security metrics overview
 */
export interface SecurityMetrics {
  active_sessions: number;
  failed_logins_24h: number;
  locked_accounts: number;
  suspicious_activities: number;
  new_devices_7d: number;
  password_changes_7d: number;
}

/**
 * Failed login attempt record
 */
export interface FailedLoginAttempt {
  id: string;
  email: string;
  employee_id?: string;
  ip_address: string;
  user_agent: string;
  reason: 'invalid_credentials' | 'account_locked' | 'account_inactive' | 'unknown';
  created_at: string;
}

/**
 * Locked account record
 */
export interface LockedAccount {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  locked_at: string;
  lock_reason: 'failed_attempts' | 'admin_action' | 'security_concern';
  failed_attempts: number;
  unlock_at?: string;
}

/**
 * Security event
 */
export interface SecurityEvent {
  id: string;
  type: 
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'password_changed'
    | 'password_reset'
    | 'account_locked'
    | 'account_unlocked'
    | 'permission_denied'
    | 'new_device'
    | 'suspicious_activity';
  user_id?: number;
  user_name?: string;
  ip_address: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
}

/**
 * Security events response
 */
export interface SecurityEventsResponse {
  data: SecurityEvent[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Failed logins response
 */
export interface FailedLoginsResponse {
  data: FailedLoginAttempt[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Get security metrics overview
 */
export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  try {
    const response = await apiClient.get<SecurityMetrics>('/v1/security/metrics');
    return response.data;
  } catch (error) {
    console.error('[security] Failed to fetch security metrics:', error);
    throw error;
  }
}

/**
 * Get recent failed login attempts
 */
export async function getFailedLogins(params?: {
  page?: number;
  per_page?: number;
  hours?: number;
}): Promise<FailedLoginsResponse> {
  try {
    const response = await apiClient.get<FailedLoginsResponse>('/v1/security/failed-logins', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('[security] Failed to fetch failed logins:', error);
    throw error;
  }
}

/**
 * Get locked accounts
 */
export async function getLockedAccounts(): Promise<{ data: LockedAccount[] }> {
  try {
    const response = await apiClient.get<{ data: LockedAccount[] }>('/v1/security/locked-accounts');
    return response.data;
  } catch (error) {
    console.error('[security] Failed to fetch locked accounts:', error);
    throw error;
  }
}

/**
 * Unlock a locked account
 */
export async function unlockAccount(userId: number): Promise<void> {
  try {
    await apiClient.post(`/v1/security/unlock-account/${userId}`);
  } catch (error) {
    console.error('[security] Failed to unlock account:', error);
    throw error;
  }
}

/**
 * Lock a user account
 */
export async function lockAccount(userId: number, reason?: string): Promise<void> {
  try {
    await apiClient.post(`/v1/security/lock-account/${userId}`, { reason });
  } catch (error) {
    console.error('[security] Failed to lock account:', error);
    throw error;
  }
}

/**
 * Get security events
 */
export async function getSecurityEvents(params?: {
  page?: number;
  per_page?: number;
  type?: SecurityEvent['type'];
  severity?: SecurityEvent['severity'];
  user_id?: number;
}): Promise<SecurityEventsResponse> {
  try {
    const response = await apiClient.get<SecurityEventsResponse>('/v1/security/events', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('[security] Failed to fetch security events:', error);
    throw error;
  }
}

/**
 * Get color for event severity
 */
export function getSeverityColor(severity: SecurityEvent['severity']): string {
  switch (severity) {
    case 'critical':
      return '#EF4444'; // Red
    case 'warning':
      return '#F59E0B'; // Amber
    case 'info':
    default:
      return '#3B82F6'; // Blue
  }
}

/**
 * Get icon for event type
 */
export function getEventTypeIcon(type: SecurityEvent['type']): string {
  switch (type) {
    case 'login_success':
      return '✅';
    case 'login_failed':
      return '❌';
    case 'logout':
      return '🚪';
    case 'password_changed':
      return '🔑';
    case 'password_reset':
      return '🔄';
    case 'account_locked':
      return '🔒';
    case 'account_unlocked':
      return '🔓';
    case 'permission_denied':
      return '⛔';
    case 'new_device':
      return '📱';
    case 'suspicious_activity':
      return '⚠️';
    default:
      return '📋';
  }
}

/**
 * Get human-readable label for event type
 */
export function getEventTypeLabel(type: SecurityEvent['type']): string {
  switch (type) {
    case 'login_success':
      return 'Login Success';
    case 'login_failed':
      return 'Login Failed';
    case 'logout':
      return 'Logout';
    case 'password_changed':
      return 'Password Changed';
    case 'password_reset':
      return 'Password Reset';
    case 'account_locked':
      return 'Account Locked';
    case 'account_unlocked':
      return 'Account Unlocked';
    case 'permission_denied':
      return 'Permission Denied';
    case 'new_device':
      return 'New Device Login';
    case 'suspicious_activity':
      return 'Suspicious Activity';
    default:
      return 'Unknown Event';
  }
}






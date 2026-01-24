/**
 * Session Management API Client
 * 
 * Provides functions for managing user sessions:
 * - List active sessions
 * - View session details
 * - Terminate sessions (single or all)
 * - Get login history
 */

import { apiClient } from './apiClient';

/**
 * Represents an active user session
 */
export interface Session {
  id: string;
  user_id: number;
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location?: {
    city?: string;
    country?: string;
    region?: string;
  };
  is_current: boolean;
  last_activity: string;
  created_at: string;
  expires_at?: string;
}

/**
 * Login history entry
 */
export interface LoginHistoryEntry {
  id: string;
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  location?: {
    city?: string;
    country?: string;
  };
  status: 'success' | 'failed';
  failure_reason?: string;
  created_at: string;
}

/**
 * Session management response
 */
export interface SessionsResponse {
  data: Session[];
  current_session_id: string;
}

/**
 * Login history response
 */
export interface LoginHistoryResponse {
  data: LoginHistoryEntry[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

/**
 * Get all active sessions for the current user
 */
export async function getActiveSessions(): Promise<SessionsResponse> {
  try {
    const response = await apiClient.get<SessionsResponse>('/v1/sessions');
    return response.data;
  } catch (error) {
    console.error('[sessions] Failed to fetch active sessions:', error);
    throw error;
  }
}

/**
 * Terminate a specific session
 * @param sessionId - The ID of the session to terminate
 */
export async function terminateSession(sessionId: string): Promise<void> {
  try {
    await apiClient.delete(`/v1/sessions/${sessionId}`);
  } catch (error) {
    console.error('[sessions] Failed to terminate session:', error);
    throw error;
  }
}

/**
 * Terminate all sessions except the current one
 */
export async function terminateAllOtherSessions(): Promise<{ terminated_count: number }> {
  try {
    const response = await apiClient.post<{ terminated_count: number }>('/v1/sessions/terminate-all');
    return response.data;
  } catch (error) {
    console.error('[sessions] Failed to terminate all sessions:', error);
    throw error;
  }
}

/**
 * Get login history for the current user
 * @param params - Pagination parameters
 */
export async function getLoginHistory(params?: {
  page?: number;
  per_page?: number;
}): Promise<LoginHistoryResponse> {
  try {
    const response = await apiClient.get<LoginHistoryResponse>('/v1/login-history', {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('[sessions] Failed to fetch login history:', error);
    throw error;
  }
}

/**
 * Parse user agent string to extract device info
 */
export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
} {
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  
  // Browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }
  
  // OS detection
  if (userAgent.includes('Windows')) {
    os = 'Windows';
    deviceType = 'desktop';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
    deviceType = 'desktop';
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    os = 'Linux';
    deviceType = 'desktop';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    deviceType = userAgent.includes('Tablet') ? 'tablet' : 'mobile';
  } else if (userAgent.includes('iPhone')) {
    os = 'iOS';
    deviceType = 'mobile';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
    deviceType = 'tablet';
  }
  
  return { browser, os, deviceType };
}

/**
 * Get device icon based on device type
 */
export function getDeviceIcon(deviceType: Session['device_type']): string {
  switch (deviceType) {
    case 'desktop':
      return '💻';
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📲';
    default:
      return '🖥️';
  }
}

/**
 * Format relative time for session display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}








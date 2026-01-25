/**
 * Permission Management API Client
 * 
 * Provides API functions for managing enhanced permissions:
 * - Enhanced capabilities CRUD
 * - Permission templates
 * - Permission testing
 * - Data masking rules
 */

import { apiClient } from '../apiClient';
import type { 
  EnhancedCapability, 
  PermissionTemplate, 
  DataMaskingRule,
  PermissionCheckContext 
} from './types';

// ========================================
// Enhanced Capabilities API
// ========================================

/**
 * Add enhanced capability to user
 */
export async function addEnhancedCapability(
  userId: number,
  capability: Omit<EnhancedCapability, 'granted_at' | 'granted_by'>
): Promise<EnhancedCapability> {
  const response = await apiClient.post<{ data: EnhancedCapability }>(
    `/v1/users/${userId}/enhanced-capabilities`,
    capability
  );
  return response.data.data || response.data;
}

/**
 * Update enhanced capability
 */
export async function updateEnhancedCapability(
  userId: number,
  capabilityId: string | number,
  updates: Partial<EnhancedCapability>
): Promise<EnhancedCapability> {
  const response = await apiClient.put<{ data: EnhancedCapability }>(
    `/v1/users/${userId}/enhanced-capabilities/${capabilityId}`,
    updates
  );
  return response.data.data || response.data;
}

/**
 * Remove enhanced capability
 */
export async function removeEnhancedCapability(
  userId: number,
  capabilityId: string | number
): Promise<void> {
  await apiClient.delete(`/v1/users/${userId}/enhanced-capabilities/${capabilityId}`);
}

/**
 * Get user's enhanced capabilities
 */
export async function getUserEnhancedCapabilities(
  userId: number
): Promise<EnhancedCapability[]> {
  const response = await apiClient.get<{ data: EnhancedCapability[] } | EnhancedCapability[]>(
    `/v1/users/${userId}/enhanced-capabilities`
  );
  
  // Handle both response formats
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.data || [];
}

// ========================================
// Permission Templates API
// ========================================

/**
 * Get all permission templates
 */
export async function getPermissionTemplates(): Promise<PermissionTemplate[]> {
  const response = await apiClient.get<{ data: PermissionTemplate[] } | PermissionTemplate[]>(
    '/v1/permission-templates'
  );
  
  // Handle both response formats
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.data || [];
}

/**
 * Get a single permission template
 */
export async function getPermissionTemplate(id: number): Promise<PermissionTemplate> {
  const response = await apiClient.get<{ data: PermissionTemplate } | PermissionTemplate>(
    `/v1/permission-templates/${id}`
  );
  
  if ('data' in response.data) {
    return response.data.data;
  }
  return response.data as PermissionTemplate;
}

/**
 * Create permission template
 */
export async function createPermissionTemplate(
  template: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>
): Promise<PermissionTemplate> {
  const response = await apiClient.post<{ data: PermissionTemplate }>(
    '/v1/permission-templates',
    template
  );
  return response.data.data || response.data;
}

/**
 * Update permission template
 */
export async function updatePermissionTemplate(
  id: number,
  updates: Partial<Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_system_template'>>
): Promise<PermissionTemplate> {
  const response = await apiClient.put<{ data: PermissionTemplate }>(
    `/v1/permission-templates/${id}`,
    updates
  );
  return response.data.data || response.data;
}

/**
 * Delete permission template
 */
export async function deletePermissionTemplate(id: number): Promise<void> {
  await apiClient.delete(`/v1/permission-templates/${id}`);
}

/**
 * Apply template to user
 */
export async function applyPermissionTemplate(
  templateId: number,
  userId: number,
  mode: 'replace' | 'merge' = 'merge'
): Promise<void> {
  await apiClient.post(
    `/v1/permission-templates/${templateId}/apply/${userId}`,
    { mode }
  );
}

// ========================================
// Permission Testing API
// ========================================

/**
 * Test permission check
 */
export async function testPermissionCheck(
  userId: number,
  module: string,
  action: string,
  context?: PermissionCheckContext
): Promise<{ allowed: boolean; reason?: string; details: any }> {
  const response = await apiClient.post<{ data: any }>(
    '/v1/permissions/check',
    { user_id: userId, module, action, context }
  );
  return response.data.data || response.data;
}

/**
 * Bulk permission check
 */
export async function testBulkPermissionCheck(
  userId: number,
  checks: Array<{ module: string; action: string; context?: PermissionCheckContext }>
): Promise<Record<string, { allowed: boolean; reason?: string; details: any }>> {
  const response = await apiClient.post<{ data: Record<string, any> }>(
    '/v1/permissions/check-bulk',
    { user_id: userId, checks }
  );
  return response.data.data || response.data;
}

// ========================================
// Data Masking Rules API
// ========================================

/**
 * Get all data masking rules
 */
export async function getDataMaskingRules(): Promise<DataMaskingRule[]> {
  const response = await apiClient.get<{ data: DataMaskingRule[] } | DataMaskingRule[]>(
    '/v1/masking-rules'
  );
  
  // Handle both response formats
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.data || [];
}

/**
 * Get data masking rules for a specific module
 */
export async function getDataMaskingRulesByModule(module: string): Promise<DataMaskingRule[]> {
  const response = await apiClient.get<{ data: DataMaskingRule[] } | DataMaskingRule[]>(
    `/v1/masking-rules?module=${module}`
  );
  
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.data || [];
}

/**
 * Create data masking rule
 */
export async function createDataMaskingRule(
  rule: Omit<DataMaskingRule, 'id'>
): Promise<DataMaskingRule> {
  const response = await apiClient.post<{ data: DataMaskingRule }>(
    '/v1/masking-rules',
    rule
  );
  return response.data.data || response.data;
}

/**
 * Update data masking rule
 */
export async function updateDataMaskingRule(
  id: number,
  updates: Partial<DataMaskingRule>
): Promise<DataMaskingRule> {
  const response = await apiClient.put<{ data: DataMaskingRule }>(
    `/v1/masking-rules/${id}`,
    updates
  );
  return response.data.data || response.data;
}

/**
 * Delete data masking rule
 */
export async function deleteDataMaskingRule(id: number): Promise<void> {
  await apiClient.delete(`/v1/masking-rules/${id}`);
}










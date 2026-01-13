/**
 * React Query Hooks for Permission Management
 * 
 * Provides hooks for managing enhanced permissions:
 * - Enhanced capabilities CRUD
 * - Permission templates
 * - Permission testing
 * - Data masking rules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from '../queries';
import * as api from './api';
import type { EnhancedCapability, PermissionTemplate, DataMaskingRule } from './types';

// ========================================
// Enhanced Capabilities Hooks
// ========================================

/**
 * Get user's enhanced capabilities
 */
export function useEnhancedCapabilities(
  userId: number,
  options?: Omit<UseQueryOptions<EnhancedCapability[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['users', userId, 'enhanced-capabilities'],
    queryFn: () => api.getUserEnhancedCapabilities(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Add enhanced capability
 */
export function useAddEnhancedCapability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, capability }: { userId: number; capability: Omit<EnhancedCapability, 'granted_at' | 'granted_by'> }) =>
      api.addEnhancedCapability(userId, capability),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['users', variables.userId, 'enhanced-capabilities']
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId.toString()) });
    },
  });
}

/**
 * Update enhanced capability
 */
export function useUpdateEnhancedCapability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, capabilityId, updates }: { userId: number; capabilityId: string | number; updates: Partial<EnhancedCapability> }) =>
      api.updateEnhancedCapability(userId, capabilityId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['users', variables.userId, 'enhanced-capabilities']
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId.toString()) });
    },
  });
}

/**
 * Remove enhanced capability
 */
export function useRemoveEnhancedCapability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, capabilityId }: { userId: number; capabilityId: string | number }) =>
      api.removeEnhancedCapability(userId, capabilityId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['users', variables.userId, 'enhanced-capabilities']
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId.toString()) });
    },
  });
}

// ========================================
// Permission Templates Hooks
// ========================================

/**
 * Get permission templates
 */
export function usePermissionTemplates(
  options?: Omit<UseQueryOptions<PermissionTemplate[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['permission-templates'],
    queryFn: api.getPermissionTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Get a single permission template
 */
export function usePermissionTemplate(
  id: number,
  options?: Omit<UseQueryOptions<PermissionTemplate, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['permission-templates', id],
    queryFn: () => api.getPermissionTemplate(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Create permission template
 */
export function useCreatePermissionTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (template: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) =>
      api.createPermissionTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
    },
  });
}

/**
 * Update permission template
 */
export function useUpdatePermissionTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_system_template'>> }) =>
      api.updatePermissionTemplate(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
      queryClient.invalidateQueries({ queryKey: ['permission-templates', variables.id] });
    },
  });
}

/**
 * Delete permission template
 */
export function useDeletePermissionTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deletePermissionTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-templates'] });
    },
  });
}

/**
 * Apply permission template to user
 */
export function useApplyPermissionTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, userId, mode }: { templateId: number; userId: number; mode?: 'replace' | 'merge' }) =>
      api.applyPermissionTemplate(templateId, userId, mode),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.userId.toString()) });
      queryClient.invalidateQueries({
        queryKey: ['users', variables.userId, 'enhanced-capabilities']
      });
    },
  });
}

// ========================================
// Permission Testing Hooks
// ========================================

/**
 * Test permission check
 */
export function useTestPermissionCheck() {
  return useMutation({
    mutationFn: ({ userId, module, action, context }: { 
      userId: number; 
      module: string; 
      action: string; 
      context?: any 
    }) =>
      api.testPermissionCheck(userId, module, action, context),
  });
}

/**
 * Test bulk permission check
 */
export function useTestBulkPermissionCheck() {
  return useMutation({
    mutationFn: ({ userId, checks }: { 
      userId: number; 
      checks: Array<{ module: string; action: string; context?: any }> 
    }) =>
      api.testBulkPermissionCheck(userId, checks),
  });
}

// ========================================
// Data Masking Rules Hooks
// ========================================

/**
 * Get data masking rules
 */
export function useDataMaskingRules(
  options?: Omit<UseQueryOptions<DataMaskingRule[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['data-masking-rules'],
    queryFn: api.getDataMaskingRules,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

/**
 * Get data masking rules by module
 */
export function useDataMaskingRulesByModule(
  module: string,
  options?: Omit<UseQueryOptions<DataMaskingRule[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['data-masking-rules', module],
    queryFn: () => api.getDataMaskingRulesByModule(module),
    enabled: !!module,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
}

/**
 * Create data masking rule
 */
export function useCreateDataMaskingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: Omit<DataMaskingRule, 'id'>) =>
      api.createDataMaskingRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-masking-rules'] });
    },
  });
}

/**
 * Update data masking rule
 */
export function useUpdateDataMaskingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<DataMaskingRule> }) =>
      api.updateDataMaskingRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-masking-rules'] });
    },
  });
}

/**
 * Delete data masking rule
 */
export function useDeleteDataMaskingRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => api.deleteDataMaskingRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-masking-rules'] });
    },
  });
}






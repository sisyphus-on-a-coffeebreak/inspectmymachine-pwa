/**
 * UserForm Component
 * 
 * Reusable form component for creating and editing users
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/useAuth';
import { hasCapability, type CreateUserPayload, type UpdateUserPayload, type UserCapabilities } from '@/lib/users';
import { EnhancedCapabilityEditor } from '@/components/permissions/EnhancedCapabilityEditor';
import type { EnhancedCapability } from '@/lib/permissions/types';
import {
  useEnhancedCapabilities,
  useAddEnhancedCapability,
  useUpdateEnhancedCapability,
  useRemoveEnhancedCapability,
} from '@/lib/permissions/queries';
import { Button } from '../ui/button';
import { colors, typography, spacing, borderRadius } from '@/lib/theme';
import type { CapabilityModule, CapabilityAction } from '@/lib/users';

export interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<CreateUserPayload> & { id?: number };
  onSubmit: (data: CreateUserPayload | UpdateUserPayload, enhancedCapabilities?: EnhancedCapability[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Capability Matrix Editor Component (extracted from UserManagement)
function CapabilityMatrixEditor({
  capabilities,
  onChange,
}: {
  capabilities?: UserCapabilities;
  onChange: (capabilities: UserCapabilities) => void;
}) {
  const modules: CapabilityModule[] = ['stockyard', 'inspection', 'expense', 'user_management', 'reports'];
  const actions: CapabilityAction[] = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

  const moduleLabels: Record<CapabilityModule, string> = {
    stockyard: 'Stockyard',
    inspection: 'Inspection',
    expense: 'Expense',
    user_management: 'User Management',
    reports: 'Reports',
  };

  const actionLabels: Record<CapabilityAction, string> = {
    create: 'Create',
    read: 'Read',
    update: 'Update',
    delete: 'Delete',
    approve: 'Approve',
    validate: 'Validate',
    review: 'Review',
    reassign: 'Reassign',
    export: 'Export',
  };

  const toggleCapability = (module: CapabilityModule, action: CapabilityAction) => {
    const current = capabilities?.[module] || [];
    const newCapabilities = { ...capabilities };

    if (current.includes(action)) {
      newCapabilities[module] = current.filter((a) => a !== action);
    } else {
      newCapabilities[module] = [...current, action];
    }

    // Remove empty arrays
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }

    onChange(newCapabilities);
  };

  const hasCap = (module: CapabilityModule, action: CapabilityAction): boolean => {
    return capabilities?.[module]?.includes(action) ?? false;
  };

  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.neutral[200]}`,
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
        Select capabilities for each module. Capabilities override role-based permissions.
        <br />
        <strong>Note:</strong> For Stockyard module, use Enhanced Capabilities below to assign function-specific permissions (Access Control, Inventory, Movements).
      </div>
      <div style={{ display: 'grid', gap: spacing.md }}>
        {modules.map((module) => (
          <div
            key={module}
            style={{
              padding: spacing.sm,
              backgroundColor: 'white',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.neutral[200]}`,
            }}
          >
            <div style={{ ...typography.label, marginBottom: spacing.xs, fontSize: '13px' }}>
              {moduleLabels[module]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
              {actions.map((action) => {
                // Filter actions by module relevance
                if (module === 'stockyard' && !['create', 'read', 'update', 'delete', 'approve', 'validate'].includes(action))
                  return null;
                if (module === 'inspection' && !['create', 'read', 'update', 'delete', 'approve', 'review'].includes(action))
                  return null;
                if (module === 'expense' && !['create', 'read', 'update', 'delete', 'approve', 'reassign'].includes(action))
                  return null;
                if (module === 'user_management' && !['create', 'read', 'update', 'delete'].includes(action)) return null;
                if (module === 'reports' && !['read', 'export'].includes(action)) return null;

                const checked = hasCap(module, action);
                return (
                  <label
                    key={action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: checked ? colors.primary + '20' : 'transparent',
                      border: `1px solid ${checked ? colors.primary : colors.neutral[300]}`,
                      borderRadius: borderRadius.sm,
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCapability(module, action)}
                      style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                    {actionLabels[action]}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const UserForm: React.FC<UserFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_id: initialData?.employee_id || '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'clerk',
    capabilities: initialData?.capabilities,
    yard_id: initialData?.yard_id || null,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    skip_approval_gate_pass: initialData?.skip_approval_gate_pass || false,
    skip_approval_expense: initialData?.skip_approval_expense || false,
  });

  const [showCapabilityMatrix, setShowCapabilityMatrix] = useState(true);
  const [capabilityTab, setCapabilityTab] = useState<'basic' | 'enhanced'>('basic');
  const [enhancedCapabilities, setEnhancedCapabilities] = useState<EnhancedCapability[]>(
    initialData?.enhanced_capabilities || []
  );

  // Enhanced capabilities hooks - only load when editing
  const { data: userEnhancedCapabilities } = useEnhancedCapabilities(initialData?.id || 0, {
    enabled: mode === 'edit' && !!initialData?.id,
  });

  const addEnhancedCapability = useAddEnhancedCapability();
  const updateEnhancedCapability = useUpdateEnhancedCapability();
  const removeEnhancedCapability = useRemoveEnhancedCapability();

  // Update enhanced capabilities when user data loads
  useEffect(() => {
    if (userEnhancedCapabilities && mode === 'edit') {
      setEnhancedCapabilities(userEnhancedCapabilities);
    }
  }, [userEnhancedCapabilities, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: User must have at least one capability
    const hasBasicCapabilities =
      formData.capabilities &&
      Object.values(formData.capabilities).some((moduleCaps) => Array.isArray(moduleCaps) && moduleCaps.length > 0);
    const hasEnhancedCapabilities = enhancedCapabilities.length > 0;

    if (!hasBasicCapabilities && !hasEnhancedCapabilities) {
      // This should be handled by parent component
      return;
    }

    await onSubmit(formData, enhancedCapabilities);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      <div>
        <label htmlFor="employee_id" style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Employee ID {mode === 'create' && <span style={{ color: colors.critical }}>*</span>}
        </label>
        <input
          id="employee_id"
          type="text"
          value={formData.employee_id}
          onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
          required={mode === 'create'}
          disabled={mode === 'edit'}
          placeholder="EMP001"
          style={{
            width: '100%',
            padding: spacing.md,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '16px',
            ...(mode === 'edit' && { backgroundColor: colors.neutral[100], color: colors.neutral[500] }),
          }}
        />
      </div>

      <div>
        <label htmlFor="name" style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Name <span style={{ color: colors.critical }}>*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="John Doe"
          style={{
            width: '100%',
            padding: spacing.md,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '16px',
          }}
        />
      </div>

      <div>
        <label htmlFor="email" style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Email <span style={{ color: colors.critical }}>*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="john@example.com"
          style={{
            width: '100%',
            padding: spacing.md,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '16px',
          }}
        />
      </div>

      {mode === 'create' && (
        <div>
          <label htmlFor="password" style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Password <span style={{ color: colors.critical }}>*</span>
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '16px',
            }}
          />
        </div>
      )}

      <div>
        <label htmlFor="role" style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Role (Display Name)
        </label>
        <input
          id="role"
          type="text"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Manager, Clerk, Inspector, etc."
          style={{
            width: '100%',
            padding: spacing.md,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '16px',
          }}
        />
        <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
          Role is just a display name for identification. It does not grant any permissions. Permissions must be
          explicitly set using the capability matrix below.
          {hasCapability(currentUser, 'user_management', 'update') &&
            ' You can grant any capabilities to this user.'}
        </p>
      </div>

      {/* Capability Matrix */}
      <div style={{ marginTop: spacing.md }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <label style={{ ...typography.label }}>Permissions (Required)</label>
          <button
            type="button"
            onClick={() => setShowCapabilityMatrix(!showCapabilityMatrix)}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              backgroundColor: showCapabilityMatrix ? colors.primary : 'white',
              color: showCapabilityMatrix ? 'white' : colors.neutral[700],
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showCapabilityMatrix ? 'Hide' : 'Show'} Capability Matrix
          </button>
        </div>
        {showCapabilityMatrix && (
          <div>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: spacing.xs,
                marginBottom: spacing.md,
                borderBottom: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <button
                type="button"
                onClick={() => setCapabilityTab('basic')}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: 'none',
                  borderBottom: `2px solid ${capabilityTab === 'basic' ? colors.primary : 'transparent'}`,
                  backgroundColor: 'transparent',
                  color: capabilityTab === 'basic' ? colors.primary : colors.neutral[600],
                  cursor: 'pointer',
                  fontWeight: capabilityTab === 'basic' ? 600 : 400,
                  ...typography.body,
                }}
              >
                Basic Capabilities
              </button>
              <button
                type="button"
                onClick={() => setCapabilityTab('enhanced')}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: 'none',
                  borderBottom: `2px solid ${capabilityTab === 'enhanced' ? colors.primary : 'transparent'}`,
                  backgroundColor: 'transparent',
                  color: capabilityTab === 'enhanced' ? colors.primary : colors.neutral[600],
                  cursor: 'pointer',
                  fontWeight: capabilityTab === 'enhanced' ? 600 : 400,
                  ...typography.body,
                }}
              >
                Enhanced Capabilities
              </button>
            </div>

            {/* Tab Content */}
            {capabilityTab === 'basic' ? (
              <CapabilityMatrixEditor
                capabilities={formData.capabilities}
                onChange={(capabilities) => setFormData({ ...formData, capabilities })}
              />
            ) : (
              <EnhancedCapabilityEditor
                capabilities={enhancedCapabilities}
                onChange={(caps) => {
                  setEnhancedCapabilities(caps);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Auto-Approval Settings */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.neutral[50],
          borderRadius: borderRadius.md,
          marginTop: spacing.md,
          border: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <div style={{ ...typography.label, marginBottom: spacing.sm, color: colors.primary[700] }}>
          Auto-Approval Settings
        </div>
        <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
          When enabled, items created by this user are automatically approved (skips approval queue)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <input
              type="checkbox"
              id="skip_approval_gate_pass"
              checked={formData.skip_approval_gate_pass || false}
              onChange={(e) => setFormData({ ...formData, skip_approval_gate_pass: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="skip_approval_gate_pass" style={{ ...typography.body, cursor: 'pointer', flex: 1 }}>
              Skip Approval for Gate Passes
            </label>
            <span style={{ ...typography.caption, color: colors.neutral[500] }}>
              Gate passes created by this user will be automatically approved
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <input
              type="checkbox"
              id="skip_approval_expense"
              checked={formData.skip_approval_expense || false}
              onChange={(e) => setFormData({ ...formData, skip_approval_expense: e.target.checked })}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="skip_approval_expense" style={{ ...typography.body, cursor: 'pointer', flex: 1 }}>
              Skip Approval for Expenses
            </label>
            <span style={{ ...typography.caption, color: colors.neutral[500] }}>
              Expenses submitted by this user will be automatically approved
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          style={{ width: '18px', height: '18px' }}
        />
        <label htmlFor="is_active" style={{ ...typography.body, cursor: 'pointer' }}>
          Active
        </label>
      </div>

      <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
        <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
          {mode === 'create' ? 'Create' : 'Update'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};


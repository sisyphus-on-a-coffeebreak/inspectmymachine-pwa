/**
 * Data Masking Rules Manager
 * 
 * Provides CRUD interface for managing data masking rules
 * that control which fields are masked for users without proper permissions.
 */

import React, { useState } from 'react';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingError } from '@/components/ui/LoadingError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import {
  useDataMaskingRules,
  useDataMaskingRulesByModule,
  useCreateDataMaskingRule,
  useUpdateDataMaskingRule,
  useDeleteDataMaskingRule,
} from '@/lib/permissions/queries';
import type { DataMaskingRule, CapabilityModule, MaskType } from '@/lib/permissions/types';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Eye, Plus, Edit2, Trash2, Search, X, Shield } from 'lucide-react';

export default function DataMaskingRules() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<DataMaskingRule | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<DataMaskingRule, 'id'>>({
    module: 'gate_pass',
    field: '',
    mask_type: 'partial',
    visible_with_capability: undefined,
    visible_to_roles: [],
  });

  // Queries
  const { data: rules, isLoading, error, refetch } = useDataMaskingRules();
  const createMutation = useCreateDataMaskingRule();
  const updateMutation = useUpdateDataMaskingRule();
  const deleteMutation = useDeleteDataMaskingRule();

  const modules: CapabilityModule[] = ['gate_pass', 'inspection', 'expense', 'user_management', 'reports'];
  const maskTypes: { value: MaskType; label: string }[] = [
    { value: 'none', label: 'No Masking' },
    { value: 'partial', label: 'Partial (Show first/last)' },
    { value: 'full', label: 'Full (****)' },
    { value: 'hash', label: 'Hash (#xxxxx)' },
    { value: 'redact', label: 'Redact ([REDACTED])' },
  ];

  const moduleLabels: Record<CapabilityModule, string> = {
    gate_pass: 'Gate Pass',
    inspection: 'Inspection',
    expense: 'Expense',
    user_management: 'User Management',
    reports: 'Reports',
  };

  // Filter rules
  const filteredRules = rules?.filter(rule => {
    const matchesSearch = rule.field.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'all' || rule.module === filterModule;
    return matchesSearch && matchesModule;
  }) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      showToast({
        title: 'Success',
        description: 'Data masking rule created successfully',
        variant: 'success',
      });
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create rule',
        variant: 'error',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;

    try {
      await updateMutation.mutateAsync({
        id: (selectedRule as any).id,
        updates: formData,
      });
      showToast({
        title: 'Success',
        description: 'Data masking rule updated successfully',
        variant: 'success',
      });
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update rule',
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRule) return;

    try {
      await deleteMutation.mutateAsync((selectedRule as any).id);
      showToast({
        title: 'Success',
        description: 'Data masking rule deleted successfully',
        variant: 'success',
      });
      setShowDeleteModal(false);
      setSelectedRule(null);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete rule',
        variant: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      module: 'gate_pass',
      field: '',
      mask_type: 'partial',
      visible_with_capability: undefined,
      visible_to_roles: [],
    });
  };

  const openEditModal = (rule: DataMaskingRule) => {
    setSelectedRule(rule);
    setFormData({
      module: rule.module,
      field: rule.field,
      mask_type: rule.mask_type,
      visible_with_capability: rule.visible_with_capability,
      visible_to_roles: rule.visible_to_roles || [],
    });
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.lg }}>
        <PageHeader
          title="Data Masking Rules"
          description="Manage data masking rules for sensitive fields"
          icon={<Eye size={24} />}
        />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: spacing.lg }}>
        <PageHeader
          title="Data Masking Rules"
          description="Manage data masking rules for sensitive fields"
          icon={<Eye size={24} />}
        />
        <LoadingError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Data Masking Rules"
        description="Control which fields are masked for users without proper permissions"
        icon={<Eye size={24} />}
      />

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.md,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: spacing.md, flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.neutral[500]
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by field name..."
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xxl}`,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                ...typography.body,
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: spacing.sm,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} color={colors.neutral[500]} />
              </button>
            )}
          </div>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              ...typography.body,
              minWidth: '150px',
            }}
          >
            <option value="all">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>{moduleLabels[m]}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateModal(true); }} variant="primary">
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          Create Rule
        </Button>
      </div>

      {/* Rules List */}
      {filteredRules.length === 0 ? (
        <EmptyState
          icon={<Eye size={48} />}
          title="No Data Masking Rules"
          description={searchTerm || filterModule !== 'all' ? 'No rules match your filters' : 'Create your first data masking rule to get started'}
          action={
            !searchTerm && filterModule === 'all' ? (
              <Button onClick={() => { resetForm(); setShowCreateModal(true); }} variant="primary">
                <Plus size={16} style={{ marginRight: spacing.xs }} />
                Create Rule
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: spacing.md }}>
          {filteredRules.map((rule, index) => (
            <div
              key={index}
              style={{
                ...cardStyles.card,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: spacing.md,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                  <Shield size={18} color={colors.primary} />
                  <h3 style={{ ...typography.subheader, margin: 0 }}>
                    {moduleLabels[rule.module]} • {rule.field}
                  </h3>
                  <span style={{
                    ...typography.caption,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    borderRadius: borderRadius.sm,
                  }}>
                    {maskTypes.find(mt => mt.value === rule.mask_type)?.label || rule.mask_type}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                  {rule.visible_with_capability && (
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Visible with: {rule.visible_with_capability.module}.{rule.visible_with_capability.action}
                    </div>
                  )}
                  {rule.visible_to_roles && rule.visible_to_roles.length > 0 && (
                    <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                      <span style={{ ...typography.caption, color: colors.neutral[600] }}>Visible to roles:</span>
                      {rule.visible_to_roles.map(role => (
                        <span
                          key={role}
                          style={{
                            ...typography.caption,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            backgroundColor: colors.neutral[100],
                            borderRadius: borderRadius.sm,
                          }}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
                <Button
                  onClick={() => openEditModal(rule)}
                  variant="secondary"
                  size="sm"
                  icon={<Edit2 size={16} />}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => { setSelectedRule(rule); setShowDeleteModal(true); }}
                  variant="destructive"
                  size="sm"
                  icon={<Trash2 size={16} />}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <RuleModal
          title="Create Data Masking Rule"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          loading={createMutation.isPending}
          modules={modules}
          moduleLabels={moduleLabels}
          maskTypes={maskTypes}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRule && (
        <RuleModal
          title="Edit Data Masking Rule"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          loading={updateMutation.isPending}
          modules={modules}
          moduleLabels={moduleLabels}
          maskTypes={maskTypes}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRule && (
        <DeleteModal
          rule={selectedRule}
          onConfirm={handleDelete}
          onClose={() => { setShowDeleteModal(false); setSelectedRule(null); }}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

// Rule Modal Component
interface RuleModalProps {
  title: string;
  formData: Omit<DataMaskingRule, 'id'>;
  setFormData: (data: Omit<DataMaskingRule, 'id'>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
  modules: CapabilityModule[];
  moduleLabels: Record<CapabilityModule, string>;
  maskTypes: { value: MaskType; label: string }[];
}

const RuleModal: React.FC<RuleModalProps> = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
  modules,
  moduleLabels,
  maskTypes,
}) => {
  const [useCapability, setUseCapability] = useState(!!formData.visible_with_capability);
  const [capabilityModule, setCapabilityModule] = useState(formData.visible_with_capability?.module || 'gate_pass');
  const [capabilityAction, setCapabilityAction] = useState(formData.visible_with_capability?.action || 'read');
  const [rolesText, setRolesText] = useState(formData.visible_to_roles?.join(', ') || '');

  const actions = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

  const handleSubmit = (e: React.FormEvent) => {
    const updatedData = {
      ...formData,
      visible_with_capability: useCapability ? {
        module: capabilityModule as CapabilityModule,
        action: capabilityAction as any,
      } : undefined,
      visible_to_roles: rolesText ? rolesText.split(',').map(r => r.trim()).filter(Boolean) : [],
    };
    setFormData(updatedData);
    onSubmit(e);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: spacing.md,
    }}>
      <div style={{
        ...cardStyles.card,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ ...typography.header, marginBottom: spacing.lg }}>{title}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Module *
                </label>
                <select
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value as CapabilityModule })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                >
                  {modules.map(m => (
                    <option key={m} value={m}>{moduleLabels[m]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Field Name *
                </label>
                <input
                  type="text"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  required
                  placeholder="amount"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.sm,
                    ...typography.body,
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Mask Type *
              </label>
              <select
                value={formData.mask_type}
                onChange={(e) => setFormData({ ...formData, mask_type: e.target.value as MaskType })}
                required
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              >
                {maskTypes.map(mt => (
                  <option key={mt.value} value={mt.value}>{mt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer', marginBottom: spacing.xs }}>
                <input
                  type="checkbox"
                  checked={useCapability}
                  onChange={(e) => setUseCapability(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={typography.label}>Visible with Capability</span>
              </label>
              {useCapability && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginTop: spacing.sm }}>
                  <select
                    value={capabilityModule}
                    onChange={(e) => setCapabilityModule(e.target.value)}
                    style={{
                      padding: spacing.sm,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.sm,
                      ...typography.body,
                    }}
                  >
                    {modules.map(m => (
                      <option key={m} value={m}>{moduleLabels[m]}</option>
                    ))}
                  </select>
                  <select
                    value={capabilityAction}
                    onChange={(e) => setCapabilityAction(e.target.value)}
                    style={{
                      padding: spacing.sm,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.sm,
                      ...typography.body,
                    }}
                  >
                    {actions.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Visible to Roles (comma-separated)
              </label>
              <input
                type="text"
                value={rolesText}
                onChange={(e) => setRolesText(e.target.value)}
                placeholder="admin, supervisor"
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button type="button" onClick={onClose} variant="secondary" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {title.includes('Create') ? 'Create' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Modal Component
interface DeleteModalProps {
  rule: DataMaskingRule;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ rule, onConfirm, onClose, loading }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: spacing.md,
    }}>
      <div style={{
        ...cardStyles.card,
        maxWidth: '400px',
        width: '100%',
      }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Delete Rule</h2>
        <p style={{ ...typography.body, marginBottom: spacing.lg }}>
          Are you sure you want to delete the masking rule for <strong>{rule.module}.{rule.field}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="destructive" loading={loading}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};









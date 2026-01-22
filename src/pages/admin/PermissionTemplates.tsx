/**
 * Permission Templates Management Page
 * 
 * Provides CRUD interface for managing permission templates
 * that can be applied to users for quick permission assignment.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingError } from '@/components/ui/LoadingError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { EnhancedCapabilityEditor } from '@/components/permissions/EnhancedCapabilityEditor';
import {
  usePermissionTemplates,
  useCreatePermissionTemplate,
  useUpdatePermissionTemplate,
  useDeletePermissionTemplate,
  useApplyPermissionTemplate,
} from '@/lib/permissions/queries';
import { getUsers } from '@/lib/users';
import type { PermissionTemplate, EnhancedUserCapabilities } from '@/lib/permissions/types';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Shield, Plus, Edit2, Trash2, Copy, Search, X } from 'lucide-react';

export default function PermissionTemplates() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('merge');

  // Form state
  const [formData, setFormData] = useState<Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>>({
    name: '',
    description: '',
    icon: '',
    capabilities: {},
    recommended_for_roles: [],
    is_system_template: false,
  });

  // Queries
  const { data: templates, isLoading, error, refetch } = usePermissionTemplates();
  const createMutation = useCreatePermissionTemplate();
  const updateMutation = useUpdatePermissionTemplate();
  const deleteMutation = useDeletePermissionTemplate();
  const applyMutation = useApplyPermissionTemplate();

  // Filter templates
  const filteredTemplates = templates?.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      showToast({
        title: 'Success',
        description: 'Permission template created successfully',
        variant: 'success',
      });
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create template',
        variant: 'error',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        updates: formData,
      });
      showToast({
        title: 'Success',
        description: 'Permission template updated successfully',
        variant: 'success',
      });
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update template',
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await deleteMutation.mutateAsync(selectedTemplate.id);
      showToast({
        title: 'Success',
        description: 'Permission template deleted successfully',
        variant: 'success',
      });
      setShowDeleteModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete template',
        variant: 'error',
      });
    }
  };

  const handleApply = async () => {
    if (!selectedTemplate || !selectedUserId) return;

    try {
      await applyMutation.mutateAsync({
        templateId: selectedTemplate.id,
        userId: selectedUserId,
        mode: applyMode,
      });
      showToast({
        title: 'Success',
        description: `Permission template applied successfully (${applyMode} mode)`,
        variant: 'success',
      });
      setShowApplyModal(false);
      setSelectedTemplate(null);
      setSelectedUserId(null);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to apply template',
        variant: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      capabilities: {},
      recommended_for_roles: [],
      is_system_template: false,
    });
  };

  const openEditModal = (template: PermissionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      icon: template.icon || '',
      capabilities: template.capabilities,
      recommended_for_roles: template.recommended_for_roles || [],
      is_system_template: template.is_system_template,
    });
    setShowEditModal(true);
  };

  const openApplyModal = (template: PermissionTemplate) => {
    setSelectedTemplate(template);
    setShowApplyModal(true);
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.lg }}>
        <PageHeader
          title="Permission Templates"
          description="Manage reusable permission templates"
          icon={<Shield size={24} />}
        />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: spacing.lg }}>
        <PageHeader
          title="Permission Templates"
          description="Manage reusable permission templates"
          icon={<Shield size={24} />}
        />
        <LoadingError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="Permission Templates"
        description="Create and manage reusable permission templates"
        icon={<Shield size={24} />}
      />

      {/* Search and Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.md,
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
            placeholder="Search templates..."
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl * 2}`,
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
        <Button onClick={() => { resetForm(); setShowCreateModal(true); }} variant="primary">
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<Shield size={48} />}
          title="No Permission Templates"
          description={searchTerm ? 'No templates match your search' : 'Create your first permission template to get started'}
          action={
            !searchTerm ? (
              <Button onClick={() => { resetForm(); setShowCreateModal(true); }} variant="primary">
                <Plus size={16} style={{ marginRight: spacing.xs }} />
                Create Template
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'grid', gap: spacing.md }}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
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
                  {template.icon && <span style={{ fontSize: '20px' }}>{template.icon}</span>}
                  <h3 style={{ ...typography.subheader, margin: 0 }}>
                    {template.name}
                    {template.is_system_template && (
                      <span style={{
                        ...typography.caption,
                        marginLeft: spacing.sm,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        backgroundColor: colors.primary + '20',
                        color: colors.primary,
                        borderRadius: borderRadius.sm,
                      }}>
                        System
                      </span>
                    )}
                  </h3>
                </div>
                <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.sm }}>
                  {template.description}
                </p>
                {template.recommended_for_roles && template.recommended_for_roles.length > 0 && (
                  <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap', marginTop: spacing.sm }}>
                    <span style={{ ...typography.caption, color: colors.neutral[600] }}>Recommended for:</span>
                    {template.recommended_for_roles.map(role => (
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
              <div style={{ display: 'flex', gap: spacing.sm, flexShrink: 0 }}>
                <Button
                  onClick={() => openApplyModal(template)}
                  variant="secondary"
                  size="sm"
                  icon={<Copy size={16} />}
                >
                  Apply
                </Button>
                {!template.is_system_template && (
                  <>
                    <Button
                      onClick={() => openEditModal(template)}
                      variant="secondary"
                      size="sm"
                      icon={<Edit2 size={16} />}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => { setSelectedTemplate(template); setShowDeleteModal(true); }}
                      variant="destructive"
                      size="sm"
                      icon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <TemplateModal
          title="Create Permission Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          loading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <TemplateModal
          title="Edit Permission Template"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          onClose={() => { setShowEditModal(false); resetForm(); }}
          loading={updateMutation.isPending}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedTemplate && (
        <DeleteModal
          template={selectedTemplate}
          onConfirm={handleDelete}
          onClose={() => { setShowDeleteModal(false); setSelectedTemplate(null); }}
          loading={deleteMutation.isPending}
        />
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedTemplate && (
        <ApplyModal
          template={selectedTemplate}
          userId={selectedUserId}
          setUserId={setSelectedUserId}
          mode={applyMode}
          setMode={setApplyMode}
          onConfirm={handleApply}
          onClose={() => { setShowApplyModal(false); setSelectedTemplate(null); setSelectedUserId(null); }}
          loading={applyMutation.isPending}
        />
      )}
    </div>
  );
}

// Template Modal Component
interface TemplateModalProps {
  title: string;
  formData: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>;
  setFormData: (data: Omit<PermissionTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  loading: boolean;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
}) => {
  const [enhancedCapabilities, setEnhancedCapabilities] = useState<EnhancedUserCapabilities>(formData.capabilities);

  const handleSubmit = (e: React.FormEvent) => {
    setFormData({ ...formData, capabilities: enhancedCapabilities });
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ ...typography.header, marginBottom: spacing.lg }}>{title}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg }}>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                  resize: 'vertical',
                }}
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Enhanced Capabilities
              </label>
              <EnhancedCapabilityEditor
                capabilities={enhancedCapabilities?.enhanced_capabilities || []}
                onChange={(caps) => setEnhancedCapabilities({ ...enhancedCapabilities, enhanced_capabilities: caps })}
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
  template: PermissionTemplate;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ template, onConfirm, onClose, loading }) => {
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
        <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>Delete Template</h2>
        <p style={{ ...typography.body, marginBottom: spacing.lg }}>
          Are you sure you want to delete "{template.name}"? This action cannot be undone.
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

// Apply Modal Component
interface ApplyModalProps {
  template: PermissionTemplate;
  userId: number | null;
  setUserId: (id: number | null) => void;
  mode: 'replace' | 'merge';
  setMode: (mode: 'replace' | 'merge') => void;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}

const ApplyModal: React.FC<ApplyModalProps> = ({
  template,
  userId,
  setUserId,
  mode,
  setMode,
  onConfirm,
  onClose,
  loading,
}) => {
  const [users, setUsers] = React.useState<Array<{ id: number; name: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);

  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.map(u => ({ id: u.id, name: u.name, email: u.email })));
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
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
        maxWidth: '500px',
        width: '100%',
      }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.md }}>
          Apply Template: {template.name}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg }}>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Select User *
            </label>
            {loadingUsers ? (
              <div style={{ ...typography.body, color: colors.neutral[600] }}>Loading users...</div>
            ) : (
              <select
                value={userId || ''}
                onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : null)}
                required
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                }}
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Apply Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'replace' | 'merge')}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
              }}
            >
              <option value="merge">Merge (Add to existing permissions)</option>
              <option value="replace">Replace (Replace all permissions)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} variant="secondary" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="primary" disabled={!userId || loading} loading={loading}>
            Apply Template
          </Button>
        </div>
      </div>
    </div>
  );
};







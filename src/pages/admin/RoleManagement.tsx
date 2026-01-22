import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../providers/useAuth';
import { useToast } from '../../providers/ToastProvider';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PermissionGate, useHasCapability } from '../../components/ui/PermissionGate';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Shield, Plus, Edit2, Trash2, Search, Users, Check, X } from 'lucide-react';
import type { CapabilityModule, CapabilityAction } from '../../lib/users';

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  capabilities: Record<CapabilityModule, CapabilityAction[]>;
  user_count: number;
  created_at?: string;
  updated_at?: string;
}

const modules: CapabilityModule[] = ['gate_pass', 'inspection', 'expense', 'user_management', 'reports', 'stockyard'];
const actions: CapabilityAction[] = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

const moduleLabels: Record<CapabilityModule, string> = {
  gate_pass: 'Gate Pass',
  inspection: 'Inspection',
  expense: 'Expense',
  user_management: 'User Management',
  reports: 'Reports',
  stockyard: 'Stockyard',
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

export default function RoleManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canCreate = useHasCapability('user_management', 'create');
  const canUpdate = useHasCapability('user_management', 'update');
  const canDelete = useHasCapability('user_management', 'delete');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    capabilities: {} as Record<CapabilityModule, CapabilityAction[]>,
  });

  // Fetch roles
  const { data: roles = [], isLoading, error, refetch } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get('/v1/roles');
      // Handle case where table doesn't exist yet
      if (response.data?.message && response.data.message.includes('not found')) {
        return [];
      }
      return response.data || [];
    },
  });

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiClient.post('/v1/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast({
        title: 'Success',
        description: 'Role created successfully',
        variant: 'success',
      });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to create role';
      const isMigrationError = errorMessage.includes('not found') || errorMessage.includes('migrations');
      
      showToast({
        title: isMigrationError ? 'Database Migration Required' : 'Error',
        description: isMigrationError 
          ? 'The roles table doesn\'t exist yet. Please run migrations: cd /Users/narnolia/code/vosm && php artisan migrate && php artisan db:seed --class=RoleSeeder'
          : errorMessage,
        variant: 'error',
        duration: isMigrationError ? 10000 : 5000, // Longer duration for migration error
      });
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return await apiClient.put(`/v1/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast({
        title: 'Success',
        description: 'Role updated successfully',
        variant: 'success',
      });
      setShowEditModal(false);
      setSelectedRole(null);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to update role';
      const isMigrationError = errorMessage.includes('not found') || errorMessage.includes('migrations');
      
      showToast({
        title: isMigrationError ? 'Database Migration Required' : 'Error',
        description: isMigrationError 
          ? 'The roles table doesn\'t exist yet. Please run migrations: cd /Users/narnolia/code/vosm && php artisan migrate && php artisan db:seed --class=RoleSeeder'
          : errorMessage,
        variant: 'error',
        duration: isMigrationError ? 10000 : 5000,
      });
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.delete(`/v1/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      showToast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'success',
      });
      setShowDeleteModal(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete role';
      const isMigrationError = errorMessage.includes('not found') || errorMessage.includes('migrations');
      
      showToast({
        title: isMigrationError ? 'Database Migration Required' : 'Error',
        description: isMigrationError 
          ? 'The roles table doesn\'t exist yet. Please run migrations: cd /Users/narnolia/code/vosm && php artisan migrate && php artisan db:seed --class=RoleSeeder'
          : errorMessage,
        variant: 'error',
        duration: isMigrationError ? 10000 : 5000,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      capabilities: {} as Record<CapabilityModule, CapabilityAction[]>,
    });
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      capabilities: role.capabilities || {},
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    updateMutation.mutate({ id: selectedRole.id, data: formData });
  };

  const handleDelete = () => {
    if (!selectedRole) return;
    deleteMutation.mutate(selectedRole.id);
  };

  const toggleCapability = (module: CapabilityModule, action: CapabilityAction) => {
    const current = formData.capabilities[module] || [];
    const newCapabilities = { ...formData.capabilities };

    if (current.includes(action)) {
      newCapabilities[module] = current.filter(a => a !== action);
    } else {
      newCapabilities[module] = [...current, action];
    }

    // Remove empty arrays
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }

    setFormData({ ...formData, capabilities: newCapabilities });
  };

  const hasCapability = (module: CapabilityModule, action: CapabilityAction): boolean => {
    return formData.capabilities[module]?.includes(action) ?? false;
  };

  // Filter roles
  const filteredRoles = roles.filter(role => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(term) ||
      role.display_name.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading roles...</div>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || 'Failed to load roles';
    const isMigrationError = errorMessage.includes('not found') || errorMessage.includes('migrations');
    
    return (
      <div style={{ padding: spacing.xl }}>
        <EmptyState
          icon="⚠️"
          title={isMigrationError ? "Database Migration Required" : "Error Loading Roles"}
          description={
            isMigrationError 
              ? "The roles table doesn't exist yet. Please run the database migrations:\n\ncd /Users/narnolia/code/vosm\nphp artisan migrate\nphp artisan db:seed --class=RoleSeeder"
              : errorMessage
          }
          action={!isMigrationError ? {
            label: 'Retry',
            onClick: () => refetch(),
            variant: 'primary',
          } : undefined}
        />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background.neutral,
      padding: spacing.xl
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader
          title="Role Management"
          subtitle="Create and manage roles with custom capabilities"
          icon={<Shield size={28} />}
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Admin', path: '/app/admin/users' },
            { label: 'Role Management' }
          ]}
          actions={
            <PermissionGate module="user_management" action="create">
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                icon={<Plus size={20} />}
              >
                Create Role
              </Button>
            </PermissionGate>
          }
        />

        {/* Search */}
        <div style={{
          ...cardStyles.base,
          marginBottom: spacing.lg,
          padding: spacing.lg
        }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.neutral[400]
              }}
            />
            <input
              type="text"
              placeholder="Search roles by name, display name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: spacing.xxxl,
                paddingRight: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '16px',
              }}
            />
          </div>
        </div>

        {/* Roles List */}
        {filteredRoles.length === 0 ? (
          <EmptyState
            icon="🛡️"
            title="No Roles Found"
            description={searchTerm ? "Try adjusting your search" : "Get started by creating your first role"}
            action={!searchTerm && canCreate ? {
              label: 'Create Role',
              onClick: () => {
                resetForm();
                setShowCreateModal(true);
              },
              variant: 'primary',
              icon: <Plus size={20} />
            } : undefined}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: spacing.lg
          }}>
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                style={{
                  ...cardStyles.base,
                  padding: spacing.lg,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = cardStyles.base.boxShadow;
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.md
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      ...typography.header,
                      fontSize: '18px',
                      margin: 0,
                      marginBottom: spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm
                    }}>
                      {role.display_name}
                      {role.is_system_role && (
                        <span style={{
                          fontSize: '11px',
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.primary + '20',
                          color: colors.primary,
                          borderRadius: borderRadius.sm,
                          fontWeight: 600
                        }}>
                          System
                        </span>
                      )}
                    </h3>
                    <p style={{
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      margin: 0,
                      marginBottom: spacing.xs
                    }}>
                      {role.name}
                    </p>
                    {role.description && (
                      <p style={{
                        ...typography.bodySmall,
                        color: colors.neutral[500],
                        margin: 0
                      }}>
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: spacing.xs }}>
                    {canUpdate && !role.is_system_role && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(role);
                        }}
                        style={{
                          padding: spacing.sm,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: colors.primary,
                          cursor: 'pointer',
                          borderRadius: borderRadius.sm,
                        }}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {canDelete && !role.is_system_role && role.user_count === 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(role);
                        }}
                        style={{
                          padding: spacing.sm,
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: colors.critical,
                          cursor: 'pointer',
                          borderRadius: borderRadius.sm,
                        }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.md,
                  paddingTop: spacing.md,
                  borderTop: `1px solid ${colors.neutral[200]}`
                }}>
                  <Users size={16} color={colors.neutral[600]} />
                  <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                    {role.user_count} user{role.user_count !== 1 ? 's' : ''}
                  </span>
                  <span style={{ ...typography.bodySmall, color: colors.neutral[400] }}>•</span>
                  <span style={{
                    ...typography.bodySmall,
                    color: role.is_active ? colors.success[600] : colors.neutral[500],
                    fontWeight: 600
                  }}>
                    {role.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Capabilities Preview */}
                <div style={{
                  ...typography.caption,
                  color: colors.neutral[600],
                  marginTop: spacing.sm
                }}>
                  <strong>Capabilities:</strong> {Object.keys(role.capabilities || {}).length} module(s)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <RoleFormModal
            title="Create Role"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            isSubmitting={createMutation.isPending}
            toggleCapability={toggleCapability}
            hasCapability={hasCapability}
          />
        )}

        {/* Edit Modal */}
        {showEditModal && selectedRole && (
          <RoleFormModal
            title="Edit Role"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRole(null);
              resetForm();
            }}
            isSubmitting={updateMutation.isPending}
            toggleCapability={toggleCapability}
            hasCapability={hasCapability}
            isSystemRole={selectedRole.is_system_role}
          />
        )}

        {/* Delete Modal */}
        <ConfirmDialog
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedRole(null);
          }}
          onConfirm={handleDelete}
          title="Delete Role"
          description={selectedRole
            ? `Are you sure you want to delete "${selectedRole.display_name}"? This action cannot be undone.`
            : ''}
          confirmText="Delete Role"
          confirmVariant="critical"
          requireTyping={true}
          confirmationText="DELETE"
        />
      </div>
    </div>
  );
}

// Role Form Modal Component
function RoleFormModal({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  isSubmitting,
  toggleCapability,
  hasCapability,
  isSystemRole = false,
}: {
  title: string;
  formData: {
    name: string;
    display_name: string;
    description: string;
    capabilities: Record<CapabilityModule, CapabilityAction[]>;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSubmitting: boolean;
  toggleCapability: (module: CapabilityModule, action: CapabilityAction) => void;
  hasCapability: (module: CapabilityModule, action: CapabilityAction) => boolean;
  isSystemRole?: boolean;
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Role Name (unique identifier) *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            required
            disabled={isSystemRole}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '16px',
            }}
            placeholder="e.g., custom_manager"
          />
          <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
            Lowercase, underscores only (e.g., custom_manager)
          </p>
        </div>

        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Display Name *
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            required
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '16px',
            }}
            placeholder="e.g., Custom Manager"
          />
        </div>

        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '16px',
              fontFamily: 'inherit',
            }}
            placeholder="Describe what this role is for..."
          />
        </div>

        {/* Capability Matrix */}
        <div>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.sm }}>
            Capabilities *
          </label>
          {isSystemRole && (
            <p style={{ ...typography.caption, color: colors.warning[600], marginBottom: spacing.sm }}>
              ⚠️ System role capabilities cannot be modified
            </p>
          )}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`,
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            {modules.map((module) => (
              <div key={module} style={{
                marginBottom: spacing.md,
                padding: spacing.sm,
                backgroundColor: 'white',
                borderRadius: borderRadius.sm,
              }}>
                <div style={{ ...typography.label, marginBottom: spacing.xs, fontSize: '13px' }}>
                  {moduleLabels[module]}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                  {actions.map((action) => {
                    // Filter actions by module relevance
                    if (module === 'gate_pass' && !['create', 'read', 'update', 'delete', 'approve', 'validate'].includes(action)) return null;
                    if (module === 'inspection' && !['create', 'read', 'update', 'delete', 'approve', 'review'].includes(action)) return null;
                    if (module === 'expense' && !['create', 'read', 'update', 'delete', 'approve', 'reassign'].includes(action)) return null;
                    if (module === 'user_management' && !['create', 'read', 'update', 'delete'].includes(action)) return null;
                    if (module === 'reports' && !['read', 'export'].includes(action)) return null;
                    if (module === 'stockyard' && !['create', 'read', 'update', 'delete', 'approve'].includes(action)) return null;

                    const checked = hasCapability(module, action);
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
                          cursor: isSystemRole ? 'not-allowed' : 'pointer',
                          fontSize: '11px',
                          opacity: isSystemRole ? 0.6 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => !isSystemRole && toggleCapability(module, action)}
                          disabled={isSystemRole}
                          style={{ width: '14px', height: '14px', cursor: isSystemRole ? 'not-allowed' : 'pointer' }}
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

        <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
          <Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}


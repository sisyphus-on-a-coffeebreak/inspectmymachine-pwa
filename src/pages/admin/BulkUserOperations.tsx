import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, type User, type UserCapabilities, type CapabilityModule, type CapabilityAction } from '../../lib/users';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../providers/ToastProvider';
import { apiClient } from '../../lib/apiClient';
import { Users, CheckSquare, Square, Settings, Power, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queries';
import { CardGrid } from '../../components/ui/ResponsiveGrid';
import { PageContainer } from '../../components/ui/PageContainer';

const modules: CapabilityModule[] = ['gate_pass', 'inspection', 'expense', 'user_management', 'reports'];
const actions: CapabilityAction[] = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

const moduleLabels: Record<CapabilityModule, string> = {
  gate_pass: 'Gate Pass',
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

// Will be replaced by API fetch
const defaultRoleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'guard', label: 'Guard' },
  { value: 'clerk', label: 'Clerk' },
];

export const BulkUserOperations: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'capabilities' | 'status' | 'role'>('capabilities');
  const [confirmDeactivate, setConfirmDeactivate] = useState<string[] | null>(null);
  
  // Capabilities state
  const [selectedCapabilities, setSelectedCapabilities] = useState<UserCapabilities>({});
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('replace');
  
  // Role state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [updateCapabilities, setUpdateCapabilities] = useState(true);

  // Fetch roles from API
  const { data: apiRoles = [] } = useQuery<Array<{
    id: number;
    name: string;
    display_name: string;
    description?: string;
    is_system_role: boolean;
    is_active: boolean;
  }>>({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/v1/roles');
        return response.data || [];
      } catch (error: any) {
        // If roles table doesn't exist, return empty array (will use default)
        if (error?.response?.status === 503 || error?.response?.status === 500) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Combine API roles with default roles
  const roleOptions = apiRoles.length > 0
    ? apiRoles.map(role => ({
        value: role.name,
        label: role.display_name + (role.is_system_role === false ? ' (Custom)' : ''),
      }))
    : defaultRoleOptions;

  // Fetch all users — getUsers() returns { data: User[], meta, links }
  const { data: usersResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.users.list({}),
    queryFn: async () => {
      const usersData = await getUsers();
      return usersData;
    },
  });
  const users = usersResponse?.data ?? [];

  // Bulk operations mutations
  const bulkAssignCapabilities = useMutation({
    mutationFn: async ({ userIds, capabilities, mergeMode }: { userIds: string[]; capabilities: UserCapabilities; mergeMode: 'replace' | 'merge' }) => {
      const response = await apiClient.post('/v1/users/bulk-assign-capabilities', {
        user_ids: userIds,
        capabilities,
        merge_mode: mergeMode,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showToast(`Capabilities assigned to ${data.updated_count} user(s)`, 'success');
      setSelectedUsers([]);
      setSelectedCapabilities({});
    },
    onError: (error: Error) => {
      showToast(`Failed to assign capabilities: ${error.message}`, 'error');
    },
  });

  const bulkActivate = useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await apiClient.post('/v1/users/bulk-activate', {
        user_ids: userIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showToast(`${data.updated_count} user(s) activated`, 'success');
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      showToast(`Failed to activate users: ${error.message}`, 'error');
    },
  });

  const bulkDeactivate = useMutation({
    mutationFn: async (userIds: string[]) => {
      const response = await apiClient.post('/v1/users/bulk-deactivate', {
        user_ids: userIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showToast(`${data.updated_count} user(s) deactivated`, 'success');
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      showToast(`Failed to deactivate users: ${error.message}`, 'error');
    },
  });

  const bulkAssignRole = useMutation({
    mutationFn: async ({ userIds, role, updateCapabilities }: { userIds: string[]; role: string; updateCapabilities: boolean }) => {
      const response = await apiClient.post('/v1/users/bulk-assign-role', {
        user_ids: userIds,
        role,
        update_capabilities: updateCapabilities,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showToast(`Role assigned to ${data.updated_count} user(s)`, 'success');
      setSelectedUsers([]);
      setSelectedRole('');
    },
    onError: (error: Error) => {
      showToast(`Failed to assign role: ${error.message}`, 'error');
    },
  });

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (!users) return;
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id.toString()));
    }
  };

  const toggleCapability = (module: CapabilityModule, action: CapabilityAction) => {
    const current = selectedCapabilities[module] || [];
    const newCapabilities = { ...selectedCapabilities };
    
    if (current.includes(action)) {
      newCapabilities[module] = current.filter(a => a !== action);
    } else {
      newCapabilities[module] = [...current, action];
    }
    
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }
    
    setSelectedCapabilities(newCapabilities);
  };

  const hasCapability = (module: CapabilityModule, action: CapabilityAction): boolean => {
    return selectedCapabilities[module]?.includes(action) ?? false;
  };

  const handleBulkCapabilities = () => {
    if (selectedUsers.length === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    
    if (Object.keys(selectedCapabilities).length === 0) {
      showToast('Please select at least one capability', 'error');
      return;
    }
    
    bulkAssignCapabilities.mutate({
      userIds: selectedUsers,
      capabilities: selectedCapabilities,
      mergeMode,
    });
  };

  const handleBulkStatus = (activate: boolean) => {
    if (selectedUsers.length === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    
    if (activate) {
      bulkActivate.mutate(selectedUsers);
    } else {
      // Require confirmation for deactivation
      setConfirmDeactivate(selectedUsers);
    }
  };

  const confirmBulkDeactivate = () => {
    if (confirmDeactivate) {
      bulkDeactivate.mutate(confirmDeactivate);
      setConfirmDeactivate(null);
    }
  };

  const handleBulkRole = () => {
    if (selectedUsers.length === 0) {
      showToast('Please select at least one user', 'error');
      return;
    }
    
    if (!selectedRole) {
      showToast('Please select a role', 'error');
      return;
    }
    
    bulkAssignRole.mutate({
      userIds: selectedUsers,
      role: selectedRole,
      updateCapabilities,
    });
  };

  if (error) {
    return (
      <div style={{ padding: spacing.xl }}>
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading users...</div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="1400px">
      <PageHeader
        title="Bulk User Operations"
        subtitle="Perform bulk operations on multiple users at once"
        icon="⚡"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/app/admin/users' },
          { label: 'Bulk Operations' }
        ]}
      />

      {/* Tabs */}
      <div style={{ marginTop: spacing.xl, display: 'flex', gap: spacing.md, borderBottom: `2px solid ${colors.neutral[200]}` }}>
        <button
          onClick={() => setActiveTab('capabilities')}
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'capabilities' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: activeTab === 'capabilities' ? colors.primary : colors.neutral[600],
            ...typography.body,
            fontWeight: activeTab === 'capabilities' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          <Settings size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
          Capabilities
        </button>
        <button
          onClick={() => setActiveTab('status')}
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'status' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: activeTab === 'status' ? colors.primary : colors.neutral[600],
            ...typography.body,
            fontWeight: activeTab === 'status' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          <Power size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
          Status
        </button>
        <button
          onClick={() => setActiveTab('role')}
          style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            border: 'none',
            background: 'transparent',
            borderBottom: activeTab === 'role' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: activeTab === 'role' ? colors.primary : colors.neutral[600],
            ...typography.body,
            fontWeight: activeTab === 'role' ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          <Shield size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
          Role
        </button>
      </div>

      {/* User Selection */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <div style={{ ...typography.subheader }}>
            Select Users ({selectedUsers.length} selected)
          </div>
          <Button
            variant="secondary"
            onClick={toggleSelectAll}
            style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}
          >
            {selectedUsers.length === users?.length ? (
              <>
                <Square size={16} />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare size={16} />
                Select All
              </>
            )}
          </Button>
        </div>
        
        {users && users.length === 0 ? (
          <EmptyState icon="👥" title="No Users" description="No users found in the system." />
        ) : (
          <CardGrid gap="md">
            {users?.map(user => (
              <label
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  border: `2px solid ${selectedUsers.includes(user.id.toString()) ? colors.primary : colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: selectedUsers.includes(user.id.toString()) ? colors.primary + '10' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id.toString())}
                  onChange={() => toggleUserSelection(user.id.toString())}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <Users size={20} color={colors.neutral[600]} />
                <div style={{ flex: 1 }}>
                  <div style={{ ...typography.body, fontWeight: 600 }}>{user.name}</div>
                  <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                    {user.email} • {user.role}
                  </div>
                  <div style={{ ...typography.caption, color: user.is_active ? colors.success[600] : colors.error[500] }}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </label>
            ))}
          </CardGrid>
        )}
      </div>

      {/* Capabilities Tab */}
      {activeTab === 'capabilities' && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <div style={{ ...typography.subheader, marginBottom: spacing.md }}>Select Capabilities</div>
          
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, marginRight: spacing.md }}>Merge Mode:</label>
            <select
              value={mergeMode}
              onChange={(e) => setMergeMode(e.target.value as 'replace' | 'merge')}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
              }}
            >
              <option value="replace">Replace all capabilities</option>
              <option value="merge">Add to existing capabilities</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: spacing.md }}>
            {modules.map(module => (
              <div
                key={module}
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div style={{ ...typography.label, marginBottom: spacing.sm }}>
                  {moduleLabels[module]}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                  {actions.map(action => {
                    // Filter actions by module
                    if (module === 'gate_pass' && !['create', 'read', 'update', 'delete', 'approve', 'validate'].includes(action)) return null;
                    if (module === 'inspection' && !['create', 'read', 'update', 'delete', 'approve', 'review'].includes(action)) return null;
                    if (module === 'expense' && !['create', 'read', 'update', 'delete', 'approve', 'reassign'].includes(action)) return null;
                    if (module === 'user_management' && !['create', 'read', 'update', 'delete'].includes(action)) return null;
                    if (module === 'reports' && !['read', 'export'].includes(action)) return null;
                    
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
                          cursor: 'pointer',
                          fontSize: '12px',
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

          <Button
            variant="primary"
            onClick={handleBulkCapabilities}
            disabled={selectedUsers.length === 0 || Object.keys(selectedCapabilities).length === 0 || bulkAssignCapabilities.isPending}
            style={{ marginTop: spacing.lg, width: '100%' }}
          >
            {bulkAssignCapabilities.isPending ? 'Assigning...' : `Assign Capabilities to ${selectedUsers.length} User(s)`}
          </Button>
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <div style={{ ...typography.subheader, marginBottom: spacing.md }}>Change User Status</div>
          <div style={{ display: 'flex', gap: spacing.md }}>
            <Button
              variant="success"
              onClick={() => handleBulkStatus(true)}
              disabled={selectedUsers.length === 0 || bulkActivate.isPending}
              style={{ flex: 1 }}
            >
              {bulkActivate.isPending ? 'Activating...' : `Activate ${selectedUsers.length} User(s)`}
            </Button>
            <Button
              variant="error"
              onClick={() => handleBulkStatus(false)}
              disabled={selectedUsers.length === 0 || bulkDeactivate.isPending}
              style={{ flex: 1 }}
            >
              {bulkDeactivate.isPending ? 'Deactivating...' : `Deactivate ${selectedUsers.length} User(s)`}
            </Button>
          </div>
        </div>
      )}

      {/* Role Tab */}
      {activeTab === 'role' && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <div style={{ ...typography.subheader, marginBottom: spacing.md }}>Assign Role</div>
          
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Select Role:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing.sm}px ${spacing.md}px`,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
              }}
            >
              <option value="">-- Select Role --</option>
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <input
              type="checkbox"
              checked={updateCapabilities}
              onChange={(e) => setUpdateCapabilities(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span style={{ ...typography.body }}>Update capabilities from role</span>
          </label>

          <Button
            variant="primary"
            onClick={handleBulkRole}
            disabled={selectedUsers.length === 0 || !selectedRole || bulkAssignRole.isPending}
            style={{ width: '100%' }}
          >
            {bulkAssignRole.isPending ? 'Assigning...' : `Assign Role to ${selectedUsers.length} User(s)`}
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDeactivate !== null}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={confirmBulkDeactivate}
        title="Deactivate Users"
        description={`Are you sure you want to deactivate ${confirmDeactivate?.length || 0} user(s)? Deactivated users will not be able to access the system.`}
        confirmText="Deactivate Users"
        confirmVariant="warning"
        requireTyping={false}
      />
    </PageContainer>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queries';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAvailableRoles,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UserCapabilities,
  type CapabilityModule,
  type CapabilityAction,
  type UsersResponse,
  type GetUsersParams,
} from '@/lib/users';
import { apiClient } from '@/lib/apiClient';
import { EnhancedCapabilityEditor } from '@/components/permissions/EnhancedCapabilityEditor';
import type { EnhancedCapability } from '@/lib/permissions/types';
import {
  useEnhancedCapabilities,
  useAddEnhancedCapability,
  useUpdateEnhancedCapability,
  useRemoveEnhancedCapability,
} from '@/lib/permissions/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingError } from '@/components/ui/LoadingError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/Pagination';
import { PermissionGate, useHasCapability } from '@/components/ui/PermissionGate';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';
import { UserCog, Search, Plus, Edit2, Trash2, Key, Users as UsersIcon, Filter } from 'lucide-react';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  // Permission checks for UI visibility
  const canUpdateUsers = useHasCapability('user_management', 'update');
  const canDeleteUsers = useHasCapability('user_management', 'delete');
  const [users, setUsers] = useState<User[]>([]);
  const [usersResponse, setUsersResponse] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ userId: number; userName: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  // Form states
  const [formData, setFormData] = useState<CreateUserPayload>({
    employee_id: '',
    name: '',
    email: '',
    password: '',
    role: 'clerk',
    capabilities: undefined,
    yard_id: null,
    is_active: true,
    skip_approval_gate_pass: false,
    skip_approval_expense: false,
  });
  const [showCapabilityMatrix, setShowCapabilityMatrix] = useState(false);
  const [capabilityTab, setCapabilityTab] = useState<'basic' | 'enhanced'>('basic');
  const [enhancedCapabilities, setEnhancedCapabilities] = useState<EnhancedCapability[]>([]);
  
  // Enhanced capabilities hooks - only load when editing
  const { data: userEnhancedCapabilities } = useEnhancedCapabilities(
    selectedUser?.id || 0,
    { enabled: !!selectedUser && showEditModal }
  );
  
  // Update enhanced capabilities when user data loads
  useEffect(() => {
    if (userEnhancedCapabilities && showEditModal) {
      setEnhancedCapabilities(userEnhancedCapabilities);
    }
  }, [userEnhancedCapabilities, showEditModal]);
  
  const addEnhancedCapability = useAddEnhancedCapability();
  const updateEnhancedCapability = useUpdateEnhancedCapability();
  const removeEnhancedCapability = useRemoveEnhancedCapability();

  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

  // Fetch roles from API (includes custom roles)
  const { data: apiRoles = [], isLoading: rolesLoading } = useQuery<Array<{
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
        // If roles table doesn't exist, fall back to hardcoded roles
        if (error?.response?.status === 503 || error?.response?.status === 500) {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Combine API roles with hardcoded roles (for backward compatibility)
  const hardcodedRoles = getAvailableRoles();
  const roles = apiRoles.length > 0 
    ? apiRoles.map(role => ({
        value: role.name as User['role'],
        label: role.display_name,
        description: role.description || '',
        id: role.id,
        is_system_role: role.is_system_role,
      }))
    : hardcodedRoles.map(role => ({
        ...role,
        id: undefined,
        is_system_role: true,
      }));

  // Use React Query for better caching and pagination support
  const { data: usersQueryData, isLoading: queryLoading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.users.list({ page, per_page: perPage, search: searchTerm, role: filterRole, status: filterStatus }),
    queryFn: async () => {
      const params: GetUsersParams = {
        page,
        per_page: perPage,
        search: searchTerm || undefined,
        role: filterRole !== 'all' ? filterRole : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      };
      return await getUsers(params);
    },
    placeholderData: keepPreviousData, // Keep old data while loading new page
    staleTime: 30000, // 30 seconds
  });

  // Update local state from query data
  useEffect(() => {
    if (usersQueryData) {
      setUsersResponse(usersQueryData);
      setUsers(usersQueryData.data);
      setLoading(false);
    }
  }, [usersQueryData]);

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  useEffect(() => {
    if (queryError) {
      const error = queryError instanceof Error ? queryError : new Error('Failed to load users');
      setError(error);
      showToast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    }
  }, [queryError, showToast]);

  const loadUsers = async () => {
    await refetch();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await createUser(formData);
      
      // Save enhanced capabilities if any
      if (enhancedCapabilities.length > 0 && newUser.id) {
        for (const cap of enhancedCapabilities) {
          try {
            await addEnhancedCapability.mutateAsync({
              userId: newUser.id,
              capability: cap,
            });
          } catch (capErr) {
            console.error('Failed to add enhanced capability:', capErr);
            // Continue with other capabilities
          }
        }
      }
      
      showToast({
        title: 'Success',
        description: 'User created successfully',
        variant: 'success',
      });
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create user',
        variant: 'error',
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload: UpdateUserPayload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ...((formData as any).role_id && { role_id: Number((formData as any).role_id) }), // Include role_id as integer if available
        capabilities: formData.capabilities,
        yard_id: formData.yard_id,
        is_active: formData.is_active,
        skip_approval_gate_pass: formData.skip_approval_gate_pass,
        skip_approval_expense: formData.skip_approval_expense,
      };
      await updateUser(selectedUser.id, payload);
      
      // Sync enhanced capabilities
      // Get current enhanced capabilities from API
      const currentCaps = userEnhancedCapabilities || [];
      
      // Find capabilities to add (in new list but not in current)
      const toAdd = enhancedCapabilities.filter(
        newCap => !currentCaps.some(
          currCap => currCap.module === newCap.module && currCap.action === newCap.action
        )
      );
      
      // Find capabilities to remove (in current but not in new)
      const toRemove = currentCaps.filter(
        currCap => !enhancedCapabilities.some(
          newCap => newCap.module === currCap.module && newCap.action === currCap.action
        )
      );
      
      // Find capabilities to update (in both but different)
      const toUpdate = enhancedCapabilities.filter(newCap => {
        const currCap = currentCaps.find(
          c => c.module === newCap.module && c.action === newCap.action
        );
        return currCap && JSON.stringify(currCap) !== JSON.stringify(newCap);
      });
      
      // Add new capabilities
      for (const cap of toAdd) {
        try {
          await addEnhancedCapability.mutateAsync({
            userId: selectedUser.id,
            capability: cap,
          });
        } catch (capErr) {
          console.error('Failed to add enhanced capability:', capErr);
        }
      }
      
      // Update existing capabilities
      for (const cap of toUpdate) {
        const existingCap = currentCaps.find(
          c => c.module === cap.module && c.action === cap.action
        );
        if (existingCap && existingCap.id) {
          try {
            await updateEnhancedCapability.mutateAsync({
              userId: selectedUser.id,
              capabilityId: existingCap.id,
              updates: cap,
            });
          } catch (capErr) {
            console.error('Failed to update enhanced capability:', capErr);
          }
        }
      }
      
      // Remove deleted capabilities
      for (const cap of toRemove) {
        if (cap.id) {
          try {
            await removeEnhancedCapability.mutateAsync({
              userId: selectedUser.id,
              capabilityId: cap.id,
            });
          } catch (capErr) {
            console.error('Failed to remove enhanced capability:', capErr);
          }
        }
      }
      
      showToast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'success',
      });
      setShowEditModal(false);
      resetForm();
      loadUsers(); // Reload current page
    } catch (err: any) {
      // Show validation errors if available
      const errorMessage = err?.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err?.response?.data?.message || err?.message || 'Failed to update user';
      
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
        duration: 8000, // Longer duration for validation errors
      });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    setConfirmDelete({ userId, userName });
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    
    try {
      await deleteUser(confirmDelete.userId);
      showToast({
        title: 'User deleted',
        description: `${confirmDelete.userName} has been removed`,
        variant: 'success',
      });
      setConfirmDelete(null);
      loadUsers(); // Reload current page
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      showToast({
        title: 'Success',
        description: 'User deleted successfully',
        variant: 'success',
      });
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete user',
        variant: 'error',
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.password !== passwordData.confirmPassword) {
      showToast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'error',
      });
      return;
    }

    try {
      await resetUserPassword(selectedUser.id, passwordData.password);
      showToast({
        title: 'Success',
        description: 'Password reset successfully',
        variant: 'success',
      });
      setShowPasswordModal(false);
      setPasswordData({ password: '', confirmPassword: '' });
      setSelectedUser(null);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reset password',
        variant: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      name: '',
      email: '',
      password: '',
      role: 'clerk',
      capabilities: undefined,
      yard_id: null,
      is_active: true,
      skip_approval_gate_pass: false,
      skip_approval_expense: false,
    });
    setShowCapabilityMatrix(false);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      ...((user as any).role_id && { role_id: (user as any).role_id }), // Include role_id if available
      capabilities: user.capabilities,
      yard_id: user.yard_id,
      is_active: user.is_active,
      skip_approval_gate_pass: user.skip_approval_gate_pass || false,
      skip_approval_expense: user.skip_approval_expense || false,
    } as any);
    // Load enhanced capabilities from user data or set empty array
    setEnhancedCapabilities(user.enhanced_capabilities || []);
    setCapabilityTab('basic');
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ password: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const getRoleColor = (role: User['role']) => {
    const roleColors: Record<User['role'], { bg: string; text: string; border: string }> = {
      super_admin: {
        bg: '#f3e8ff', // purple-100
        text: '#6b21a8', // purple-800
        border: '#e9d5ff' // purple-200
      },
      admin: {
        bg: '#dbeafe', // blue-100
        text: '#1e40af', // blue-800
        border: '#bfdbfe' // blue-200
      },
      supervisor: {
        bg: '#dcfce7', // green-100
        text: '#166534', // green-800
        border: '#bbf7d0' // green-200
      },
      inspector: {
        bg: '#fef9c3', // yellow-100
        text: '#854d0e', // yellow-800
        border: '#fef08a' // yellow-200
      },
      guard: {
        bg: '#fed7aa', // orange-100
        text: '#9a3412', // orange-800
        border: '#fdba74' // orange-200
      },
      clerk: {
        bg: '#f3f4f6', // gray-100
        text: '#1f2937', // gray-800
        border: '#e5e7eb' // gray-200
      },
    };
    return roleColors[role] || roleColors.clerk;
  };

  // Users are now filtered on the backend via pagination params
  // No client-side filtering needed
  const filteredUsers = users;

  if (loading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: spacing.xl }}>
        <LoadingError resource="Users" error={error} onRetry={loadUsers} />
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
        {/* Page Header */}
        <PageHeader
          title="User Management"
          subtitle="Manage users, roles, and permissions"
          icon={<UserCog size={28} />}
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'User Management' }
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
                Create User
              </Button>
            </PermissionGate>
          }
        />

        {/* Filters and Search */}
        <div style={{
          ...cardStyles.base,
          marginBottom: spacing.lg,
          padding: spacing.lg
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md
          }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', flex: 1 }}>
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
                placeholder="Search by name, email, employee ID, role, or capability..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when searching
                }}
                aria-label="Search users by name, email, employee ID, role, or capability"
                style={{
                  width: '100%',
                  paddingLeft: spacing.xxxl,
                  paddingRight: spacing.md,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.md,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  color: colors.neutral[700],
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.neutral[300];
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: spacing.md,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <Filter size={18} color={colors.neutral[600]} />
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1); // Reset to first page when filtering
                  }}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                    color: colors.neutral[700],
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1); // Reset to first page when filtering
                }}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  color: colors.neutral[700],
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                color: colors.neutral[600],
                fontSize: '14px'
              }}>
                <UsersIcon size={16} />
                <span>
                  {usersResponse?.meta?.total || filteredUsers.length} user
                  {(usersResponse?.meta?.total || filteredUsers.length) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No users found"
            description={searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? "Try adjusting your search or filters"
              : "Get started by creating your first user"}
            action={!searchTerm && filterRole === 'all' && filterStatus === 'all' ? {
              label: 'Create User',
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
            ...cardStyles.base,
            overflow: 'hidden',
            padding: 0
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{
                  backgroundColor: colors.neutral[50],
                  borderBottom: `1px solid ${colors.neutral[200]}`
                }}>
                  <tr>
                    {['Employee ID', 'Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: spacing.md,
                          textAlign: header === 'Actions' ? 'right' : 'left',
                          ...typography.label,
                          color: colors.neutral[600],
                          fontWeight: 600
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      onClick={() => navigate(`/app/admin/users/${user.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/app/admin/users/${user.id}`);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View user details: ${user.name} (${user.employee_id})`}
                      style={{
                        borderBottom: index < filteredUsers.length - 1 ? `1px solid ${colors.neutral[200]}` : 'none',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.neutral[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <td style={{ padding: spacing.md }}>
                        <span style={{ ...typography.body, fontWeight: 600, color: colors.neutral[900] }}>
                          {user.employee_id}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span style={{ ...typography.body, color: colors.neutral[900] }}>
                          {user.name}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span style={{ ...typography.body, color: colors.neutral[600] }}>
                          {user.email}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md }}>
                        {(() => {
                          const roleColor = getRoleColor(user.role);
                          const roleLabel = roles.find((r) => r.value === user.role)?.label || user.role;
                          return (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: `${spacing.xs} ${spacing.md}`,
                              borderRadius: borderRadius.full,
                              fontSize: '12px',
                              fontWeight: 600,
                              border: `1px solid ${roleColor.border}`,
                              backgroundColor: roleColor.bg,
                              color: roleColor.text,
                              minWidth: '80px',
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}>
                              {roleLabel}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: `${spacing.xs} ${spacing.md}`,
                          borderRadius: borderRadius.full,
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: user.is_active ? colors.success : colors.critical,
                          color: 'white',
                          minWidth: '70px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                          {/* Edit User Button - requires update permission */}
                          {canUpdateUsers && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(user);
                              }}
                              aria-label={`Edit user ${user.name}`}
                              style={{
                                padding: spacing.sm,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: colors.primary,
                                cursor: 'pointer',
                                borderRadius: borderRadius.sm,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.neutral[100];
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {/* Reset Password Button - requires update permission */}
                          {canUpdateUsers && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPasswordModal(user);
                              }}
                              aria-label={`Reset password for ${user.name}`}
                              style={{
                                padding: spacing.sm,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: colors.warning,
                                cursor: 'pointer',
                                borderRadius: borderRadius.sm,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.neutral[100];
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                          )}
                          {/* Delete User Button - requires delete permission and can't delete self */}
                          {canDeleteUsers && currentUser?.id !== user.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id, user.name);
                              }}
                              aria-label={`Delete user ${user.name}`}
                              style={{
                                padding: spacing.sm,
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: colors.critical,
                                cursor: 'pointer',
                                borderRadius: borderRadius.sm,
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.neutral[100];
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersResponse?.meta && (
              <Pagination
                currentPage={usersResponse.meta.current_page}
                totalPages={usersResponse.meta.last_page}
                totalItems={usersResponse.meta.total}
                perPage={perPage}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  // Scroll to top when page changes
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPerPageChange={(newPerPage) => {
                  setPerPage(newPerPage);
                  setPage(1); // Reset to first page when changing per page
                }}
              />
            )}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <SimpleModal
            title="Create User"
            onClose={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <FormField label="Employee ID" required>
                <input
                  type="text"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Name" required>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Password" required>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Role">
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as User['role'];
                    const selectedRoleData = roles.find(r => r.value === newRole);
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      // Store role_id if available (for database roles)
                      ...(selectedRoleData?.id && { role_id: selectedRoleData.id } as any),
                      // Auto-populate capabilities from role if not manually set
                      capabilities: showCapabilityMatrix ? formData.capabilities : undefined,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                >
                  {rolesLoading ? (
                    <option value="">Loading roles...</option>
                  ) : roles.length === 0 ? (
                    <option value="">No roles available</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} {role.is_system_role === false && '(Custom)'} - {role.description}
                      </option>
                    ))
                  )}
                </select>
                <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Role sets default capabilities. Use capability matrix below for custom permissions.
                  {apiRoles.length === 0 && roles.length > 0 && ' (Using hardcoded roles - run migrations to enable custom roles)'}
                </p>
              </FormField>
              
              {/* Capability Matrix */}
              <div style={{ marginTop: spacing.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <label style={{ ...typography.label }}>Permissions</label>
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
                    {showCapabilityMatrix ? 'Hide' : 'Show'} Custom Permissions
                  </button>
                </div>
                {showCapabilityMatrix && (
                  <div>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md, borderBottom: `1px solid ${colors.neutral[200]}` }}>
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
              <div style={{ 
                padding: spacing.md, 
                backgroundColor: colors.neutral[50], 
                borderRadius: borderRadius.md,
                marginTop: spacing.md,
                border: `1px solid ${colors.neutral[200]}`
              }}>
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
                <Button type="submit" variant="primary" fullWidth>
                  Create
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SimpleModal>
        )}

        {showEditModal && selectedUser && (
          <SimpleModal
            title="Edit User"
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              resetForm();
            }}
          >
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <FormField label="Employee ID">
                <input
                  type="text"
                  value={formData.employee_id}
                  disabled
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px',
                    backgroundColor: colors.neutral[100],
                    color: colors.neutral[500]
                  }}
                />
              </FormField>
              <FormField label="Name" required>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Role">
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value as User['role'];
                    const selectedRoleData = roles.find(r => r.value === newRole);
                    setFormData({ 
                      ...formData, 
                      role: newRole,
                      // Store role_id if available (for database roles)
                      ...(selectedRoleData?.id && { role_id: selectedRoleData.id } as any),
                      // Auto-populate capabilities from role if not manually set
                      capabilities: showCapabilityMatrix ? formData.capabilities : undefined,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                >
                  {rolesLoading ? (
                    <option value="">Loading roles...</option>
                  ) : roles.length === 0 ? (
                    <option value="">No roles available</option>
                  ) : (
                    roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} {role.is_system_role === false && '(Custom)'} - {role.description}
                      </option>
                    ))
                  )}
                </select>
                <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Role sets default capabilities. Use capability matrix below for custom permissions.
                  {apiRoles.length === 0 && roles.length > 0 && ' (Using hardcoded roles - run migrations to enable custom roles)'}
                </p>
              </FormField>
              
              {/* Capability Matrix */}
              <div style={{ marginTop: spacing.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <label style={{ ...typography.label }}>Permissions</label>
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
                    {showCapabilityMatrix ? 'Hide' : 'Show'} Custom Permissions
                  </button>
                </div>
                {showCapabilityMatrix && (
                  <div>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md, borderBottom: `1px solid ${colors.neutral[200]}` }}>
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
              <div style={{ 
                padding: spacing.md, 
                backgroundColor: colors.neutral[50], 
                borderRadius: borderRadius.md,
                marginTop: spacing.md,
                border: `1px solid ${colors.neutral[200]}`
              }}>
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
                      id="skip_approval_gate_pass_edit"
                      checked={formData.skip_approval_gate_pass || false}
                      onChange={(e) => setFormData({ ...formData, skip_approval_gate_pass: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="skip_approval_gate_pass_edit" style={{ ...typography.body, cursor: 'pointer', flex: 1 }}>
                      Skip Approval for Gate Passes
                    </label>
                    <span style={{ ...typography.caption, color: colors.neutral[500] }}>
                      Gate passes created by this user will be automatically approved
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <input
                      type="checkbox"
                      id="skip_approval_expense_edit"
                      checked={formData.skip_approval_expense || false}
                      onChange={(e) => setFormData({ ...formData, skip_approval_expense: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="skip_approval_expense_edit" style={{ ...typography.body, cursor: 'pointer', flex: 1 }}>
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
                  id="is_active_edit"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="is_active_edit" style={{ ...typography.body, cursor: 'pointer' }}>
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
                <Button type="submit" variant="primary" fullWidth>
                  Update
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SimpleModal>
        )}

        {showDeleteModal && selectedUser && (
          <SimpleModal
            title="Delete User"
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedUser(null);
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <p style={{ ...typography.body, color: colors.neutral[700] }}>
                Are you sure you want to delete user <strong>{selectedUser.name}</strong> ({selectedUser.employee_id})?
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
                <Button
                  variant="critical"
                  onClick={handleDelete}
                  fullWidth
                >
                  Delete
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SimpleModal>
        )}

        <ConfirmDialog
          isOpen={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          description={`Are you sure you want to delete ${confirmDelete?.userName}? This action cannot be undone.`}
          confirmText="Delete User"
          confirmVariant="critical"
          requireTyping={true}
          confirmationText="DELETE"
        />

        {showPasswordModal && selectedUser && (
          <SimpleModal
            title="Reset Password"
            onClose={() => {
              setShowPasswordModal(false);
              setSelectedUser(null);
              setPasswordData({ password: '', confirmPassword: '' });
            }}
          >
            <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              <p style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                Reset password for <strong>{selectedUser.name}</strong> ({selectedUser.employee_id})
              </p>
              <FormField label="New Password" required>
                <input
                  type="password"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <FormField label="Confirm Password" required>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '16px'
                  }}
                />
              </FormField>
              <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.md }}>
                <Button type="submit" variant="primary" fullWidth>
                  Reset Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setPasswordData({ password: '', confirmPassword: '' });
                  }}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SimpleModal>
        )}
      </div>
    </div>
  );
}

// Capability Matrix Editor Component
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
      newCapabilities[module] = current.filter(a => a !== action);
    } else {
      newCapabilities[module] = [...current, action];
    }
    
    // Remove empty arrays
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }
    
    onChange(newCapabilities);
  };

  const hasCapability = (module: CapabilityModule, action: CapabilityAction): boolean => {
    return capabilities?.[module]?.includes(action) ?? false;
  };

  return (
    <div style={{
      padding: spacing.md,
      backgroundColor: colors.neutral[50],
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.neutral[200]}`,
      maxHeight: '400px',
      overflowY: 'auto',
    }}>
      <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
        Select capabilities for each module. Capabilities override role-based permissions.
        <br />
        <strong>Note:</strong> For Stockyard module, use Enhanced Capabilities below to assign function-specific permissions (Access Control, Inventory, Movements).
      </div>
      <div style={{ display: 'grid', gap: spacing.md }}>
        {modules.map((module) => (
          <div key={module} style={{
            padding: spacing.sm,
            backgroundColor: 'white',
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.neutral[200]}`,
          }}>
            <div style={{ ...typography.label, marginBottom: spacing.xs, fontSize: '13px' }}>
              {moduleLabels[module]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
              {actions.map((action) => {
                // Filter actions by module relevance
                if (module === 'stockyard' && !['create', 'read', 'update', 'delete', 'approve', 'validate'].includes(action)) return null;
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

// Simple Modal Component (local to this file)
function SimpleModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      overflowY: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg
    }}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: 'opacity 0.2s ease'
        }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative',
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        boxShadow: shadows.xl,
        width: '100%',
        maxWidth: '500px',
        padding: spacing.xl,
        zIndex: 51
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg
        }}>
          <h3 style={{
            ...typography.header,
            fontSize: '24px',
            margin: 0
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: spacing.sm,
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.neutral[400],
              cursor: 'pointer',
              borderRadius: borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.neutral[600];
              e.currentTarget.style.backgroundColor = colors.neutral[100];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.neutral[400];
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Form Field Component
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <label style={{
        ...typography.label,
        fontSize: '14px',
        textTransform: 'none',
        color: colors.neutral[700]
      }}>
        {label} {required && <span style={{ color: colors.critical }}>*</span>}
      </label>
      {children}
    </div>
  );
}

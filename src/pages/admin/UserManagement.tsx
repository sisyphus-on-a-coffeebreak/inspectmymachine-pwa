import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
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
} from '@/lib/users';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingError } from '@/components/ui/LoadingError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { colors, typography, spacing, cardStyles, borderRadius, shadows } from '@/lib/theme';
import { UserCog, Search, Plus, Edit2, Trash2, Key, Users as UsersIcon, Filter } from 'lucide-react';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
  });
  const [showCapabilityMatrix, setShowCapabilityMatrix] = useState(false);

  const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

  const roles = getAvailableRoles();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load users');
      setError(error);
      showToast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData);
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
        capabilities: formData.capabilities,
        yard_id: formData.yard_id,
        is_active: formData.is_active,
      };
      await updateUser(selectedUser.id, payload);
      showToast({
        title: 'Success',
        description: 'User updated successfully',
        variant: 'success',
      });
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user',
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
      capabilities: user.capabilities,
      yard_id: user.yard_id,
      is_active: user.is_active,
    });
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

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    
    // Enhanced search: employee_id, name, email, role, and capabilities
    const matchesSearch = searchTerm === '' || (
      user.employee_id.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      // Search in role label
      (roles.find((r) => r.value === user.role)?.label || '').toLowerCase().includes(searchLower) ||
      // Search in capabilities (capabilities is an object with module keys, each containing an array of actions)
      (user.capabilities && Object.keys(user.capabilities).some((module) => {
        const moduleCaps = user.capabilities?.[module as CapabilityModule];
        if (!moduleCaps || !Array.isArray(moduleCaps)) return false;
        // Search by module name
        if (module.toLowerCase().includes(searchLower)) return true;
        // Search by action names in the array
        return moduleCaps.some((action) => 
          action.toLowerCase().includes(searchLower)
        );
      }))
    );
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onChange={(e) => setFilterRole(e.target.value)}
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
                onChange={(e) => setFilterStatus(e.target.value)}
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
                <span>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</span>
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
                          {currentUser?.id !== user.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(user);
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
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <Modal
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
                    setFormData({ 
                      ...formData, 
                      role: newRole,
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
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Role sets default capabilities. Use capability matrix below for custom permissions.
                </p>
              </FormField>
              
              {/* Capability Matrix */}
              <div style={{ marginTop: spacing.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <label style={{ ...typography.label }}>Capability Matrix</label>
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
                  <CapabilityMatrixEditor
                    capabilities={formData.capabilities}
                    onChange={(capabilities) => setFormData({ ...formData, capabilities })}
                  />
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
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
          </Modal>
        )}

        {showEditModal && selectedUser && (
          <Modal
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
                    setFormData({ 
                      ...formData, 
                      role: newRole,
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
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
                <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  Role sets default capabilities. Use capability matrix below for custom permissions.
                </p>
              </FormField>
              
              {/* Capability Matrix */}
              <div style={{ marginTop: spacing.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <label style={{ ...typography.label }}>Capability Matrix</label>
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
                  <CapabilityMatrixEditor
                    capabilities={formData.capabilities}
                    onChange={(capabilities) => setFormData({ ...formData, capabilities })}
                  />
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
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
          </Modal>
        )}

        {showDeleteModal && selectedUser && (
          <Modal
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
          </Modal>
        )}

        {showPasswordModal && selectedUser && (
          <Modal
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
          </Modal>
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

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
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

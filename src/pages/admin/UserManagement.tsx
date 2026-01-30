/**
 * User Management - Refactored Version
 * 
 * This is a refactored version using:
 * - Service layer (UserService)
 * - Custom hooks (useUsers, useUserFilters)
 * - Extracted components (UserList, UserFilters, BulkActionsBar)
 * - URL-based state management
 * - Activity logging
 * - Consistent UI components (NetworkError, LoadingState)
 * - Pull-to-refresh support
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';
import { useHasCapability } from '@/components/ui/PermissionGate';
import { isSuperAdmin, type User } from '@/lib/users';
import { useUsers, useRoles, useDeleteUser, useBulkUserOperation } from '@/hooks/useUsers';
import { useUserFilters } from '@/hooks/useUserFilters';
import { UserList } from '@/components/users/UserList';
import { UserFilters } from '@/components/users/UserFilters';
import { BulkActionsBar } from '@/components/users/BulkActionsBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { LoadingState } from '@/components/ui/LoadingState';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserCog, Plus } from 'lucide-react';
import { spacing } from '@/lib/theme';
import { ExportButton } from '@/components/ui/ExportButton';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Permission checks
  const canCreate = useHasCapability('user_management', 'create');
  const canUpdate = useHasCapability('user_management', 'update');
  const canDelete = useHasCapability('user_management', 'delete');
  const canExport = useHasCapability('user_management', 'export');

  // URL-based filters
  const {
    filters,
    updateFilter,
    clearFilters,
    searchTerm,
    filterRole,
    filterStatus,
  } = useUserFilters();

  // Fetch users using new hook
  const { data, isLoading, error, refetch } = useUsers(filters);

  // Fetch roles
  const { data: apiRoles = [] } = useRoles();
  const roles = useMemo(() => {
    return apiRoles.map((role) => ({
      value: role.name,
      label: role.display_name,
      id: role.id,
    }));
  }, [apiRoles]);

  // Mutations
  const deleteMutation = useDeleteUser();
  const bulkMutation = useBulkUserOperation();

  // Local state
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    userIds: number[];
    action: string;
  } | null>(null);
  const [lastSuperAdminIds, setLastSuperAdminIds] = useState<Set<number>>(new Set());

  // Extract data
  const users = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;
  const totalUsers = meta?.total ?? users.length;

  // Check which users are last superadmins
  useEffect(() => {
    const superAdmins = users.filter((u) => isSuperAdmin(u) && u.is_active);
    if (superAdmins.length === 1) {
      setLastSuperAdminIds(new Set([superAdmins[0].id]));
    } else {
      setLastSuperAdminIds(new Set());
    }
  }, [users]);

  // Handlers
  const handleCreate = () => {
    navigate('/app/admin/users/create');
  };

  const handleEdit = (user: User) => {
    navigate(`/app/admin/users/${user.id}/edit`);
  };

  const handleDelete = (userId: number, _userName: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (lastSuperAdminIds.has(userId)) {
      // This should be handled by the UserList component, but just in case
      return;
    }
    setConfirmDelete({ userIds: [userId], action: 'delete' });
  };

  const handleResetPassword = (user: User) => {
    navigate(`/app/admin/users/${user.id}/reset-password`);
  };

  const handleBulkActivate = () => {
    if (selectedUsers.length === 0) return;
    setConfirmDelete({ userIds: selectedUsers, action: 'activate' });
  };

  const handleBulkDeactivate = () => {
    if (selectedUsers.length === 0) return;
    // Check if any selected user is the last superadmin
    const hasLastSuperAdmin = selectedUsers.some((id) => lastSuperAdminIds.has(id));
    if (hasLastSuperAdmin) {
      // This should be handled better, but for now just return
      return;
    }
    setConfirmDelete({ userIds: selectedUsers, action: 'deactivate' });
  };

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return;
    // Check if any selected user is the last superadmin
    const hasLastSuperAdmin = selectedUsers.some((id) => lastSuperAdminIds.has(id));
    if (hasLastSuperAdmin) {
      // This should be handled better, but for now just return
      return;
    }
    setConfirmDelete({ userIds: selectedUsers, action: 'delete' });
  };

  const confirmBulkOperation = async () => {
    if (!confirmDelete) return;

    try {
      await bulkMutation.mutateAsync({
        action: confirmDelete.action,
        userIds: confirmDelete.userIds,
      });
      setSelectedUsers([]);
      setConfirmDelete(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  const confirmSingleDelete = async () => {
    if (!confirmDelete || confirmDelete.userIds.length !== 1) return;

    try {
      await deleteMutation.mutateAsync(confirmDelete.userIds[0]);
      setConfirmDelete(null);
    } catch {
      // Error handled by mutation hook
    }
  };

  const handlePageChange = (newPage: number) => {
    updateFilter('page', newPage);
  };

  const handlePerPageChange = (newPerPage: number) => {
    updateFilter('per_page', newPerPage);
  };

  // Error state
  if (error) {
    return (
      <div style={{ padding: spacing.xl }}>
        <NetworkError error={error} onRetry={refetch} />
      </div>
    );
  }

  // Loading state
  if (isLoading && !data) {
    return (
      <div style={{ padding: spacing.xl }}>
        <LoadingState variant="skeleton" message="Loading users..." />
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={async () => { await refetch(); }}>
      <div style={{ padding: spacing.xl }}>
        {/* Page Header */}
        <PageHeader
          title="User Management"
          subtitle="Manage users, roles, and permissions"
          icon={<UserCog size={28} />}
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'User Management' },
          ]}
          actions={
            canCreate && (
              <Button variant="primary" onClick={handleCreate} icon={<Plus size={20} />}>
                Create User
              </Button>
            )
          }
        />

        {/* Filters */}
        <UserFilters
          filters={filters}
          roles={roles}
          totalUsers={totalUsers}
          onUpdate={updateFilter}
          onClear={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Export Button */}
        {canExport && users.length > 0 && (
          <div style={{ marginBottom: spacing.md, display: 'flex', justifyContent: 'flex-end' }}>
            <ExportButton
              data={users.map((user) => ({
                'Employee ID': user.employee_id,
                Name: user.name,
                Email: user.email,
                Role: user.role,
                Status: user.is_active ? 'Active' : 'Inactive',
                'Last Login': user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never',
                'Created At': user.created_at ? new Date(user.created_at).toLocaleString() : '',
              }))}
              formats={['csv', 'excel']}
              options={{
                filename: `users-export-${new Date().toISOString().split('T')[0]}`,
                headers: ['Employee ID', 'Name', 'Email', 'Role', 'Status', 'Last Login', 'Created At'],
              }}
              module="user"
              label="Export Users"
              variant="outline"
            />
          </div>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedUsers.length}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onDelete={handleBulkDelete}
          onClear={() => setSelectedUsers([])}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isLoading={bulkMutation.isPending || deleteMutation.isPending}
        />

        {/* User List */}
        {users.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No users found"
            description={
              searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first user'
            }
            action={
              !searchTerm && filterRole === 'all' && filterStatus === 'all' && canCreate
                ? {
                    label: 'Create User',
                    onClick: handleCreate,
                    variant: 'primary',
                    icon: <Plus size={20} />,
                  }
                : undefined
            }
          />
        ) : (
          <UserList
            users={users}
            roles={roles}
            selectedUsers={selectedUsers}
            onSelect={setSelectedUsers}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onResetPassword={canUpdate ? handleResetPassword : undefined}
            canUpdate={canUpdate}
            canDelete={canDelete}
            currentUserId={currentUser?.id}
            lastSuperAdminIds={lastSuperAdminIds}
            meta={meta}
            onPageChange={handlePageChange}
            onPerPageChange={handlePerPageChange}
          />
        )}

        {/* Confirmation Dialogs */}
        <ConfirmDialog
          isOpen={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          onConfirm={
            confirmDelete?.action === 'delete' && (confirmDelete?.userIds?.length ?? 0) === 1
              ? confirmSingleDelete
              : confirmBulkOperation
          }
          title={
            confirmDelete?.action === 'delete'
              ? (confirmDelete?.userIds?.length ?? 0) === 1
                ? 'Delete User'
                : `Delete ${confirmDelete?.userIds?.length ?? 0} Users`
              : confirmDelete?.action === 'activate'
              ? `Activate ${confirmDelete?.userIds?.length ?? 0} Users`
              : `Deactivate ${confirmDelete?.userIds?.length ?? 0} Users`
          }
          description={
            confirmDelete?.action === 'delete'
              ? (confirmDelete?.userIds?.length ?? 0) === 1
                ? 'Are you sure you want to delete this user? This action cannot be undone.'
                : `Are you sure you want to delete ${confirmDelete?.userIds?.length ?? 0} users? This action cannot be undone.`
              : confirmDelete?.action === 'activate'
              ? `Are you sure you want to activate ${confirmDelete?.userIds?.length ?? 0} users?`
              : `Are you sure you want to deactivate ${confirmDelete?.userIds?.length ?? 0} users?`
          }
          confirmText={
            confirmDelete?.action === 'delete'
              ? 'Delete'
              : confirmDelete?.action === 'activate'
              ? 'Activate'
              : 'Deactivate'
          }
          confirmVariant={confirmDelete?.action === 'delete' ? 'critical' : 'warning'}
          requireTyping={confirmDelete?.action === 'delete'}
        />
      </div>
    </PullToRefreshWrapper>
  );
}


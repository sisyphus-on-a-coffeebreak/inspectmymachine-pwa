/**
 * UserList Component
 * 
 * Displays a list of users in a table format
 * Supports row selection, actions, and navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Key } from 'lucide-react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import type { User } from '../../lib/users';
import { Pagination } from '../ui/Pagination';

export interface UserListProps {
  users: User[];
  roles: Array<{ value: string; label: string }>;
  selectedUsers: number[];
  onSelect: (userIds: number[]) => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: number, userName: string) => void;
  onResetPassword?: (user: User) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  currentUserId?: number;
  lastSuperAdminIds?: Set<number>;
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const getRoleColor = (role: User['role']) => {
  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    super_admin: {
      bg: '#f3e8ff',
      text: '#6b21a8',
      border: '#e9d5ff',
    },
    admin: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#bfdbfe',
    },
    supervisor: {
      bg: '#dcfce7',
      text: '#166534',
      border: '#bbf7d0',
    },
    inspector: {
      bg: '#fef9c3',
      text: '#854d0e',
      border: '#fef08a',
    },
    guard: {
      bg: '#fed7aa',
      text: '#9a3412',
      border: '#fdba74',
    },
    clerk: {
      bg: '#f3f4f6',
      text: '#1f2937',
      border: '#e5e7eb',
    },
  };
  return roleColors[role] || roleColors.clerk;
};

export const UserList: React.FC<UserListProps> = ({
  users,
  roles,
  selectedUsers,
  onSelect,
  onEdit,
  onDelete,
  onResetPassword,
  canUpdate = false,
  canDelete = false,
  currentUserId,
  lastSuperAdminIds = new Set(),
  meta,
  onPageChange,
  onPerPageChange,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (user: User) => {
    navigate(`/app/admin/users/${user.id}`);
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      onSelect([...selectedUsers, userId]);
    } else {
      onSelect(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelect(users.map((u) => u.id));
    } else {
      onSelect([]);
    }
  };

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isSomeSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <div
      style={{
        ...cardStyles.base,
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              backgroundColor: colors.neutral[50],
              borderBottom: `1px solid ${colors.neutral[200]}`,
            }}
          >
            <tr>
              <th
                style={{
                  padding: spacing.md,
                  textAlign: 'left',
                  ...typography.label,
                  color: colors.neutral[600],
                  fontWeight: 600,
                  width: '40px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </th>
              {['Employee ID', 'Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: spacing.md,
                    textAlign: header === 'Actions' ? 'right' : 'left',
                    ...typography.label,
                    color: colors.neutral[600],
                    fontWeight: 600,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => {
              const isSelected = selectedUsers.includes(user.id);
              const roleColor = getRoleColor(user.role);
              const roleLabel = roles.find((r) => r.value === user.role)?.label || user.role;
              const isLastSuperAdmin = lastSuperAdminIds.has(user.id);
              const canDeleteUser = canDelete && currentUserId !== user.id && !isLastSuperAdmin;

              return (
                <tr
                  key={user.id}
                  onClick={() => handleRowClick(user)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(user);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View user details: ${user.name} (${user.employee_id})`}
                  style={{
                    borderBottom: index < users.length - 1 ? `1px solid ${colors.neutral[200]}` : 'none',
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? colors.primary + '10' : 'white',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <td
                    style={{ padding: spacing.md }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
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
                    <span
                      style={{
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
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {roleLabel}
                    </span>
                  </td>
                  <td style={{ padding: spacing.md }}>
                    <span
                      style={{
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
                        whiteSpace: 'nowrap',
                      }}
                    >
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
                  <td
                    style={{ padding: spacing.md, textAlign: 'right' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
                      {canUpdate && onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(user);
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
                            transition: 'all 0.2s ease',
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
                      {canUpdate && onResetPassword && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetPassword(user);
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
                            transition: 'all 0.2s ease',
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
                      {canDeleteUser && onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(user.id, user.name);
                          }}
                          aria-label={`Delete user ${user.name}`}
                          title={isLastSuperAdmin
                            ? 'Cannot delete the last active superadmin. At least one superadmin must always exist.'
                            : 'Delete user'}
                          style={{
                            padding: spacing.sm,
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: isLastSuperAdmin ? 'not-allowed' : 'pointer',
                            opacity: isLastSuperAdmin ? 0.5 : 1,
                            color: colors.critical,
                            borderRadius: borderRadius.sm,
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isLastSuperAdmin) {
                              e.currentTarget.style.backgroundColor = colors.neutral[100];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          disabled={isLastSuperAdmin}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {meta && meta.last_page > 1 && (
        <div style={{ padding: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
          <Pagination
            currentPage={meta.current_page}
            totalPages={meta.last_page}
            totalItems={meta.total}
            perPage={meta.per_page}
            onPageChange={(newPage) => {
              onPageChange?.(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPerPageChange={(newPerPage) => {
              onPerPageChange?.(newPerPage);
            }}
          />
        </div>
      )}
    </div>
  );
};


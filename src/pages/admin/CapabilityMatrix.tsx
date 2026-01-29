import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, updateUser, getAvailableRoles, type User, type UserCapabilities, type CapabilityModule, type CapabilityAction } from '../../lib/users';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../providers/ToastProvider';
import { Grid, Filter, Download, Check, X, UserCog } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queries';
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
  create: 'C',
  read: 'R',
  update: 'U',
  delete: 'D',
  approve: 'A',
  validate: 'V',
  review: 'Rv',
  reassign: 'Ra',
  export: 'E',
};

const actionFullLabels: Record<CapabilityAction, string> = {
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

export const CapabilityMatrix: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmCapabilityRemoval, setConfirmCapabilityRemoval] = useState<{
    user: User;
    module: CapabilityModule;
    action: CapabilityAction;
  } | null>(null);

  // Fetch all users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.users.list({ role: filterRole !== 'all' ? filterRole : undefined }),
    queryFn: async () => {
      const users = await getUsers();
      return users;
    },
  });

  // Fetch available roles dynamically from API (includes custom roles)
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
        // If roles table doesn't exist, return empty array (will use hardcoded fallback)
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
  const availableRoles = apiRoles.length > 0 
    ? apiRoles.map(role => ({
        value: role.name as User['role'],
        label: role.display_name + (role.is_system_role === false ? ' (Custom)' : ''),
        description: role.description || '',
      }))
    : hardcodedRoles;

  // Update user capabilities mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, capabilities }: { userId: string; capabilities: UserCapabilities }) => {
      await updateUser(userId, { capabilities });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      showToast('Capabilities updated successfully', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to update capabilities: ${error.message}`, 'error');
    },
  });

  // getUsers() returns { data: User[], meta, links } — use .data for the list
  const usersList = usersData?.data ?? [];

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!usersList.length) return [];
    
    let filtered = usersList;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.employee_id?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [usersList, filterRole, searchTerm]);

  // Get all unique capabilities across all modules
  const allCapabilities = useMemo(() => {
    const caps: Array<{ module: CapabilityModule; action: CapabilityAction }> = [];
    modules.forEach(module => {
      const moduleActions = actions.filter(action => {
        if (module === 'gate_pass' && !['create', 'read', 'update', 'delete', 'approve', 'validate'].includes(action)) return false;
        if (module === 'inspection' && !['create', 'read', 'update', 'delete', 'approve', 'review'].includes(action)) return false;
        if (module === 'expense' && !['create', 'read', 'update', 'delete', 'approve', 'reassign'].includes(action)) return false;
        if (module === 'user_management' && !['create', 'read', 'update', 'delete'].includes(action)) return false;
        if (module === 'reports' && !['read', 'export'].includes(action)) return false;
        return true;
      });
      moduleActions.forEach(action => {
        caps.push({ module, action });
      });
    });
    return caps;
  }, []);

  const hasCapability = (user: User, module: CapabilityModule, action: CapabilityAction): boolean => {
    return user.capabilities?.[module]?.includes(action) ?? false;
  };

  const toggleCapability = async (user: User, module: CapabilityModule, action: CapabilityAction) => {
    const current = user.capabilities?.[module] || [];
    const isRemoving = current.includes(action);
    
    // High-risk actions require confirmation when removing
    const highRiskActions: CapabilityAction[] = ['delete', 'approve'];
    if (isRemoving && highRiskActions.includes(action)) {
      setConfirmCapabilityRemoval({ user, module, action });
      return;
    }
    
    const newCapabilities: UserCapabilities = { ...user.capabilities };
    
    if (isRemoving) {
      newCapabilities[module] = current.filter(a => a !== action);
    } else {
      newCapabilities[module] = [...current, action];
    }
    
    // Remove empty arrays
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }
    
    await updateMutation.mutateAsync({ userId: user.id.toString(), capabilities: newCapabilities });
  };

  const confirmRemoveCapability = async () => {
    if (!confirmCapabilityRemoval) return;
    
    const { user, module, action } = confirmCapabilityRemoval;
    const current = user.capabilities?.[module] || [];
    const newCapabilities: UserCapabilities = { ...user.capabilities };
    
    newCapabilities[module] = current.filter(a => a !== action);
    
    // Remove empty arrays
    if (newCapabilities[module]?.length === 0) {
      delete newCapabilities[module];
    }
    
    await updateMutation.mutateAsync({ userId: user.id.toString(), capabilities: newCapabilities });
    setConfirmCapabilityRemoval(null);
  };

  const exportToCSV = () => {
    if (!filteredUsers || filteredUsers.length === 0) return;
    
    const headers = ['User', 'Email', 'Role', ...allCapabilities.map(c => `${moduleLabels[c.module]}: ${actionFullLabels[c.action]}`)];
    const rows = filteredUsers.map(user => {
      const row = [user.name, user.email, user.role];
      allCapabilities.forEach(cap => {
        row.push(hasCapability(user, cap.module, cap.action) ? 'Yes' : 'No');
      });
      return row;
    });
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capability-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Capability matrix exported to CSV', 'success');
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
        <div style={{ color: colors.neutral[600] }}>Loading capability matrix...</div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="full" className="page-container-no-padding">
      <div style={{ overflowX: 'auto', padding: spacing.xl }}>
        <PageHeader
        title="Capability Matrix"
        subtitle="View and manage user capabilities across all modules"
        icon="🔐"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin', path: '/app/admin/users' },
          { label: 'Capability Matrix' }
        ]}
      />

      {/* Filters and Actions */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg, display: 'flex', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: '200px' }}>
          <Filter size={20} color={colors.neutral[600]} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: `${spacing.sm}px ${spacing.md}px`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              ...typography.body,
            }}
          />
        </div>
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: `${spacing.sm}px ${spacing.md}px`,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.sm,
            ...typography.body,
            minWidth: '150px',
          }}
        >
          <option value="all">All Roles</option>
          {availableRoles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <Button
          variant="secondary"
          onClick={exportToCSV}
          style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}
        >
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {/* Matrix Grid */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Users Found"
          description={searchTerm || filterRole !== 'all' ? "Try adjusting your filters." : "No users in the system."}
        />
      ) : (
        <div style={{ marginTop: spacing.lg, overflowX: 'auto' }}>
          <div style={{ ...cardStyles.card, minWidth: 'max-content' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.neutral[300]}` }}>
                  <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10 }}>
                    User
                  </th>
                  <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left', position: 'sticky', left: '200px', backgroundColor: 'white', zIndex: 10 }}>
                    Role
                  </th>
                  {modules.map(module => (
                    <th
                      key={module}
                      colSpan={allCapabilities.filter(c => c.module === module).length}
                      style={{ ...typography.label, padding: spacing.md, textAlign: 'center', borderLeft: `1px solid ${colors.neutral[200]}` }}
                    >
                      {moduleLabels[module]}
                    </th>
                  ))}
                </tr>
                <tr style={{ borderBottom: `1px solid ${colors.neutral[200]}` }}>
                  <th style={{ padding: spacing.sm }}></th>
                  <th style={{ padding: spacing.sm }}></th>
                  {allCapabilities.map(cap => (
                    <th
                      key={`${cap.module}-${cap.action}`}
                      style={{ ...typography.caption, padding: spacing.xs, textAlign: 'center', minWidth: '40px', borderLeft: `1px solid ${colors.neutral[200]}` }}
                      title={actionFullLabels[cap.action]}
                    >
                      {actionLabels[cap.action]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: `1px solid ${colors.neutral[200]}`,
                      backgroundColor: idx % 2 === 0 ? 'white' : colors.neutral[50],
                    }}
                  >
                    <td style={{ padding: spacing.md, position: 'sticky', left: 0, backgroundColor: idx % 2 === 0 ? 'white' : colors.neutral[50], zIndex: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <UserCog size={16} color={colors.neutral[600]} />
                        <div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{user.name}</div>
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: spacing.md, position: 'sticky', left: '200px', backgroundColor: idx % 2 === 0 ? 'white' : colors.neutral[50], zIndex: 5 }}>
                      <div style={{
                        ...typography.caption,
                        padding: `${spacing.xs}px ${spacing.sm}px`,
                        backgroundColor: colors.primary + '20',
                        color: colors.primary,
                        borderRadius: borderRadius.sm,
                        display: 'inline-block',
                      }}>
                        {user.role}
                      </div>
                    </td>
                    {allCapabilities.map(cap => {
                      const hasCap = hasCapability(user, cap.module, cap.action);
                      return (
                        <td
                          key={`${cap.module}-${cap.action}`}
                          style={{
                            padding: spacing.sm,
                            textAlign: 'center',
                            borderLeft: `1px solid ${colors.neutral[200]}`,
                            cursor: 'pointer',
                            backgroundColor: hasCap ? colors.success[50] : colors.neutral[50],
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => toggleCapability(user, cap.module, cap.action)}
                          title={`${moduleLabels[cap.module]}: ${actionFullLabels[cap.action]} - Click to ${hasCap ? 'remove' : 'add'}`}
                        >
                          {hasCap ? (
                            <Check size={16} color={colors.success[600]} />
                          ) : (
                            <X size={16} color={colors.neutral[400]} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg, padding: spacing.md }}>
        <div style={{ ...typography.label, marginBottom: spacing.sm }}>Legend</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <Check size={16} color={colors.success[600]} />
            <span style={{ ...typography.caption }}>Has capability</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <X size={16} color={colors.neutral[400]} />
            <span style={{ ...typography.caption }}>No capability</span>
          </div>
          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
            Click any cell to toggle capability
          </div>
        </div>
        <div style={{ marginTop: spacing.sm, ...typography.caption, color: colors.neutral[600] }}>
          <strong>Action abbreviations:</strong> C=Create, R=Read, U=Update, D=Delete, A=Approve, V=Validate, Rv=Review, Ra=Reassign, E=Export
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmCapabilityRemoval !== null}
        onClose={() => setConfirmCapabilityRemoval(null)}
        onConfirm={confirmRemoveCapability}
        title="Remove Capability"
        description={`Are you sure you want to remove ${actionFullLabels[confirmCapabilityRemoval?.action || 'delete']} capability for ${moduleLabels[confirmCapabilityRemoval?.module || 'gate_pass']} from ${confirmCapabilityRemoval?.user.name}? This is a high-risk permission change.`}
        confirmText="Remove Capability"
        confirmVariant="warning"
        requireTyping={false}
      />
      </div>
    </PageContainer>
  );
};






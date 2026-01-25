# User Management System Design - From Scratch

**Based on:** VOMS module patterns, capability-based permissions, and existing architecture  
**Date:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Design](#api-design)
5. [Frontend Structure](#frontend-structure)
6. [Permission System](#permission-system)
7. [Features & User Flows](#features--user-flows)
8. [Implementation Patterns](#implementation-patterns)

---

## Overview

### Purpose
A comprehensive user management system for VOMS that follows the same patterns as other modules (Gate Pass, Expenses, Inspections, Stockyard) while providing:
- User CRUD operations
- Capability-based permission management
- Role templates (for convenience, not enforcement)
- Activity logging and audit trails
- Bulk operations
- User lifecycle management (activation, deactivation, password reset)

### Design Principles
1. **Consistency**: Follow patterns from existing modules
2. **Capability-First**: Permissions based on capabilities, not roles
3. **Type Safety**: Full TypeScript coverage
4. **Offline Support**: Works with offline queue system
5. **Activity Logging**: All actions logged for audit
6. **Superadmin Protection**: Always maintain at least one superadmin

---

## Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│   Pages (UserManagement.tsx)       │  ← UI Components
├─────────────────────────────────────┤
│   Hooks (useUsers.ts)               │  ← React Query hooks
├─────────────────────────────────────┤
│   Services (UserService.ts)         │  ← API client layer
├─────────────────────────────────────┤
│   API Client (apiClient.ts)         │  ← Centralized HTTP client
├─────────────────────────────────────┤
│   Backend API (/v1/users)          │  ← Laravel endpoints
└─────────────────────────────────────┘
```

### Module Structure

```
src/
├── pages/
│   └── admin/
│       ├── UserManagement.tsx          # Main list view
│       ├── UserDetails.tsx             # User detail view
│       ├── CreateUser.tsx              # Create user form
│       ├── EditUser.tsx                # Edit user form
│       └── UserBulkOperations.tsx      # Bulk actions
├── hooks/
│   ├── useUsers.ts                     # Main user hooks
│   ├── useUserDetails.ts               # Single user hook
│   ├── useUserFilters.ts               # Filter management
│   └── useUserCapabilities.ts          # Capability management
├── lib/
│   ├── services/
│   │   └── UserService.ts              # API service layer
│   └── users.ts                        # Types & utilities (existing)
└── components/
    └── users/
        ├── UserList.tsx                # List component
        ├── UserCard.tsx                # Card component
        ├── UserForm.tsx                # Form component
        ├── CapabilityEditor.tsx        # Capability management
        └── UserFilters.tsx             # Filter component
```

---

## Data Model

### User Entity

```typescript
interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: string;                    // Display name only
  role_id?: number;                // Links to roles table
  capabilities?: UserCapabilities; // Basic capabilities
  enhanced_capabilities?: EnhancedCapability[]; // Granular capabilities
  yard_id: string | null;
  is_active: boolean;
  skip_approval_gate_pass?: boolean;
  skip_approval_expense?: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number;
  creator?: User;                  // Populated relation
}
```

### Role Template (for convenience)

```typescript
interface Role {
  id: number;
  name: string;                    // e.g., "Supervisor", "Guard"
  display_name: string;
  description: string;
  capabilities: UserCapabilities;  // Default capabilities for this role
  is_system_role: boolean;          // Cannot be deleted
  created_at: string;
  updated_at: string;
}
```

### Capability Structure

```typescript
interface UserCapabilities {
  gate_pass?: CapabilityAction[];
  inspection?: CapabilityAction[];
  expense?: CapabilityAction[];
  user_management?: CapabilityAction[];
  reports?: CapabilityAction[];
  stockyard?: CapabilityAction[];
  enhanced_capabilities?: EnhancedCapability[];
}

interface EnhancedCapability {
  module: CapabilityModule;
  action: CapabilityAction;
  scope?: {
    type: 'all' | 'own' | 'yard' | 'function' | 'custom';
    value?: string | number;
  };
  conditions?: {
    time_restriction?: { start: string; end: string };
    field_restrictions?: string[];
  };
}
```

---

## API Design

### Endpoints

#### List Users
```
GET /v1/users
Query Params:
  - page?: number
  - per_page?: number (default: 50)
  - search?: string (name, email, employee_id)
  - role?: string
  - status?: 'active' | 'inactive' | 'all'
  - yard_id?: string
  - has_capability?: string (e.g., "gate_pass:create")
  - sort?: 'name' | 'email' | 'created_at' | 'last_login_at'
  - order?: 'asc' | 'desc'

Response: UsersResponse
{
  data: User[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  links: {
    next: string | null;
    prev: string | null;
  };
}
```

#### Get User
```
GET /v1/users/{id}

Response: { data: User }
```

#### Create User
```
POST /v1/users
Body: CreateUserPayload
{
  employee_id: string;
  name: string;
  email: string;
  password: string;
  role?: string;              // Display name
  role_id?: number;           // Preferred: link to role
  capabilities?: UserCapabilities;
  yard_id?: string | null;
  is_active?: boolean;
  skip_approval_gate_pass?: boolean;
  skip_approval_expense?: boolean;
}

Response: { data: User }
```

#### Update User
```
PUT /v1/users/{id}
Body: UpdateUserPayload (all fields optional)

Response: { data: User }
```

#### Delete User
```
DELETE /v1/users/{id}

Response: 204 No Content
```

#### Get User Permissions
```
GET /v1/users/{id}/permissions

Response: {
  user_id: number;
  role: string;
  capabilities: UserCapabilities;
  enhanced_capabilities?: EnhancedCapability[];
}
```

#### Update User Capabilities
```
PATCH /v1/users/{id}/capabilities
Body: {
  capabilities?: UserCapabilities;
  enhanced_capabilities?: EnhancedCapability[];
}

Response: { data: User }
```

#### Reset Password
```
POST /v1/users/{id}/reset-password
Body: {
  password: string;
  send_email?: boolean;  // Send password reset email
}

Response: 204 No Content
```

#### Bulk Operations
```
POST /v1/users/bulk
Body: {
  action: 'activate' | 'deactivate' | 'delete' | 'assign_role' | 'assign_capabilities';
  user_ids: number[];
  payload?: {
    role_id?: number;
    capabilities?: UserCapabilities;
  };
}

Response: {
  success: number;
  failed: number;
  errors?: Array<{ user_id: number; error: string }>;
}
```

#### Get Available Roles
```
GET /v1/roles

Response: {
  data: Role[];
}
```

#### Get Role Capabilities
```
GET /v1/roles/{id}/capabilities

Response: {
  role_id: number;
  capabilities: UserCapabilities;
}
```

---

## Frontend Structure

### 1. Service Layer (`lib/services/UserService.ts`)

```typescript
import { apiClient } from '../apiClient';
import type { User, CreateUserPayload, UpdateUserPayload, UsersResponse, GetUsersParams } from '../users';

export const userService = {
  // List users with filters
  async getUsers(params?: GetUsersParams): Promise<UsersResponse> {
    const response = await apiClient.get<UsersResponse>('/v1/users', { params });
    return response.data;
  },

  // Get single user
  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<{ data: User }>(`/v1/users/${id}`);
    return response.data.data;
  },

  // Create user
  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await apiClient.post<{ data: User }>('/v1/users', payload);
    return response.data.data;
  },

  // Update user
  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const response = await apiClient.put<{ data: User }>(`/v1/users/${id}`, payload);
    return response.data.data;
  },

  // Delete user
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/v1/users/${id}`);
  },

  // Get user permissions
  async getUserPermissions(id: number): Promise<{ user_id: number; role: string; capabilities: UserCapabilities }> {
    const response = await apiClient.get(`/v1/users/${id}/permissions`);
    return response.data;
  },

  // Update capabilities
  async updateCapabilities(id: number, capabilities: UserCapabilities, enhanced?: EnhancedCapability[]): Promise<User> {
    const response = await apiClient.patch<{ data: User }>(`/v1/users/${id}/capabilities`, {
      capabilities,
      enhanced_capabilities: enhanced,
    });
    return response.data.data;
  },

  // Reset password
  async resetPassword(id: number, password: string, sendEmail = false): Promise<void> {
    await apiClient.post(`/v1/users/${id}/reset-password`, { password, send_email: sendEmail });
  },

  // Bulk operations
  async bulkOperation(action: string, userIds: number[], payload?: any): Promise<{ success: number; failed: number; errors?: any[] }> {
    const response = await apiClient.post('/v1/users/bulk', {
      action,
      user_ids: userIds,
      payload,
    });
    return response.data;
  },

  // Get roles
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<{ data: Role[] }>('/v1/roles');
    return response.data.data;
  },
};
```

### 2. React Query Hooks (`hooks/useUsers.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/services/UserService';
import { useToast } from '../providers/ToastProvider';
import { logActivity } from '../lib/activityLogs';
import type { User, CreateUserPayload, UpdateUserPayload, GetUsersParams } from '../lib/users';

// Query Keys Factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: GetUsersParams) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  roles: () => [...userKeys.all, 'roles'] as const,
};

// List users hook
export function useUsers(filters?: GetUsersParams) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getUsers(filters),
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true, // For pagination
  });
}

// Single user hook
export function useUser(id: number | null, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: () => userService.getUser(id!),
    enabled: enabled && id !== null,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.createUser(payload),
    onSuccess: async (user) => {
      // Invalidate lists
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      // Log activity
      await logActivity({
        action: 'create',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: { name: user.name, email: user.email },
      });

      showToast({
        title: 'User created',
        description: `${user.name} has been added successfully`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to create user',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      userService.updateUser(id, payload),
    onSuccess: async (user, variables) => {
      // Update cache
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Log activity
      await logActivity({
        action: 'update',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: { changes: variables.payload },
      });

      showToast({
        title: 'User updated',
        description: `${user.name} has been updated`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to update user',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: async (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Log activity
      await logActivity({
        action: 'delete',
        module: 'user_management',
        resource_type: 'user',
        resource_id: userId.toString(),
      });

      showToast({
        title: 'User deleted',
        description: 'User has been removed',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to delete user',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Update capabilities mutation
export function useUpdateCapabilities() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, capabilities, enhanced }: { id: number; capabilities: UserCapabilities; enhanced?: EnhancedCapability[] }) =>
      userService.updateCapabilities(id, capabilities, enhanced),
    onSuccess: async (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      await logActivity({
        action: 'update',
        module: 'user_management',
        resource_type: 'user',
        resource_id: user.id.toString(),
        details: { type: 'capabilities' },
      });

      showToast({
        title: 'Capabilities updated',
        description: `Permissions for ${user.name} have been updated`,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to update capabilities',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Reset password mutation
export function useResetPassword() {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ id, password, sendEmail }: { id: number; password: string; sendEmail?: boolean }) =>
      userService.resetPassword(id, password, sendEmail),
    onSuccess: () => {
      showToast({
        title: 'Password reset',
        description: 'Password has been reset successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Failed to reset password',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Bulk operations mutation
export function useBulkUserOperation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ action, userIds, payload }: { action: string; userIds: number[]; payload?: any }) =>
      userService.bulkOperation(action, userIds, payload),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      await logActivity({
        action: 'bulk_operation',
        module: 'user_management',
        resource_type: 'user',
        details: { action, count: result.success },
      });

      showToast({
        title: 'Bulk operation completed',
        description: `${result.success} users updated, ${result.failed} failed`,
        variant: result.failed > 0 ? 'warning' : 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Bulk operation failed',
        description: error.message || 'An error occurred',
        variant: 'error',
      });
    },
  });
}

// Get roles hook
export function useRoles() {
  return useQuery({
    queryKey: userKeys.roles(),
    queryFn: () => userService.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 3. Filter Hook (`hooks/useUserFilters.ts`)

```typescript
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GetUsersParams } from '../lib/users';

export function useUserFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL
  const filters = useMemo<GetUsersParams>(() => ({
    page: parseInt(searchParams.get('page') || '1', 10),
    per_page: parseInt(searchParams.get('per_page') || '50', 10),
    search: searchParams.get('search') || undefined,
    role: searchParams.get('role') || undefined,
    status: (searchParams.get('status') as 'active' | 'inactive' | 'all') || 'all',
    yard_id: searchParams.get('yard_id') || undefined,
    sort: (searchParams.get('sort') as any) || 'name',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'asc',
  }), [searchParams]);

  const updateFilter = (key: keyof GetUsersParams, value: any) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value === undefined || value === '' || value === 'all') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      // Reset to page 1 when filters change
      if (key !== 'page') {
        newParams.set('page', '1');
      }
      return newParams;
    });
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  return {
    filters,
    updateFilter,
    clearFilters,
  };
}
```

### 4. Main Page Component (`pages/admin/UserManagement.tsx`)

```typescript
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers, useDeleteUser, useBulkUserOperation } from '../../hooks/useUsers';
import { useUserFilters } from '../../hooks/useUserFilters';
import { useAuth } from '../../providers/useAuth';
import { hasCapability } from '../../lib/users';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { UserList } from '../../components/users/UserList';
import { UserFilters } from '../../components/users/UserFilters';
import { LoadingState } from '../../components/ui/LoadingState';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { Plus, Search, Filter, Download } from 'lucide-react';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { filters, updateFilter, clearFilters } = useUserFilters();
  const { data, isLoading, error, refetch } = useUsers(filters);
  const deleteMutation = useDeleteUser();
  const bulkMutation = useBulkUserOperation();

  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const users = data?.data || [];
  const meta = data?.meta;

  // Permission checks
  const canCreate = hasCapability(currentUser, 'user_management', 'create');
  const canDelete = hasCapability(currentUser, 'user_management', 'delete');
  const canExport = hasCapability(currentUser, 'user_management', 'export');

  const handleCreate = () => {
    navigate('/app/admin/users/create');
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    await deleteMutation.mutateAsync(userId);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedUsers.length} users?`)) return;
    await bulkMutation.mutateAsync({
      action: 'delete',
      userIds: selectedUsers,
    });
    setSelectedUsers([]);
  };

  const handleBulkActivate = async () => {
    await bulkMutation.mutateAsync({
      action: 'activate',
      userIds: selectedUsers,
    });
    setSelectedUsers([]);
  };

  const handleBulkDeactivate = async () => {
    await bulkMutation.mutateAsync({
      action: 'deactivate',
      userIds: selectedUsers,
    });
    setSelectedUsers([]);
  };

  if (error) {
    return <NetworkError onRetry={refetch} />;
  }

  return (
    <PullToRefreshWrapper onRefresh={refetch}>
      <div className="space-y-6">
        <PageHeader
          title="User Management"
          description="Manage users, roles, and permissions"
          actions={
            canCreate && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            )
          }
        />

        {/* Search and Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {canExport && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {showFilters && (
          <UserFilters
            filters={filters}
            onUpdate={updateFilter}
            onClear={clearFilters}
          />
        )}

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkActivate}>
                Activate
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkDeactivate}>
                Deactivate
              </Button>
              {canDelete && (
                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}

        {/* User List */}
        {isLoading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Create your first user to get started"
            action={canCreate ? { label: 'Create User', onClick: handleCreate } : undefined}
          />
        ) : (
          <UserList
            users={users}
            onSelect={setSelectedUsers}
            selectedUsers={selectedUsers}
            onDelete={canDelete ? handleDelete : undefined}
            onEdit={(user) => navigate(`/app/admin/users/${user.id}/edit`)}
            onView={(user) => navigate(`/app/admin/users/${user.id}`)}
          />
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((meta.current_page - 1) * meta.per_page) + 1} to{' '}
              {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} users
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={meta.current_page === 1}
                onClick={() => updateFilter('page', meta.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={meta.current_page === meta.last_page}
                onClick={() => updateFilter('page', meta.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </PullToRefreshWrapper>
  );
}
```

---

## Permission System

### Capability Checks

All permission checks use the capability system:

```typescript
// ✅ CORRECT: Check capabilities
if (hasCapability(user, 'user_management', 'create')) {
  // Show create button
}

// ❌ WRONG: Don't check role
if (user.role === 'admin') {
  // This is wrong
}
```

### Required Capabilities

- **List Users**: `user_management:read`
- **View User**: `user_management:read`
- **Create User**: `user_management:create`
- **Update User**: `user_management:update`
- **Delete User**: `user_management:delete`
- **Manage Capabilities**: `user_management:update` (capabilities field)
- **Reset Password**: `user_management:update`
- **Bulk Operations**: `user_management:update` or `user_management:delete`

### Superadmin Protection

```typescript
// Check if user is last superadmin before delete/deactivate
import { isLastSuperAdmin } from '../../lib/users';

const handleDelete = async (user: User) => {
  const isLast = await isLastSuperAdmin(user.id);
  if (isLast) {
    showToast({
      title: 'Cannot delete',
      description: 'Cannot delete the last active superadmin',
      variant: 'error',
    });
    return;
  }
  // Proceed with delete
};
```

---

## Features & User Flows

### 1. List Users
- **URL**: `/app/admin/users`
- **Features**:
  - Search by name, email, employee_id
  - Filter by role, status, yard
  - Sort by name, email, created_at, last_login_at
  - Pagination
  - Bulk selection
  - Export to CSV/Excel
  - Pull-to-refresh

### 2. Create User
- **URL**: `/app/admin/users/create`
- **Form Fields**:
  - Employee ID (required, unique)
  - Name (required)
  - Email (required, unique, validated)
  - Password (required, strength meter)
  - Role (dropdown, optional - for display)
  - Role Template (dropdown, optional - applies default capabilities)
  - Yard (optional)
  - Active status (default: true)
  - Skip approval flags
  - Capabilities (advanced editor)
- **Validation**:
  - Email format
  - Password strength
  - Employee ID uniqueness
  - Email uniqueness
- **Activity Logging**: Log user creation

### 3. Edit User
- **URL**: `/app/admin/users/{id}/edit`
- **Similar to Create**, but:
  - Pre-filled with existing data
  - Password field optional (only if changing)
  - Cannot change employee_id
  - Shows last login, created date

### 4. User Details
- **URL**: `/app/admin/users/{id}`
- **Sections**:
  - Basic Info (name, email, role, status)
  - Permissions (capabilities viewer)
  - Activity Log (user's actions)
  - Sessions (active sessions)
  - Related Records (gate passes, expenses created by user)

### 5. Capability Management
- **Component**: `CapabilityEditor`
- **Features**:
  - Module-level capabilities (checkboxes)
  - Enhanced capabilities (advanced editor)
  - Role template selector
  - Capability preview
  - Save changes with confirmation

### 6. Bulk Operations
- **Actions**:
  - Activate/Deactivate
  - Delete
  - Assign Role
  - Assign Capabilities
- **UI**: Selection checkboxes, bulk action bar
- **Confirmation**: Required for destructive actions

---

## Implementation Patterns

### 1. Follow Existing Module Patterns

- **Service Layer**: Like `AccessService`, `TaskService`
- **Query Keys Factory**: Like `accessPassKeys`, `taskKeys`
- **Filter Hook**: Like `useGatePassFilters`, `useExpenseFilters`
- **Activity Logging**: After all mutations
- **Toast Notifications**: Success/error feedback
- **Loading States**: `LoadingState` component
- **Error Handling**: `NetworkError` component
- **Empty States**: `EmptyState` component
- **Pull-to-Refresh**: `PullToRefreshWrapper`

### 2. Type Safety

- All types in `lib/users.ts`
- Use TypeScript interfaces for all API responses
- Type all hooks and functions

### 3. Offline Support

- Uses `apiClient` which has offline queue
- Mutations will queue if offline
- Retry automatically when online

### 4. Performance

- Lazy load pages
- Memoize expensive computations
- Use `keepPreviousData` for pagination
- Optimistic updates where appropriate

### 5. Security

- All API calls through `apiClient` (CSRF protection)
- Permission checks on frontend (backend enforces)
- Superadmin protection
- Password strength validation

---

## Summary

This design provides a complete user management system that:

1. ✅ Follows existing module patterns (Gate Pass, Expenses, etc.)
2. ✅ Uses capability-based permissions (not role-based)
3. ✅ Full TypeScript type safety
4. ✅ Activity logging for audit trails
5. ✅ Bulk operations support
6. ✅ Offline support via apiClient
7. ✅ Superadmin protection
8. ✅ Consistent UI/UX with other modules
9. ✅ URL-based state management (filters, pagination)
10. ✅ Proper error handling and loading states

The system is designed to be maintainable, scalable, and consistent with the rest of the VOMS application.


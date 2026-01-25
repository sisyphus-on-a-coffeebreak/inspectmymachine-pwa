/**
 * UserFilters Component
 * 
 * Filter UI for user list with search, role, and status filters
 */

import React from 'react';
import { Search, Filter, Users as UsersIcon, X } from 'lucide-react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../ui/button';
import type { GetUsersParams } from '../../lib/users';

export interface UserFiltersProps {
  filters: GetUsersParams;
  roles: Array<{ value: string; label: string }>;
  totalUsers?: number;
  onUpdate: (key: keyof GetUsersParams, value: any) => void;
  onClear: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  roles,
  totalUsers,
  onUpdate,
  onClear,
  showFilters = true,
  onToggleFilters,
}) => {
  const hasActiveFilters = filters.search || (filters.role && filters.role !== 'all') || (filters.status && filters.status !== 'all');

  return (
    <div
      style={{
        ...cardStyles.base,
        marginBottom: spacing.lg,
        padding: spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[400],
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, employee ID, role, or capability..."
            value={filters.search || ''}
            onChange={(e) => onUpdate('search', e.target.value)}
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
              transition: 'all 0.2s ease',
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

        {/* Filters Row */}
        {showFilters && (
          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <Filter size={18} color={colors.neutral[600]} />
              <select
                value={filters.role || 'all'}
                onChange={(e) => onUpdate('role', e.target.value === 'all' ? undefined : e.target.value)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  color: colors.neutral[700],
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
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
              value={filters.status || 'all'}
              onChange={(e) => onUpdate('status', e.target.value === 'all' ? undefined : e.target.value)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                color: colors.neutral[700],
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <X size={16} />
                Clear Filters
              </Button>
            )}

            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                color: colors.neutral[600],
                fontSize: '14px',
              }}
            >
              <UsersIcon size={16} />
              <span>
                {totalUsers || 0} user{(totalUsers || 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


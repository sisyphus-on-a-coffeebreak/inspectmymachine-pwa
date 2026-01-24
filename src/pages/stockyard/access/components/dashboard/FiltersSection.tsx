/**
 * Filters Section Component
 * Handles filtering UI for gate pass dashboard
 */

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBadges } from '@/components/ui/FilterBadge';
import { colors, typography, spacing, borderRadius } from '@/lib/theme';
import { useGatePassFilters } from '@/pages/stockyard/access/hooks/useGatePassFilters';

export const FiltersSection: React.FC = () => {
  const { filters, setFilter, clearFilters, hasActiveFilters, activeFilterCount } = useGatePassFilters();

  return (
    <div style={{ 
      marginBottom: spacing.lg,
      backgroundColor: 'white',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.neutral[200]}`,
    }}>
      <div style={{ 
        display: 'flex',
        gap: spacing.sm,
        flexWrap: 'wrap',
        alignItems: 'center',
        marginBottom: hasActiveFilters ? spacing.sm : 0,
      }}>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name, pass number, or access code..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          style={{
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: typography.bodySmall.fontSize,
            flex: 1,
            minWidth: '200px',
            fontFamily: typography.body.fontFamily,
          }}
        />
        
        {/* Status Filter */}
        {(['all', 'active', 'pending', 'inside'] as const).map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter('status', filterOption)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: filters.status === filterOption ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              backgroundColor: filters.status === filterOption ? colors.primary[50] : 'white',
              color: filters.status === filterOption ? colors.primary[600] : colors.neutral[700],
              cursor: 'pointer',
              fontSize: typography.bodySmall.fontSize,
              fontWeight: filters.status === filterOption ? 600 : 500,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (filters.status !== filterOption) {
                e.currentTarget.style.borderColor = colors.primary[300];
                e.currentTarget.style.backgroundColor = colors.neutral[50];
              }
            }}
            onMouseLeave={(e) => {
              if (filters.status !== filterOption) {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {filterOption}
          </button>
        ))}
        
        {/* Type Filter */}
        {(['all', 'visitor', 'vehicle'] as const).map(typeOption => (
          <button
            key={typeOption}
            onClick={() => setFilter('type', typeOption)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: filters.type === typeOption ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              backgroundColor: filters.type === typeOption ? colors.primary[50] : 'white',
              color: filters.type === typeOption ? colors.primary[600] : colors.neutral[700],
              cursor: 'pointer',
              fontSize: typography.bodySmall.fontSize,
              fontWeight: filters.type === typeOption ? 600 : 500,
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (filters.type !== typeOption) {
                e.currentTarget.style.borderColor = colors.primary[300];
                e.currentTarget.style.backgroundColor = colors.neutral[50];
              }
            }}
            onMouseLeave={(e) => {
              if (filters.type !== typeOption) {
                e.currentTarget.style.borderColor = colors.neutral[300];
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {typeOption}
          </button>
        ))}
      </div>
      
      {/* Filter Summary and Clear Button */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}>
          <div style={{
            ...typography.bodySmall,
            color: colors.neutral[600],
          }}>
            {activeFilterCount > 0 && `${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearFilters}
            icon={<X size={16} />}
          >
            Clear Filters
          </Button>
        </div>
      )}
      
      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div style={{ marginTop: spacing.sm }}>
          <FilterBadges
            filters={[
              ...(filters.status !== 'all' ? [{
                label: 'Status',
                value: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
                onRemove: () => setFilter('status', 'all'),
              }] : []),
              ...(filters.type !== 'all' ? [{
                label: 'Type',
                value: filters.type.charAt(0).toUpperCase() + filters.type.slice(1),
                onRemove: () => setFilter('type', 'all'),
              }] : []),
              ...(filters.search.trim() ? [{
                label: 'Search',
                value: filters.search,
                onRemove: () => setFilter('search', ''),
              }] : []),
            ]}
            onClearAll={clearFilters}
          />
        </div>
      )}
    </div>
  );
};



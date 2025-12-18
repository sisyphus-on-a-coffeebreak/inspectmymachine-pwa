/**
 * FilterBar Component
 * 
 * Standardized filter UI component for consistent filtering across all pages
 * Supports search, multiple filter dropdowns, and clear filters action
 */

import React from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { X, Search } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  filters: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }>;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  onClear?: () => void;
  showClearButton?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  search,
  onClear,
  showClearButton = true,
}) => {
  const hasActiveFilters = filters.some(f => f.value !== 'all' && f.value !== '') || (search?.value && search.value.length > 0);
  
  // Get active filters for badge display
  const activeFilters = filters.filter(f => f.value !== 'all' && f.value !== '');
  const activeSearch = search?.value && search.value.length > 0;

  return (
    <div style={{
      ...cardStyles.base,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md,
      padding: spacing.md,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Filter Controls Row */}
      <div style={{
        display: 'flex',
        gap: spacing.md,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
      {search && (
        <div style={{ position: 'relative', flex: '1', minWidth: '0', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: spacing.sm,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.neutral[500], // Improved contrast for accessibility
            }}
          />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || "Search..."}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl + spacing.sm}`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: typography.body.fontFamily,
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${colors.primary}`;
              e.currentTarget.style.outlineOffset = '2px';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.borderColor = colors.neutral[300];
            }}
          />
        </div>
      )}

      {filters.map((filter) => (
        <div key={filter.key} style={{ position: 'relative' }}>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              paddingRight: spacing.xl,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: typography.body.fontFamily,
              backgroundColor: 'white',
              color: colors.neutral[900],
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `right ${spacing.sm} center`,
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${colors.primary}`;
              e.currentTarget.style.outlineOffset = '2px';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.borderColor = colors.neutral[300];
            }}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count !== undefined ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

        {showClearButton && hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: colors.neutral[100],
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: typography.body.fontFamily,
              color: colors.neutral[700],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[200];
              e.currentTarget.style.borderColor = colors.neutral[400];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[100];
              e.currentTarget.style.borderColor = colors.neutral[300];
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = `2px solid ${colors.primary}`;
              e.currentTarget.style.outlineOffset = '2px';
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = 'none';
            }}
          >
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          flexWrap: 'wrap',
          alignItems: 'center',
          paddingTop: spacing.xs,
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}>
          {activeSearch && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.primary + '15',
                border: `1px solid ${colors.primary}`,
                borderRadius: borderRadius.md,
                fontSize: '13px',
                fontFamily: typography.body.fontFamily,
                color: colors.primary,
              }}
            >
              <span style={{ fontWeight: 500 }}>Search: "{search.value}"</span>
              <button
                onClick={() => search.onChange('')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '50%',
                  color: colors.primary,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.primary;
                }}
                aria-label="Remove search filter"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          {activeFilters.map((filter) => {
            const selectedOption = filter.options.find(opt => opt.value === filter.value);
            const label = selectedOption?.label || filter.value;
            
            return (
              <div
                key={filter.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: colors.primary + '15',
                  border: `1px solid ${colors.primary}`,
                  borderRadius: borderRadius.md,
                  fontSize: '13px',
                  fontFamily: typography.body.fontFamily,
                  color: colors.primary,
                }}
              >
                <span style={{ fontWeight: 500 }}>{filter.label}: {label}</span>
                <button
                  onClick={() => filter.onChange('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    borderRadius: '50%',
                    color: colors.primary,
                    transition: 'all 0.2s ease',
                    minWidth: '20px',
                    minHeight: '20px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.primary;
                  }}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


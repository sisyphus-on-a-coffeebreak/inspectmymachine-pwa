/**
 * PassListSection Component
 * 
 * Reusable pass list with filters
 * Used across different role dashboards
 */

import React from 'react';
import { useGatePassFilters } from '../../hooks/useGatePassFilters';
import { useGatePasses } from '@/hooks/useGatePasses';
import { useMemo } from 'react';
import type { GatePassFilters, GatePass } from '../../gatePassTypes';
import { colors, spacing, borderRadius } from '../../../../lib/theme';
import { PassCard } from '../../../../components/gatepass/PassCard';
import { PassCardSkeleton } from '../../../../components/gatepass/PassCardSkeleton';
import { GatePassEmptyState } from '../GatePassEmptyState';
import { Pagination } from '../../../../components/ui/Pagination';
import { FilterBadges } from '../../../../components/ui/FilterBadge';
import { Button } from '../../../../components/ui/button';
import { X } from 'lucide-react';
import { typography } from '../../../../lib/theme';

export const PassListSection: React.FC = () => {
  const { filters, setFilter, clearFilters, hasActiveFilters, activeFilterCount } = useGatePassFilters();
  const perPage = 20;

  // Build API filters from URL-based filters
  const apiFilters: GatePassFilters = useMemo(() => {
    const filterObj: GatePassFilters = {
      per_page: perPage,
      page: filters.page,
      include_stats: false, // Stats already loaded in parent
    };

    // Map status filter
    if (filters.status === 'all') {
      filterObj.status = ['pending', 'active', 'inside'];
    } else if (filters.status === 'active') {
      filterObj.status = ['active', 'inside'];
    } else {
      filterObj.status = [filters.status as any];
    }

    // Map type filter
    if (filters.type === 'visitor') {
      filterObj.type = 'visitor';
    } else if (filters.type === 'vehicle') {
      filterObj.type = ['vehicle_inbound', 'vehicle_outbound'];
    }

    // Add search if present
    if (filters.search.trim()) {
      filterObj.search = filters.search.trim();
    }

    return filterObj;
  }, [filters, perPage]);

  const { data: passesData, isLoading: loading } = useGatePasses(apiFilters);
  const allPasses = passesData?.data || [];
  const pagination = {
    total: passesData?.total || 0,
    page: passesData?.page || 1,
    per_page: passesData?.per_page || 20,
    last_page: passesData?.last_page || 1,
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: spacing.lg,
        color: colors.neutral[900],
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm
      }}>
        📋 Recent Gate Passes
      </h2>

      {/* Filters - Reuse from main dashboard */}
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
            >
              {filterOption}
            </button>
          ))}
          
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
            >
              {typeOption}
            </button>
          ))}
        </div>
        
        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.neutral[200]}`,
          }}>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              Showing {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
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
      </div>

      {/* Pass List */}
      {loading ? (
        <div role="list" aria-label="Gate passes loading">
          <PassCardSkeleton count={5} />
        </div>
      ) : allPasses.length === 0 ? (
        <GatePassEmptyState
          type={pagination.total === 0 ? 'no-data' : 'no-results'}
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
          hasActiveFilters={hasActiveFilters}
        />
      ) : (
        <div role="list" aria-label="Gate passes" style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {allPasses.map((pass: GatePass) => (
            <PassCard key={pass.id} pass={pass} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.last_page}
          totalItems={pagination.total}
          perPage={pagination.per_page}
          onPageChange={(page) => {
            setFilter('page', page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPerPageChange={() => {
            // Per page is fixed at 20 for now
          }}
        />
      )}
    </div>
  );
};







